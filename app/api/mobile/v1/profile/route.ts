/**
 * Mobile API Profile Endpoint
 * GET /api/mobile/v1/profile - Get current user profile
 * PUT /api/mobile/v1/profile - Update current user profile
 * 
 * Example of using mobile API middleware with JWT authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireMobileContext } from '@/lib/mobileAuth/context';
import type { UserDTO } from '@drouple/contracts';

// Update profile schema
const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  bio: z.string().max(500).optional(),
});

/**
 * Convert User to UserDTO
 */
function toUserDTO(user: any): UserDTO {
  const primaryMembership = user.memberships[0];
  
  return {
    id: user.id,
    email: user.email,
    firstName: user.name?.split(' ')[0] || '',
    lastName: user.name?.split(' ').slice(1).join(' ') || '',
    roles: [user.role],
    tenantId: user.tenantId || '',
    churchId: primaryMembership?.localChurchId || '',
    isActive: user.memberStatus === 'ACTIVE',
    profileImage: user.image || undefined,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

/**
 * GET /api/mobile/v1/profile
 * Get current user profile
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user context from middleware
    const context = requireMobileContext(request);

    // Fetch user with memberships
    const user = await db.user.findUnique({
      where: { id: context.userId },
      include: {
        memberships: {
          where: { believerStatus: 'ACTIVE' },
          include: {
            localChurch: {
              include: {
                church: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Convert to DTO and return
    const userDTO = toUserDTO(user);
    
    return NextResponse.json({
      user: userDTO,
      profile: {
        phone: user.phone,
        bio: user.bio,
        joinedAt: user.joinedAt,
        profileVisibility: user.profileVisibility,
        allowContact: user.allowContact,
      },
    });

  } catch (error) {
    console.error('Get profile error:', error);
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/mobile/v1/profile
 * Update current user profile
 */
export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user context from middleware
    const context = requireMobileContext(request);

    // Parse request body
    const body = await request.json();
    const result = UpdateProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: result.error.errors,
        },
        { status: 400 }
      );
    }

    const { name, phone, bio } = result.data;

    // Update user profile
    const user = await db.user.update({
      where: { id: context.userId },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(bio && { bio }),
      },
      include: {
        memberships: {
          where: { believerStatus: 'ACTIVE' },
          include: {
            localChurch: true,
          },
        },
      },
    });

    // Convert to DTO and return
    const userDTO = toUserDTO(user);

    return NextResponse.json({
      user: userDTO,
      message: 'Profile updated successfully',
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}