import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { getAccessibleChurchIds } from '@/lib/rbac';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get accessible churches based on user role and tenant
    const accessibleChurchIds = await getAccessibleChurchIds(
      session.user.id,
      session.user.role,
      session.user.tenantId
    );

    // Get current active services
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const activeServices = await prisma.service.findMany({
      where: {
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
        churchId: {
          in: accessibleChurchIds,
        },
      },
      include: {
        _count: {
          select: {
            checkins: true,
          },
        },
        church: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Transform to live counts format
    const serviceCounts = activeServices.map(service => ({
      serviceId: service.id,
      serviceName: service.name,
      churchId: service.churchId,
      churchName: service.church.name,
      date: service.date,
      currentCheckins: service._count.checkins,
      capacity: service.capacity,
      isActive: true,
      updatedAt: new Date(),
    }));

    // Get overall stats for accessible churches
    const totalCheckins = serviceCounts.reduce((sum, service) => sum + service.currentCheckins, 0);
    const totalServices = serviceCounts.length;

    return NextResponse.json({
      success: true,
      data: {
        services: serviceCounts,
        summary: {
          totalServices,
          totalCheckins,
          accessibleChurches: accessibleChurchIds.length,
          timestamp: new Date(),
        },
      },
    });
  } catch (error) {
    console.error('Live service counts error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve live service counts' },
      { status: 500 }
    );
  }
}