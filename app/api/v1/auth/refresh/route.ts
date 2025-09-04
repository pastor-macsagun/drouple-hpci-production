/**
 * Unified token refresh endpoint
 * POST /api/v1/auth/refresh
 * Used by both Web and Mobile clients
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createApiResponse, createApiError, revokeJWT } from '@/lib/middleware/auth';
import { refreshTokens, generateRefreshToken } from '../login/route';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

// Request schema
const RefreshRequestSchema = z.object({
  refreshToken: z.string(),
});

// Response type
interface RefreshSuccessData {
  accessToken: string;
  refreshToken: string;
}

function createAccessToken(payload: {
  sub: string;
  roles: string[];
  tenantId: string;
}): string {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET!;
  const jti = randomBytes(16).toString('hex');
  
  return jwt.sign(
    {
      ...payload,
      jti,
    },
    secret,
    { 
      expiresIn: '15m', // Short-lived access tokens
      algorithm: 'HS256'
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const result = RefreshRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        createApiError('INVALID_REQUEST', 'Invalid request data'),
        { status: 400 }
      );
    }

    const { refreshToken } = result.data;

    // Check if refresh token exists and is valid
    const tokenData = refreshTokens.get(refreshToken);
    if (!tokenData) {
      return NextResponse.json(
        createApiError('INVALID_TOKEN', 'Invalid refresh token'),
        { status: 401 }
      );
    }

    // Check if token is expired
    if (tokenData.expiresAt < new Date()) {
      refreshTokens.delete(refreshToken);
      return NextResponse.json(
        createApiError('TOKEN_EXPIRED', 'Refresh token has expired'),
        { status: 401 }
      );
    }

    // Get user data
    const user = await db.user.findUnique({
      where: { id: tokenData.userId },
      include: {
        memberships: {
          where: { believerStatus: 'ACTIVE' },
        },
      },
    });

    if (!user || user.memberStatus !== 'ACTIVE') {
      refreshTokens.delete(refreshToken);
      return NextResponse.json(
        createApiError('USER_INACTIVE', 'User account is not active'),
        { status: 401 }
      );
    }

    // Revoke the old refresh token
    refreshTokens.delete(refreshToken);

    // Create new tokens
    const newAccessToken = createAccessToken({
      sub: user.id,
      roles: [user.role],
      tenantId: user.tenantId || '',
    });

    const newRefreshToken = generateRefreshToken(user.id);

    const responseData: RefreshSuccessData = {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };

    return NextResponse.json(
      createApiResponse(true, 'TOKEN_REFRESHED', 'Token refreshed successfully', responseData),
      { status: 200 }
    );

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      createApiError('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    );
  }
}