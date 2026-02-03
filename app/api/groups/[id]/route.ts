import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/groups/[id] - получить группу
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        schedules: true,
        students: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                balance: true
              }
            }
          }
        },
        _count: {
          select: { students: true }
        }
      }
    });

    if (!group) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: group });
  } catch (error) {
    console.error("Error fetching group:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch group" },
      { status: 500 }
    );
  }
}

// PATCH /api/groups/[id] - обновить группу
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description, maxStudents, telegramChat, schedules } = body;

    // Обновляем основную информацию
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (maxStudents !== undefined) updateData.maxStudents = maxStudents;
    if (telegramChat !== undefined) updateData.telegramChat = telegramChat;

    // Если есть новое расписание, удаляем старое и создаем новое
    if (schedules) {
      await prisma.schedule.deleteMany({
        where: { groupId: id }
      });
      
      updateData.schedules = {
        create: schedules.map((s: any) => ({
          dayOfWeek: s.dayOfWeek,
          time: s.time,
        }))
      };
    }

    const group = await prisma.group.update({
      where: { id },
      data: updateData,
      include: {
        schedules: true
      }
    });

    return NextResponse.json({ success: true, data: group });
  } catch (error) {
    console.error("Error updating group:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update group" },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[id] - удалить группу
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.group.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting group:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete group" },
      { status: 500 }
    );
  }
}
