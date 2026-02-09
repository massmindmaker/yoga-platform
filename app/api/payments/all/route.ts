import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/payments/all - получить все платежи (для тренера)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: any = {};
    
    if (from || to) {
      where.createdAt = {};
      if (from) {
        const fromDate = new Date(from);
        fromDate.setUTCHours(0, 0, 0, 0);
        where.createdAt.gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setUTCHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({ success: true, data: payments });
  } catch (error) {
    console.error("[PAYMENTS_ALL_GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
