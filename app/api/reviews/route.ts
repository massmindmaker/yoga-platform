import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createReviewSchema = z.object({
  userId: z.string(),
  groupId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// GET /api/reviews - list reviews
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');
    const isVisible = searchParams.get('isVisible');

    const where: Record<string, unknown> = {};
    if (groupId) where.groupId = groupId;
    if (isVisible !== null) where.isVisible = isVisible === 'true';

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        group: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: reviews });
  } catch (error) {
    console.error('[REVIEWS_GET]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/reviews - create review
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = createReviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: validation.data,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        group: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    console.error('[REVIEWS_POST]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
