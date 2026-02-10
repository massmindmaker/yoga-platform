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
                username: true,
                photoUrl: true,
                balance: true,
                telegramId: true
              }
            }
          }
        },
        votings: {
          where: {
            status: { in: ['ACTIVE', 'FINALIZED'] }
          },
          include: {
            options: {
              include: {
                votes: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        telegramId: true,
                      }
                    }
                  }
                },
                _count: { select: { votes: true } }
              }
            },
            _count: { select: { votes: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
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
      schedules 
    } = validationResult.data;

    // Обновляем основную информацию
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (groupType !== undefined) updateData.groupType = groupType;
    if (pricingType !== undefined) updateData.pricingType = pricingType;
    if (fixedPrice !== undefined) updateData.fixedPrice = fixedPrice;
    if (maxStudents !== undefined) updateData.maxStudents = maxStudents;
    if (telegramChat !== undefined) updateData.telegramChat = telegramChat;
    if (startsAt !== undefined) updateData.startsAt = startsAt ? new Date(startsAt) : null;
    if (endsAt !== undefined) updateData.endsAt = endsAt ? new Date(endsAt) : null;

    // Атомарное обновление: удаление старого расписания + создание нового в одной транзакции
    const group = await prisma.$transaction(async (tx) => {
      if (schedules) {
        await tx.schedule.deleteMany({
          where: { groupId: id }
        });

        updateData.schedules = {
          create: schedules.map((s: { dayOfWeek: number; time: string }) => ({
            dayOfWeek: s.dayOfWeek,
            time: s.time,
          }))
        };
      }

      return tx.group.update({
        where: { id },
        data: updateData as Record<string, unknown>,
        include: {
          schedules: true
        }
      });
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
