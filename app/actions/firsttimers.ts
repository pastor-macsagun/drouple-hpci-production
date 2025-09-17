'use server'

import { auth } from '@/lib/auth'
import { prisma as db } from '@/lib/prisma'
import { UserRole, PathwayType, EnrollmentStatus, BelieverStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createFirstTimerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  assignedVipId: z.string().optional(),
  notes: z.string().optional(),
})

export async function getFirstTimers() {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Unauthorized')
  
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, tenantId: true }
  })
  
  if (!user) throw new Error('User not found')
  
  // Check if user has VIP access
  const hasVipAccess = [
    UserRole.SUPER_ADMIN,
    UserRole.PASTOR,
    UserRole.ADMIN,
    UserRole.VIP
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ].includes(user.role as any)
  
  if (!hasVipAccess) {
    throw new Error('Access denied. VIP role or higher required.')
  }

  const firstTimers = await db.firstTimer.findMany({
    where: user.role === UserRole.SUPER_ADMIN 
      ? {} 
      : { member: { tenantId: user.tenantId } },
    include: {
      member: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          pathwayEnrollments: {
            where: {
              pathway: { type: PathwayType.ROOTS }
            },
            select: {
              status: true,
              completedAt: true
            }
          },
          memberships: {
            select: {
              id: true,
              localChurchId: true,
              believerStatus: true
            }
          }
        }
      },
      assignedVip: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return firstTimers
}

export async function createFirstTimer(data: z.infer<typeof createFirstTimerSchema>) {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Unauthorized')
  
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, tenantId: true }
  })
  
  if (!user) throw new Error('User not found')
  
  // Check if user has VIP access
  const hasVipAccess = [
    UserRole.SUPER_ADMIN,
    UserRole.PASTOR,
    UserRole.ADMIN,
    UserRole.VIP
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ].includes(user.role as any)
  
  if (!hasVipAccess) {
    throw new Error('Access denied. VIP role or higher required.')
  }
  
  const validated = createFirstTimerSchema.parse(data)
  
  // Check if email already exists
  const existingUser = await db.user.findUnique({
    where: { email: validated.email }
  })
  
  if (existingUser) {
    throw new Error('A user with this email already exists')
  }
  
  // Create the member and first timer in a transaction
  const result = await db.$transaction(async (tx) => {
    // Create the member account
    const member = await tx.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        role: UserRole.MEMBER,
        isNewBeliever: true,
        tenantId: user.tenantId,
      }
    })
    
    // Create the first timer record
    const firstTimer = await tx.firstTimer.create({
      data: {
        memberId: member.id,
        assignedVipId: validated.assignedVipId,
        notes: validated.notes,
      },
      include: {
        member: true,
        assignedVip: true
      }
    })
    
    // Auto-enroll in ROOTS pathway
    const rootsPathway = await tx.pathway.findFirst({
      where: {
        type: PathwayType.ROOTS,
        tenantId: user.tenantId!,
        isActive: true
      }
    })
    
    if (rootsPathway) {
      await tx.pathwayEnrollment.create({
        data: {
          pathwayId: rootsPathway.id,
          userId: member.id,
          status: EnrollmentStatus.ENROLLED
        }
      })
    }
    
    return firstTimer
  })
  
  revalidatePath('/vip/firsttimers')
  return result
}

export async function updateFirstTimer(
  id: string,
  updates: {
    gospelShared?: boolean
    rootsCompleted?: boolean
    notes?: string
    assignedVipId?: string | null
  }
) {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Unauthorized')
  
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, tenantId: true }
  })
  
  if (!user) throw new Error('User not found')
  
  // Check if user has VIP access
  const hasVipAccess = [
    UserRole.SUPER_ADMIN,
    UserRole.PASTOR,
    UserRole.ADMIN,
    UserRole.VIP
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ].includes(user.role as any)
  
  if (!hasVipAccess) {
    throw new Error('Access denied. VIP role or higher required.')
  }
  
  // Verify the first timer belongs to the user's tenant
  const firstTimer = await db.firstTimer.findUnique({
    where: { id },
    include: { member: true }
  })
  
  if (!firstTimer) {
    throw new Error('First timer not found')
  }
  
  if (user.role !== UserRole.SUPER_ADMIN && firstTimer.member.tenantId !== user.tenantId) {
    throw new Error('Access denied')
  }
  
  // Update the first timer
  const updated = await db.firstTimer.update({
    where: { id },
    data: updates,
    include: {
      member: true,
      assignedVip: true
    }
  })
  
  // If ROOTS is marked as completed, update the pathway enrollment
  if (updates.rootsCompleted === true) {
    const rootsEnrollment = await db.pathwayEnrollment.findFirst({
      where: {
        userId: firstTimer.memberId,
        pathway: { type: PathwayType.ROOTS }
      }
    })
    
    if (rootsEnrollment && rootsEnrollment.status !== EnrollmentStatus.COMPLETED) {
      await db.pathwayEnrollment.update({
        where: { id: rootsEnrollment.id },
        data: {
          status: EnrollmentStatus.COMPLETED,
          completedAt: new Date()
        }
      })
    }
  }
  
  revalidatePath('/vip/firsttimers')
  return updated
}

