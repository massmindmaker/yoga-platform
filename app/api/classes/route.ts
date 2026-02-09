import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/classes - получить занятия
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const status = searchParams.get("status");

    const where: any = {};
    
    if (groupId) {
      where.schedule = {
        groupId
      };
    }

    if (from || to) {
      where.date = {};
      if (from) {
        // Start of the day
        const fromDate = new Date(from);
        fromDate.setUTCHours(0, 0, 0, 0);
        where.date.gte = fromDate;
      }
      if (to) {
        // End of the day
        const toDate = new Date(to);
        toDate.setUTCHours(23, 59, 59, 999);
        where.date.lte = toDate;
      }
    }

    if (status) {
      where.status = status;
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
        }
      },
      orderBy: {
        date: "asc"
      }
    });

    return NextResponse.json({ success: true, data: classes });
  } catch (error) {
    console.error("[CLASSES_GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}
