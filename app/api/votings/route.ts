import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createVotingSchema } from '@/lib/validation';
import { sendVotingToChat } from '@/lib/telegram';

// GET /api/votings - получить активные голосования
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    const where: Record<string, unknown> = {};
    if (groupId) where.groupId = groupId;
    if (status) {
      where.status = status;
    } else {
      where.status = { in: ['ACTIVE', 'FINALIZED'] };
    }

    const votings = await prisma.voting.findMany({
      where,
      include: {
        group: {
          select: { id: true, name: true, pricingType: true, fixedPrice: true },
        },
        options: {
          include: {
            _count: { select: { votes: true } },
            votes: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true, balance: true } },
              },
            },
          },
        },
        _count: { select: { votes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add hasVoted flag for each voting if userId provided
    const votingsWithHasVoted = await Promise.all(
      votings.map(async (voting) => {
        if (!userId) return { ...voting, hasVoted: false };

        const userVote = await prisma.vote.findFirst({
          where: { votingId: voting.id, userId },
        });

        return { ...voting, hasVoted: !!userVote };
      })
    );

    return NextResponse.json({ success: true, data: votingsWithHasVoted });
  } catch (error) {
    console.error('[VOTINGS_GET]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch votings' },
      { status: 500 }
    );
  }
}

// POST /api/votings - создать голосование
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validationResult = createVotingSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const {
      groupId,
      title,
      type,
      chargeOnVote,
      multipleChoice,
      minParticipants,
      deadline,
      weekStart,
      weekEnd,
      options,
    } = validationResult.data;

    // Verify group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, pricingType: true, fixedPrice: true, telegramChat: true },
    });

    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Group not found' },
        { status: 404 }
      );
    }

    const voting = await prisma.voting.create({
      data: {
        groupId,
        title,
        type: type || 'SCHEDULE',
        chargeOnVote: chargeOnVote ?? false,
        multipleChoice: multipleChoice ?? true,
        minParticipants: minParticipants || 1,
        deadline: new Date(deadline),
        weekStart: weekStart ? new Date(weekStart) : null,
        weekEnd: weekEnd ? new Date(weekEnd) : null,
        options: {
          create: options.map((opt) => ({
            dayOfWeek: opt.dayOfWeek,
            time: opt.time,
            date: opt.date ? new Date(opt.date) : null,
            description: opt.description || null,
          })),
        },
      },
      include: {
        group: {
          select: { id: true, name: true, pricingType: true, fixedPrice: true },
        },
        options: {
          include: { _count: { select: { votes: true } } },
        },
      },
    });

    // Publish to Telegram chat if group has telegramChat
    if (group.telegramChat) {
      const telegramResult = await sendVotingToChat(group.telegramChat, {
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
          fixedPrice: group.fixedPrice || undefined,
        },
      });

      if (telegramResult.success && telegramResult.messageId) {
        // Save Telegram message ID
        await prisma.voting.update({
          where: { id: voting.id },
          data: { telegramPollId: telegramResult.messageId.toString() },
        });
      }
    }

    return NextResponse.json({ success: true, data: voting });
  } catch (error) {
    console.error('[VOTINGS_POST]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create voting' },
      { status: 500 }
    );
  }
}
