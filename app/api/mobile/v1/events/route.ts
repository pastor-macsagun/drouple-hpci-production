/**
 * Mobile Events API
 * GET /api/mobile/v1/events - Get events list
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireMobileContext } from '@/lib/mobileAuth/context';
import type { EventDTO } from '@drouple/contracts';

// Query parameters schema
const EventQuerySchema = z.object({
  upcoming: z.string().transform(val => val === 'true').optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 50, 100)).optional(),
});

/**
 * Create tenant-scoped where clause for church access
 */
function withChurch(tenantId: string, localChurchId?: string) {
  const baseClause = {
    localChurch: {
      church: {
        tenantId: tenantId,
      },
    },
  };

  // If user has a specific local church, scope to that church
  if (localChurchId) {
    return {
      ...baseClause,
      localChurchId: localChurchId,
    };
  }

  return baseClause;
}

/**
 * Convert Event to EventDTO
 */
function toEventDTO(event: any): EventDTO {
  const spotsLeft = event.capacity 
    ? Math.max(0, event.capacity - (event._count?.eventRsvps || 0))
    : undefined;

  return {
    id: event.id,
    title: event.title,
    startsAt: event.startsAt.toISOString(),
    location: event.location,
    capacity: event.capacity,
    spotsLeft: spotsLeft,
  };
}

/**
 * GET /api/mobile/v1/events
 * Get events list with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user context
    const context = requireMobileContext(request);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = EventQuerySchema.safeParse({
      upcoming: searchParams.get('upcoming'),
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

    const { upcoming, limit = 50 } = queryResult.data;

    // Build where clause
    const whereClause = {
      ...withChurch(context.tenantId, context.localChurchId),
      // Only show upcoming events if requested (default to all)
      ...(upcoming && {
        startsAt: {
          gte: new Date(),
        },
      }),
    };

    // Fetch events
    const events = await db.event.findMany({
      where: whereClause,
      include: {
        localChurch: {
          include: {
            church: true,
          },
        },
        _count: {
          select: {
            eventRsvps: {
              where: {
                status: 'GOING',
              },
            },
          },
        },
      },
      orderBy: {
        startsAt: 'asc',
      },
      take: limit,
    });

    // Convert to DTOs
    const eventDTOs = events.map(toEventDTO);

    return NextResponse.json(eventDTOs);

  } catch (error) {
    console.error('Events fetch error:', error);

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