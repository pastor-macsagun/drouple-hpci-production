import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v2/announcements
 * Get announcements for mobile app
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100);
    const cursor = searchParams.get('cursor');
    const since = searchParams.get('since');

    // Build where clause
    const whereClause: Record<string, unknown> = {
      tenantId: session.user.tenantId,
      isActive: true,
    };

    if (since) {
      whereClause.updatedAt = { gte: new Date(since) };
    }

    if (cursor) {
      whereClause.id = { gt: cursor };
    }

    const announcements = await prisma.announcement.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        content: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            name: true,
            role: true,
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit + 1,
    });

    const hasMore = announcements.length > limit;
    const results = hasMore ? announcements.slice(0, limit) : announcements;
    const nextCursor = hasMore ? results[results.length - 1]?.id : null;

    const etag = `"announcements-${session.user.tenantId}-${Date.now()}"`;
    
    const response = NextResponse.json({
      data: results,
      meta: {
        hasMore,
        nextCursor,
        total: results.length,
      },
    });
    
    response.headers.set('ETag', etag);
    response.headers.set('Cache-Control', 'private, max-age=180'); // 3 minutes
    
    return response;
    
  } catch (error) {
    console.error('Get announcements error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}