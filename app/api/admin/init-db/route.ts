import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// POST /api/admin/init-db - инициализация БД через Prisma
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
      
      // Если таблиц нет, создаем их
      if (existingTables.length === 0) {
        // Создаем enum типы и таблицы
        await prisma.$executeRawUnsafe(`
          CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'ATTENDED');
          CREATE TYPE "ClassStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
          CREATE TYPE "GroupType" AS ENUM ('REGULAR', 'INTENSIVE');
          CREATE TYPE "PricingType" AS ENUM ('FREE', 'FIXED', 'DONATION');
          CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
          CREATE TYPE "BalanceTransactionType" AS ENUM ('PURCHASE', 'REFUND', 'BOOKING_DEDUCTION', 'MANUAL_ADJUSTMENT');
          CREATE TYPE "VotingStatus" AS ENUM ('ACTIVE', 'FINALIZED', 'CANCELLED', 'COMPLETED');
          CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TRAINER', 'STUDENT');
          
          CREATE TABLE "User" (
            "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            "telegramId" TEXT UNIQUE,
            "firstName" TEXT NOT NULL,
            "lastName" TEXT,
            "username" TEXT,
            "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
            "balance" INTEGER NOT NULL DEFAULT 0,
            "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
            "updatedAt" TIMESTAMP NOT NULL
          );
          
          CREATE TABLE "Group" (
            "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            "name" TEXT NOT NULL,
            "description" TEXT,
            "groupType" "GroupType" NOT NULL DEFAULT 'REGULAR',
            "pricingType" "PricingType" NOT NULL DEFAULT 'FIXED',
            "fixedPrice" INTEGER,
            "maxStudents" INTEGER DEFAULT 15,
            "telegramChat" TEXT,
            "trainerId" TEXT REFERENCES "User"("id"),
            "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
            "updatedAt" TIMESTAMP NOT NULL
          );
          
          CREATE TABLE "Schedule" (
            "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            "groupId" TEXT NOT NULL REFERENCES "Group"("id") ON DELETE CASCADE,
            "dayOfWeek" INTEGER NOT NULL,
            "time" TEXT NOT NULL,
            "description" TEXT
          );
          
          CREATE TABLE "Class" (
            "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            "scheduleId" TEXT NOT NULL REFERENCES "Schedule"("id") ON DELETE CASCADE,
            "trainerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
            "date" TIMESTAMP NOT NULL,
            "maxStudents" INTEGER DEFAULT 15,
            "price" INTEGER DEFAULT 700,
            "status" "ClassStatus" NOT NULL DEFAULT 'SCHEDULED',
            "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
          );
          
          CREATE TABLE "Booking" (
            "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
            "classId" TEXT NOT NULL REFERENCES "Class"("id") ON DELETE CASCADE,
            "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
            "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
          );
          
          CREATE INDEX "idx_booking_userId" ON "Booking"("userId");
          CREATE INDEX "idx_booking_classId" ON "Booking"("classId");
          CREATE INDEX "idx_class_scheduleId" ON "Class"("scheduleId");
          CREATE INDEX "idx_class_date" ON "Class"("date");
        `);
        
        await prisma.$disconnect();
        
        return NextResponse.json({
          success: true,
          message: "Database initialized successfully",
          tablesCreated: true
        });
      } else {
        await prisma.$disconnect();
        
        return NextResponse.json({
          success: true,
          message: "Tables already exist",
          existingTables
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
      error: error instanceof Error ? error.message : "Database initialization failed",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
