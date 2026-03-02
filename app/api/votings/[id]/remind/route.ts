import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTelegramUser, sendTelegramMessage } from "@/lib/telegram";

// POST /api/votings/[id]/remind - отправить напоминание (только тренер)
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
        { success: false, error: "Только тренер может отправлять напоминания" },
        { status: 403 }
      );
    }

    const { id: votingId } = await params;

    // Get voting with group and participants
    const voting = await prisma.voting.findUnique({
      where: { id: votingId },
      include: {
        group: {
          include: {
            students: {
              include: {
                user: {
                  select: { id: true, telegramId: true, firstName: true },
                },
              },
            },
          },
        },
        votes: {
          select: { userId: true },
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

    // Find users who haven't voted
    const votedUserIds = new Set(voting.votes.map(v => v.userId));
    const nonVoters = voting.group.students.filter(
      s => !votedUserIds.has(s.userId) && s.user.telegramId
    );

    // Send reminders
    const remindersSent = [];
    for (const student of nonVoters) {
      try {
        await sendTelegramMessage(student.user.telegramId!, {
          text: `⏰ Напоминание о голосовании!\n\n"${voting.title}"\n\nДедлайн: ${new Date(voting.deadline).toLocaleString("ru-RU")}\n\nПроголосуйте, чтобы мы могли спланировать занятия.`,
        });
        remindersSent.push(student.userId);
      } catch (err) {
        console.error(`[VOTINGS_REMIND] Failed to send reminder to ${student.userId}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        remindersSent: remindersSent.length,
        totalNonVoters: nonVoters.length,
      },
    });
  } catch (error) {
    console.error("[VOTINGS_REMIND]", error);
    return NextResponse.json(
      { success: false, error: "Ошибка отправки напоминаний" },
      { status: 500 }
    );
  }
}
