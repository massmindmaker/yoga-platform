import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// POST /api/admin/init-db - инициализация БД через Prisma
export async function POST(req: NextRequest) {
  try {
    // Проверяем секретный ключ (обязателен в production)
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

    // Создаем новый PrismaClient для выполнения сырых SQL
    const prisma = new PrismaClient();

    try {
      // Проверяем существование таблиц
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;

      const existingTables = (tables as { table_name: string }[]).map(t => t.table_name);

      if (existingTables.length === 0) {
        await prisma.$disconnect();
        return NextResponse.json({
          success: false,
          message: "Таблиц нет. Запустите: npx prisma migrate deploy",
        });
      } else {
        await prisma.$disconnect();
        return NextResponse.json({
          success: true,
          message: "Таблицы существуют",
          existingTables,
        });
      }
    } catch (dbError) {
      await prisma.$disconnect();
      throw dbError;
    }
  } catch (error) {
    console.error("[INIT_DB_ERROR]", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Ошибка инициализации БД",
    }, { status: 500 });
  }
}