export async function deleteFirstTimer(id: string) {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Unauthorized')
  
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, tenantId: true }
  })
  
  if (!user) throw new Error('User not found')
  
  // Only SUPER_ADMIN and ADMIN can delete
  if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
    throw new Error('Access denied. Admin role required.')
  }
  
  // Verify the first timer belongs to the user's tenant
  const firstTimer = await db.firstTimer.findUnique({
    where: { id },
    include: { member: true }
  })
  
  if (!firstTimer) {
    throw new Error('First timer not found')
  }
  
  if (user.role !== UserRole.SUPER_ADMIN && firstTimer.member.tenantId !== user.tenantId) {
    throw new Error('Access denied')
  }
  
  // Delete the first timer (but keep the member)
  await db.firstTimer.delete({
    where: { id }
  })
  
  revalidatePath('/vip/firsttimers')
  return { success: true }
}

// US-VIP-006: Complete believer status management
export async function setBelieverStatus(
  membershipId: string, 
  status: BelieverStatus,
  note?: string
) {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Unauthorized')
  
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, tenantId: true, id: true }
  })
  
  if (!user) throw new Error('User not found')
  
  // Check if user has VIP access
  const hasVipAccess = [
    UserRole.SUPER_ADMIN,
    UserRole.PASTOR,
    UserRole.ADMIN,
    UserRole.VIP
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ].includes(user.role as any)
  
  if (!hasVipAccess) {
    throw new Error('Access denied. VIP role or higher required.')
  }
  
  // Get the membership to verify it exists and check tenant
  const membership = await db.membership.findUnique({
    where: { id: membershipId },
    include: { 
      user: true,
      localChurch: true 
    }
  })
  
  if (!membership) {
    throw new Error('Membership not found')
  }
  
  // Check tenant isolation
  if (user.role !== UserRole.SUPER_ADMIN && membership.user.tenantId !== user.tenantId) {
    throw new Error('Access denied')
  }
  
  const previousStatus = membership.believerStatus
  
  // Update the membership believer status (preserves ROOTS progress)
  const updated = await db.membership.update({
    where: { id: membershipId },
    data: {
      believerStatus: status,
      updatedAt: new Date()
    }
  })
  
  // Create audit log for status change
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: 'BELIEVER_STATUS_CHANGE',
      entity: 'Membership',
      entityId: membershipId,
      localChurchId: membership.localChurchId,
      meta: {
        previousStatus,
        newStatus: status,
        userId: membership.userId,
        note
      }
    }
  })
  
  revalidatePath('/vip/firsttimers')
  return updated
}

// Backward compatibility function
export async function markBelieverInactive(membershipId: string) {
  return setBelieverStatus(membershipId, BelieverStatus.INACTIVE)
}

export async function getVipTeamMembers() {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Unauthorized')
  
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, tenantId: true }
  })
  
  if (!user) throw new Error('User not found')
  
  // Get all VIP team members for assignment dropdown
  const vipMembers = await db.user.findMany({
    where: {
      role: { in: [UserRole.VIP, UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN] },
      ...(user.role !== UserRole.SUPER_ADMIN && { tenantId: user.tenantId })
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    },
    orderBy: { name: 'asc' }
  })
  
  return vipMembers
}

