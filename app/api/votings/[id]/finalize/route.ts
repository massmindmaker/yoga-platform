import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { finalizeVotingSchema } from "@/lib/validation";
import { getTelegramUser, stopTelegramPoll, sendDynamicPaymentMessage } from "@/lib/telegram";

// POST /api/votings/[id]/finalize - подвести итоги (только тренер)
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
        { success: false, error: "Только тренер может финализировать голосование" },
        { status: 403 }
      );
    }

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

    // For DYNAMIC pricing — trainer sets prices per option
    if (voting.group.pricingType === "DYNAMIC") {
      const validationResult = finalizeVotingSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { success: false, error: "Ошибка валидации", details: validationResult.error.issues },
          { status: 400 }
        );
      }

      const { prices } = validationResult.data;

      await prisma.$transaction(async (tx) => {
        // Set prices on options and generate payment links
        for (const { optionId, price } of prices) {
          const option = voting.options.find((o) => o.id === optionId);
          if (!option) continue;

          const paymentLink: string | null = null;

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
          data: { status: "FINALIZED" },
        });
      });
    } else {
      // For FIXED pricing — just close the voting
      await prisma.voting.update({
        where: { id: votingId },
        data: { status: "CLOSED" },
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

    // Закрываем нативный Poll в Telegram
    if (voting.telegramChatId && voting.telegramMsgId) {
      await stopTelegramPoll(voting.telegramChatId, voting.telegramMsgId).catch((err) =>
        console.error("[VOTING_FINALIZE] stopPoll error:", err)
      );

      // Для DYNAMIC — отправляем сообщение с кнопками оплаты и ценами
      if (voting.group.pricingType === "DYNAMIC" && updated) {
        await sendDynamicPaymentMessage(voting.telegramChatId, {
          id: voting.id,
          title: voting.title,
          options: updated.options.map((opt) => ({
            id: opt.id,
            dayOfWeek: opt.dayOfWeek,
            time: opt.time,
            finalPrice: opt.finalPrice,
            _count: opt._count,
          })),
        }).catch((err) =>
          console.error("[VOTING_FINALIZE] sendDynamicPaymentMessage error:", err)
        );
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[VOTING_FINALIZE]", error);
    return NextResponse.json(
      { success: false, error: "Ошибка финализации голосования" },
      { status: 500 }
    );
  }
}
