import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";

// POST /api/admin/migrate - применить миграции (только с секретным ключом)
export async function POST(req: NextRequest) {
  try {
    // Проверяем секретный ключ
    const authHeader = req.headers.get("authorization");
    const secretKey = process.env.MIGRATE_SECRET_KEY || "yoga-migrate-2024";
    
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
      cwd: process.cwd()
    });
    
    return NextResponse.json({
      success: true,
      message: "Migrations applied successfully",
      output: result
    });
    
  } catch (error) {
    console.error("[MIGRATE_ERROR]", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Migration failed",
      stderr: error instanceof Error && "stderr" in error ? (error as {stderr: string}).stderr : undefined
    }, { status: 500 });
  }
}
