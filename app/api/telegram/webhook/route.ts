import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/telegram/webhook - webhook для сообщений от бота
export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // Обработка команды /start
    if (update.message?.text === "/start") {
      const chatId = update.message.chat.id;
      const user = update.message.from;

      // Приветственное сообщение
      await sendTelegramMessage(
        chatId,
        `👋 Привет, ${user.first_name}!\n\nЯ бот Yoga Studio. Я помогу тебе:\n• Записываться на занятия\n• Узнавать о голосованиях\n• Отслеживать баланс\n\nОткрывай приложение и начинай заниматься! 🧘‍♀️`,
        {
          inline_keyboard: [
            [
              {
                text: "🧘‍♀️ Открыть приложение",
                web_app: {
                  url: process.env.NEXT_PUBLIC_APP_URL || "",
                },
              },
            ],
          ],
        }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in Telegram webhook:", error);
    return NextResponse.json({ ok: false });
  }
}

// Вспомогательная функция для отправки сообщений
async function sendTelegramMessage(
  chatId: number,
  text: string,
  replyMarkup?: any
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      reply_markup: replyMarkup,
    }),
  });
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
