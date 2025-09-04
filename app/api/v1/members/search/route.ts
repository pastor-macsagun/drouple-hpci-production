/**
 * Unified Members Search API
 * GET /api/v1/members/search - Search member directory
 * Used by both Web and Mobile clients
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createApiResponse, createApiError, runMiddleware, withTenant } from '@/lib/middleware/auth';

// Query parameters schema
const MembersSearchSchema = z.object({
  q: z.string().optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 20, 50)).optional(),
  offset: z.string().transform(val => parseInt(val) || 0).optional(),
});

/**
 * Create tenant-scoped where clause for church access
 */
function createTenantWhereClause(tenantId: string) {
  return {
    tenantId: tenantId,
    memberStatus: 'ACTIVE',
    memberships: {
      some: {
        believerStatus: 'ACTIVE',
      },
    },
  };
}

/**
 * Convert User to simplified format for API response
 */
function toMemberInfo(user: any, canViewDetails: boolean) {
  return {
    id: user.id,
    email: canViewDetails ? user.email : undefined,
    name: user.name || 'Unknown',
    role: user.role,
    tenantId: user.tenantId,
    churchId: user.memberships?.[0]?.localChurchId,
  };
}

export async function GET(request: NextRequest) {
  // Apply middleware
  const middlewareResult = await runMiddleware(request, [
    withTenant()
  ]);
  
  if (middlewareResult) {
    return middlewareResult;
  }

  try {
    // Get user context from middleware
    const user = (request as any).user;
    const tenantId = (request as any).tenantId;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      q: searchParams.get('q'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    };

    const result = MembersSearchSchema.safeParse(queryParams);

    if (!result.success) {
      return NextResponse.json(
        createApiError('INVALID_REQUEST', 'Invalid query parameters'),
        { status: 400 }
      );
    }

    const { q, limit = 20, offset = 0 } = result.data;

    // Build search conditions
    const whereClause = createTenantWhereClause(tenantId);
    
    if (q) {
      Object.assign(whereClause, {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ]
      });
    }

    // Check if user can view detailed info (admins and above)
    const canViewDetails = ['SUPER_ADMIN', 'CHURCH_ADMIN', 'VIP', 'LEADER'].includes(user.roles[0]);

    // Execute search
    const [members, total] = await Promise.all([
      db.user.findMany({
        where: whereClause,
        include: {
          memberships: {
            where: { believerStatus: 'ACTIVE' },
            include: {
              localChurch: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        take: limit,
        skip: offset,
      }),
      db.user.count({ where: whereClause })
    ]);

    // Convert to API format
    const membersData = members.map(member => toMemberInfo(member, canViewDetails));

    return NextResponse.json(
      createApiResponse(true, 'SEARCH_SUCCESS', 'Members found', {
        members: membersData,
        total,
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Members search error:', error);
    return NextResponse.json(
      createApiError('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    );
  }
}