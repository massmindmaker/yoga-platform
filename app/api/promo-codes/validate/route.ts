import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { getTelegramUser } from "@/lib/telegram";

const validateSchema = z.object({
  code: z.string().min(1),
});

// POST /api/promo-codes/validate - проверить промокод
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
    const validation = validateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Неверный запрос" },
        { status: 400 }
      );
    }

    const { code } = validation.data;
    const now = new Date();

    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promoCode) {
      return NextResponse.json(
        { success: false, error: "Промокод не найден" },
        { status: 404 }
      );
    }

    if (!promoCode.isActive) {
      return NextResponse.json(
        { success: false, error: "Промокод неактивен" },
        { status: 400 }
      );
    }

    if (promoCode.validUntil < now) {
      return NextResponse.json(
        { success: false, error: "Промокод истёк" },
        { status: 400 }
      );
    }

    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
      return NextResponse.json(
        { success: false, error: "Лимит использования промокода исчерпан" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        code: promoCode.code,
        discountPercent: promoCode.discountPercent,
        discountAmount: promoCode.discountAmount,
      },
    });
  } catch (error) {
    console.error("[PROMO_CODES_VALIDATE]", error);
    return NextResponse.json(
      { success: false, error: "Ошибка проверки промокода" },
      { status: 500 }
    );
  }
}
