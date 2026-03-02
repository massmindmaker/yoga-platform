import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// POST /api/admin/setup - диагностика БД
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const secretKey = process.env.MIGRATE_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { success: false, error: "MIGRATE_SECRET_KEY не настроен" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const prisma = new PrismaClient();
    const results: Record<string, unknown> = {};

    try {
      // 1. Проверяем существующие таблицы
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      results.existingTables = (tables as { table_name: string }[]).map(t => t.table_name);

      // 2. Проверяем существование основных таблиц
      const requiredTables = ["users", "groups", "schedules", "classes", "bookings"];
      const missingTables = requiredTables.filter(t => !(results.existingTables as string[]).includes(t));

      if (missingTables.length > 0) {
        results.missingTables = missingTables;
        results.message = "Таблицы отсутствуют. Запустите: npx prisma migrate deploy";
        results.status = "needs_migration";
      } else {
        results.status = "ok";
        results.message = "Все таблицы существуют";
      }

      // 3. Пробуем простой запрос
      try {
        const userCount = await prisma.user.count();
        results.userCount = userCount;
        results.canQuery = true;
      } catch (e) {
        results.canQuery = false;
        results.queryError = e instanceof Error ? e.message : "Query failed";
      }

      await prisma.$disconnect();

      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        results,
      });
    } catch (dbError) {
      await prisma.$disconnect();
      throw dbError;
    }
  } catch (error) {
    console.error("[SETUP_ERROR]", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Ошибка диагностики",
    }, { status: 500 });
  }
}
