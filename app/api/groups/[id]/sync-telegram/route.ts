import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// POST /api/groups/[id]/sync-telegram - синхронизировать учеников из Telegram чата
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;

    if (!BOT_TOKEN) {
      return NextResponse.json(
        { success: false, error: "TELEGRAM_BOT_TOKEN not configured" },
        { status: 500 }
      );
    }

    // Получаем группу
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      );
    }

    if (!group.telegramChat) {
      return NextResponse.json(
        { success: false, error: "Telegram chat not linked to this group" },
        { status: 400 }
      );
    }

    // Получаем список участников из Telegram чата
    const chatId = group.telegramChat;
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getChatMemberCount`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId }),
      }
    );

    const memberCountData = await response.json();
    
    if (!memberCountData.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch Telegram chat info" },
        { status: 500 }
      );
    }

    // Получаем администраторов чата (они же ученики)
    const adminsResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getChatAdministrators`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId }),
      }
    );

    const adminsData = await adminsResponse.json();
    
    if (!adminsData.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch chat members" },
        { status: 500 }
      );
    }

    // Фильтруем только обычных пользователей (не ботов)
    const members = adminsData.result.filter(
      (member: any) => !member.user.is_bot
    );

    let addedCount = 0;
    let existingCount = 0;

    // Добавляем или обновляем пользователей
    for (const member of members) {
      const telegramUser = member.user;
      
      // Проверяем, существует ли пользователь
      let user = await prisma.user.findFirst({
        where: { telegramId: telegramUser.id.toString() },
      });

      // Если нет - создаем
      if (!user) {
        user = await prisma.user.create({
          data: {
            telegramId: telegramUser.id.toString(),
            firstName: telegramUser.first_name || "Unknown",
            lastName: telegramUser.last_name || null,
            role: "STUDENT",
            balance: 0,
          },
        });
        addedCount++;
      } else {
        existingCount++;
      }

      // Проверяем, связан ли пользователь с группой
      const existingLink = await prisma.groupStudent.findUnique({
        where: {
          groupId_userId: {
            groupId: groupId,
            userId: user.id,
          },
        },
      });

      // Если нет - создаем связь
      if (!existingLink) {
        await prisma.groupStudent.create({
          data: {
            groupId: groupId,
            userId: user.id,
          },
        });
        if (existingCount > 0) addedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Синхронизация завершена. Добавлено: ${addedCount}, уже в группе: ${existingCount}`,
      data: {
        added: addedCount,
        existing: existingCount,
        totalMembers: members.length,
      },
    });
  } catch (error) {
    console.error("[SYNC_TELEGRAM_POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to sync students from Telegram" },
      { status: 500 }
    );
  }
}
