/**
 * Mobile Events RSVP API
 * POST /api/mobile/v1/events/rsvp - RSVP to an event
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireMobileContext } from '@/lib/mobileAuth/context';
import { withIdempotency } from '@/lib/mobileAuth/idempotency';
import type { RSVPRequest, SuccessResponse } from '@drouple/contracts';

// Validation schema
const RSVPSchema = z.object({
  clientRequestId: z.string(),
  eventId: z.string(),
  action: z.enum(['RSVP', 'CANCEL']),
}) satisfies z.ZodType<RSVPRequest>;

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
 * POST /api/mobile/v1/events/rsvp
 * RSVP or cancel RSVP for an event
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user context
    const context = requireMobileContext(request);

    // Parse and validate request body
    const body = await request.json();
    const result = RSVPSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: result.error.errors,
        },
        { status: 400 }
      );
    }

    const rsvpData = result.data;

    return await withIdempotency(
      request,
      context,
      '/api/mobile/v1/events/rsvp',
      rsvpData,
      async () => {
        // Verify the event exists and is accessible
        const event = await db.event.findFirst({
          where: {
            id: rsvpData.eventId,
            ...withChurch(context.tenantId, context.localChurchId),
          },
          include: {
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
        });

        if (!event) {
          throw new Error('Event not found or access denied');
        }

        // Check if user already has an RSVP for this event
        const existingRsvp = await db.eventRsvp.findFirst({
          where: {
            eventId: rsvpData.eventId,
            userId: context.userId,
          },
        });

        if (rsvpData.action === 'RSVP') {
          // Create or update RSVP
          if (existingRsvp) {
            if (existingRsvp.status === 'GOING') {
              // Already RSVP'd
              return {
                status: 'ok' as const,
                message: 'Already RSVP\'d to this event',
              } satisfies SuccessResponse;
            }

            // Update existing RSVP
            await db.eventRsvp.update({
              where: { id: existingRsvp.id },
              data: {
                status: 'GOING',
                rsvpedAt: new Date(),
              },
            });
          } else {
            // Check capacity
            if (event.capacity && event._count.eventRsvps >= event.capacity) {
              // Event is at capacity, add to waitlist
              await db.eventRsvp.create({
                data: {
                  eventId: rsvpData.eventId,
                  userId: context.userId,
                  status: 'WAITLIST',
                  rsvpedAt: new Date(),
                },
              });

              return {
                status: 'ok' as const,
                message: 'Added to waitlist - event is at capacity',
              } satisfies SuccessResponse;
            }

            // Create new RSVP
            await db.eventRsvp.create({
              data: {
                eventId: rsvpData.eventId,
                userId: context.userId,
                status: 'GOING',
                rsvpedAt: new Date(),
              },
            });
          }

          // TODO: Create audit log
          // await auditLog({ userId: context.userId, action: 'CREATE', resource: 'event_rsvp', resourceId: rsvpData.eventId });

          return {
            status: 'ok' as const,
            message: 'RSVP confirmed',
          } satisfies SuccessResponse;

        } else {
          // Cancel RSVP
          if (!existingRsvp || existingRsvp.status === 'CANCELLED') {
            return {
              status: 'ok' as const,
              message: 'No active RSVP to cancel',
            } satisfies SuccessResponse;
          }

          // Update RSVP to cancelled
          await db.eventRsvp.update({
            where: { id: existingRsvp.id },
            data: {
              status: 'CANCELLED',
              rsvpedAt: new Date(),
            },
          });

          // If event has waitlist, promote next person
          const nextWaitlisted = await db.eventRsvp.findFirst({
            where: {
              eventId: rsvpData.eventId,
              status: 'WAITLIST',
            },
            orderBy: {
              rsvpedAt: 'asc',
            },
          });

          if (nextWaitlisted) {
            await db.eventRsvp.update({
              where: { id: nextWaitlisted.id },
              data: {
                status: 'GOING',
                rsvpedAt: new Date(),
              },
            });
          }

          // TODO: Create audit log
          // await auditLog({ userId: context.userId, action: 'UPDATE', resource: 'event_rsvp', resourceId: rsvpData.eventId });

          return {
            status: 'ok' as const,
            message: 'RSVP cancelled',
          } satisfies SuccessResponse;
        }
      }
    );

  } catch (error) {
    console.error('RSVP error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Authentication required')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      if (error.message.includes('access denied')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }

      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}