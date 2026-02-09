import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schemas
const createActivityLogSchema = z.object({
  userId: z.string().uuid('Invalid user ID').optional(),
  action: z.string().min(1, 'Action is required'),
  entityType: z.string().min(1, 'Entity type is required'),
  entityId: z.string().uuid('Invalid entity ID').optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

const queryActivityLogSchema = z.object({
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.number().int().positive().max(100).optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0),
});

// GET /api/activity-logs - получить логи действий
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    const query = {
      userId: searchParams.get('userId') || undefined,
      action: searchParams.get('action') || undefined,
      entityType: searchParams.get('entityType') || undefined,
      entityId: searchParams.get('entityId') || undefined,
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const validationResult = queryActivityLogSchema.safeParse(query);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { userId, action, entityType, entityId, from, to, limit, offset } = validationResult.data;

    const where: {
      userId?: string;
      action?: string;
      entityType?: string;
      entityId?: string;
      createdAt?: { gte?: Date; lte?: Date };
    } = {};
    
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + logs.length < total,
      },
    });
  } catch (error) {
    console.error('[ACTIVITY_LOGS_GET]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}

// POST /api/activity-logs - создать запись лога
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validationResult = createActivityLogSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { userId, action, entityType, entityId, metadata, ipAddress, userAgent } = validationResult.data;

    const log = await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        metadata: metadata as Record<string, string | number | boolean | null>,
        ipAddress,
        userAgent,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: log });
  } catch (error) {
    console.error('[ACTIVITY_LOGS_POST]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create activity log' },
      { status: 500 }
    );
  }
}

// DELETE /api/activity-logs - очистить старые логи (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const olderThan = searchParams.get('olderThan');

    if (!olderThan) {
      return NextResponse.json(
        { success: false, error: 'olderThan parameter is required (ISO date)' },
        { status: 400 }
      );
    }

    const date = new Date(olderThan);
    
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }

    const result = await prisma.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: date,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { deletedCount: result.count },
    });
  } catch (error) {
    console.error('[ACTIVITY_LOGS_DELETE]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete activity logs' },
      { status: 500 }
    );
  }
}
