/**
 * Mobile Event RSVP Endpoint
 * POST /api/mobile/v1/events/[id]/rsvp - RSVP to event
 * DELETE /api/mobile/v1/events/[id]/rsvp - Cancel RSVP
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withMobileAuth, createMobileResponse, createMobileErrorResponse, requireTenantAccess } from '@/lib/mobile-auth';
import { RSVPSchema } from '@drouple/contracts';
import { z } from 'zod';
import { logAuditAction } from '@/lib/audit';

const RSVPRequestSchema = z.object({
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withMobileAuth(request, async (req, user) => {
    try {
      const eventId = params.id;

      // Parse request (notes are optional)
      const body = await req.json();
      const parseResult = RSVPRequestSchema.safeParse(body);
      
      if (!parseResult.success) {
        return createMobileErrorResponse(
          'VALIDATION_ERROR',
          'Invalid RSVP data',
          400,
          { errors: parseResult.error.errors }
        );
      }

      const { notes } = parseResult.data;

      // Verify event exists and user has access
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          title: true,
          maxAttendees: true,
          restrictedToRoles: true,
          churchId: true,
          isActive: true,
          startDate: true,
          church: {
            select: {
              tenantId: true,
            }
          },
          _count: {
            select: {
              rsvps: {
                where: { status: 'ATTENDING' }
              }
            }
          }
        },
      });

      if (!event) {
        return createMobileErrorResponse(
          'NOT_FOUND',
          'Event not found',
          404
        );
      }

      if (!event.isActive) {
        return createMobileErrorResponse(
          'FORBIDDEN',
          'Event is not active for RSVP',
          403
        );
      }

      // Check if event has already started
      if (new Date() > event.startDate) {
        return createMobileErrorResponse(
          'FORBIDDEN',
          'Cannot RSVP to event that has already started',
          403
        );
      }

      // Validate tenant access
      requireTenantAccess(user, event.church.tenantId);

      // Check role-based restrictions
      if (event.restrictedToRoles.length > 0) {
        const hasRequiredRole = event.restrictedToRoles.some(role => 
          user.roles.includes(role)
        );
        
        if (!hasRequiredRole) {
          return createMobileErrorResponse(
            'FORBIDDEN',
            'You do not have permission to RSVP to this event',
            403
          );
        }
      }

      // Check for existing RSVP
      const existingRSVP = await prisma.eventRSVP.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId: user.sub,
          }
        },
      });

      if (existingRSVP && existingRSVP.status !== 'CANCELLED') {
        return createMobileErrorResponse(
          'CONFLICT',
          existingRSVP.status === 'ATTENDING' ? 
            'You have already RSVP\'d to this event' : 
            'You are already on the waitlist for this event',
          409
        );
      }

      // Determine RSVP status based on capacity
      const currentAttendees = event._count.rsvps;
      const isAtCapacity = event.maxAttendees && currentAttendees >= event.maxAttendees;
      const rsvpStatus = isAtCapacity ? 'WAITLISTED' : 'ATTENDING';

      // Create or update RSVP
      const rsvp = await prisma.eventRSVP.upsert({
        where: {
          eventId_userId: {
            eventId,
            userId: user.sub,
          }
        },
        update: {
          status: rsvpStatus,
          rsvpedAt: new Date(),
          notes,
        },
        create: {
          eventId,
          userId: user.sub,
          status: rsvpStatus,
          rsvpedAt: new Date(),
          notes,
          isPaid: false,
        },
        select: {
          id: true,
          eventId: true,
          userId: true,
          status: true,
          rsvpedAt: true,
          isPaid: true,
          notes: true,
        },
      });

      // Audit log
      await logAuditAction({
        actorId: user.sub,
        action: existingRSVP ? 'rsvp_update' : 'rsvp_create',
        entity: 'event_rsvp',
        entityId: rsvp.id,
        changes: {
          eventId,
          status: rsvpStatus,
          notes,
          wasWaitlisted: isAtCapacity,
        },
        reason: 'Mobile RSVP',
        tenantId: user.tenantId,
      });

      // Format response
      const response = {
        id: rsvp.id,
        eventId: rsvp.eventId,
        userId: rsvp.userId,
        status: rsvp.status,
        rsvpedAt: rsvp.rsvpedAt.toISOString(),
        isPaid: rsvp.isPaid,
        notes: rsvp.notes || undefined,
      };

      const validatedResponse = RSVPSchema.parse(response);

      return createMobileResponse(validatedResponse, 201);

    } catch (error) {
      console.error('Mobile RSVP error:', error);
      
      if (error instanceof Error && error.message.includes('Tenant access')) {
        return createMobileErrorResponse(
          'FORBIDDEN',
          'You do not have access to this event',
          403
        );
      }

      return createMobileErrorResponse(
        'INTERNAL_ERROR',
        'RSVP failed due to server error',
        500
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withMobileAuth(request, async (req, user) => {
    try {
      const eventId = params.id;

      // Find existing RSVP
      const existingRSVP = await prisma.eventRSVP.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId: user.sub,
          }
        },
        include: {
          event: {
            select: {
              church: {
                select: { tenantId: true }
              }
            }
          }
        }
      });

      if (!existingRSVP) {
        return createMobileErrorResponse(
          'NOT_FOUND',
          'No RSVP found for this event',
          404
        );
      }

      // Validate tenant access
      requireTenantAccess(user, existingRSVP.event.church.tenantId);

      // Update RSVP to cancelled
      const cancelledRSVP = await prisma.eventRSVP.update({
        where: { id: existingRSVP.id },
        data: {
          status: 'CANCELLED',
          rsvpedAt: new Date(), // Update timestamp
        },
        select: {
          id: true,
          eventId: true,
          userId: true,
          status: true,
          rsvpedAt: true,
          isPaid: true,
          notes: true,
        },
      });

      // If user was attending, promote someone from waitlist
      if (existingRSVP.status === 'ATTENDING') {
        const waitlistRSVP = await prisma.eventRSVP.findFirst({
          where: {
            eventId,
            status: 'WAITLISTED',
          },
          orderBy: { rsvpedAt: 'asc' }, // First come, first served
        });

        if (waitlistRSVP) {
          await prisma.eventRSVP.update({
            where: { id: waitlistRSVP.id },
            data: { 
              status: 'ATTENDING',
              rsvpedAt: new Date(), // Update promotion timestamp
            },
          });

          // Audit log for promotion
          await logAuditAction({
            actorId: 'system',
            action: 'rsvp_promoted',
            entity: 'event_rsvp',
            entityId: waitlistRSVP.id,
            changes: {
              from: 'WAITLISTED',
              to: 'ATTENDING',
              promotedDueToCancellation: existingRSVP.id,
            },
            reason: 'Automatic waitlist promotion',
            tenantId: user.tenantId,
          });
        }
      }

      // Audit log for cancellation
      await logAuditAction({
        actorId: user.sub,
        action: 'rsvp_cancel',
        entity: 'event_rsvp',
        entityId: existingRSVP.id,
        changes: {
          eventId,
          previousStatus: existingRSVP.status,
          newStatus: 'CANCELLED',
        },
        reason: 'Mobile RSVP cancellation',
        tenantId: user.tenantId,
      });

      const response = {
        id: cancelledRSVP.id,
        eventId: cancelledRSVP.eventId,
        userId: cancelledRSVP.userId,
        status: cancelledRSVP.status,
        rsvpedAt: cancelledRSVP.rsvpedAt.toISOString(),
        isPaid: cancelledRSVP.isPaid,
        notes: cancelledRSVP.notes || undefined,
      };

      const validatedResponse = RSVPSchema.parse(response);

      return createMobileResponse(validatedResponse);

    } catch (error) {
      console.error('Mobile RSVP cancellation error:', error);
      
      if (error instanceof Error && error.message.includes('Tenant access')) {
        return createMobileErrorResponse(
          'FORBIDDEN',
          'You do not have access to this event',
          403
        );
      }

      return createMobileErrorResponse(
        'INTERNAL_ERROR',
        'RSVP cancellation failed due to server error',
        500
      );
    }
  });
}