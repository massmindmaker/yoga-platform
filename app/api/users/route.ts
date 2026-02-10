import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createUserSchema } from '@/lib/validation';
import type { Role } from '@prisma/client';

// POST /api/users - создать пользователя
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body
    const validationResult = createUserSchema.safeParse(body);
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

    const { telegramId, firstName, lastName, role } = validationResult.data;

    // Проверяем существует ли пользователь
    const orConditions = [];
    if (telegramId) orConditions.push({ telegramId });
    orConditions.push({ firstName, lastName: lastName || null });

    const existingUser = await prisma.user.findFirst({
      where: { OR: orConditions }
    });

    if (existingUser) {
      return NextResponse.json({ success: true, data: existingUser });
    }

    const user = await prisma.user.create({
      data: {
        telegramId,
        firstName,
        lastName,
        role: role || 'STUDENT',
        balance: 0
      }
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// GET /api/users - получить всех пользователей
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const limit = searchParams.get("limit");

    const where: { role?: Role } = {};
    if (role) where.role = role as Role;

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...(limit && !isNaN(parseInt(limit, 10)) ? { take: Math.min(parseInt(limit, 10), 100) } : {}),
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
