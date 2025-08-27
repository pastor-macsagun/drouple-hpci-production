import { NextResponse } from "next/server";
import { checkDatabaseHealth } from '@/lib/prisma';

export async function GET() {
  try {
    // Use centralized database health check
    const healthResult = await checkDatabaseHealth();
    
    if (!healthResult.healthy) {
      throw new Error('Database health check failed');
    }
    
    return NextResponse.json({
      ok: true,
      status: "healthy",
      time: new Date().toISOString(),
      service: "hpci-chms",
      db: "up",
      dbResponseTime: `${healthResult.latencyMs}ms`,
      version: process.env.npm_package_version || "unknown"
    });
  } catch (error) {
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