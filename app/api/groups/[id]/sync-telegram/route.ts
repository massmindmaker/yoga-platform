import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractChatId, resolveChatId } from "@/lib/telegram-chat";
import { getTelegramUser } from "@/lib/telegram";

function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN;
}

// POST /api/groups/[id]/sync-telegram - синхронизировать учеников из Telegram чата (только тренер)
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
        { success: false, error: "Только тренер может синхронизировать участников" },
        { status: 403 }
      );
    }

    const { id: groupId } = await params;
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    const BOT_TOKEN = getBotToken();
    if (!BOT_TOKEN) {
      return NextResponse.json(
        { success: false, error: "TELEGRAM_BOT_TOKEN не настроен" },
        { status: 500 }
      );
    }

    // Получаем группу
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json(
        { success: false, error: "Группа не найдена" },
        { status: 404 }
      );
    }

    // Action: reconnect — сбросить telegramChatId и заново привязать
    if (action === "reconnect") {
      await prisma.group.update({
        where: { id: groupId },
        data: { telegramChatId: null },
      });
      return NextResponse.json({
        success: true,
        message: "Chat ID сброшен. Отправьте /start в Telegram группу, затем нажмите Синхронизировать.",
      });
    }

    if (!group.telegramChat && !group.telegramChatId) {
      return NextResponse.json(
        { success: false, error: "Telegram чат не привязан к этой группе" },
        { status: 400 }
      );
    }

    // Use saved numeric telegramChatId if available (solves private invite links)
    let chatId: string;

    if (group.telegramChatId) {
      console.log("[SYNC_TELEGRAM] Using saved telegramChatId:", group.telegramChatId);

      // Verify the saved chatId is still valid
      const verifyRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: group.telegramChatId }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyData.ok) {
        console.log("[SYNC_TELEGRAM] Saved chatId invalid, resetting:", group.telegramChatId);
        // Reset invalid chatId
        await prisma.group.update({
          where: { id: groupId },
          data: { telegramChatId: null },
        });
        return NextResponse.json({
          success: false,
          error: "Сохранённый Chat ID недействителен. Отправьте /start в Telegram группу с ботом @Yom23_bot, затем повторите синхронизацию.",
        }, { status: 400 });
      }

      chatId = group.telegramChatId;
    } else {
      // Resolve chat ID from various formats (link, username, etc.)
      const rawChatId = group.telegramChat!;
      console.log("[SYNC_TELEGRAM] Raw chat ID from DB:", rawChatId);

      const chatIdExtracted = extractChatId(rawChatId);
      console.log("[SYNC_TELEGRAM] Extracted chat ID:", chatIdExtracted);

      if (!chatIdExtracted) {
        return NextResponse.json(
          { success: false, error: "Неверный формат ссылки на чат: " + rawChatId },
          { status: 400 }
        );
      }

      // Try to resolve to actual chat ID
      const resolveResult = await resolveChatId(BOT_TOKEN, chatIdExtracted);
      console.log("[SYNC_TELEGRAM] Resolve result:", resolveResult);

      if (!resolveResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: resolveResult.error || "Не удалось найти чат. Для приватных групп: отправьте /start в группу с ботом, затем повторите синхронизацию.",
          },
          { status: 400 }
        );
      }

      chatId = resolveResult.chatId!;

      // Сохраняем числовой ID чата в группу для будущего использования
      await prisma.group.update({
        where: { id: groupId },
        data: { telegramChatId: chatId },
      });
      console.log("[SYNC_TELEGRAM] Saved telegramChatId:", chatId);
    }

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
      let errorMessage = "Ошибка получения информации о чате";
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

    // Получаем администраторов чата
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
        { success: false, error: "Ошибка получения участников чата" },
        { status: 500 }
      );
    }

    // Фильтруем только обычных пользователей (не ботов)
    interface TelegramChatMember {
      user: {
        id: number;
        is_bot: boolean;
        first_name?: string;
        last_name?: string;
        username?: string;
      };
    }

    const members = adminsData.result.filter(
      (member: TelegramChatMember) => !member.user.is_bot
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
      let dbUser = await prisma.user.findFirst({
        where: { telegramId: telegramUser.id.toString() },
      });

      // Если нет - создаем
      if (!dbUser) {
        dbUser = await prisma.user.create({
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
          where: { id: dbUser.id },
          data: {
            firstName: telegramUser.first_name || dbUser.firstName,
            lastName: telegramUser.last_name || dbUser.lastName,
            username: telegramUser.username || dbUser.username,
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
            userId: dbUser.id,
          },
        },
        update: {},
        create: {
          groupId: groupId,
          userId: dbUser.id,
        },
      });
    }

    // Удаляем участников группы, которых больше нет в Telegram чате
    const syncedTelegramIds = members.map((m: TelegramChatMember) => m.user.id.toString());

    // Получаем всех текущих участников группы
    const currentGroupStudents = await prisma.groupStudent.findMany({
      where: { groupId },
      include: { user: true },
    });

    let removedCount = 0;
    for (const gs of currentGroupStudents) {
      // Если у участника есть telegramId и его нет в чате — удаляем из группы
      if (gs.user.telegramId && !syncedTelegramIds.includes(gs.user.telegramId)) {
        await prisma.groupStudent.delete({
          where: {
            groupId_userId: {
              groupId,
              userId: gs.userId,
            },
          },
        });
        removedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Синхронизация завершена. Добавлено: ${addedCount}, обновлено: ${existingCount}, удалено: ${removedCount}.`,
      data: {
        added: addedCount,
        existing: existingCount,
        removed: removedCount,
        totalMembers: members.length,
      },
    });
  } catch (error) {
    console.error("[SYNC_TELEGRAM_POST]", error);
    return NextResponse.json(
      { success: false, error: "Ошибка синхронизации участников из Telegram" },
      { status: 500 }
    );
  }
}
