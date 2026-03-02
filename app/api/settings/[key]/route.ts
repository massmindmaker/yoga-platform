import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTelegramUser } from "@/lib/telegram";

// GET /api/settings/[key] - получить конкретную настройку
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const user = await getTelegramUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }

    const { key } = await params;
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      return NextResponse.json(
        { success: false, error: "Настройка не найдена" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: setting });
  } catch (error) {
    console.error("[SETTINGS_GET_ONE]", error);
    return NextResponse.json(
      { success: false, error: "Ошибка получения настройки" },
      { status: 500 }
    );
  }
}

// PATCH /api/settings/[key] - обновить настройку (только тренер)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const user = await getTelegramUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }
    if (user.role !== "TRAINER") {
      return NextResponse.json(
        { success: false, error: "Только тренер может изменять настройки" },
        { status: 403 }
      );
    }

    const { key } = await params;
    const { value, description } = await req.json();

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: {
        value: JSON.stringify(value),
        ...(description && { description }),
      },
      create: {
        key,
        value: JSON.stringify(value),
        description: description || "",
      },
    });

    return NextResponse.json({ success: true, data: setting });
  } catch (error) {
    console.error("[SETTINGS_PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Ошибка обновления настройки" },
      { status: 500 }
    );
  }
}
