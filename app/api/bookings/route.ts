import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/bookings - получить бронирования пользователя
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const upcoming = searchParams.get("upcoming");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId required" },
        { status: 400 }
      );
    }

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
    const body = await req.json();
    const { userId, classId } = body;

    if (!userId || !classId) {
      return NextResponse.json(
        { success: false, error: "userId and classId required" },
        { status: 400 }
      );
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
