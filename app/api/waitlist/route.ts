import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { getTelegramUser } from "@/lib/telegram";

// Validation schemas
const createWaitlistSchema = z.object({
  groupId: z.string().uuid("Invalid group ID").optional(),
  classId: z.string().uuid("Invalid class ID").optional(),
  priority: z.number().int().default(0),
});

const updateWaitlistSchema = z.object({
  priority: z.number().int().optional(),
  status: z.enum(["ACTIVE", "FULFILLED", "CANCELLED", "EXPIRED"]).optional(),
});

// GET /api/waitlist - получить лист ожидания
export async function GET(req: NextRequest) {
  try {
    const user = await getTelegramUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    const classId = searchParams.get("classId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};

    // Ученик видит только свои записи, тренер — все
    if (user.role !== "TRAINER") {
      where.userId = user.id;
    } else {
      const userId = searchParams.get("userId");
      if (userId) where.userId = userId;
    }

    if (groupId) where.groupId = groupId;
    if (classId) where.classId = classId;
    if (status) where.status = status;

    const waitlist = await prisma.waitlist.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        group: {
          select: { id: true, name: true, maxStudents: true },
        },
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json({ success: true, data: waitlist });
  } catch (error) {
    console.error("[WAITLIST_GET]", error);
    return NextResponse.json(
      { success: false, error: "Ошибка получения листа ожидания" },
      { status: 500 }
    );
  }
}

// POST /api/waitlist - добавить в лист ожидания (userId из auth)
export async function POST(req: NextRequest) {
  try {
    const user = await getTelegramUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const validationResult = createWaitlistSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Ошибка валидации", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { groupId, classId, priority } = validationResult.data;
    // userId из auth
    const userId = user.id;

    // Validate that at least one of groupId or classId is provided
    if (!groupId && !classId) {
      return NextResponse.json(
        { success: false, error: "Необходимо указать groupId или classId" },
        { status: 400 }
      );
    }

    // Check if user already in waitlist for this group/class
    const existingEntry = await prisma.waitlist.findFirst({
      where: {
        userId,
        ...(groupId && { groupId }),
        ...(classId && { classId }),
        status: "ACTIVE",
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        { success: false, error: "Вы уже в листе ожидания" },
        { status: 409 }
      );
    }

    // Verify group exists if provided
    if (groupId) {
      const group = await prisma.group.findUnique({
        where: { id: groupId },
      });

      if (!group) {
        return NextResponse.json(
          { success: false, error: "Группа не найдена" },
          { status: 404 }
        );
      }
    }

    const entry = await prisma.waitlist.create({
      data: {
        userId,
        groupId,
        classId,
        priority,
        status: "ACTIVE",
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        group: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    console.error("[WAITLIST_POST]", error);
    return NextResponse.json(
      { success: false, error: "Ошибка добавления в лист ожидания" },
      { status: 500 }
    );
  }
}

// PATCH /api/waitlist - обновить запись в листе ожидания (только тренер)
export async function PATCH(req: NextRequest) {
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
        { success: false, error: "Только тренер может обновлять лист ожидания" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID записи обязателен" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const validationResult = updateWaitlistSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Ошибка валидации", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = validationResult.data;

    // If status is being changed to FULFILLED, set fulfilledAt
    if (validationResult.data.status === "FULFILLED") {
      updateData.fulfilledAt = new Date();
    }

    const entry = await prisma.waitlist.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        group: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    console.error("[WAITLIST_PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Ошибка обновления записи" },
      { status: 500 }
    );
  }
}

// DELETE /api/waitlist - удалить из листа ожидания (только тренер)
export async function DELETE(req: NextRequest) {
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
        { success: false, error: "Только тренер может удалять из листа ожидания" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID записи обязателен" },
        { status: 400 }
      );
    }

    await prisma.waitlist.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[WAITLIST_DELETE]", error);
    return NextResponse.json(
      { success: false, error: "Ошибка удаления записи" },
      { status: 500 }
    );
  }
}
