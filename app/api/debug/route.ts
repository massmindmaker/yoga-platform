import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/debug - диагностика API
export async function GET() {
  const diagnostics: Record<string, unknown> = {};
  
  try {
    // Test 1: Database connection
    try {
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      diagnostics.database = { status: "ok", result };
    } catch (e) {
      diagnostics.database = { 
        status: "error", 
        error: e instanceof Error ? e.message : "Unknown error" 
      };
    }
    
    // Test 2: Count bookings
    try {
      const count = await prisma.booking.count();
      diagnostics.bookings = { status: "ok", count };
    } catch (e) {
      diagnostics.bookings = { 
        status: "error", 
        error: e instanceof Error ? e.message : "Unknown error" 
      };
    }
    
    // Test 3: Count users
    try {
      const count = await prisma.user.count();
      diagnostics.users = { status: "ok", count };
    } catch (e) {
      diagnostics.users = { 
        status: "error", 
        error: e instanceof Error ? e.message : "Unknown error" 
      };
    }
    
    // Test 4: Simple booking query
    try {
      const bookings = await prisma.booking.findMany({
        take: 1,
        select: { id: true, userId: true, classId: true }
      });
      diagnostics.bookingQuery = { status: "ok", count: bookings.length };
    } catch (e) {
      diagnostics.bookingQuery = { 
        status: "error", 
        error: e instanceof Error ? e.message : "Unknown error" 
      };
    }
    
    // Test 5: Complex booking query (as in API)
    try {
      const bookings = await prisma.booking.findMany({
        take: 1,
        include: {
          class: {
            include: {
              schedule: {
                include: {
                  group: true
                }
              }
            }
          }
        }
      });
      diagnostics.complexQuery = { status: "ok", count: bookings.length };
    } catch (e) {
      diagnostics.complexQuery = { 
        status: "error", 
        error: e instanceof Error ? e.message : "Unknown error",
        stack: e instanceof Error ? e.stack : undefined
      };
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      diagnostics
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
