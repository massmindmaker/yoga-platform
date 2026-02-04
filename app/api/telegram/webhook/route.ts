import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendTelegramMessage, sendMainMenu, notifyGroupAboutClass } from "@/lib/bot-messages";

// POST /api/telegram/webhook - webhook для сообщений от бота
export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // Обработка callback queries (кнопки)
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return NextResponse.json({ ok: true });
    }

    // Обработка сообщений
    if (update.message) {
      const chatId = update.message.chat.id;
      const from = update.message.from;
      const text = update.message.text || "";
      const isGroup = update.message.chat.type === "group" || update.message.chat.type === "supergroup";

      // Команда /start
      if (text === "/start") {
        await handleStart(chatId, from, isGroup);
      }
      // Команда /help
      else if (text === "/help") {
        await handleHelp(chatId, isGroup);
      }
      // Команда /balance
      else if (text === "/balance") {
        await handleBalance(chatId, from);
      }
      // Команда /schedule
      else if (text === "/schedule") {
        await handleSchedule(chatId, isGroup);
      }
      // Команда /vote
      else if (text === "/vote") {
        await handleVote(chatId, from);
      }
      // Команда для группы - показать расписание группы
      else if (isGroup && text === "/groupschedule") {
        await handleGroupSchedule(chatId);
      }
      // Команда для группы - статистика
      else if (isGroup && text === "/stats") {
        await handleGroupStats(chatId);
      }
      // Если бота добавили в группу
      else if (update.message.new_chat_members) {
        const botId = (await getBotInfo()).id;
        const isBotAdded = update.message.new_chat_members.some(
          (member: any) => member.id === botId
        );
        if (isBotAdded) {
          await handleBotAddedToGroup(chatId);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in Telegram webhook:", error);
    return NextResponse.json({ ok: false });
  }
}

// Обработка команды /start
async function handleStart(chatId: number, user: any, isGroup: boolean) {
  if (isGroup) {
    await sendTelegramMessage(
      chatId,
      `👋 Привет, группа!

Я бот Yoga Studio. Я буду присылать сюда:
• Напоминания о занятиях
• Новости о голосованиях
• Статистику группы

Используйте команды:
/groupschedule - расписание
/stats - статистика`
    );
    return;
  }

  // Личное сообщение
  const telegramUser = {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
  };

  // Получаем или создаем пользователя
  const dbUser = await prisma.user.upsert({
    where: { telegramId: user.id.toString() },
    update: { firstName: user.first_name },
    create: {
      telegramId: user.id.toString(),
      firstName: user.first_name,
      lastName: user.last_name || null,
      role: "STUDENT",
      balance: 0,
    },
  });

  await sendTelegramMessage(
    chatId,
    `👋 Привет, ${user.first_name}!

Твой баланс: *${dbUser.balance}* занятий

Я помогу тебе:
• Записываться на занятия
• Узнавать о голосованиях
• Отслеживать баланс`,
    {
      inline_keyboard: [
        [
          {
            text: "🧘‍♀️ Открыть приложение",
            web_app: { url: process.env.NEXT_PUBLIC_APP_URL || "" },
          },
        ],
        [
          { text: "💰 Мой баланс", callback_data: "show_balance" },
          { text: "📅 Расписание", callback_data: "show_schedule" },
        ],
      ],
    }
  );
}

// Обработка команды /help
async function handleHelp(chatId: number, isGroup: boolean) {
  if (isGroup) {
    await sendTelegramMessage(
      chatId,
      `📋 Команды бота в группе:

/groupschedule - расписание занятий
/stats - статистика группы

Бот автоматически присылает уведомления о новых занятиях и напоминания.`
    );
  } else {
    await sendTelegramMessage(
      chatId,
      `📋 Доступные команды:

/balance - проверить баланс
/schedule - расписание занятий
/vote - активные голосования
/help - эта справка

Также можно открыть приложение кнопкой ниже.`,
      {
        inline_keyboard: [
          [
            {
              text: "🧘‍♀️ Открыть приложение",
              web_app: { url: process.env.NEXT_PUBLIC_APP_URL || "" },
            },
          ],
        ],
      }
    );
  }
}

// Обработка команды /balance
async function handleBalance(chatId: number, user: any) {
  const dbUser = await prisma.user.findFirst({
    where: { telegramId: user.id.toString() },
  });

  if (!dbUser) {
    await sendTelegramMessage(
      chatId,
      "❌ Сначала отправьте /start для регистрации"
    );
    return;
  }

  await sendTelegramMessage(
    chatId,
    `💰 Ваш баланс: *${dbUser.balance}* занятий

${dbUser.balance === 0 ? "⚠️ Баланс пуст! Пополните в приложении." : "✅ Можно записываться на занятия!"}`,
    {
      inline_keyboard: [
        [
          {
            text: "💳 Пополнить",
            web_app: {
              url: `${process.env.NEXT_PUBLIC_APP_URL}/purchase`,
            },
          },
        ],
      ],
    }
  );
}

// Обработка команды /schedule
async function handleSchedule(chatId: number, isGroup: boolean) {
  const groups = await prisma.group.findMany({
    include: { schedules: true },
  });

  if (groups.length === 0) {
    await sendTelegramMessage(chatId, "📅 Пока нет доступных групп");
    return;
  }

  let message = isGroup ? "📅 Расписание групп:\n\n" : "📅 Доступные группы:\n\n";

  for (const group of groups) {
    const days = group.schedules.map((s) => getDayName(s.dayOfWeek)).join(", ");
    message += `*${group.name}*\n`;
    message += `📍 ${days}\n`;
    message += `👥 Мест: ${group.maxStudents}\n\n`;
  }

  message += "Записаться можно в приложении:";

  await sendTelegramMessage(
    chatId,
    message,
    {
      inline_keyboard: [
        [
          {
            text: "🧘‍♀️ Записаться",
            web_app: { url: process.env.NEXT_PUBLIC_APP_URL || "" },
          },
        ],
      ],
    }
  );
}

// Обработка команды /vote
async function handleVote(chatId: number, user: any) {
  const activeVotings = await prisma.voting.findMany({
    where: { status: "ACTIVE" },
    include: { options: { include: { _count: { select: { votes: true } } } } },
  });

  if (activeVotings.length === 0) {
    await sendTelegramMessage(chatId, "🗳️ Сейчас нет активных голосований");
    return;
  }

  for (const voting of activeVotings) {
    const totalVotes = voting.options.reduce(
      (sum, opt) => sum + opt._count.votes,
      0
    );
    const minVotes = voting.minParticipants;
    const progress = Math.round((totalVotes / minVotes) * 100);

    await sendTelegramMessage(
      chatId,
      `🗳️ *${voting.title}*\n\n` +
        `📊 Проголосовало: *${totalVotes}/${minVotes}* (${progress}%)\n` +
        `⏰ До: ${voting.deadline.toLocaleDateString("ru-RU")}\n\n` +
        `${progress >= 100 ? "✅ Занятие состоится!" : `⚠️ Нужно еще ${Math.max(0, minVotes - totalVotes)} голосов`}`,
      {
        inline_keyboard: [
          [
            {
              text: "🗳️ Проголосовать",
              web_app: {
                url: `${process.env.NEXT_PUBLIC_APP_URL}/voting`,
              },
            },
          ],
        ],
      }
    );
  }
}

// Обработка callback queries
async function handleCallbackQuery(callbackQuery: any) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const user = callbackQuery.from;

  if (data === "show_balance") {
    await handleBalance(chatId, user);
  } else if (data === "show_schedule") {
    await handleSchedule(chatId, false);
  }

  // Отвечаем на callback чтобы убрать "часики"
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQuery.id }),
    }
  );
}

