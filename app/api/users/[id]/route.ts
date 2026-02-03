import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { idParamSchema } from '@/lib/validation';

// GET /api/users/[id] - получить пользователя
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID param
    const idValidation = idParamSchema.safeParse({ id });
    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid ID format",
          details: idValidation.error.issues,
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            class: true
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id] - обновить профиль пользователя (без баланса)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID param
    const idValidation = idParamSchema.safeParse({ id });
    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid ID format",
          details: idValidation.error.issues,
        },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Разрешенные поля для обновления (баланс изменяется только через платежи)
    const allowedFields = ['firstName', 'lastName', 'phone', 'email'];
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Проверяем, есть ли данные для обновления
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
