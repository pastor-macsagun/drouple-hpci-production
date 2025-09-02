'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { startOfDay, endOfDay } from 'date-fns'
import { z } from 'zod'
import { hasMinRole, createTenantWhereClause } from '@/lib/rbac'
import { UserRole } from '@prisma/client'

const checkInSchema = z.object({
  serviceId: z.string().min(1),
  isNewBeliever: z.boolean().default(false)
})

const createServiceSchema = z.object({
  date: z.date()
})

export async function getTodayService() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const today = new Date()
    const dayStart = startOfDay(today)
    const dayEnd = endOfDay(today)

    // Apply proper tenant isolation for service lookup
    const whereClause = await createTenantWhereClause(
      session.user,
      {
        date: {
          gte: dayStart,
          lte: dayEnd
        }
      },
      undefined,
      'localChurchId' // Service model uses localChurchId field
    )

    const service = await prisma.service.findFirst({
      where: whereClause,
      include: {
        localChurch: true,
        _count: {
          select: {
            checkins: true
          }
        }
      }
    })

    return { success: true, data: service }
  } catch (error) {
    console.error('Get today service error:', error)
    return { success: false, error: 'Failed to get service' }
  }
}

/**
 * Handles Sunday service check-in with auto-enrollment for new believers.
 * Implements duplicate prevention and ROOTS pathway enrollment business logic.
 * 
 * @param formData Form data containing serviceId and isNewBeliever flag
 * @returns Success/failure result with duplicate prevention
 */
export async function checkIn(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    // Validate input
    const validatedData = checkInSchema.parse({
      serviceId: formData.get('serviceId'),
      isNewBeliever: formData.get('isNewBeliever') === 'true'
    })

    const { serviceId, isNewBeliever } = validatedData

    // Optimize: Combine service validation with tenant check
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        localChurchId: session.user.tenantId || undefined
      },
      select: { 
        id: true,
        localChurchId: true 
      }
    })

    if (!service) {
      return { success: false, error: 'Service not found or access denied' }
    }

    // Check if already checked in
    const existingCheckin = await prisma.checkin.findUnique({
      where: {
        serviceId_userId: {
          serviceId,
          userId: session.user.id
        }
      }
    })

    if (existingCheckin) {
      return { success: false, error: 'Already checked in for this service' }
    }

    // Create check-in
    const checkin = await prisma.checkin.create({
      data: {
        serviceId,
        userId: session.user.id,
        isNewBeliever
      }
    })

    // Business logic: New believer auto-enrollment in discipleship pathway
    if (isNewBeliever) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { isNewBeliever: true }
      })

      // Auto-enroll in ROOTS pathway for discipleship tracking
      // ROOTS is designed for new believers to complete basic Christian foundations
      const rootsPathway = await prisma.pathway.findFirst({
        where: {
          type: 'ROOTS',
          tenantId: session.user.tenantId || undefined
        }
      })

      if (rootsPathway) {
        await prisma.pathwayEnrollment.create({
          data: {
            pathwayId: rootsPathway.id,
            userId: session.user.id
          }
        }).catch(() => {
          // Graceful handling: Ignore duplicate enrollment attempts
        })
      }
    }

    revalidatePath('/checkin')
    revalidatePath('/admin/services')
    
    return { success: true, data: checkin }
  } catch (error: unknown) {
    console.error('Check-in error:', error)
    
    // Handle unique constraint violation
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return { success: false, error: 'Already checked in for this service' }
    }
    
    return { success: false, error: 'Failed to check in' }
  }
}

export async function getUserCheckin(serviceId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const checkin = await prisma.checkin.findUnique({
      where: {
        serviceId_userId: {
          serviceId,
          userId: session.user.id
        }
      }
    })

    return { success: true, data: checkin }
  } catch (error) {
    console.error('Get user checkin error:', error)
    return { success: false, error: 'Failed to get checkin status' }
  }
}

export async function getServiceAttendance(serviceId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Only admins can view attendance
    if (!hasMinRole(session.user.role, UserRole.ADMIN)) {
      return { success: false, error: 'Unauthorized' }
    }

    // Optimize: Single query with tenant filtering for attendance
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        ...(session.user.role !== 'SUPER_ADMIN' && {
          localChurchId: session.user.tenantId || undefined
        })
      },
      select: { 
        id: true,
        localChurchId: true 
      }
    })

    if (!service) {
      return { success: false, error: 'Service not found or access denied' }
    }

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
      }
    })

    return { success: true, data: checkins }
  } catch (error) {
    console.error('Get service attendance error:', error)
    return { success: false, error: 'Failed to get attendance' }
  }
}

export async function createService(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Validate input
    const validatedData = createServiceSchema.parse({
      date: new Date(formData.get('date') as string)
    })

    // Only admins can create services
    if (!hasMinRole(session.user.role, UserRole.ADMIN)) {
      return { success: false, error: 'Unauthorized' }
    }

    const service = await prisma.service.create({
      data: {
        date: validatedData.date,
        localChurchId: session.user.tenantId!
      }
    })

    revalidatePath('/admin/services')
    return { success: true, data: service }
  } catch (error) {
    console.error('Create service error:', error)
    return { success: false, error: 'Failed to create service' }
  }
}