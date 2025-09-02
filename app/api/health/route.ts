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
      service: "drouple",
      db: {
        status: "up",
        responseTime: `${healthResult.latencyMs}ms`,
        connectionPooling: healthResult.connectionInfo?.pooled ? "enabled" : "disabled",
        activeConnections: healthResult.connectionInfo?.activeConnections,
        serverVersion: healthResult.connectionInfo?.serverVersion
      },
      version: process.env.npm_package_version || "unknown"
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      status: "unhealthy", 
      time: new Date().toISOString(),
      service: "drouple",
      db: "down",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 503 });
  }
}