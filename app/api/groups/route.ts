import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/groups - получить все группы
export async function GET() {
  try {
    const groups = await prisma.group.findMany({
      include: {
        schedules: true,
        _count: {
          select: { students: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: groups });
  } catch (error) {
    console.error("Error fetching groups:", error);
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
    const { name, description, maxStudents, telegramChat, schedules } = body;

    const group = await prisma.group.create({
      data: {
        name,
        description,
        maxStudents: maxStudents || 20,
        telegramChat,
        schedules: {
          create: schedules?.map((s: any) => ({
            dayOfWeek: s.dayOfWeek,
            time: s.time,
          })) || []
        }
      },
      include: {
        schedules: true
      }
    });

    return NextResponse.json({ success: true, data: group });
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create group" },
      { status: 500 }
    );
  }
}
