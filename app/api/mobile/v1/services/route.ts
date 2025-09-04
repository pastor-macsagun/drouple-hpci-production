/**
 * Mobile Services Endpoint
 * GET /api/mobile/v1/services
 * List active services for check-in with tenant isolation
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withMobileAuth, createMobileResponse, createMobileTenantWhere, getAccessibleChurchIds } from '@/lib/mobile-auth';
import { ServiceSchema, PaginationRequestSchema } from '@drouple/contracts';
import { z } from 'zod';

const ServicesQuerySchema = PaginationRequestSchema.extend({
  churchId: z.string().optional(),
  activeOnly: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  return withMobileAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const query = ServicesQuerySchema.parse({
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '20'),
        search: searchParams.get('search') || undefined,
        activeOnly: searchParams.get('activeOnly') !== 'false',
        churchId: searchParams.get('churchId') || undefined,
      });

      // Get accessible church IDs
      const accessibleChurchIds = getAccessibleChurchIds(user);
      
      // Build where clause with tenant isolation
      const where = {
        ...createMobileTenantWhere(user),
        ...(query.activeOnly && { isActive: true }),
        ...(query.churchId && { 
          churchId: query.churchId,
          // Validate user can access this church
          ...(accessibleChurchIds.length > 0 && {
            churchId: { in: accessibleChurchIds }
          })
        }),
        ...(query.search && {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ],
        }),
      };

      // Get services with pagination
      const [services, total] = await Promise.all([
        prisma.service.findMany({
          where,
          select: {
            id: true,
            name: true,
            description: true,
            date: true,
            churchId: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                checkins: true,
              }
            },
          },
          orderBy: { date: 'desc' },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
        prisma.service.count({ where }),
      ]);

      // Transform to contract format
      const formattedServices = services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description || undefined,
        date: service.date.toISOString(),
        churchId: service.churchId,
        isActive: service.isActive,
        attendeeCount: service._count.checkins,
        createdAt: service.createdAt.toISOString(),
        updatedAt: service.updatedAt.toISOString(),
      }));

      // Validate against schema
      const validatedServices = z.array(ServiceSchema).parse(formattedServices);

      const response = {
        items: validatedServices,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
          hasNext: query.page * query.limit < total,
          hasPrev: query.page > 1,
        },
      };

      return createMobileResponse(response);

    } catch (error) {
      console.error('Mobile services list error:', error);
      return createMobileResponse(
        { error: 'Failed to fetch services' },
        500
      );
    }
  });
}