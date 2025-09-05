import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v2/events
 * Get events with RSVP status
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

    // Build where clause for tenant isolation
    const whereClause: Record<string, unknown> = {
      tenantId: session.user.tenantId,
      // Only show events that haven't ended
      endDateTime: { gte: new Date() },
    };

    if (cursor) {
      whereClause.id = { gt: cursor };
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        startDateTime: true,
        endDateTime: true,
        location: true,
        capacity: true,
        requiresPayment: true,
        feeAmount: true,
        _count: {
          select: {
            rsvps: {
              where: { status: 'GOING' }
            }
          }
        },
        rsvps: {
          where: { userId: session.user.id },
          select: {
            status: true,
            hasPaid: true,
          },
          take: 1,
        }
      },
      orderBy: { startDateTime: 'asc' },
      take: limit + 1,
    });

    const hasMore = events.length > limit;
    const results = hasMore ? events.slice(0, limit) : events;
    const nextCursor = hasMore ? results[results.length - 1]?.id : null;

    // Transform data to include RSVP status
    const eventsWithStatus = results.map(event => ({
      ...event,
      attendeeCount: event._count.rsvps,
      userRsvpStatus: event.rsvps[0]?.status || null,
      userPaid: !!event.rsvps[0]?.hasPaid,
      rsvps: undefined, // Remove from response
      _count: undefined, // Remove from response
    }));

    const etag = `"events-${session.user.tenantId}-${Date.now()}"`;
    
    const response = NextResponse.json({
      data: eventsWithStatus,
      meta: {
        hasMore,
        nextCursor,
        total: results.length,
      },
    });
    
    response.headers.set('ETag', etag);
    response.headers.set('Cache-Control', 'private, max-age=300'); // 5 minutes
    
    return response;
    
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}