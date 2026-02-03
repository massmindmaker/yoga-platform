import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createPayment, handlePaymentWebhook } from "@/lib/tbank";
import { createPaymentSchema, getPaymentsQuerySchema } from "@/lib/validation";

// POST /api/payments - создать платеж
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

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

// GET /api/payments - получить платежи пользователя
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    // Validate query params
    const validationResult = getPaymentsQuerySchema.safeParse({ userId });
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

    const payments = await prisma.payment.findMany({
      where: { userId: validationResult.data.userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: payments });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
