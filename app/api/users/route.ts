import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTelegramUser } from "@/lib/telegram";
import type { Role } from "@prisma/client";

// POST /api/users - создать/получить пользователя (при первом входе)
export async function POST(req: NextRequest) {
  try {
    const user = await getTelegramUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }

    // Пользователь уже существует (getTelegramUser нашёл его в БД) — возвращаем
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("[USERS_POST]", error);
    return NextResponse.json(
      { success: false, error: "Ошибка создания пользователя" },
      { status: 500 }
    );
  }
}

// GET /api/users - получить всех пользователей (только тренер)
export async function GET(req: NextRequest) {
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
        { success: false, error: "Только тренер может просматривать список пользователей" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const limit = searchParams.get("limit");

    const where: { role?: Role } = {};
    if (role) where.role = role as Role;

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...(limit && !isNaN(parseInt(limit, 10)) ? { take: Math.min(parseInt(limit, 10), 100) } : {}),
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("[USERS_GET]", error);
    return NextResponse.json(
      { success: false, error: "Ошибка получения пользователей" },
      { status: 500 }
    );
  }
}
