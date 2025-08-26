import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export async function GET() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "hpci-chms",
      database: "connected"
    });
  } catch (error) {
    await prisma.$disconnect();
    
    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      service: "hpci-chms",
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 503 });
  }
}