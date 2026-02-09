import { NextRequest, NextResponse } from "next/server";

// GET /api/telegram/test - тест отправки сообщения
export async function GET(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chatId") || "test";

  const diagnostics: Record<string, unknown> = {
    tokenPresent: !!token,
    tokenLength: token?.length || 0,
    tokenPrefix: token?.slice(0, 10) || "MISSING",
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "NOT SET",
    nodeEnv: process.env.NODE_ENV,
  };

  // Если передали chatId — пробуем реально отправить
  if (chatId !== "test" && token) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "✅ Тестовое сообщение от бота! Всё работает.",
        }),
      });
      const data = await response.json();
      diagnostics.sendResult = data;
    } catch (error) {
      diagnostics.sendError = String(error);
    }
  }

  return NextResponse.json(diagnostics);
}
