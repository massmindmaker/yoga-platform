import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTelegramUser, sendVotingToChat } from "@/lib/telegram";
import { resolveChatId } from "@/lib/telegram-chat";

function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN;
}

// POST /api/votings/[id]/publish - опубликовать голосование в Telegram (только тренер)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getTelegramUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }
    if (user.role !== "TRAINER") {
      return NextResponse.json(
        { success: false, error: "Только тренер может публиковать голосование" },
        { status: 403 }
      );
    }

    const { id: votingId } = await params;

    const voting = await prisma.voting.findUnique({
      where: { id: votingId },
      include: {
        group: {
          select: { id: true, name: true, pricingType: true, fixedPrice: true, telegramChat: true, telegramChatId: true },
        },
        options: {
          include: { _count: { select: { votes: true } } },
        },
      },
    });

    if (!voting) {
      return NextResponse.json(
        { success: false, error: "Голосование не найдено" },
        { status: 404 }
      );
    }

    if (voting.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Голосование не активно" },
        { status: 400 }
      );
    }

    if (!voting.group.telegramChat && !voting.group.telegramChatId) {
      return NextResponse.json(
        { success: false, error: "У группы нет привязанного Telegram чата" },
        { status: 400 }
      );
    }

    // Resolve chat ID from various formats
    const BOT_TOKEN = getBotToken();
    if (!BOT_TOKEN) {
      return NextResponse.json(
        { success: false, error: "TELEGRAM_BOT_TOKEN не настроен" },
        { status: 500 }
      );
    }

    // Use saved numeric telegramChatId if available (faster, no extra API call)
    let resolveResult: { success: boolean; chatId?: string; error?: string };
    const savedChatId = voting.group.telegramChatId;
    if (savedChatId) {
      resolveResult = { success: true, chatId: savedChatId };
    } else {
      resolveResult = await resolveChatId(BOT_TOKEN, voting.group.telegramChat!);
    }

    if (!resolveResult.success) {
      return NextResponse.json(
        { success: false, error: resolveResult.error || "Не удалось найти чат. Для приватных групп: отправьте /start в группу с ботом, затем повторите отправку." },
        { status: 400 }
      );
    }

    const telegramResult = await sendVotingToChat(resolveResult.chatId!, {
      id: voting.id,
      title: voting.title,
      multipleChoice: voting.multipleChoice,
      minParticipants: voting.minParticipants,
      deadline: voting.deadline,
      chargeOnVote: voting.chargeOnVote,
      pricingType: voting.group.pricingType,
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
        data: {
          telegramPollId: telegramResult.pollId || null,
          telegramMsgId: telegramResult.messageId.toString(),
          telegramChatId: resolveResult.chatId!,
        },
      });

      return NextResponse.json({
        success: true,
        data: { messageId: telegramResult.messageId, pollId: telegramResult.pollId },
      });
    }

    return NextResponse.json(
      { success: false, error: telegramResult.error || "Не удалось отправить в чат" },
      { status: 500 }
    );
  } catch (error) {
    console.error("[VOTINGS_PUBLISH]", error);
    return NextResponse.json(
      { success: false, error: "Ошибка публикации голосования" },
      { status: 500 }
    );
  }
}
