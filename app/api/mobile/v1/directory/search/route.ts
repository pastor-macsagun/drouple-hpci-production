/**
 * Mobile Directory Search API
 * GET /api/mobile/v1/directory/search - Search member directory
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireMobileContext, hasRole } from '@/lib/mobileAuth/context';
import type { DirectoryEntry } from '@drouple/contracts';

// Query parameters schema
const DirectorySearchSchema = z.object({
  q: z.string().min(1),
  limit: z.string().transform(val => Math.min(parseInt(val) || 20, 50)).optional(),
});

/**
 * Create tenant-scoped where clause for church access
 */
function withChurch(tenantId: string, localChurchId?: string) {
  const baseClause = {
    tenantId: tenantId,
    memberStatus: 'ACTIVE',
    // Only include users with active memberships
    memberships: {
      some: {
        believerStatus: 'ACTIVE',
        ...(localChurchId && { localChurchId }),
      },
    },
  };

  return baseClause;
}

/**
 * Convert User to DirectoryEntry based on privacy settings
 */
function toDirectoryEntry(user: any, canViewDetails: boolean): DirectoryEntry {
  return {
    id: user.id,
    name: user.name || 'Unknown',
    roles: [user.role],
    // Respect privacy settings
    phone: (canViewDetails && user.allowContact && user.profileVisibility !== 'PRIVATE') ? user.phone : undefined,
    email: (canViewDetails && user.allowContact && user.profileVisibility !== 'PRIVATE') ? user.email : undefined,
  };
}

/**
 * GET /api/mobile/v1/directory/search
 * Search member directory with privacy controls
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user context
    const context = requireMobileContext(request);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = DirectorySearchSchema.safeParse({
      q: searchParams.get('q'),
      limit: searchParams.get('limit'),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters',
          details: queryResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { q, limit = 20 } = queryResult.data;

    // Check if user can view detailed member information
    const canViewDetails = hasRole(context, 'LEADER');

    // Build search where clause
    const whereClause = {
      ...withChurch(context.tenantId, context.localChurchId),
      OR: [
        {
          name: {
            contains: q,
            mode: 'insensitive' as const,
          },
        },
        {
          email: {
            contains: q,
            mode: 'insensitive' as const,
          },
        },
      ],
    };

    // Search members
    const users = await db.user.findMany({
      where: whereClause,
      include: {
        memberships: {
          where: {
            believerStatus: 'ACTIVE',
            ...(context.localChurchId && { localChurchId: context.localChurchId }),
          },
          include: {
            localChurch: {
              include: {
                church: true,
              },
            },
          },
        },
      },
      orderBy: [
        { name: 'asc' },
        { email: 'asc' },
      ],
      take: limit,
    });

    // Convert to directory entries
    const directoryEntries = users.map(user => toDirectoryEntry(user, canViewDetails));

    return NextResponse.json(directoryEntries);

  } catch (error) {
    console.error('Directory search error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Authentication required')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}