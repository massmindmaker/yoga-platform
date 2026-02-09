import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const validateSchema = z.object({
  code: z.string().min(1),
  userId: z.string().optional(),
});

// POST /api/promo-codes/validate - validate a promo code
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 400 }
      );
    }

    const { code } = validation.data;
    const now = new Date();

    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!promoCode) {
      return NextResponse.json(
        { success: false, error: 'Promo code not found' },
        { status: 404 }
      );
    }

    if (!promoCode.isActive) {
      return NextResponse.json(
        { success: false, error: 'Promo code is inactive' },
        { status: 400 }
      );
    }

    if (promoCode.validUntil < now) {
      return NextResponse.json(
        { success: false, error: 'Promo code has expired' },
        { status: 400 }
      );
    }

    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
      return NextResponse.json(
        { success: false, error: 'Promo code usage limit reached' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        code: promoCode.code,
        discountPercent: promoCode.discountPercent,
        discountAmount: promoCode.discountAmount,
      }
    });
  } catch (error) {
    console.error('[PROMO_CODES_VALIDATE]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate promo code' },
      { status: 500 }
    );
  }
}
