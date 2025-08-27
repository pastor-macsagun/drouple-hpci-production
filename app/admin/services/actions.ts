'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { hasMinRole } from '@/lib/rbac'
import { UserRole } from '@prisma/client'
import { createTenantWhereClause } from '@/lib/rbac'

export async function listServices({ 
  churchId,
  cursor,
  take = 20 
}: { 
  churchId?: string
  cursor?: string
  take?: number 
} = {}) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!hasMinRole(session.user.role, UserRole.ADMIN)) {
      return { success: false, error: 'Unauthorized' }
    }

    // Apply tenant scoping - Service model uses localChurchId field
    const whereClause = await createTenantWhereClause(
      session.user, 
      {}, 
      churchId,
      'localChurchId' // Service model uses localChurchId instead of tenantId
    )

    const services = await prisma.service.findMany({
      where: whereClause,
      include: {
        localChurch: true,
        _count: {
          select: {
            checkins: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: take + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1
      })
    })

    const hasMore = services.length > take
    const items = services.slice(0, take)
    const nextCursor = hasMore ? items[items.length - 1].id : null

    return { 
      success: true, 
      data: { 
        items, 
        nextCursor,
        hasMore 
      } 
    }
  } catch (error) {
    console.error('List services error:', error)
    return { success: false, error: 'Failed to list services' }
  }
}

export async function createService({
  date,
  localChurchId
}: {
  date: Date
  localChurchId: string
}) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!hasMinRole(session.user.role, UserRole.ADMIN)) {
      return { success: false, error: 'Unauthorized' }
    }

    if (session.user.role !== 'SUPER_ADMIN' && localChurchId !== session.user.tenantId) {
      return { success: false, error: 'Cannot create service for another church' }
    }

    const service = await prisma.service.create({
      data: {
        date,
        localChurchId
      },
      include: {
        localChurch: true,
        _count: {
          select: {
            checkins: true
          }
        }
      }
    })

    revalidatePath('/admin/services')
    return { success: true, data: service }
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any)?.code === 'P2002') {
      return { success: false, error: 'Service already exists for this date' }
    }
    console.error('Create service error:', error)
    return { success: false, error: 'Failed to create service' }
  }
}

export async function deleteService({ id }: { id: string }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!hasMinRole(session.user.role, UserRole.ADMIN)) {
      return { success: false, error: 'Unauthorized' }
    }

    const service = await prisma.service.findUnique({
      where: { id },
      select: { localChurchId: true }
    })

    if (!service) {
      return { success: false, error: 'Service not found' }
    }

    if (session.user.role !== 'SUPER_ADMIN' && service.localChurchId !== session.user.tenantId) {
      return { success: false, error: 'Cannot delete service from another church' }
    }

    await prisma.service.delete({
      where: { id }
    })

    revalidatePath('/admin/services')
    return { success: true }
  } catch (error) {
    console.error('Delete service error:', error)
    return { success: false, error: 'Failed to delete service' }
  }
}

export async function getServiceAttendance({ serviceId }: { serviceId: string }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!hasMinRole(session.user.role, UserRole.ADMIN)) {
      return { success: false, error: 'Unauthorized' }
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { localChurchId: true }
    })

    if (!service) {
      return { success: false, error: 'Service not found' }
    }

    if (session.user.role !== 'SUPER_ADMIN' && service.localChurchId !== session.user.tenantId) {
      return { success: false, error: 'Cannot view attendance for another church' }
    }

    // Optimize: Single query with aggregation instead of separate count/findMany
    const checkins = await prisma.checkin.findMany({
      where: { serviceId },
      select: {
        id: true,
        checkedInAt: true,
        isNewBeliever: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        checkedInAt: 'desc'
      },
      take: 10
    })
    
    // Get count with a separate optimized query
    const count = await prisma.checkin.count({
      where: { serviceId }
    })

    return { success: true, data: { count, checkins } }
  } catch (error) {
    console.error('Get service attendance error:', error)
    return { success: false, error: 'Failed to get attendance' }
  }
}

export async function exportAttendanceCsv({ serviceId }: { serviceId: string }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new Response('Not authenticated', { status: 401 })
    }

    if (!hasMinRole(session.user.role, UserRole.ADMIN)) {
      return new Response('Unauthorized', { status: 403 })
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        date: true,
        localChurchId: true,
        localChurch: {
          select: {
            id: true,
            name: true
          }
        },
        checkins: {
          select: {
            id: true,
            checkedInAt: true,
            isNewBeliever: true,
            user: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
          },
          orderBy: {
            checkedInAt: 'asc'
          }
        }
      }
    })

    if (!service) {
      return new Response('Service not found', { status: 404 })
    }

    if (session.user.role !== 'SUPER_ADMIN' && service.localChurchId !== session.user.tenantId) {
      return new Response('Cannot export attendance for another church', { status: 403 })
    }

    const csv = [
      ['Service Date', 'Church', 'Total Attendance', ''],
      [service.date.toLocaleDateString(), service.localChurch.name, service.checkins.length.toString(), ''],
      [],
      ['Name', 'Email', 'Phone', 'Check-in Time', 'New Believer'],
      ...service.checkins.map(checkin => [
        checkin.user.name || '',
        checkin.user.email || '',
        checkin.user.phone || '',
        checkin.checkedInAt.toLocaleString(),
        checkin.isNewBeliever ? 'Yes' : 'No'
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="attendance-${service.date.toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Export attendance CSV error:', error)
    return new Response('Failed to export attendance', { status: 500 })
  }
}

export async function getLocalChurches() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!hasMinRole(session.user.role, UserRole.ADMIN)) {
      return { success: false, error: 'Unauthorized' }
    }

    const churches = await prisma.localChurch.findMany({
      where: session.user.role === 'SUPER_ADMIN' 
        ? {} 
        : { id: session.user.tenantId || undefined },
      select: {
        id: true,
        name: true
      },
      orderBy: { name: 'asc' }
    })

    return { success: true, data: churches }
  } catch (error) {
    console.error('Get local churches error:', error)
    return { success: false, error: 'Failed to get churches' }
  }
}