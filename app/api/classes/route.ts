import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTelegramUser } from "@/lib/telegram";
import type { Prisma, ClassStatus } from "@prisma/client";

// GET /api/classes - получить занятия (реальные + виртуальные из расписания)
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
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const status = searchParams.get("status");

    const where: Prisma.ClassWhereInput = {};

    if (groupId) {
      where.schedule = { groupId };
    }

    if (from || to) {
      where.date = {};
      if (from) {
        const fromDate = new Date(from);
        fromDate.setUTCHours(0, 0, 0, 0);
        where.date.gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setUTCHours(23, 59, 59, 999);
        where.date.lte = toDate;
      }
    }

    if (status) {
      where.status = status as ClassStatus;
    }

    // 1. Получаем реальные Class записи
    const existingClasses = await prisma.class.findMany({
      where,
      include: {
        schedule: {
          include: {
            group: true,
          },
        },
        trainer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        bookings: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    // 2. Генерируем виртуальные занятия из Schedule шаблонов
    //    Только для запросов с диапазоном дат и без фильтра по status
    let allClasses = [...existingClasses];

    if (from && !status) {
      const fromDate = new Date(from);
      fromDate.setUTCHours(0, 0, 0, 0);
      const toDate = to ? new Date(to) : new Date(from);
      toDate.setUTCHours(23, 59, 59, 999);

      // Получаем все расписания (шаблоны)
      const scheduleWhere: Prisma.ScheduleWhereInput = {};
      if (groupId) {
        scheduleWhere.groupId = groupId;
      }

      const schedules = await prisma.schedule.findMany({
        where: scheduleWhere,
        include: {
          group: {
            include: {
              trainer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      // Виртуальные занятия генерируем только для сегодня и будущих дат
      // (прошедшие виртуальные занятия не имеют смысла — они не были реально проведены)
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const virtualStartDate = fromDate < today ? today : fromDate;

      const currentDate = new Date(virtualStartDate);
      while (currentDate <= toDate) {
        const dayOfWeek = currentDate.getUTCDay(); // 0=Вс, 1=Пн, ..., 6=Сб (UTC!)
        const dateStr = currentDate.toISOString().split("T")[0]; // "2026-03-15"

        for (const schedule of schedules) {
          if (schedule.dayOfWeek !== dayOfWeek) continue;
          // Пропускаем расписания без тренера в группе
          if (!schedule.group.trainer) continue;

          // Проверяем, нет ли уже реальной Class записи для этого schedule+date
          const hasExisting = existingClasses.some(
            (c) =>
              c.scheduleId === schedule.id &&
              c.date.toISOString().split("T")[0] === dateStr
          );

          if (!hasExisting) {
            // Создаём виртуальное занятие
            const trainer = schedule.group.trainer;
            allClasses.push({
              id: `virtual-${schedule.id}-${dateStr}`,
              scheduleId: schedule.id,
              trainerId: trainer.id,
              date: new Date(`${dateStr}T00:00:00.000Z`),
              maxStudents: schedule.group.maxStudents,
              price: schedule.group.fixedPrice || 1,
              status: "SCHEDULED" as ClassStatus,
              createdAt: new Date(),
              schedule: {
                id: schedule.id,
                groupId: schedule.groupId,
                dayOfWeek: schedule.dayOfWeek,
                time: schedule.time,
                description: schedule.description,
                group: {
                  id: schedule.group.id,
                  name: schedule.group.name,
                  description: schedule.group.description,
                  groupType: schedule.group.groupType,
                  pricingType: schedule.group.pricingType,
                  fixedPrice: schedule.group.fixedPrice,
                  intensivePrice: schedule.group.intensivePrice,
                  maxStudents: schedule.group.maxStudents,
                  telegramChat: schedule.group.telegramChat,
                  telegramChatId: schedule.group.telegramChatId,
                  trainerId: schedule.group.trainerId,
                  startsAt: schedule.group.startsAt,
                  endsAt: schedule.group.endsAt,
                  createdAt: schedule.group.createdAt,
                },
              },
              trainer: { id: trainer.id, firstName: trainer.firstName, lastName: trainer.lastName },
              bookings: [],
              _count: { bookings: 0 },
            } as (typeof existingClasses)[number]);
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Сортируем по времени расписания
      allClasses.sort((a, b) => {
        const timeA = a.schedule.time || "00:00";
        const timeB = b.schedule.time || "00:00";
        return timeA.localeCompare(timeB);
      });
    }

    return NextResponse.json(
      { success: true, data: allClasses },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("[CLASSES_GET]", error);
    return NextResponse.json(
      { success: false, error: "Ошибка получения занятий" },
      { status: 500 }
    );
  }
}
