// Telegram Bot Service
import { prisma } from "@/lib/db";
import crypto from "crypto";

// Read at call time, not module load time (important for serverless)
function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN;
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

// Криптографическая верификация Telegram initData (HMAC-SHA256)
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
export function validateTelegramData(initData: string): TelegramUser | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");

    if (!hash) {
      console.error("No hash in initData");
      return null;
    }

    // В dev-режиме разрешаем без верификации (нет реального Telegram)
    const token = getBotToken();
    if (!token) {
      console.warn("[AUTH] No bot token, skipping HMAC verification");
      return parseTelegramUser(params);
    }

    // Собираем data-check-string: все параметры кроме hash, отсортированные, через \n
    params.delete("hash");
    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    // secret_key = HMAC-SHA256("WebAppData", bot_token)
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(token)
      .digest();

    // computed_hash = HMAC-SHA256(secret_key, data_check_string)
    const computedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    if (computedHash !== hash) {
      console.error("[AUTH] HMAC verification failed");
      return null;
    }

    // Проверяем auth_date — не старше 5 минут
    const authDate = params.get("auth_date");
    if (authDate) {
      const authTimestamp = parseInt(authDate, 10);
      const now = Math.floor(Date.now() / 1000);
      const MAX_AGE_SECONDS = 300; // 5 минут
      if (now - authTimestamp > MAX_AGE_SECONDS) {
        console.error("[AUTH] initData expired:", now - authTimestamp, "seconds old");
        return null;
      }
    }

    return parseTelegramUser(params);
  } catch (error) {
    console.error("Error validating Telegram data:", error);
    return null;
  }
}

// Извлечение user из params (вспомогательная)
function parseTelegramUser(params: URLSearchParams): TelegramUser | null {
  const userStr = params.get("user");
  if (!userStr) {
    console.error("No user in initData");
    return null;
  }
  const user = JSON.parse(userStr);
  if (!user.id) {
    console.error("No user id in initData");
    return null;
  }
  return user;
}

// Получить или создать пользователя
export async function getOrCreateUser(telegramUser: TelegramUser) {
  const user = await prisma.user.findFirst({
    where: { telegramId: telegramUser.id.toString() },
  });

  if (user) return user;

  return prisma.user.create({
    data: {
      telegramId: telegramUser.id.toString(),
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name || null,
      username: telegramUser.username || null,
      photoUrl: telegramUser.photo_url || null,
      role: "STUDENT",
      balance: 0,
    },
  });
}

// Отправить голосование с inline кнопками
export async function sendVotingToChat(
  chatId: string,
  voting: {
    id: string;
    title: string;
    description?: string;
    minParticipants: number;
    deadline: Date;
    chargeOnVote: boolean;
    options: Array<{
      id: string;
      dayOfWeek: number;
      time: string;
      description?: string;
    }>;
    group: { fixedPrice?: number };
  }
) {
  const token = getBotToken();
  if (!token) {
    console.error("[BOT] TELEGRAM_BOT_TOKEN not set");
    return { success: false, error: "Bot token not configured" };
  }

  const DAYS_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  
  const deadlineStr = voting.deadline.toLocaleString("ru-RU", {
    day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
  });

  let message = `🗳️ *${voting.title}*\n`;
  if (voting.description) message += `\n${voting.description}\n`;
  message += `\n📅 Дедлайн: ${deadlineStr}`;
  message += `\n👥 Минимум участников: ${voting.minParticipants}`;
  
  if (voting.chargeOnVote) {
    const price = voting.group.fixedPrice || 1000;
    message += `\n💰 При голосовании спишется 1 занятие (${price}₽)`;
  }
  message += `\n\n_Выберите дни, когда сможете прийти:_`;

  const keyboard = {
    inline_keyboard: voting.options.map(opt => [{
      text: `${DAYS_SHORT[opt.dayOfWeek]} ${opt.time}`,
      callback_data: `vote_${voting.id}_${opt.id}`
    }])
  };

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId, text: message, parse_mode: "Markdown", reply_markup: keyboard,
      }),
    });
    const data = await response.json();
    if (data.ok) return { success: true, messageId: data.result.message_id };
    console.error("[BOT] Telegram API error:", data);
    return { success: false, error: data.description };
  } catch (error) {
    console.error("[BOT] Error sending voting:", error);
    return { success: false, error: "Network error" };
  }
}

