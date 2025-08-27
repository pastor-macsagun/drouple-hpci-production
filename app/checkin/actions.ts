'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { startOfDay, endOfDay } from 'date-fns'

export async function getTodayService() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const today = new Date()
    const dayStart = startOfDay(today)
    const dayEnd = endOfDay(today)

    // Get service for today in user's local church
    const service = await prisma.service.findFirst({
      where: {
        date: {
          gte: dayStart,
          lte: dayEnd
        },
        localChurchId: session.user.tenantId || undefined
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

    return { success: true, data: service }
  } catch (error) {
    console.error('Get today service error:', error)
    return { success: false, error: 'Failed to get service' }
  }
}

export async function checkIn(serviceId: string, isNewBeliever = false) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
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

    // If new believer, update user profile and auto-enroll in ROOTS pathway
    if (isNewBeliever) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { isNewBeliever: true }
      })

      // Auto-enroll in ROOTS pathway if it exists
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
          // Ignore if already enrolled
        })
      }
    }

    revalidatePath('/checkin')
    revalidatePath('/admin/services')
    
    return { success: true, data: checkin }
  } catch (error: any) {
    console.error('Check-in error:', error)
    
    // Handle unique constraint violation
    if (error?.code === 'P2002') {
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
    if (!['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    const checkins = await prisma.checkin.findMany({
      where: { serviceId },
      include: {
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

export async function createService(date: Date) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Only admins can create services
    if (!['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    const service = await prisma.service.create({
      data: {
        date,
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