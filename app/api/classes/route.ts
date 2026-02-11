import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma, ClassStatus } from "@prisma/client";

// GET /api/classes - получить занятия
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const status = searchParams.get("status");

    const where: Prisma.ClassWhereInput = {};
    
    if (groupId) {
      where.schedule = { groupId };
    }

    if (from || to) {
      where.date = {};
      if (from) {
        const fromDate = new Date(from);
        fromDate.setUTCHours(0, 0, 0, 0);
        where.date.gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setUTCHours(23, 59, 59, 999);
        where.date.lte = toDate;
      }
    }

    if (status) {
      where.status = status as ClassStatus;
    }

    const classes = await prisma.class.findMany({
      where,
      include: {
        schedule: {
          include: {
            group: true
          }
        },
        trainer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        bookings: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        _count: {
          select: { bookings: true }
        }
      },
      orderBy: {
        date: "asc"
      }
    });

    // Cache for 30 seconds (stale-while-revalidate pattern)
    return NextResponse.json(
      { success: true, data: classes },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error("[CLASSES_GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}
