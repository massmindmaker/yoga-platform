import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createGroupSchema } from "@/lib/validation";
import { getTelegramUser } from "@/lib/telegram";

// GET /api/groups - получить все группы
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
    const trainerId = searchParams.get("trainerId");
    const groupType = searchParams.get("groupType");

    const where: Record<string, unknown> = {};
    if (trainerId) where.trainerId = trainerId;
    if (groupType) where.groupType = groupType;

    const groups = await prisma.group.findMany({
      where,
      include: {
        schedules: true,
        trainer: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: {
          select: { students: true, votings: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: groups });
  } catch (error) {
    console.error("[GROUPS_GET]", error);
    return NextResponse.json(
      { success: false, error: "Ошибка получения групп" },
      { status: 500 }
    );
  }
}

// POST /api/groups - создать группу (только тренер)
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
        { success: false, error: "Только тренер может создавать группы" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const validationResult = createGroupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Ошибка валидации", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      groupType,
      pricingType,
      fixedPrice,
      maxStudents,
      telegramChat,
      startsAt,
      endsAt,
      schedules,
    } = validationResult.data;

    // trainerId из auth, не из body
    const trainerId = user.id;

    const group = await prisma.group.create({
      data: {
        name,
        description,
        groupType: groupType || "REGULAR",
        pricingType: pricingType || "FIXED",
        fixedPrice: fixedPrice || 1,
        maxStudents: maxStudents || 15,
        telegramChat,
        trainerId,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        schedules: {
          create: schedules?.map((s) => ({
            dayOfWeek: s.dayOfWeek,
            time: s.time,
            description: s.description || null,
          })) || [],
        },
      },
      include: {
        schedules: true,
        trainer: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: {
          select: { students: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: group });
  } catch (error) {
    console.error("[GROUPS_POST]", error);
    return NextResponse.json(
      { success: false, error: "Ошибка создания группы" },
      { status: 500 }
    );
  }
}
