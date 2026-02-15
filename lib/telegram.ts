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
  const existingUser = await prisma.user.findFirst({
    where: { telegramId: telegramUser.id.toString() },
  });

  // Если пользователь существует - обновляем его данные (включая photoUrl)
  if (existingUser) {
    return prisma.user.update({
      where: { id: existingUser.id },
      data: {
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name || null,
        username: telegramUser.username || null,
        photoUrl: telegramUser.photo_url || existingUser.photoUrl,
      },
    });
  }

  // Создаём нового пользователя
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

// Отправить голосование как нативный Telegram Poll
// Для FIXED: сразу после Poll отправляется сообщение с кнопками оплаты
// Для DYNAMIC: кнопка оплаты появится после финализации (sendDynamicPaymentMessage)
export async function sendVotingToChat(
  chatId: string,
  voting: {
    id: string;
    title: string;
    description?: string;
    multipleChoice?: boolean;
    minParticipants: number;
    deadline: Date;
    chargeOnVote: boolean;
    pricingType: string;
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

  // Формируем вопрос Poll
  const question = `🗳️ ${voting.title}`;

  // Варианты ответа — текстовые строки (макс 100 символов)
  const pollOptions = voting.options.map((opt) => {
    let label = `${DAYS_SHORT[opt.dayOfWeek]} ${opt.time}`;
    if (opt.description) label += ` — ${opt.description}`;
    return { text: label.slice(0, 100) };
  });

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendPoll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        question,
        options: pollOptions,
        is_anonymous: false,
        allows_multiple_answers: voting.multipleChoice !== false,
      }),
    });
    const data = await response.json();
    if (!data.ok) {
      console.error("[BOT] Telegram sendPoll error:", data);
      return { success: false, error: data.description };
    }

    const pollId = data.result.poll.id;
    const messageId = data.result.message_id;

    // Для FIXED pricing — сразу отправляем сообщение с кнопками оплаты под Poll-ом
    if (voting.pricingType === "FIXED") {
      const price = voting.group.fixedPrice || 1;
      // callback_data limit: 64 bytes. Format: pf:{8-char-voting-id}
      const shortId = voting.id.slice(0, 8);
      
      const paymentMsg = `💳 *Оплата участия*\n\nСтоимость: *${price} зан.*\nВы можете оплатить картой или списать с баланса.\nОплата наличными — в зале.`;
      
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: paymentMsg,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: `💳 Оплатить картой`, callback_data: `pc:${shortId}` },
                { text: `📝 Списать с баланса`, callback_data: `pb:${shortId}` },
              ],
            ],
          },
        }),
      }).catch((err) => console.error("[BOT] Error sending payment message:", err));
    } else {
      // DYNAMIC — информируем, что цена будет позже
      const infoMsg = `ℹ️ Стоимость занятия зависит от количества участников.\nОплата станет доступна после завершения голосования.`;
      
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: infoMsg,
        }),
      }).catch((err) => console.error("[BOT] Error sending info message:", err));
    }

    return { success: true, messageId, pollId };
  } catch (error) {
    console.error("[BOT] Error sending poll:", error);
    return { success: false, error: "Network error" };
  }
}

// Остановить нативный Telegram Poll
export async function stopTelegramPoll(chatId: string, messageId: string) {
  const token = getBotToken();
  if (!token) return { success: false, error: "Bot token not configured" };

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/stopPoll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, message_id: parseInt(messageId) }),
    });
    const data = await response.json();
    if (data.ok) return { success: true };
    console.error("[BOT] stopPoll error:", data);
    return { success: false, error: data.description };
  } catch (error) {
    console.error("[BOT] Error stopping poll:", error);
    return { success: false, error: "Network error" };
  }
}

// Отправить сообщение с кнопкой оплаты после финализации DYNAMIC голосования
export async function sendDynamicPaymentMessage(
  chatId: string,
  voting: {
    id: string;
    title: string;
    options: Array<{ id: string; dayOfWeek: number; time: string; finalPrice?: number | null; _count?: { votes: number } }>;
  }
) {
  const token = getBotToken();
  if (!token) return { success: false, error: "Bot token not configured" };

  const DAYS_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const shortId = voting.id.slice(0, 8);

  let message = `🏁 *Голосование завершено: ${voting.title}*\n\n`;
  
  const buttons: Array<{ text: string; callback_data: string }[]> = [];
  
  for (const opt of voting.options) {
    const day = DAYS_SHORT[opt.dayOfWeek];
    const voters = opt._count?.votes || 0;
    const price = opt.finalPrice;
    message += `${day} ${opt.time} — ${voters} чел.`;
    if (price) {
      message += ` → *${price}₽*`;
    }
    message += `\n`;
    
    if (price) {
      // callback_data: pd:{shortVotingId}:{optionIndex} (dynamic pay card)
      const optIdx = voting.options.indexOf(opt);
      buttons.push([
        { text: `💳 ${day} ${opt.time} — ${price}₽`, callback_data: `pd:${shortId}:${optIdx}` },
      ]);
    }
  }
  
  message += `\nОплатите картой или наличными в зале:`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
        reply_markup: buttons.length > 0 ? { inline_keyboard: buttons } : undefined,
      }),
    });
    const data = await response.json();
    if (data.ok) return { success: true, messageId: data.result.message_id };
    console.error("[BOT] Telegram API error:", data);
    return { success: false, error: data.description };
  } catch (error) {
    console.error("[BOT] Error sending dynamic payment message:", error);
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
