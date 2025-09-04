/**
 * Mobile API: Bulk Check-ins
 * POST /api/mobile/v1/sync/checkins/bulk - Process multiple check-ins with conflict resolution
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withMobileAuth, createMobileResponse, handleMobileApiError, createMobileTenantWhere } from '@/lib/mobile-auth';
import { broadcastServiceCounts } from '@/lib/socket-server';
import type { BulkCheckinRequest, BulkCheckinResponse, BulkOperationResult } from '@drouple/contracts';

// Validation schema for bulk check-in request
const BulkCheckinSchema = z.object({
  checkins: z.array(z.object({
    serviceId: z.string(),
    checkinTime: z.string().datetime(),
    clientId: z.string().optional(), // For conflict resolution
    offlineId: z.string().optional(), // Offline-generated ID
  })),
  conflictResolution: z.enum(['last-write-wins', 'fail-on-conflict']).default('last-write-wins'),
}) satisfies z.ZodType<BulkCheckinRequest>;

/**
 * POST /api/mobile/v1/sync/checkins/bulk
 * Process multiple check-ins from offline sync with conflict resolution
 */
export async function POST(request: NextRequest) {
  return withMobileAuth(request, async (req, user) => {
    try {
      // Parse and validate request body
      const body = await req.json();
      const result = BulkCheckinSchema.safeParse(body);

      if (!result.success) {
        return createMobileResponse(
          { 
            error: 'Invalid request data',
            details: result.error.errors,
          },
          400
        );
      }

      const { checkins, conflictResolution } = result.data;

      if (checkins.length === 0) {
        return createMobileResponse(
          { error: 'No check-ins provided' },
          400
        );
      }

      if (checkins.length > 100) {
        return createMobileResponse(
          { error: 'Maximum 100 check-ins per bulk request' },
          400
        );
      }

      // Build tenant-aware where clause
      const tenantWhere = createMobileTenantWhere(user);

      // Validate all services exist and user has access
      const serviceIds = [...new Set(checkins.map(c => c.serviceId))];
      const services = await prisma.service.findMany({
        where: {
          ...tenantWhere,
          id: { in: serviceIds },
        },
        select: {
          id: true,
          name: true,
          churchId: true,
          serviceDate: true,
          church: {
            select: {
              name: true,
            },
          },
        },
      });

      if (services.length !== serviceIds.length) {
        const missingIds = serviceIds.filter(id => !services.some(s => s.id === id));
        return createMobileResponse(
          { error: `Services not found: ${missingIds.join(', ')}` },
          404
        );
      }

      // Check church access for non-super admins
      if (!user.roles.includes('SUPER_ADMIN')) {
        const invalidServices = services.filter(s => s.churchId !== user.churchId);
        if (invalidServices.length > 0) {
          return createMobileResponse(
            { error: 'Access denied to services in other churches' },
            403
          );
        }
      }

      const results: BulkOperationResult[] = [];
      const processedCheckins: Array<{
        serviceId: string;
        churchId: string;
        serviceName: string;
      }> = [];

      // Process each check-in
      for (const checkinData of checkins) {
        try {
          const service = services.find(s => s.id === checkinData.serviceId)!;
          const checkinTime = new Date(checkinData.checkinTime);

          // Check for existing check-in (duplicate prevention)
          const existingCheckin = await prisma.checkin.findFirst({
            where: {
              serviceId: checkinData.serviceId,
              userId: user.sub,
            },
          });

          if (existingCheckin) {
            if (conflictResolution === 'fail-on-conflict') {
              results.push({
                success: false,
                id: checkinData.offlineId || checkinData.clientId || 'unknown',
                error: 'Check-in already exists',
                conflictType: 'duplicate',
              });
              continue;
            } else {
              // last-write-wins: update existing check-in
              const updatedCheckin = await prisma.checkin.update({
                where: { id: existingCheckin.id },
                data: {
                  checkinTime,
                  updatedAt: new Date(),
                },
              });

              results.push({
                success: true,
                id: checkinData.offlineId || checkinData.clientId || updatedCheckin.id,
                serverId: updatedCheckin.id,
                action: 'updated',
              });

              processedCheckins.push({
                serviceId: service.id,
                churchId: service.churchId,
                serviceName: service.name,
              });
              continue;
            }
          }

          // Create new check-in
          const newCheckin = await prisma.checkin.create({
            data: {
              serviceId: checkinData.serviceId,
              userId: user.sub,
              checkinTime,
            },
          });

          results.push({
            success: true,
            id: checkinData.offlineId || checkinData.clientId || newCheckin.id,
            serverId: newCheckin.id,
            action: 'created',
          });

          processedCheckins.push({
            serviceId: service.id,
            churchId: service.churchId,
            serviceName: service.name,
          });

        } catch (error) {
          console.error('Error processing check-in:', error);
          results.push({
            success: false,
            id: checkinData.offlineId || checkinData.clientId || 'unknown',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Broadcast updated service counts for each affected service
      for (const service of processedCheckins) {
        try {
          // Get updated counts
          const totalCheckins = await prisma.checkin.count({
            where: { serviceId: service.serviceId },
          });

          const uniqueUsers = await prisma.checkin.findMany({
            where: { serviceId: service.serviceId },
            select: { userId: true },
            distinct: ['userId'],
          });

          // Broadcast to realtime channels
          broadcastServiceCounts(user.tenantId, service.churchId, {
            serviceId: service.serviceId,
            totalCheckins,
            currentAttendance: uniqueUsers.length,
            timestamp: new Date().toISOString(),
          });

        } catch (error) {
          console.error('Error broadcasting service counts:', error);
        }
      }

      // Calculate summary statistics
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      const conflictCount = results.filter(r => r.conflictType === 'duplicate').length;

      const response: BulkCheckinResponse = {
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount,
          conflicts: conflictCount,
        },
        timestamp: new Date().toISOString(),
      };

      return createMobileResponse(response);

    } catch (error) {
      return handleMobileApiError(error);
    }
  });
}