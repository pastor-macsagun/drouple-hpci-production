import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const TokenRequestSchema = z.object({
  sessionToken: z.string().min(1, 'Session token is required'),
});

/**
 * POST /api/v2/auth/token
 * Exchange session token for mobile JWT access token
 * 
 * This endpoint implements the auth token exchange pattern from the PRD:
 * - Takes a session token from web auth
 * - Returns a short-lived JWT for mobile use
 * - JWT includes claims: sub, tenantId, roles[], iat, exp
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { sessionToken } = TokenRequestSchema.parse(body);
    
    // Verify the session token is valid
    const session = await auth.api.getSessionAndUser({ 
      sessionToken 
    });
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Invalid session token' },
        { status: 401 }
      );
    }

    const user = session.user;
    
    // Generate JWT with required claims per PRD
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 3600; // 1 hour
    
    const tokenClaims = {
      sub: user.id,
      tenantId: user.tenantId || '',
      roles: [user.role],
      iat: now,
      exp: now + expiresIn,
    };
    
    const jwtSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (!jwtSecret) {
      console.error('JWT secret not configured');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    const accessToken = jwt.sign(tokenClaims, jwtSecret, {
      algorithm: 'HS256',
    });
    
    // Return token response per API standards
    return NextResponse.json({
      success: true,
      data: {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: expiresIn,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          memberStatus: user.memberStatus,
        }
      },
    });
  } catch (error) {
    console.error('Token exchange error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Validation error: ${error.errors[0].message}` 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}