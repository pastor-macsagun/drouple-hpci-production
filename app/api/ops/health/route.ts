import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    endpoint: 'ops/health',
    time: new Date().toISOString() 
  });
}