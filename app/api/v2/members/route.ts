import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v2/members
 * Get member directory with search and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100);
    const cursor = searchParams.get('cursor');

    // Build where clause for tenant isolation and search
    const whereClause: Record<string, unknown> = {
      tenantId: session.user.tenantId,
      isActive: true,
    };

    if (q) {
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (cursor) {
      whereClause.id = { gt: cursor };
    }

    const members = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        memberStatus: true,
        createdAt: true,
      },
      orderBy: { id: 'asc' },
      take: limit + 1, // Get one extra to determine if there are more
    });

    // Separate the extra item for pagination
    const hasMore = members.length > limit;
    const results = hasMore ? members.slice(0, limit) : members;
    const nextCursor = hasMore ? results[results.length - 1]?.id : null;

    // Set ETag for caching
    const etag = `"members-${session.user.tenantId}-${Date.now()}"`;
    
    const response = NextResponse.json({
      data: results,
      meta: {
        hasMore,
        nextCursor,
        total: results.length,
      },
    });
    
    response.headers.set('ETag', etag);
    response.headers.set('Cache-Control', 'private, max-age=60');
    
    return response;
    
  } catch (error) {
    console.error('Get members error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}