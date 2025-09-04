/**
 * Mobile Check-in Endpoint
 * POST /api/mobile/v1/checkin
 * Member check-in to service with tenant isolation and new believer handling
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withMobileAuth, createMobileResponse, createMobileErrorResponse, requireTenantAccess } from '@/lib/mobile-auth';
import { CheckInSchema } from '@drouple/contracts';
import { z } from 'zod';
import { autoEnrollInRoots } from '@/lib/pathways/auto-enroll';
import { logAuditAction } from '@/lib/audit';

const CheckInRequestSchema = z.object({
  serviceId: z.string(),
  isFirstTime: z.boolean().default(false),
  notes: z.string().optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  return withMobileAuth(request, async (req, user) => {
    try {
      // Parse request
      const body = await req.json();
      const parseResult = CheckInRequestSchema.safeParse(body);
      
      if (!parseResult.success) {
        return createMobileErrorResponse(
          'VALIDATION_ERROR',
          'Invalid check-in data',
          400,
          { errors: parseResult.error.errors }
        );
      }

      const { serviceId, isFirstTime, notes, location } = parseResult.data;

      // Verify service exists and user has access
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        select: {
          id: true,
          name: true,
          churchId: true,
          isActive: true,
          church: {
            select: {
              tenantId: true,
            }
          }
        },
      });

      if (!service) {
        return createMobileErrorResponse(
          'NOT_FOUND',
          'Service not found',
          404
        );
      }

      if (!service.isActive) {
        return createMobileErrorResponse(
          'FORBIDDEN',
          'Service is not active for check-in',
          403
        );
      }

      // Validate tenant access
      requireTenantAccess(user, service.church.tenantId);

      // Check for duplicate check-in
      const existingCheckin = await prisma.checkin.findUnique({
        where: {
          serviceId_userId: {
            serviceId,
            userId: user.sub,
          }
        },
      });

      if (existingCheckin) {
        return createMobileErrorResponse(
          'CONFLICT',
          'You have already checked in to this service',
          409
        );
      }

      // Create check-in record
      const checkin = await prisma.checkin.create({
        data: {
          serviceId,
          userId: user.sub,
          checkedInAt: new Date(),
          isFirstTime,
          notes,
          // Location would be stored in a separate field/table if needed
        },
        select: {
          id: true,
          serviceId: true,
          userId: true,
          checkedInAt: true,
          isFirstTime: true,
          notes: true,
        },
      });

      // Handle new believer logic
      if (isFirstTime) {
        try {
          // Auto-enroll in ROOTS pathway for new believers
          await autoEnrollInRoots(user.sub, user.tenantId);
          
          // Log new believer for VIP team follow-up
          await prisma.firstTimer.upsert({
            where: { userId: user.sub },
            update: {
              lastVisit: new Date(),
              visitCount: { increment: 1 },
            },
            create: {
              userId: user.sub,
              tenantId: user.tenantId,
              churchId: service.churchId,
              firstVisit: new Date(),
              lastVisit: new Date(),
              visitCount: 1,
              source: 'mobile_checkin',
            },
          });
        } catch (error) {
          console.error('New believer handling error:', error);
          // Don't fail the check-in if new believer logic fails
        }
      }

      // Audit log
      await logAuditAction({
        actorId: user.sub,
        action: 'checkin_create',
        entity: 'checkin',
        entityId: checkin.id,
        changes: {
          serviceId,
          isFirstTime,
          notes,
        },
        reason: 'Mobile check-in',
        tenantId: user.tenantId,
      });

      // Format response
      const response = {
        id: checkin.id,
        userId: checkin.userId,
        serviceId: checkin.serviceId,
        checkedInAt: checkin.checkedInAt.toISOString(),
        isFirstTime: checkin.isFirstTime,
        notes: checkin.notes || undefined,
        ...(location && { location }),
      };

      const validatedResponse = CheckInSchema.parse(response);

      return createMobileResponse(validatedResponse, 201);

    } catch (error) {
      console.error('Mobile check-in error:', error);
      
      if (error instanceof Error && error.message.includes('Tenant access')) {
        return createMobileErrorResponse(
          'FORBIDDEN',
          'You do not have access to this service',
          403
        );
      }

      return createMobileErrorResponse(
        'INTERNAL_ERROR',
        'Check-in failed due to server error',
        500
      );
    }
  });
}

// GET endpoint for check-in history
export async function GET(request: NextRequest) {
  return withMobileAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

      // Get user's check-in history with tenant isolation
      const [checkins, total] = await Promise.all([
        prisma.checkin.findMany({
          where: {
            userId: user.sub,
            service: {
              church: {
                tenantId: user.tenantId,
              }
            }
          },
          include: {
            service: {
              select: {
                id: true,
                name: true,
                date: true,
                churchId: true,
              }
            }
          },
          orderBy: { checkedInAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.checkin.count({
          where: {
            userId: user.sub,
            service: {
              church: {
                tenantId: user.tenantId,
              }
            }
          }
        }),
      ]);

      const formattedCheckins = checkins.map(checkin => ({
        id: checkin.id,
        userId: checkin.userId,
        serviceId: checkin.serviceId,
        checkedInAt: checkin.checkedInAt.toISOString(),
        isFirstTime: checkin.isFirstTime,
        notes: checkin.notes || undefined,
        service: {
          name: checkin.service.name,
          date: checkin.service.date.toISOString(),
        },
      }));

      const response = {
        items: formattedCheckins,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };

      return createMobileResponse(response);

    } catch (error) {
      console.error('Mobile check-in history error:', error);
      return createMobileErrorResponse(
        'INTERNAL_ERROR',
        'Failed to fetch check-in history',
        500
      );
    }
  });
}