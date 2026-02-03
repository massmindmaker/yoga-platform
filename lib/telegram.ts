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

// Отправить сообщение о голосовании
export async function sendVotingMessage(
  chatId: string,
  voting: {
    id: string;
    title: string;
    currentVotes: number;
    minParticipants: number;
    deadline: Date;
  }
) {
  if (!BOT_TOKEN) return;

  const progress = Math.round((voting.currentVotes / voting.minParticipants) * 100);
  const needed = Math.max(0, voting.minParticipants - voting.currentVotes);

  const message = `
🗳️ *${voting.title}*

📊 Проголосовало: *${voting.currentVotes}/${voting.minParticipants}* (${progress}%)
⏰ До: ${voting.deadline.toLocaleDateString("ru-RU")}

${needed > 0 ? `⚠️ Нужно еще *${needed}* человек` : "✅ Занятие состоится!"}

[Проголосовать в приложении](${process.env.NEXT_PUBLIC_APP_URL}/voting)
  `.trim();

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });
  } catch (error) {
    console.error("Error sending Telegram message:", error);
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
