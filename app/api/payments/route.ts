import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createPayment } from "@/lib/tbank";
import { createPaymentSchema } from "@/lib/validation";
import { getTelegramUser } from "@/lib/telegram";

// POST /api/payments - создать платеж
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
    // Подставляем userId из auth
    body.userId = user.id;

    // Validate request body
    const validationResult = createPaymentSchema.safeParse(body);
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

    const { userId, amount, classesCount, telegramId } = validationResult.data;

    // Создаем запись о платеже в базе
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount,
        classesCount,
        status: "PENDING",
        provider: "tbank",
      },
    });

    // Создаем платеж в T-Bank
    const result = await createPayment({
      amount: amount * 100, // в копейках
      orderId: payment.id,
      description: `Покупка ${classesCount} занятий`,
      userId,
      telegramId,
    });

    if (result.success) {
      // Обновляем externalId
      await prisma.payment.update({
        where: { id: payment.id },
        data: { externalId: result.paymentId },
      });

      return NextResponse.json({
        success: true,
        paymentUrl: result.paymentUrl,
        paymentId: payment.id,
      });
    } else {
      // Отменяем платеж
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });

      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create payment" },
      { status: 500 }
    );
  }
}

// GET /api/payments - получить платежи текущего пользователя
export async function GET(req: NextRequest) {
  try {
    const user = await getTelegramUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }

    // userId из auth, не из query params
    const payments = await prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: payments });
  } catch (error) {
    console.error("[PAYMENTS_GET]", error);
    return NextResponse.json(
      { success: false, error: "Ошибка получения платежей" },
      { status: 500 }
    );
  }
}
