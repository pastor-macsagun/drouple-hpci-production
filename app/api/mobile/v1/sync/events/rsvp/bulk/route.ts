/**
 * Mobile API: Bulk Event RSVPs
 * POST /api/mobile/v1/sync/events/rsvp/bulk - Process multiple RSVPs with conflict resolution
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withMobileAuth, createMobileResponse, handleMobileApiError, createMobileTenantWhere } from '@/lib/mobile-auth';
import { sendNotificationToUser } from '@/lib/notifications/service';
import type { BulkRsvpRequest, BulkRsvpResponse, BulkOperationResult } from '@drouple/contracts';

// Validation schema for bulk RSVP request
const BulkRsvpSchema = z.object({
  rsvps: z.array(z.object({
    eventId: z.string(),
    status: z.enum(['CONFIRMED', 'CANCELLED']),
    rsvpDate: z.string().datetime(),
    clientId: z.string().optional(), // For conflict resolution
    offlineId: z.string().optional(), // Offline-generated ID
  })),
  conflictResolution: z.enum(['last-write-wins', 'fail-on-conflict']).default('last-write-wins'),
}) satisfies z.ZodType<BulkRsvpRequest>;

/**
 * POST /api/mobile/v1/sync/events/rsvp/bulk
 * Process multiple event RSVPs from offline sync with conflict resolution
 */
export async function POST(request: NextRequest) {
  return withMobileAuth(request, async (req, user) => {
    try {
      // Parse and validate request body
      const body = await req.json();
      const result = BulkRsvpSchema.safeParse(body);

      if (!result.success) {
        return createMobileResponse(
          { 
            error: 'Invalid request data',
            details: result.error.errors,
          },
          400
        );
      }

      const { rsvps, conflictResolution } = result.data;

      if (rsvps.length === 0) {
        return createMobileResponse(
          { error: 'No RSVPs provided' },
          400
        );
      }

      if (rsvps.length > 50) {
        return createMobileResponse(
          { error: 'Maximum 50 RSVPs per bulk request' },
          400
        );
      }

      // Build tenant-aware where clause
      const tenantWhere = createMobileTenantWhere(user);

      // Validate all events exist and user has access
      const eventIds = [...new Set(rsvps.map(r => r.eventId))];
      const events = await prisma.event.findMany({
        where: {
          ...tenantWhere,
          id: { in: eventIds },
          status: 'PUBLISHED',
        },
        include: {
          church: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              rsvps: {
                where: { status: 'CONFIRMED' },
              },
            },
          },
        },
      });

      if (events.length !== eventIds.length) {
        const missingIds = eventIds.filter(id => !events.some(e => e.id === id));
        return createMobileResponse(
          { error: `Events not found: ${missingIds.join(', ')}` },
          404
        );
      }

      // Check church access for non-super admins
      if (!user.roles.includes('SUPER_ADMIN')) {
        const invalidEvents = events.filter(e => e.churchId !== user.churchId);
        if (invalidEvents.length > 0) {
          return createMobileResponse(
            { error: 'Access denied to events in other churches' },
            403
          );
        }
      }

      const results: BulkOperationResult[] = [];
      const waitlistPromotions: Array<{ eventId: string; eventTitle: string }> = [];

      // Process each RSVP
      for (const rsvpData of rsvps) {
        try {
          const event = events.find(e => e.id === rsvpData.eventId)!;
          const rsvpDate = new Date(rsvpData.rsvpDate);

          // Check for existing RSVP
          const existingRsvp = await prisma.eventRSVP.findFirst({
            where: {
              eventId: rsvpData.eventId,
              userId: user.sub,
            },
          });

          if (existingRsvp) {
            if (conflictResolution === 'fail-on-conflict') {
              results.push({
                success: false,
                id: rsvpData.offlineId || rsvpData.clientId || 'unknown',
                error: 'RSVP already exists',
                conflictType: 'duplicate',
              });
              continue;
            } else {
              // last-write-wins: update existing RSVP
              const updatedRsvp = await prisma.eventRSVP.update({
                where: { id: existingRsvp.id },
                data: {
                  status: rsvpData.status,
                  rsvpDate,
                  updatedAt: new Date(),
                },
              });

              results.push({
                success: true,
                id: rsvpData.offlineId || rsvpData.clientId || updatedRsvp.id,
                serverId: updatedRsvp.id,
                action: 'updated',
              });

              // Check for waitlist promotion if status changed to CANCELLED
              if (rsvpData.status === 'CANCELLED' && existingRsvp.status === 'CONFIRMED') {
                await promoteFromWaitlist(event.id, event.title, waitlistPromotions);
              }

              continue;
            }
          }

          // Create new RSVP
          let finalStatus = rsvpData.status;
          
          // Check capacity for new RSVPs
          if (rsvpData.status === 'CONFIRMED' && event.capacity) {
            const currentConfirmed = event._count.rsvps;
            if (currentConfirmed >= event.capacity) {
              // Event is full, add to waitlist
              finalStatus = 'WAITLISTED';
            }
          }

          const newRsvp = await prisma.eventRSVP.create({
            data: {
              eventId: rsvpData.eventId,
              userId: user.sub,
              status: finalStatus,
              rsvpDate,
            },
          });

          results.push({
            success: true,
            id: rsvpData.offlineId || rsvpData.clientId || newRsvp.id,
            serverId: newRsvp.id,
            action: 'created',
            ...(finalStatus === 'WAITLISTED' && { 
              warning: 'Event is full, added to waitlist' 
            }),
          });

        } catch (error) {
          console.error('Error processing RSVP:', error);
          results.push({
            success: false,
            id: rsvpData.offlineId || rsvpData.clientId || 'unknown',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Send notifications for waitlist promotions
      for (const promotion of waitlistPromotions) {
        try {
          await sendNotificationToUser(
            user.sub,
            'Event Spot Available!',
            `You've been moved from the waitlist to confirmed for "${promotion.eventTitle}".`,
            { priority: 'MEDIUM' }
          );
        } catch (error) {
          console.error('Error sending waitlist promotion notification:', error);
        }
      }

      // Calculate summary statistics
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      const conflictCount = results.filter(r => r.conflictType === 'duplicate').length;
      const waitlistedCount = results.filter(r => r.warning?.includes('waitlist')).length;

      const response: BulkRsvpResponse = {
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount,
          conflicts: conflictCount,
          waitlisted: waitlistedCount,
        },
        timestamp: new Date().toISOString(),
      };

      return createMobileResponse(response);

    } catch (error) {
      return handleMobileApiError(error);
    }
  });
}

/**
 * Promote first waitlisted user to confirmed status
 */
async function promoteFromWaitlist(
  eventId: string, 
  eventTitle: string, 
  promotions: Array<{ eventId: string; eventTitle: string }>
): Promise<void> {
  try {
    // Find first waitlisted RSVP
    const waitlistedRsvp = await prisma.eventRSVP.findFirst({
      where: {
        eventId,
        status: 'WAITLISTED',
      },
      orderBy: { rsvpDate: 'asc' },
      include: {
        user: {
          select: { id: true },
        },
      },
    });

    if (waitlistedRsvp) {
      // Promote to confirmed
      await prisma.eventRSVP.update({
        where: { id: waitlistedRsvp.id },
        data: { 
          status: 'CONFIRMED',
          updatedAt: new Date(),
        },
      });

      // Track for notification
      promotions.push({ eventId, eventTitle });
    }
  } catch (error) {
    console.error('Error promoting from waitlist:', error);
  }
}