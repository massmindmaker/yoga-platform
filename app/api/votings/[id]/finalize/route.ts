import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { finalizeVotingSchema } from '@/lib/validation';
import { createPayment } from '@/lib/tbank';

// POST /api/votings/[id]/finalize - подвести итоги (тренер назначает цены для DYNAMIC)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: votingId } = await params;
    const body = await req.json();

    const voting = await prisma.voting.findUnique({
      where: { id: votingId },
      include: {
        group: { select: { pricingType: true, name: true, telegramChat: true } },
        options: {
          include: {
            votes: {
              where: { refunded: false },
              include: { user: { select: { id: true, firstName: true, telegramId: true } } },
            },
          },
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
        { success: false, error: 'Voting is not active' },
        { status: 400 }
      );
    }

    // For DYNAMIC pricing — trainer sets prices per option
    if (voting.group.pricingType === 'DYNAMIC') {
      const validationResult = finalizeVotingSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: validationResult.error.issues },
          { status: 400 }
        );
      }

      const { prices } = validationResult.data;

      await prisma.$transaction(async (tx) => {
        // Set prices on options and generate payment links
        for (const { optionId, price } of prices) {
          const option = voting.options.find((o) => o.id === optionId);
          if (!option) continue;

          let paymentLink: string | null = null;

          // Generate T-Bank payment links for each voter
          // For now, we store the price — individual links generated on demand
          await tx.votingOption.update({
            where: { id: optionId },
            data: {
              finalPrice: price,
              paymentLink,
            },
          });
        }

        // Update voting status
        await tx.voting.update({
          where: { id: votingId },
          data: { status: 'FINALIZED' },
        });
      });
    } else {
      // For FIXED pricing — just close the voting
      await prisma.voting.update({
        where: { id: votingId },
        data: { status: 'CLOSED' },
      });
    }

    // Fetch updated voting
    const updated = await prisma.voting.findUnique({
      where: { id: votingId },
      include: {
        group: { select: { id: true, name: true, pricingType: true, fixedPrice: true } },
        options: {
          include: {
            _count: { select: { votes: true } },
            votes: {
              where: { refunded: false },
              include: { user: { select: { id: true, firstName: true, lastName: true } } },
            },
          },
        },
      },
    });

    // TODO: Publish results to Telegram chat

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[VOTING_FINALIZE]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to finalize voting' },
      { status: 500 }
    );
  }
}
