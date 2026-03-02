import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTelegramUser } from "@/lib/telegram";

// GET /api/settings - получить все настройки
export async function GET(req: NextRequest) {
  try {
    const user = await getTelegramUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }

    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: "asc" },
    });

    // Convert to key-value object
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, unknown>);

    return NextResponse.json({ success: true, data: settingsObject });
  } catch (error) {
    console.error("[SETTINGS_GET]", error);
    return NextResponse.json(
      { success: false, error: "Ошибка получения настроек" },
      { status: 500 }
    );
  }
}
