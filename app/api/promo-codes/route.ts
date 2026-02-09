import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createPromoCodeSchema = z.object({
  code: z.string().min(3).max(50),
  discountPercent: z.number().min(0).max(100).optional(),
  discountAmount: z.number().min(0).optional(),
  validUntil: z.string().datetime(),
  maxUses: z.number().min(1).optional(),
});

// GET /api/promo-codes - list all promo codes
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get('isActive');

    const where: Record<string, unknown> = {};
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const promoCodes = await prisma.promoCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: promoCodes });
  } catch (error) {
    console.error('[PROMO_CODES_GET]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch promo codes' },
      { status: 500 }
    );
  }
}

// POST /api/promo-codes - create new promo code
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = createPromoCodeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { code, discountPercent, discountAmount, validUntil, maxUses } = validation.data;

    // Check if code already exists
    const existing = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Promo code already exists' },
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
      }
    });

    return NextResponse.json({ success: true, data: promoCode });
  } catch (error) {
    console.error('[PROMO_CODES_POST]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create promo code' },
      { status: 500 }
    );
  }
}
