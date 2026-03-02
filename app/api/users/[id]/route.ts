import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { idParamSchema } from "@/lib/validation";
import { getTelegramUser } from "@/lib/telegram";

// GET /api/users/[id] - получить пользователя
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getTelegramUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validate ID param
    const idValidation = idParamSchema.safeParse({ id });
    if (!idValidation.success) {
      return NextResponse.json(
        { success: false, error: "Неверный формат ID", details: idValidation.error.issues },
        { status: 400 }
      );
    }

    // Ученик может видеть только себя, тренер — любого
    if (authUser.role !== "TRAINER" && authUser.id !== id) {
      return NextResponse.json(
        { success: false, error: "Нет доступа к данным другого пользователя" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            class: true,
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("[USER_GET]", error);
    return NextResponse.json(
      { success: false, error: "Ошибка получения пользователя" },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id] - обновить профиль пользователя (без баланса)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getTelegramUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validate ID param
    const idValidation = idParamSchema.safeParse({ id });
    if (!idValidation.success) {
      return NextResponse.json(
        { success: false, error: "Неверный формат ID", details: idValidation.error.issues },
        { status: 400 }
      );
    }

    // Пользователь может редактировать только себя, тренер — любого
    if (authUser.role !== "TRAINER" && authUser.id !== id) {
      return NextResponse.json(
        { success: false, error: "Нет доступа к данным другого пользователя" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Разрешенные поля для обновления (баланс изменяется только через платежи)
    const allowedFields = ["firstName", "lastName", "phone", "email"];
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Проверяем, есть ли данные для обновления
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "Нет полей для обновления" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("[USER_PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Ошибка обновления пользователя" },
      { status: 500 }
    );
  }
}
