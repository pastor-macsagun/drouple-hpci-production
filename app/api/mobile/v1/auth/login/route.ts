/**
 * Mobile authentication login endpoint
 * POST /api/mobile/v1/auth/login
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { signAccessToken } from '@/lib/mobileAuth/jwt';
import { createRefreshToken } from '@/lib/mobileAuth/rotate';
import { rateLimiters, getClientIp } from '@/lib/rate-limit';
import type { UserDTO, Role } from '@drouple/contracts';

// Request schema
const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Response types
interface LoginSuccessResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDTO;
}

interface LoginErrorResponse {
  error: string;
}

/**
 * Convert User with memberships to UserDTO
 */
function toUserDTO(user: any): UserDTO {
  const primaryMembership = user.memberships[0];
  
  return {
    id: user.id,
    email: user.email,
    firstName: user.name?.split(' ')[0] || '',
    lastName: user.name?.split(' ').slice(1).join(' ') || '',
    roles: [user.role] as Role[],
    tenantId: user.tenantId || '',
    churchId: primaryMembership?.localChurchId || '',
    isActive: user.memberStatus === 'ACTIVE',
    profileImage: user.image || undefined,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 3 attempts per hour per IP
    const clientIp = getClientIp(request.headers);
    
    const rateLimitResult = await rateLimiters.auth.check(
      `mobile-login:${clientIp}`
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const result = LoginRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
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
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.memberStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 401 }
      );
    }

    // Verify password
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'Password not set. Please use web interface to set up your password.' },
        { status: 401 }
      );
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user has active membership
    if (!user.memberships || user.memberships.length === 0) {
      return NextResponse.json(
        { error: 'No active church membership found' },
        { status: 401 }
      );
    }

    // Get primary membership for token
    const primaryMembership = user.memberships[0];
    const localChurchId = primaryMembership.localChurch?.id;

    // Generate access token
    const accessToken = await signAccessToken({
      sub: user.id,
      userId: user.id,
      roles: [user.role] as Role[],
      tenantId: user.tenantId || '',
      localChurchId,
    });

    // Generate refresh token
    const refreshToken = await createRefreshToken(user.id);

    // Convert to DTO
    const userDTO = toUserDTO(user);

    const response: LoginSuccessResponse = {
      accessToken,
      refreshToken,
      user: userDTO,
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Mobile login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}