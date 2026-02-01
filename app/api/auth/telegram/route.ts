import { NextRequest, NextResponse } from "next/server";
import { validateTelegramData, getOrCreateUser } from "@/lib/telegram";

// POST /api/auth/telegram - авторизация через Telegram WebApp
export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json();

    if (!initData) {
      return NextResponse.json(
        { success: false, error: "initData required" },
        { status: 400 }
      );
    }

    // Валидируем данные от Telegram
    const telegramUser = validateTelegramData(initData);

    if (!telegramUser) {
      return NextResponse.json(
        { success: false, error: "Invalid Telegram data" },
        { status: 401 }
      );
    }

    // Получаем или создаем пользователя
    const user = await getOrCreateUser(telegramUser);

    return NextResponse.json({
      success: true,
      data: {
        user,
        telegram: {
          id: telegramUser.id,
          username: telegramUser.username,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
        },
      },
    });
  } catch (error) {
    console.error("Error in Telegram auth:", error);
    return NextResponse.json(
      { success: false, error: "Authentication failed" },
      { status: 500 }
    );
  }
}