// Отправить сообщение с кнопкой оплаты после голосования
export async function sendPaymentRequestAfterVote(
  chatId: string,
  userId: string,
  voting: { id: string; title: string; group: { fixedPrice?: number } }
) {
  const token = getBotToken();
  if (!token) return { success: false, error: "Bot token not configured" };

  const price = voting.group.fixedPrice || 1000;
  
  const message = `✅ Вы проголосовали в "${voting.title}"\n\n💰 Для подтверждения участия необходимо оплатить 1 занятие (${price}₽)\n\nНажмите кнопку ниже для оплаты:`;

  const keyboard = {
    inline_keyboard: [
      [{ text: `💳 Оплатить ${price}₽`, callback_data: `pay_voting_${voting.id}_${userId}` }],
      [{ text: "🧘‍♀️ Открыть в приложении", web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}/voting?pay=${voting.id}` } }]
    ]
  };

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "Markdown", reply_markup: keyboard }),
    });
    const data = await response.json();
    if (data.ok) return { success: true, messageId: data.result.message_id };
    console.error("[BOT] Telegram API error:", data);
    return { success: false, error: data.description };
  } catch (error) {
    console.error("[BOT] Error sending payment request:", error);
    return { success: false, error: "Network error" };
  }
}

// Создать invoice для оплаты через Telegram
export async function createTelegramInvoice(
  chatId: string,
  paymentData: { title: string; description: string; payload: string; amount: number; currency?: string }
) {
  const token = getBotToken();
  if (!token) return { success: false, error: "Bot token not configured" };

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendInvoice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        title: paymentData.title,
        description: paymentData.description,
        payload: paymentData.payload,
        provider_token: process.env.TELEGRAM_PAYMENT_PROVIDER_TOKEN || "",
        currency: paymentData.currency || "RUB",
        prices: [{ label: "Занятие", amount: paymentData.amount }],
        start_parameter: "pay_voting",
        need_name: false, need_phone_number: false, need_email: false,
        need_shipping_address: false, is_flexible: false,
      }),
    });
    const data = await response.json();
    if (data.ok) return { success: true, messageId: data.result.message_id };
    console.error("[BOT] Telegram API error:", data);
    return { success: false, error: data.description };
  } catch (error) {
    console.error("[BOT] Error creating invoice:", error);
    return { success: false, error: "Network error" };
  }
}

// Отправить уведомление об оплате
export async function sendPaymentMessage(
  chatId: string,
  payment: { amount: number; classesCount: number }
) {
  const token = getBotToken();
  if (!token) return;

  const message = `✅ *Оплата успешна!*\n\n💰 Сумма: *${payment.amount.toLocaleString()} ₽*\n🎫 Занятий: *${payment.classesCount}*\n\nСпасибо за покупку! Ваш баланс пополнен.`;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "Markdown" }),
    });
  } catch (error) {
    console.error("[BOT] Error sending payment message:", error);
  }
}

// Отправить напоминание о занятии
export async function sendClassReminder(
  chatId: string,
  classInfo: { title: string; date: Date; time: string }
) {
  const token = getBotToken();
  if (!token) return;

  const message = `⏰ *Напоминание о занятии*\n\n🧘‍♀️ *${classInfo.title}*\n📅 ${classInfo.date.toLocaleDateString("ru-RU")} в ${classInfo.time}\n\nДо начала осталось менее 2 часов!`;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "Markdown" }),
    });
  } catch (error) {
    console.error("[BOT] Error sending reminder:", error);
  }
}

// Универсальная функция отправки сообщения (для remind route)
export async function sendTelegramMessage(
  chatId: string,
  message: { text: string; parseMode?: "Markdown" | "HTML" }
) {
  const token = getBotToken();
  if (!token) {
    console.error("[BOT] TELEGRAM_BOT_TOKEN not set");
    throw new Error("Bot token not configured");
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message.text,
        parse_mode: message.parseMode || "Markdown",
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error("[BOT] Telegram API error:", data);
      throw new Error(data.description || "Failed to send message");
    }
    return { success: true, messageId: data.result.message_id };
  } catch (error) {
    console.error("[BOT] Error sending Telegram message:", error);
    throw error;
  }
}
