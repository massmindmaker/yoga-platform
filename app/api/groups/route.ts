import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createGroupSchema } from "@/lib/validation";

// GET /api/groups - получить все группы
export async function GET(req: NextRequest) {
  try {
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
          select: { students: true, votings: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: groups });
  } catch (error) {
    console.error("[GROUPS_GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}

// POST /api/groups - создать группу
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validationResult = createGroupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationResult.error.issues,
        },
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

    // TODO: Get trainer ID from Telegram auth
    const trainerId = body.trainerId || null;

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
          })) || []
        }
      },
      include: {
        schedules: true,
        trainer: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: {
          select: { students: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: group });
  } catch (error) {
    console.error("[GROUPS_POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create group" },
      { status: 500 }
    );
  }
}
