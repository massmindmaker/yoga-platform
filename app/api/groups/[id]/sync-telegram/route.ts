import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractChatId, resolveChatId } from "@/lib/telegram-chat";

function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN;
}

// POST /api/groups/[id]/sync-telegram - синхронизировать учеников из Telegram чата
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;

    const BOT_TOKEN = getBotToken();
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

    // Resolve chat ID from various formats (link, username, etc.)
    const rawChatId = group.telegramChat;
    const chatIdExtracted = extractChatId(rawChatId);
    
    if (!chatIdExtracted) {
      return NextResponse.json(
        { success: false, error: "Неверный формат ссылки на чат" },
        { status: 400 }
      );
    }
    
    // Try to resolve to actual chat ID
    const resolveResult = await resolveChatId(BOT_TOKEN, chatIdExtracted);
    
    if (!resolveResult.success) {
      return NextResponse.json(
        { success: false, error: resolveResult.error || "Не удалось найти чат. Убедитесь, что бот @Yom23_bot добавлен в группу и является администратором" },
        { status: 400 }
      );
    }
    
    const chatId = resolveResult.chatId!;
    
    // Получаем список участников из Telegram чата
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
      // More specific error messages based on Telegram error
      let errorMessage = "Failed to fetch Telegram chat info";
      if (memberCountData.error_code === 400) {
        if (memberCountData.description?.includes("chat not found")) {
          errorMessage = "Чат не найден. Проверьте ID чата и убедитесь, что бот добавлен в чат";
        } else if (memberCountData.description?.includes("bot is not a member")) {
          errorMessage = "Бот не является членом чата. Добавьте бота @Yom23_bot в группу";
        } else {
          errorMessage = "Ошибка доступа к чату: " + memberCountData.description;
        }
      }
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
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

      // Получаем фото профиля
      let photoUrl: string | null = null;
      try {
        const photosRes = await fetch(
          `https://api.telegram.org/bot${BOT_TOKEN}/getUserProfilePhotos`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: telegramUser.id, limit: 1 }),
          }
        );
        const photosData = await photosRes.json();
        if (photosData.ok && photosData.result.total_count > 0) {
          // Берём самый маленький файл (достаточно для аватарки)
          const fileId = photosData.result.photos[0][0].file_id;
          const fileRes = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/getFile`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ file_id: fileId }),
            }
          );
          const fileData = await fileRes.json();
          if (fileData.ok) {
            photoUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`;
          }
        }
      } catch {
        // Фото не критично — продолжаем
      }
      
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
            username: telegramUser.username || null,
            photoUrl,
            role: "STUDENT",
            balance: 0,
          },
        });
        addedCount++;
      } else {
        // Обновляем имя, фото и username
        await prisma.user.update({
          where: { id: user.id },
          data: {
            firstName: telegramUser.first_name || user.firstName,
            lastName: telegramUser.last_name || user.lastName,
            username: telegramUser.username || user.username,
            ...(photoUrl ? { photoUrl } : {}),
          },
        });
        existingCount++;
      }

      // Создаём связь с группой (upsert чтобы не дублировать)
      await prisma.groupStudent.upsert({
        where: {
          groupId_userId: {
            groupId: groupId,
            userId: user.id,
          },
        },
        update: {},
        create: {
          groupId: groupId,
          userId: user.id,
        },
      });
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
