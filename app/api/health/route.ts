import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/health - проверка состояния API и БД
export async function GET() {
  try {
    // Проверяем подключение к БД
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    
    return NextResponse.json({
      success: true,
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[HEALTH_CHECK]", error);
    return NextResponse.json(
      {
        success: false,
        status: "error",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
