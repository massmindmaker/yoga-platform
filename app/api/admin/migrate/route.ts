import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";

// POST /api/admin/migrate - применить миграции (только с секретным ключом)
export async function POST(req: NextRequest) {
  try {
    // Проверяем секретный ключ (обязателен)
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

    // Применяем миграции
    const result = execSync("npx prisma migrate deploy", {
      encoding: "utf-8",
      stdio: "pipe",
      cwd: process.cwd(),
    });

    return NextResponse.json({
      success: true,
      message: "Миграции применены",
      output: result,
    });
  } catch (error) {
    console.error("[MIGRATE_ERROR]", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Ошибка миграции",
    }, { status: 500 });
  }
}
