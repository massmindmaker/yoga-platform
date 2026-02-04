import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateGroupSchema, idParamSchema } from "@/lib/validation";
import type { ScheduleInput } from "@/src/types";

// GET /api/groups/[id] - получить группу
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID param
    const idValidation = idParamSchema.safeParse({ id });
    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid ID format",
          details: idValidation.error.issues,
        },
        { status: 400 }
      );
    }

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

    // Validate ID param
    const idValidation = idParamSchema.safeParse({ id });
    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid ID format",
          details: idValidation.error.issues,
        },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Validate request body
    const validationResult = updateGroupSchema.safeParse(body);
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

    const { name, description, minStudents, telegramChat, schedules } = validationResult.data;

    // Обновляем основную информацию
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (minStudents !== undefined) updateData.maxStudents = minStudents;
    if (telegramChat !== undefined) updateData.telegramChat = telegramChat;

    // Если есть новое расписание, удаляем старое и создаем новое
    if (schedules) {
      await prisma.schedule.deleteMany({
        where: { groupId: id }
      });

      updateData.schedules = {
        create: schedules.map((s) => ({
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

    // Validate ID param
    const idValidation = idParamSchema.safeParse({ id });
    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid ID format",
          details: idValidation.error.issues,
        },
        { status: 400 }
      );
    }

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
