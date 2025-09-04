/**
 * Unified Events API
 * GET /api/v1/events - List events
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createApiResponse, createApiError, runMiddleware, withTenant } from '@/lib/middleware/auth';

const EventsQuerySchema = z.object({
  limit: z.string().transform(val => Math.min(parseInt(val) || 20, 100)).optional(),
  offset: z.string().transform(val => parseInt(val) || 0).optional(),
});

export async function GET(request: NextRequest) {
  const middlewareResult = await runMiddleware(request, [withTenant()]);
  if (middlewareResult) return middlewareResult;

  try {
    const user = (request as any).user;
    const tenantId = (request as any).tenantId;

    const { searchParams } = new URL(request.url);
    const result = EventsQuerySchema.safeParse({
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });

    if (!result.success) {
      return NextResponse.json(
        createApiError('INVALID_REQUEST', 'Invalid query parameters'),
        { status: 400 }
      );
    }

    const { limit = 20, offset = 0 } = result.data;

    // Get events for the tenant
    const [events, total] = await Promise.all([
      db.event.findMany({
        where: {
          tenantId: tenantId,
          startDate: { gte: new Date() }, // Only future events
        },
        include: {
          rsvps: {
            where: { userId: user.sub },
            select: { status: true },
          },
          _count: {
            select: { rsvps: { where: { status: 'ATTENDING' } } },
          },
        },
        orderBy: { startDate: 'asc' },
        take: limit,
        skip: offset,
      }),
      db.event.count({
        where: {
          tenantId: tenantId,
          startDate: { gte: new Date() },
        },
      })
    ]);

    const eventsData = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      capacity: event.capacity,
      currentAttendees: event._count.rsvps,
      rsvpStatus: event.rsvps[0]?.status || null,
    }));

    return NextResponse.json(
      createApiResponse(true, 'EVENTS_RETRIEVED', 'Events retrieved successfully', {
        events: eventsData,
        total,
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Events list error:', error);
    return NextResponse.json(
      createApiError('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    );
  }
}