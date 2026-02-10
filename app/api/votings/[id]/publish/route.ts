import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendVotingToChat } from '@/lib/telegram';

// POST /api/votings/[id]/publish - publish/republish voting to Telegram chat
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: votingId } = await params;

    const voting = await prisma.voting.findUnique({
      where: { id: votingId },
      include: {
        group: {
          select: { id: true, name: true, pricingType: true, fixedPrice: true, telegramChat: true },
        },
        options: {
          include: { _count: { select: { votes: true } } },
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
        { success: false, error: 'Голосование не активно' },
        { status: 400 }
      );
    }

    if (!voting.group.telegramChat) {
      return NextResponse.json(
        { success: false, error: 'У группы нет привязанного Telegram чата' },
        { status: 400 }
      );
    }

    const telegramResult = await sendVotingToChat(voting.group.telegramChat, {
      id: voting.id,
      title: voting.title,
      minParticipants: voting.minParticipants,
      deadline: voting.deadline,
      chargeOnVote: voting.chargeOnVote,
      options: voting.options.map(opt => ({
        id: opt.id,
        dayOfWeek: opt.dayOfWeek,
        time: opt.time,
        description: opt.description || undefined,
      })),
      group: {
        fixedPrice: voting.group.fixedPrice || undefined,
      },
    });

    if (telegramResult.success && telegramResult.messageId) {
      await prisma.voting.update({
        where: { id: voting.id },
        data: { telegramPollId: telegramResult.messageId.toString() },
      });

      return NextResponse.json({
        success: true,
        data: { messageId: telegramResult.messageId },
      });
    }

    return NextResponse.json(
      { success: false, error: telegramResult.error || 'Не удалось отправить в чат' },
      { status: 500 }
    );
  } catch (error) {
    console.error('[VOTINGS_PUBLISH]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to publish voting' },
      { status: 500 }
    );
  }
}
