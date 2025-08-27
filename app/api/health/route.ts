import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export async function GET() {
  const prisma = new PrismaClient();
  
  try {
    // Test database connectivity with timeout
    const startTime = Date.now();
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      )
    ]);
    const dbResponseTime = Date.now() - startTime;
    await prisma.$disconnect();
    
    return NextResponse.json({
      ok: true,
      status: "healthy",
      time: new Date().toISOString(),
      service: "hpci-chms",
      db: "up",
      dbResponseTime: `${dbResponseTime}ms`,
      version: process.env.npm_package_version || "unknown"
    });
  } catch (error) {
    await prisma.$disconnect();
    
    return NextResponse.json({
      ok: false,
      status: "unhealthy", 
      time: new Date().toISOString(),
      service: "hpci-chms",
      db: "down",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 503 });
  }
}