import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTelegramUser } from "@/lib/telegram";

// GET /api/bookings - получить бронирования пользователя
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
    const status = searchParams.get("status");
    const upcoming = searchParams.get("upcoming");

    // Используем user.id из auth вместо userId из query
    const userId = user.id;

    const where: Record<string, unknown> = { userId };
    
    if (status) {
      where.status = status;
    }

    if (upcoming === "true") {
      where.class = {
        date: {
          gte: new Date()
        }
      };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        class: {
          include: {
            schedule: {
              include: {
                group: true
              }
            }
          }
        },
        attendance: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    console.error("[BOOKINGS_GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

// POST /api/bookings - создать бронирование
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
    let { classId } = body;
    // Используем user.id из auth — не доверяем userId из body
    const userId = user.id;

    if (!classId) {
      return NextResponse.json(
        { success: false, error: "classId required" },
        { status: 400 }
      );
    }

    // Если classId виртуальный (virtual-{scheduleId}-{date}), создаём реальную Class запись
    if (typeof classId === "string" && classId.startsWith("virtual-")) {
      const parts = classId.replace("virtual-", "").split("-");
      // scheduleId — это UUID, date — "YYYY-MM-DD" (последние 3 части после split)
      const dateStr = parts.slice(-3).join("-"); // "2026-03-15"
      const scheduleId = parts.slice(0, -3).join("-"); // UUID

      const schedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
        include: { group: true },
      });

      if (!schedule) {
        return NextResponse.json(
          { success: false, error: "Расписание не найдено" },
          { status: 404 }
        );
      }

      // Проверяем, не создана ли уже Class за это время (race condition)
      const existingClass = await prisma.class.findFirst({
        where: {
          scheduleId,
          date: {
            gte: new Date(`${dateStr}T00:00:00.000Z`),
            lte: new Date(`${dateStr}T23:59:59.999Z`),
          },
        },
      });

      if (existingClass) {
        classId = existingClass.id;
      } else {
        const newClass = await prisma.class.create({
          data: {
            scheduleId,
            trainerId: schedule.group.trainerId || userId,
            date: new Date(`${dateStr}T00:00:00.000Z`),
            maxStudents: schedule.group.maxStudents,
            price: schedule.group.fixedPrice || 1,
            status: "SCHEDULED",
          },
        });
        classId = newClass.id;
      }
    }

    // Создаем бронирование и списываем баланс атомарно
    const result = await prisma.$transaction(async (tx) => {
      // Проверяем баланс ВНУТРИ транзакции (предотвращает race condition)
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { balance: true }
      });

      if (!user || user.balance < 1) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      // Создаем бронирование
      const booking = await tx.booking.create({
        data: {
          userId,
          classId,
          status: "CONFIRMED"
        },
        include: {
          class: {
            include: {
              schedule: {
                include: {
                  group: true
                }
              }
            }
          }
        }
      });

      // Списываем баланс
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: 1 } }
      });

      // Создаем транзакцию баланса
      await tx.balanceTransaction.create({
        data: {
          userId,
          amount: -1,
          type: "BOOKING_DEDUCTION",
          description: "Списание за запись на занятие",
          bookingId: booking.id
        }
      });

      return booking;
    }).catch((err) => {
      if (err.message === "INSUFFICIENT_BALANCE") {
        return null;
      }
      throw err;
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Insufficient balance", code: "NO_BALANCE" },
        { status: 402 }
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[BOOKINGS_POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