// Бота добавили в группу
async function handleBotAddedToGroup(chatId: number) {
  await sendTelegramMessage(
    chatId,
    `👋 Привет, группа!

Я бот Yoga Studio. Я буду присылать сюда:
• 📅 Расписание занятий
• 🗳️ Голосования
• ⏰ Напоминания

Доступные команды:
/groupschedule - расписание
/stats - статистика

Настройте эту группу в приложении, привязав к группе йоги.`
  );
}

// Расписание для группы
async function handleGroupSchedule(chatId: number) {
  // Находим группу по chatId (если привязана)
  const group = await prisma.group.findFirst({
    where: { telegramChat: chatId.toString() },
  });

  if (!group) {
    await sendTelegramMessage(
      chatId,
      "❌ Эта группа не привязана к группе йоги.\n\nАдминистратор может привязать группу в приложении."
    );
    return;
  }

  await sendTelegramMessage(
    chatId,
    `📅 *${group.name}*\n\n` +
      `👥 Мест: ${group.maxStudents}\n\n` +
      `Подробное расписание доступно в приложении.`
  );
}

// Статистика группы
async function handleGroupStats(chatId: number) {
  const group = await prisma.group.findFirst({
    where: { telegramChat: chatId.toString() },
    include: { _count: { select: { students: true } } },
  });

  if (!group) {
    await sendTelegramMessage(
      chatId,
      "❌ Эта группа не привязана к группе йоги."
    );
    return;
  }

  await sendTelegramMessage(
    chatId,
    `📊 *${group.name}*\n\n` +
      `👥 Учеников: ${group._count.students}/${group.maxStudents}\n` +
      `✅ Доступно мест: ${group.maxStudents - group._count.students}`
  );
}

// Вспомогательные функции
function getDayName(dayOfWeek: number): string {
  const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  return days[dayOfWeek];
}

async function getBotInfo() {
  const response = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`
  );
  const data = await response.json();
  return data.result;
}

// GET /api/telegram/webhook - установка webhook
export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`;

  if (!token) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN not set" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook?url=${webhookUrl}`
    );
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error setting webhook:", error);
    return NextResponse.json(
      { error: "Failed to set webhook" },
      { status: 500 }
    );
  }
}
