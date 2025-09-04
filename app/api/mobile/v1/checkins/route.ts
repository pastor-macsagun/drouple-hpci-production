/**
 * Mobile Check-ins API
 * POST /api/mobile/v1/checkins - Check in to a service
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireMobileContext, hasRole } from '@/lib/mobileAuth/context';
import { withIdempotency } from '@/lib/mobileAuth/idempotency';
// Note: Audit logging would be implemented here in production
import type { CheckInRequest, CheckInResult } from '@drouple/contracts';

// Validation schema
const CheckInSchema = z.object({
  clientRequestId: z.string(),
  memberId: z.string(),
  serviceId: z.string(),
  newBeliever: z.boolean().optional(),
}) satisfies z.ZodType<CheckInRequest>;

/**
 * Create tenant-scoped where clause for church access
 */
function withChurch(tenantId: string, localChurchId?: string) {
  const baseClause = {
    church: {
      tenantId: tenantId,
    },
  };

  // If user has a specific local church, scope to that church
  if (localChurchId) {
    return {
      ...baseClause,
      id: localChurchId,
    };
  }

  return baseClause;
}

/**
 * POST /api/mobile/v1/checkins
 * Check in to a service
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user context
    const context = requireMobileContext(request);

    // Parse and validate request body
    const body = await request.json();
    const result = CheckInSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: result.error.errors,
        },
        { status: 400 }
      );
    }

    const checkInData = result.data;

    return await withIdempotency(
      request,
      context,
      '/api/mobile/v1/checkins',
      checkInData,
      async () => {
        // Verify user can check in (self or admin/leader role)
        if (checkInData.memberId !== context.userId && !hasRole(context, 'LEADER')) {
          throw new Error('Insufficient permissions to check in other members');
        }

        // Verify the service exists and is accessible
        const service = await db.service.findFirst({
          where: {
            id: checkInData.serviceId,
            localChurch: withChurch(context.tenantId, context.localChurchId),
          },
          include: {
            localChurch: {
              include: {
                church: true,
              },
            },
          },
        });

        if (!service) {
          throw new Error('Service not found or access denied');
        }

        // Verify the member exists and is in the same tenant
        const member = await db.user.findFirst({
          where: {
            id: checkInData.memberId,
            tenantId: context.tenantId,
            memberStatus: 'ACTIVE',
          },
          include: {
            memberships: {
              where: {
                believerStatus: 'ACTIVE',
                localChurchId: service.localChurchId,
              },
            },
          },
        });

        if (!member) {
          throw new Error('Member not found or not active in this church');
        }

        // Check if already checked in to this service
        const existingCheckIn = await db.checkin.findFirst({
          where: {
            userId: checkInData.memberId,
            serviceId: checkInData.serviceId,
          },
        });

        if (existingCheckIn) {
          return {
            id: existingCheckIn.id,
            status: 'duplicate' as const,
          } satisfies CheckInResult;
        }

        // Create the check-in
        const checkin = await db.checkin.create({
          data: {
            userId: checkInData.memberId,
            serviceId: checkInData.serviceId,
            checkInTime: new Date(),
            ...(checkInData.newBeliever && { isNewBeliever: true }),
          },
        });

        // If this is a new believer, handle auto-enrollment in ROOTS pathway
        if (checkInData.newBeliever) {
          try {
            // Find ROOTS pathway for this church
            const rootsPathway = await db.pathway.findFirst({
              where: {
                type: 'ROOTS',
                localChurchId: service.localChurchId,
              },
            });

            if (rootsPathway) {
              // Check if not already enrolled
              const existingEnrollment = await db.pathwayEnrollment.findFirst({
                where: {
                  userId: member.id,
                  pathwayId: rootsPathway.id,
                },
              });

              if (!existingEnrollment) {
                await db.pathwayEnrollment.create({
                  data: {
                    userId: member.id,
                    pathwayId: rootsPathway.id,
                    status: 'ENROLLED',
                    enrolledAt: new Date(),
                  },
                });
              }
            }
          } catch (error) {
            // Don't fail check-in if pathway enrollment fails
            console.error('Failed to auto-enroll in ROOTS pathway:', error);
          }
        }

        // TODO: Create audit log in production
        // await auditLog({ userId: context.userId, action: 'CREATE', resource: 'checkin', resourceId: checkin.id });

        return {
          id: checkin.id,
          status: 'ok' as const,
        } satisfies CheckInResult;
      }
    );

  } catch (error) {
    console.error('Check-in error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Authentication required')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      if (error.message.includes('permissions') || error.message.includes('access denied')) {
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