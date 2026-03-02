import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createVotingSchema } from '@/lib/validation';
import { sendVotingToChat, getTelegramUser } from '@/lib/telegram';

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
      // Support comma-separated statuses: ?status=CLOSED,CANCELLED,FINALIZED
      const statuses = status.split(',').map(s => s.trim());
      where.status = statuses.length > 1 ? { in: statuses } : statuses[0];
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

    // Вычисляем hasVoted из уже загруженных данных (без N+1 запросов)
    const votingsWithHasVoted = votings.map((voting) => {
      if (!userId) return { ...voting, hasVoted: false };

      const hasVoted = voting.options.some((opt) =>
        opt.votes.some((v) => v.user.id === userId)
      );

      return { ...voting, hasVoted };
    });

    // Cache for 10 seconds (votings change frequently)
    return NextResponse.json(
      { success: true, data: votingsWithHasVoted },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('[VOTINGS_GET]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch votings' },
      { status: 500 }
    );
  }
}

// POST /api/votings - создать голосование (только тренер)
export async function POST(req: NextRequest) {
  try {
    const user = await getTelegramUser(req);
    if (!user || user.role !== "TRAINER") {
      return NextResponse.json(
        { success: false, error: "Доступ только для тренера" },
        { status: 403 }
      );
    }

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
      select: { id: true, pricingType: true, fixedPrice: true, telegramChat: true, telegramChatId: true },
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
    if (group.telegramChat || group.telegramChatId) {
      // Use saved numeric telegramChatId if available (required for private groups)
      let chatId: string | null = group.telegramChatId || null;
      
      if (!chatId && group.telegramChat) {
        // Try to resolve from link
        const { resolveChatId } = await import('@/lib/telegram-chat');
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        if (BOT_TOKEN) {
          const resolveResult = await resolveChatId(BOT_TOKEN, group.telegramChat);
          if (resolveResult.success && resolveResult.chatId) {
            chatId = resolveResult.chatId;
            // Save resolved chatId for future use
            await prisma.group.update({
              where: { id: group.id },
              data: { telegramChatId: chatId },
            });
          }
        }
      }

      if (chatId) {
        const telegramResult = await sendVotingToChat(chatId, {
          id: voting.id,
          title: voting.title,
          multipleChoice: voting.multipleChoice,
          minParticipants: voting.minParticipants,
          deadline: voting.deadline,
          chargeOnVote: voting.chargeOnVote,
          pricingType: group.pricingType,
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
          await prisma.voting.update({
            where: { id: voting.id },
            data: {
              telegramPollId: telegramResult.pollId || null,
              telegramMsgId: telegramResult.messageId.toString(),
              telegramChatId: chatId,
            },
          });
        }
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
