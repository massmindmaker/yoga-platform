import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { getTelegramUser } from "@/lib/telegram";

const createPromoCodeSchema = z.object({
  code: z.string().min(3).max(50),
  discountPercent: z.number().min(0).max(100).optional(),
  discountAmount: z.number().min(0).optional(),
  validUntil: z.string().datetime(),
  maxUses: z.number().min(1).optional(),
});

// GET /api/promo-codes - список промокодов (только тренер)
export async function GET(req: NextRequest) {
  try {
    const user = await getTelegramUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }
    if (user.role !== "TRAINER") {
      return NextResponse.json(
        { success: false, error: "Только тренер может просматривать промокоды" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get("isActive");

    const where: Record<string, unknown> = {};
    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    const promoCodes = await prisma.promoCode.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: promoCodes });
  } catch (error) {
    console.error("[PROMO_CODES_GET]", error);
    return NextResponse.json(
      { success: false, error: "Ошибка получения промокодов" },
      { status: 500 }
    );
  }
}

// POST /api/promo-codes - создать промокод (только тренер)
export async function POST(req: NextRequest) {
  try {
    const user = await getTelegramUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }
    if (user.role !== "TRAINER") {
      return NextResponse.json(
        { success: false, error: "Только тренер может создавать промокоды" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = createPromoCodeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Ошибка валидации", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { code, discountPercent, discountAmount, validUntil, maxUses } = validation.data;

    // Check if code already exists
    const existing = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Промокод уже существует" },
        { status: 409 }
      );
    }

    const promoCode = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        discountPercent,
        discountAmount,
        validUntil: new Date(validUntil),
        maxUses,
      },
    });

    return NextResponse.json({ success: true, data: promoCode });
  } catch (error) {
    console.error("[PROMO_CODES_POST]", error);
    return NextResponse.json(
      { success: false, error: "Ошибка создания промокода" },
      { status: 500 }
    );
  }
}
