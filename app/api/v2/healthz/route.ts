import { NextResponse } from 'next/server';

/**
 * GET /api/v2/healthz
 * Health check endpoint for mobile app
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'hpci-chms-api',
    version: '2.0.0',
  });
}