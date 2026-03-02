import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { getTelegramUser } from "@/lib/telegram";

// Validation schemas
const createActivityLogSchema = z.object({
  action: z.string().min(1, "Action is required"),
  entityType: z.string().min(1, "Entity type is required"),
  entityId: z.string().uuid("Invalid entity ID").optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const queryActivityLogSchema = z.object({
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.number().int().positive().max(100).optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0),
});

// GET /api/activity-logs - получить логи действий (только тренер)
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
        { success: false, error: "Только тренер может просматривать логи" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);

    const query = {
      userId: searchParams.get("userId") || undefined,
      action: searchParams.get("action") || undefined,
      entityType: searchParams.get("entityType") || undefined,
      entityId: searchParams.get("entityId") || undefined,
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50,
      offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0,
    };

    const validationResult = queryActivityLogSchema.safeParse(query);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Ошибка валидации", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { userId, action, entityType, entityId, from, to, limit, offset } = validationResult.data;

    const where: {
      userId?: string;
      action?: string;
      entityType?: string;
      entityId?: string;
      createdAt?: { gte?: Date; lte?: Date };
    } = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + logs.length < total,
      },
    });
  } catch (error) {
    console.error("[ACTIVITY_LOGS_GET]", error);
    return NextResponse.json(
      { success: false, error: "Ошибка получения логов" },
      { status: 500 }
    );
  }
}

// POST /api/activity-logs - создать запись лога (только тренер)
export async function POST(req: NextRequest) {
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
        { success: false, error: "Только тренер может создавать логи" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const validationResult = createActivityLogSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Ошибка валидации", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { action, entityType, entityId, metadata } = validationResult.data;

    const log = await prisma.activityLog.create({
      data: {
        userId: user.id,
        action,
        entityType,
        entityId,
        metadata: metadata as Record<string, string | number | boolean | null>,
        ipAddress: req.headers.get("x-forwarded-for") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: log });
  } catch (error) {
    console.error("[ACTIVITY_LOGS_POST]", error);
    return NextResponse.json(
      { success: false, error: "Ошибка создания лога" },
      { status: 500 }
    );
  }
}

// DELETE /api/activity-logs - очистить старые логи (только тренер)
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
        { success: false, error: "Только тренер может удалять логи" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const olderThan = searchParams.get("olderThan");

    if (!olderThan) {
      return NextResponse.json(
        { success: false, error: "Параметр olderThan обязателен (ISO дата)" },
        { status: 400 }
      );
    }

    const date = new Date(olderThan);

    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { success: false, error: "Неверный формат даты" },
        { status: 400 }
      );
    }

    const result = await prisma.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: date,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { deletedCount: result.count },
    });
  } catch (error) {
    console.error("[ACTIVITY_LOGS_DELETE]", error);
    return NextResponse.json(
      { success: false, error: "Ошибка удаления логов" },
      { status: 500 }
    );
  }
}
