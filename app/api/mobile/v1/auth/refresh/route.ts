/**
 * Mobile authentication refresh endpoint
 * POST /api/mobile/v1/auth/refresh
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyRefreshToken } from '@/lib/mobileAuth/jwt';
import { rotateRefreshToken } from '@/lib/mobileAuth/rotate';
import { rateLimiters, getClientIp } from '@/lib/rate-limit';

// Request schema
const RefreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

// Response types
interface RefreshSuccessResponse {
  accessToken: string;
  refreshToken: string;
}

interface RefreshErrorResponse {
  error: string;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - use API rate limiter
    const clientIp = getClientIp(request.headers);
    
    const rateLimitResult = await rateLimiters.api.check(
      `mobile-refresh:${clientIp}`
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many refresh attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const result = RefreshRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { refreshToken } = result.data;

    // Verify the refresh token
    let payload;
    try {
      payload = await verifyRefreshToken(refreshToken);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Rotate the refresh token (this also validates if it's still active)
    const rotationResult = await rotateRefreshToken(
      payload.rotationId,
      payload.sub
    );

    if (!rotationResult.success) {
      // Token rotation failed - could be due to:
      // 1. Token already used (suspicious - possible replay attack)
      // 2. Token expired
      // 3. Token revoked
      return NextResponse.json(
        { error: rotationResult.error || 'Token refresh failed' },
        { status: 401 }
      );
    }

    const response: RefreshSuccessResponse = {
      accessToken: rotationResult.accessToken!,
      refreshToken: rotationResult.refreshToken!,
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Mobile refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}