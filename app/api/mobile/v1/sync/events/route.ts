/**
 * Mobile API: Events Delta Sync
 * GET /api/mobile/v1/sync/events?updatedAfter=ISO - Get events updated after timestamp
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withMobileAuth, createMobileResponse, handleMobileApiError, createMobileTenantWhere } from '@/lib/mobile-auth';
import type { EventSyncResponse, MobileEvent } from '@drouple/contracts';

/**
 * GET /api/mobile/v1/sync/events
 * Returns events updated after specified timestamp for delta sync
 */
export async function GET(request: NextRequest) {
  return withMobileAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const updatedAfterParam = searchParams.get('updatedAfter');
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
      const offset = parseInt(searchParams.get('offset') || '0');

      // Parse updatedAfter timestamp
      let updatedAfter: Date;
      if (updatedAfterParam) {
        updatedAfter = new Date(updatedAfterParam);
        if (isNaN(updatedAfter.getTime())) {
          return createMobileResponse(
            { error: 'Invalid updatedAfter timestamp format. Use ISO 8601 format.' },
            400
          );
        }
      } else {
        // Default to last 30 days if no timestamp provided
        updatedAfter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      // Build tenant-aware where clause
      const tenantWhere = createMobileTenantWhere(user);

      // Query events with delta filtering
      const events = await prisma.event.findMany({
        where: {
          ...tenantWhere,
          OR: [
            { updatedAt: { gte: updatedAfter } },
            { createdAt: { gte: updatedAfter } },
          ],
          // Only return events user can see based on visibility rules
          OR: [
            { visibility: 'PUBLIC' },
            { 
              visibility: 'MEMBERS',
              // User must be a member
            },
            {
              visibility: 'LEADERS',
              // User must have leader role or higher
            },
            {
              visibility: 'ADMINS',
              // User must have admin role or higher  
            },
          ],
          // Scope filtering
          ...(user.roles.includes('SUPER_ADMIN') ? {} : {
            OR: [
              { scope: 'WHOLE_CHURCH' },
              { 
                scope: 'LOCAL_CHURCH',
                church: { id: user.churchId },
              },
            ],
          }),
        },
        include: {
          church: {
            select: {
              id: true,
              name: true,
            },
          },
          rsvps: {
            where: { userId: user.sub },
            select: {
              id: true,
              status: true,
              rsvpDate: true,
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
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      });

      // Transform to mobile format
      const mobileEvents: MobileEvent[] = events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        eventDate: event.eventDate.toISOString(),
        eventTime: event.eventTime,
        location: event.location,
        capacity: event.capacity,
        fee: event.fee ? parseFloat(event.fee.toString()) : null,
        visibility: event.visibility,
        scope: event.scope,
        status: event.status,
        churchId: event.churchId,
        churchName: event.church.name,
        userRsvp: event.rsvps.length > 0 ? {
          id: event.rsvps[0].id,
          status: event.rsvps[0].status,
          rsvpDate: event.rsvps[0].rsvpDate.toISOString(),
        } : null,
        attendeeCount: event._count.rsvps,
        isFull: event.capacity ? event._count.rsvps >= event.capacity : false,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
      }));

      // Check if there are more events available
      const totalCount = await prisma.event.count({
        where: {
          ...tenantWhere,
          OR: [
            { updatedAt: { gte: updatedAfter } },
            { createdAt: { gte: updatedAfter } },
          ],
        },
      });

      const hasMore = offset + limit < totalCount;

      const response: EventSyncResponse = {
        events: mobileEvents,
        hasMore,
        nextOffset: hasMore ? offset + limit : null,
        timestamp: new Date().toISOString(),
        syncVersion: 1,
      };

      return createMobileResponse(response);

    } catch (error) {
      return handleMobileApiError(error);
    }
  });
}