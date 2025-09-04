/**
 * Unified authentication login endpoint 
 * POST /api/v1/auth/login
 * Used by both Web and Mobile clients
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { rateLimiters, getClientIp } from '@/lib/rate-limit';
import { createApiResponse, createApiError, type JWTPayload } from '@/lib/middleware/auth';
import { randomBytes } from 'crypto';

// Request schema
const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Response types
interface LoginSuccessData {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
    churchId?: string;
  };
  accessToken: string;
  refreshToken: string;
}

// Simple refresh token storage (in production, use Redis)
const refreshTokens = new Map<string, { userId: string; expiresAt: Date }>();

function generateRefreshToken(userId: string): string {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  refreshTokens.set(token, { userId, expiresAt });
  return token;
}

function createAccessToken(payload: Omit<JWTPayload, 'exp' | 'iat' | 'jti'>): string {
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
    // Rate limiting - 3 attempts per hour per IP
    const clientIp = getClientIp(request.headers);
    
    const rateLimitResult = await rateLimiters.auth.check(
      `unified-login:${clientIp}`
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        createApiError('RATE_LIMITED', 'Too many login attempts. Please try again later.'),
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const result = LoginRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        createApiError('INVALID_REQUEST', 'Invalid request data'),
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // Find user with memberships
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        memberships: {
          where: { believerStatus: 'ACTIVE' },
          include: {
            localChurch: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        createApiError('INVALID_CREDENTIALS', 'Invalid credentials'),
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.memberStatus !== 'ACTIVE') {
      return NextResponse.json(
        createApiError('ACCOUNT_INACTIVE', 'Account is not active'),
        { status: 401 }
      );
    }

    // Verify password
    if (!user.passwordHash) {
      return NextResponse.json(
        createApiError('PASSWORD_NOT_SET', 'Password not set. Please use web interface to set up your password.'),
        { status: 401 }
      );
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        createApiError('INVALID_CREDENTIALS', 'Invalid credentials'),
        { status: 401 }
      );
    }

    // Check if user has active membership
    if (!user.memberships || user.memberships.length === 0) {
      return NextResponse.json(
        createApiError('NO_MEMBERSHIP', 'No active church membership found'),
        { status: 401 }
      );
    }

    // Get primary membership for token
    const primaryMembership = user.memberships[0];
    const localChurchId = primaryMembership.localChurch?.id;

    // Create JWT payload
    const jwtPayload: Omit<JWTPayload, 'exp' | 'iat' | 'jti'> = {
      sub: user.id,
      roles: [user.role],
      tenantId: user.tenantId || '',
    };

    // Generate tokens
    const accessToken = createAccessToken(jwtPayload);
    const refreshToken = generateRefreshToken(user.id);

    // Prepare response data
    const responseData: LoginSuccessData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
        role: user.role,
        tenantId: user.tenantId || '',
        churchId: localChurchId,
      },
      accessToken,
      refreshToken,
    };

    return NextResponse.json(
      createApiResponse(true, 'LOGIN_SUCCESS', 'Login successful', responseData),
      { status: 200 }
    );

  } catch (error) {
    console.error('Unified login error:', error);
    return NextResponse.json(
      createApiError('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    );
  }
}

// Export refresh token functions for use by refresh endpoint
export { refreshTokens, generateRefreshToken };