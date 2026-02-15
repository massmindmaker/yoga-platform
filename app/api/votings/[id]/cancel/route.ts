import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/votings/[id]/cancel - отменить голосование (возврат всем)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: votingId } = await params;

    const voting = await prisma.voting.findUnique({
      where: { id: votingId },
      include: {
        group: { select: { fixedPrice: true } },
        votes: {
          where: { refunded: false, balanceCharged: true },
          select: { id: true, userId: true },
        },
      },
    });

    if (!voting) {
      return NextResponse.json(
        { success: false, error: 'Voting not found' },
        { status: 404 }
      );
    }

    if (voting.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: `Cannot cancel voting with status ${voting.status}` },
        { status: 400 }
      );
    }

    const refundAmount = voting.group.fixedPrice || 1;

    await prisma.$transaction(async (tx) => {
      // Refund all charged votes
      for (const vote of voting.votes) {
        await tx.vote.update({
          where: { id: vote.id },
          data: { refunded: true, refundedAt: new Date() },
        });

        await tx.user.update({
          where: { id: vote.userId },
          data: { balance: { increment: refundAmount } },
        });

        await tx.balanceTransaction.create({
          data: {
            userId: vote.userId,
            amount: refundAmount,
            type: 'VOTE_REFUND',
            description: `Возврат — голосование отменено: ${voting.title}`,
            voteId: vote.id,
            votingId,
          },
        });
      }

      // Mark all option votes as cancelled
      await tx.voting.update({
        where: { id: votingId },
        data: { status: 'CANCELLED' },
      });
    });

    // TODO: Notify users in Telegram

    return NextResponse.json({
      success: true,
      data: { refundedVotes: voting.votes.length },
    });
  } catch (error) {
    console.error('[VOTING_CANCEL]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel voting' },
      { status: 500 }
    );
  }
}
