// Telegram Bot Service
import { prisma } from "@/lib/db";
import crypto from "crypto";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`;

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

// Упрощенная проверка - только извлечение userId и username
export function validateTelegramData(initData: string): TelegramUser | null {
  try {
    const params = new URLSearchParams(initData);
    const userStr = params.get("user");
    
    if (!userStr) {
      console.error("No user in initData");
      return null;
    }
    
    const user = JSON.parse(userStr);
    
    // Проверяем только наличие id
    if (!user.id) {
      console.error("No user id in initData");
      return null;
    }
    
    return user;
  } catch (error) {
    console.error("Error parsing Telegram data:", error);
    return null;
  }
}

// Получить или создать пользователя
export async function getOrCreateUser(telegramUser: TelegramUser) {
  const user = await prisma.user.findFirst({
    where: {
      telegramId: telegramUser.id.toString(),
    },
  });

  if (user) {
    return user;
  }

  // Создаем нового пользователя
  const newUser = await prisma.user.create({
    data: {
      telegramId: telegramUser.id.toString(),
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name || null,
      role: "STUDENT",
      balance: 0,
    },
  });

  return newUser;
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
    group: {
      fixedPrice?: number;
    };
  }
) {
  if (!BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN not set");
    return { success: false, error: "Bot token not configured" };
  }

  const DAYS_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  
  // Форматируем дедлайн
  const deadlineStr = voting.deadline.toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  });

  // Формируем текст сообщения
  let message = `🗳️ *${voting.title}*\n`;
  if (voting.description) {
    message += `\n${voting.description}\n`;
  }
  message += `\n📅 Дедлайн: ${deadlineStr}`;
  message += `\n👥 Минимум участников: ${voting.minParticipants}`;
  
  if (voting.chargeOnVote) {
    const price = voting.group.fixedPrice || 1000;
    message += `\n💰 При голосовании спишется 1 занятие (${price}₽)`;
  }
  
  message += `\n\n_Выберите дни, когда сможете прийти:_`;

  // Создаём inline кнопки для каждого дня
  const keyboard = {
    inline_keyboard: voting.options.map(opt => [{
      text: `${DAYS_SHORT[opt.dayOfWeek]} ${opt.time}`,
      callback_data: `vote_${voting.id}_${opt.id}`
    }])
  };

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
        reply_markup: keyboard,
      }),
    });

    const data = await response.json();
    
    if (data.ok) {
      return { success: true, messageId: data.result.message_id };
    } else {
      console.error("Telegram API error:", data);
      return { success: false, error: data.description };
    }
  } catch (error) {
    console.error("Error sending voting to Telegram:", error);
    return { success: false, error: "Network error" };
  }
}

// Отправить уведомление об оплате
export async function sendPaymentMessage(
  chatId: string,
  payment: {
    amount: number;
    classesCount: number;
  }
) {
  if (!BOT_TOKEN) return;

  const message = `
✅ *Оплата успешна!*

💰 Сумма: *${payment.amount.toLocaleString()} ₽*
🎫 Занятий: *${payment.classesCount}*

Спасибо за покупку! Ваш баланс пополнен.
  `.trim();

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });
  } catch (error) {
    console.error("Error sending payment message:", error);
  }
}

// Отправить напоминание о занятии
export async function sendClassReminder(
  chatId: string,
  classInfo: {
    title: string;
    date: Date;
    time: string;
  }
) {
  if (!BOT_TOKEN) return;

  const message = `
⏰ *Напоминание о занятии*

🧘‍♀️ *${classInfo.title}*
📅 ${classInfo.date.toLocaleDateString("ru-RU")} в ${classInfo.time}

До начала осталось менее 2 часов!
  `.trim();

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });
  } catch (error) {
    console.error("Error sending reminder:", error);
  }
}