// US-VIP-003: Enhanced filtering for VIP dashboard
export async function getFirstTimersWithFilters(filters?: {
  assignmentFilter?: 'all' | 'assigned' | 'unassigned' | 'my_assigned'
  statusFilter?: BelieverStatus | 'all'
  currentUserId?: string
}) {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Unauthorized')
  
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, tenantId: true, id: true }
  })
  
  if (!user) throw new Error('User not found')
  
  const hasVipAccess = [
    UserRole.SUPER_ADMIN,
    UserRole.PASTOR,
    UserRole.ADMIN,
    UserRole.VIP
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ].includes(user.role as any)
  
  if (!hasVipAccess) {
    throw new Error('Access denied. VIP role or higher required.')
  }

  // Build filter conditions
  const whereConditions: Record<string, unknown> = {
    ...(user.role !== UserRole.SUPER_ADMIN && {
      member: { tenantId: user.tenantId }
    })
  }

  // Assignment filters
  if (filters?.assignmentFilter) {
    switch (filters.assignmentFilter) {
      case 'assigned':
        whereConditions.assignedVipId = { not: null }
        break
      case 'unassigned':
        whereConditions.assignedVipId = null
        break
      case 'my_assigned':
        whereConditions.assignedVipId = user.id
        break
      // 'all' adds no filter
    }
  }

  const firstTimers = await db.firstTimer.findMany({
    where: whereConditions,
    include: {
      member: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          pathwayEnrollments: {
            where: {
              pathway: { type: PathwayType.ROOTS }
            },
            select: {
              status: true,
              completedAt: true
            }
          },
          memberships: {
            select: {
              id: true,
              localChurchId: true,
              believerStatus: true
            }
          }
        }
      },
      assignedVip: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Apply status filter after query (since believerStatus is on membership)
  let filteredTimers = firstTimers
  if (filters?.statusFilter && filters.statusFilter !== 'all') {
    filteredTimers = firstTimers.filter(ft => 
      ft.member.memberships.some(m => m.believerStatus === filters.statusFilter)
    )
  }

  return filteredTimers
}

// US-VIP-008: Admin reporting analytics
export async function getVipAnalytics() {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Unauthorized')
  
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, tenantId: true }
  })
  
  if (!user) throw new Error('User not found')
  
  // Only ADMIN+ roles can access analytics
  const hasAdminAccess = [
    UserRole.SUPER_ADMIN,
    UserRole.PASTOR,
    UserRole.ADMIN
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ].includes(user.role as any)
  
  if (!hasAdminAccess) {
    throw new Error('Access denied. Admin role or higher required.')
  }

  // Parallel queries for analytics
  const [
    totalFirstTimers,
    gospelSharedCount,
    rootsCompletedCount,
    statusBreakdown,
    assignmentBreakdown
  ] = await Promise.all([
    // Total first-timers
    db.firstTimer.count({
      where: user.role !== UserRole.SUPER_ADMIN 
        ? { member: { tenantId: user.tenantId } }
        : {}
    }),

    // Gospel shared count
    db.firstTimer.count({
      where: {
        gospelShared: true,
        ...(user.role !== UserRole.SUPER_ADMIN && {
          member: { tenantId: user.tenantId }
        })
      }
    }),

    // ROOTS completed count
    db.firstTimer.count({
      where: {
        rootsCompleted: true,
        ...(user.role !== UserRole.SUPER_ADMIN && {
          member: { tenantId: user.tenantId }
        })
      }
    }),

    // Believer status breakdown
    db.membership.groupBy({
      by: ['believerStatus'],
      _count: { believerStatus: true },
      where: {
        isNewBeliever: true,
        ...(user.role !== UserRole.SUPER_ADMIN && { 
          user: { tenantId: user.tenantId }
        })
      }
    }),

    // Assignment breakdown  
    db.firstTimer.groupBy({
      by: ['assignedVipId'],
      _count: { assignedVipId: true },
      where: user.role !== UserRole.SUPER_ADMIN 
        ? { member: { tenantId: user.tenantId } }
        : {}
    })
  ])

  return {
    totalFirstTimers,
    gospelSharedCount,
    rootsCompletedCount,
    gospelSharedRate: totalFirstTimers > 0 ? (gospelSharedCount / totalFirstTimers * 100) : 0,
    rootsCompletionRate: totalFirstTimers > 0 ? (rootsCompletedCount / totalFirstTimers * 100) : 0,
    statusBreakdown,
    assignmentBreakdown: {
      assigned: assignmentBreakdown.filter(a => a.assignedVipId !== null).reduce((sum, a) => sum + a._count.assignedVipId, 0),
      unassigned: assignmentBreakdown.find(a => a.assignedVipId === null)?._count.assignedVipId || 0
    }
  }
}