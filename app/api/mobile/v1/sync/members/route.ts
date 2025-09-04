/**
 * Mobile API: Members Delta Sync
 * GET /api/mobile/v1/sync/members?updatedAfter=ISO - Get members updated after timestamp
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withMobileAuth, createMobileResponse, handleMobileApiError, createMobileTenantWhere } from '@/lib/mobile-auth';
import { hasMinRole } from '@/lib/mobile-jwt';
import type { MemberSyncResponse, MobileMember } from '@drouple/contracts';

/**
 * GET /api/mobile/v1/sync/members
 * Returns members updated after specified timestamp for delta sync
 * Requires LEADER role or higher for access to member directory
 */
export async function GET(request: NextRequest) {
  return withMobileAuth(request, async (req, user) => {
    try {
      // Check permissions - only leaders and above can access member directory
      if (!hasMinRole(user.roles, 'LEADER')) {
        return createMobileResponse(
          { error: 'Insufficient permissions. Leader role required.' },
          403
        );
      }

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

      // Query members with delta filtering
      const members = await prisma.user.findMany({
        where: {
          ...tenantWhere,
          isActive: true,
          OR: [
            { updatedAt: { gte: updatedAfter } },
            { createdAt: { gte: updatedAfter } },
          ],
        },
        include: {
          membership: {
            include: {
              church: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      });

      // Transform to mobile format (excluding sensitive data)
      const mobileMembers: MobileMember[] = members.map(member => ({
        id: member.id,
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName,
        profileImage: member.profileImage,
        roles: member.roles,
        churchId: member.membership?.church?.id || '',
        churchName: member.membership?.church?.name || '',
        isActive: member.isActive,
        createdAt: member.createdAt.toISOString(),
        updatedAt: member.updatedAt.toISOString(),
        // Contact info only for admins
        phone: hasMinRole(user.roles, 'ADMIN') ? member.phone : null,
      }));

      // Check if there are more members available
      const totalCount = await prisma.user.count({
        where: {
          ...tenantWhere,
          isActive: true,
          OR: [
            { updatedAt: { gte: updatedAfter } },
            { createdAt: { gte: updatedAfter } },
          ],
        },
      });

      const hasMore = offset + limit < totalCount;

      const response: MemberSyncResponse = {
        members: mobileMembers,
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