// lib/bot-messages.ts - утилиты для отправки сообщений ботом

// Read at call time, not module load time (important for serverless)
function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN;
}

interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
  web_app?: { url: string };
}

interface ReplyMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

// Отправить текстовое сообщение
export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  replyMarkup?: ReplyMarkup
) {
  const token = getBotToken();
  if (!token) {
    console.error("[BOT] TELEGRAM_BOT_TOKEN not set!");
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        reply_markup: replyMarkup,
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error("[BOT] Telegram API error:", data.description, "chatId:", chatId);
    }
    return data;
  } catch (error) {
    console.error("[BOT] Error sending Telegram message:", error);
  }
}

// Отправить главное меню
export async function sendMainMenu(chatId: number) {
  await sendTelegramMessage(
    chatId,
    `🧘‍♀️ *Yoga Studio*

Выберите действие:`,
    {
      inline_keyboard: [
        [
          {
            text: "📅 Расписание",
            callback_data: "show_schedule",
          },
          {
            text: "💰 Баланс",
            callback_data: "show_balance",
          },
        ],
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

// Уведомить группу о новом занятии
export async function notifyGroupAboutClass(
  chatId: number,
  classInfo: {
    title: string;
    date: string;
    time: string;
    trainer: string;
  }
) {
  await sendTelegramMessage(
    chatId,
    `📅 *Новое занятие!*\n\n` +
      `🧘‍♀️ ${classInfo.title}\n` +
      `📆 ${classInfo.date} в ${classInfo.time}\n` +
      `👨‍🏫 Тренер: ${classInfo.trainer}\n\n` +
      `Записывайтесь в приложении!`,
    {
      inline_keyboard: [
        [
          {
            text: "📝 Записаться",
            web_app: { url: process.env.NEXT_PUBLIC_APP_URL || "" },
          },
        ],
      ],
    }
  );
}

// Отправить напоминание о занятии
export async function sendClassReminder(
  chatId: number,
  classInfo: {
    title: string;
    date: string;
    time: string;
    location?: string;
  }
) {
  await sendTelegramMessage(
    chatId,
    `⏰ *Напоминание!*\n\n` +
      `🧘‍♀️ ${classInfo.title}\n` +
      `📆 Сегодня в ${classInfo.time}\n` +
      `${classInfo.location ? `📍 ${classInfo.location}\n\n` : "\n"}` +
      `До начала менее 2 часов!`
  );
}

// Отправить уведомление об оплате
export async function sendPaymentNotification(
  chatId: number,
  payment: {
    amount: number;
    classesCount: number;
  }
) {
  await sendTelegramMessage(
    chatId,
    `✅ *Оплата успешна!*\n\n` +
      `💰 Сумма: ${payment.amount.toLocaleString()} ₽\n` +
      `🎫 Занятий: ${payment.classesCount}\n\n` +
      `Ваш баланс пополнен!`
  );
}

// Отправить уведомление о низком балансе
export async function sendLowBalanceWarning(chatId: number, balance: number) {
  await sendTelegramMessage(
    chatId,
    `⚠️ *Внимание!*\n\n` +
      `У вас осталось *${balance}* занятий.\n\n` +
      `Не забудьте пополнить баланс!`,
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

// Отправить уведомление о голосовании
export async function sendVotingNotification(
  chatId: number,
  voting: {
    title: string;
    deadline: string;
    minVotes: number;
    currentVotes: number;
  }
) {
  const progress = Math.round((voting.currentVotes / voting.minVotes) * 100);
  const needed = Math.max(0, voting.minVotes - voting.currentVotes);

  await sendTelegramMessage(
    chatId,
    `🗳️ *${voting.title}*\n\n` +
      `📊 Проголосовало: *${voting.currentVotes}/${voting.minVotes}* (${progress}%)\n` +
      `⏰ До: ${voting.deadline}\n\n` +
      `${needed > 0 ? `⚠️ Нужно еще *${needed}* голосов` : "✅ Занятие состоится!"}`,
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
