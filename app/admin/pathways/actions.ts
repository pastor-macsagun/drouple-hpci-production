'use server'

import { prisma } from '@/lib/prisma'
import { PathwayType, UserRole } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { hasMinRole } from '@/lib/rbac'

export async function createPathway(data: {
  name: string
  description?: string
  type: PathwayType
  tenantId: string
  isActive?: boolean
}) {
  const pathway = await prisma.pathway.create({
    data: {
      name: data.name,
      description: data.description,
      type: data.type,
      tenantId: data.tenantId,
      isActive: data.isActive ?? true,
    },
  })

  revalidatePath('/admin/pathways')
  return pathway
}

export async function updatePathway(
  id: string,
  data: {
    name?: string
    description?: string
    type?: PathwayType
    isActive?: boolean
  }
) {
  const pathway = await prisma.pathway.update({
    where: { id },
    data,
  })

  revalidatePath('/admin/pathways')
  revalidatePath(`/admin/pathways/${id}`)
  return pathway
}

export async function deletePathway(id: string) {
  await prisma.pathway.delete({
    where: { id },
  })

  revalidatePath('/admin/pathways')
}

export async function createStep(data: {
  pathwayId: string
  name: string
  description?: string
  orderIndex: number
}) {
  const step = await prisma.pathwayStep.create({
    data,
  })

  revalidatePath('/admin/pathways')
  revalidatePath(`/admin/pathways/${data.pathwayId}/steps`)
  return step
}

export async function updateStep(
  id: string,
  data: {
    name?: string
    description?: string
    orderIndex?: number
  }
) {
  const step = await prisma.pathwayStep.update({
    where: { id },
    data,
  })

  revalidatePath('/admin/pathways')
  return step
}

export async function deleteStep(id: string) {
  const step = await prisma.pathwayStep.findUnique({
    where: { id },
    select: { pathwayId: true },
  })

  await prisma.pathwayStep.delete({
    where: { id },
  })

  if (step) {
    revalidatePath('/admin/pathways')
    revalidatePath(`/admin/pathways/${step.pathwayId}/steps`)
  }
}

export async function markStepComplete(
  stepId: string,
  userId: string,
  completedBy: string,
  notes?: string
) {
  const existing = await prisma.pathwayProgress.findFirst({
    where: { stepId, userId },
  })

  if (existing) {
    return existing
  }

  const progress = await prisma.pathwayProgress.create({
    data: {
      stepId,
      userId,
      completedBy,
      notes,
    },
  })

  revalidatePath('/admin/pathways')
  revalidatePath('/pathways')
  return progress
}

export async function enrollUser(
  userId: string,
  pathwayId: string
) {
  const existing = await prisma.pathwayEnrollment.findFirst({
    where: { userId, pathwayId },
  })

  if (existing) {
    return existing
  }

  const enrollment = await prisma.pathwayEnrollment.create({
    data: {
      userId,
      pathwayId,
    },
  })

  revalidatePath('/admin/pathways')
  revalidatePath('/pathways')
  return enrollment
}

// US-PWY-004: Leader verifies step completion with notes
export async function verifyStepCompletion(
  enrollmentId: string,
  stepId: string,
  notes?: string
) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  })

  if (!user || !hasMinRole(user.role, UserRole.LEADER)) {
    throw new Error('Insufficient privileges - Leader access required')
  }

  // Verify enrollment exists and get user info
  const enrollment = await prisma.pathwayEnrollment.findUnique({
    where: { id: enrollmentId },
    include: { user: true, pathway: true }
  })

  if (!enrollment) {
    throw new Error('Enrollment not found')
  }

  // Check for existing progress
  const existing = await prisma.pathwayProgress.findFirst({
    where: { stepId, userId: enrollment.userId },
  })

  if (existing) {
    return existing
  }

  // Create progress with leader verification
  const progress = await prisma.pathwayProgress.create({
    data: {
      stepId,
      userId: enrollment.userId,
      completedBy: user.id,
      notes: notes || `Verified by ${user.name || user.email}`,
    },
  })

  // Create audit log entry
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: 'VERIFY_STEP_COMPLETION',
      entity: 'PathwayProgress',
      entityId: progress.id,
      localChurchId: user.tenantId,
      meta: {
        pathwayId: enrollment.pathwayId,
        stepId,
        userId: enrollment.userId,
        notes
      }
    }
  })

  revalidatePath('/admin/pathways')
  revalidatePath('/pathways')
  return progress
}

// US-PWY-008: Admin analytics
export async function getPathwayAnalytics(tenantId: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  })

  if (!user || !hasMinRole(user.role, UserRole.ADMIN)) {
    throw new Error('Admin access required')
  }

  // Parallel queries for analytics
  const [
    totalEnrollments,
    activeEnrollments, 
    completedEnrollments,
    pathwayBreakdown,
    progressBreakdown,
    recentCompletions
  ] = await Promise.all([
    // Total enrollments
    prisma.pathwayEnrollment.count({
      where: { pathway: { tenantId } }
    }),

    // Active enrollments
    prisma.pathwayEnrollment.count({
      where: { 
        pathway: { tenantId },
        status: 'ENROLLED'
      }
    }),

    // Completed enrollments
    prisma.pathwayEnrollment.count({
      where: { 
        pathway: { tenantId },
        status: 'COMPLETED'
      }
    }),

    // Enrollments per pathway
    prisma.pathway.findMany({
      where: { tenantId },
      select: {
        name: true,
        type: true,
        _count: {
          select: { enrollments: true }
        }
      }
    }),

    // Progress breakdown
    prisma.pathwayProgress.groupBy({
      by: ['stepId'],
      _count: { stepId: true },
      where: {
        step: { pathway: { tenantId } }
      }
    }),

    // Recent completions (last 30 days)
    prisma.pathwayEnrollment.findMany({
      where: {
        pathway: { tenantId },
        status: 'COMPLETED',
        completedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        pathway: { select: { name: true, type: true } },
        user: { select: { name: true, email: true } }
      },
      orderBy: { completedAt: 'desc' },
      take: 20
    })
  ])

  return {
    totalEnrollments,
    activeEnrollments,
    completedEnrollments,
    completionRate: totalEnrollments > 0 ? (completedEnrollments / totalEnrollments * 100) : 0,
    pathwayBreakdown,
    progressBreakdown,
    recentCompletions
  }
}

// US-PWY-007: Detect pathway completion and create recommendations
export async function detectPathwayCompletion(userId: string, pathwayId: string) {
  // Get pathway with all steps
  const pathway = await prisma.pathway.findUnique({
    where: { id: pathwayId },
    include: { 
      steps: { orderBy: { orderIndex: 'asc' } }
    }
  })

  if (!pathway) return false

  // Get user progress for this pathway
  const userProgress = await prisma.pathwayProgress.findMany({
    where: { 
      userId,
      step: { pathwayId }
    }
  })

  const completedSteps = userProgress.length
  const totalSteps = pathway.steps.length

  // Check if pathway is complete
  if (completedSteps === totalSteps && totalSteps > 0) {
    // Mark enrollment as completed
    await prisma.pathwayEnrollment.updateMany({
      where: { userId, pathwayId, status: 'ENROLLED' },
      data: { 
        status: 'COMPLETED',
        completedAt: new Date()
      }
    })

    // Create recommendation for next pathway
    if (pathway.type === 'ROOTS') {
      // Recommend VINES after completing ROOTS
      const vinesPathway = await prisma.pathway.findFirst({
        where: { 
          type: 'VINES', 
          tenantId: pathway.tenantId,
          isActive: true
        }
      })

      if (vinesPathway) {
        // TODO: Implement notification system
        console.log(`User ${userId} completed ROOTS - recommend VINES pathway`)
        return { completed: true, recommendation: vinesPathway }
      }
    }

    return { completed: true, recommendation: null }
  }

  return { completed: false, recommendation: null }
}

// US-PWY-006: Mark attendance-based steps as completed
export async function markAttendanceStepComplete(
  eventId: string,
  userId: string,
  pathwayId: string
) {
  // Find attendance-required steps for this pathway
  const attendanceSteps = await prisma.pathwayStep.findMany({
    where: {
      pathwayId,
      requiresAttendance: true
    }
  })

  if (attendanceSteps.length === 0) return

  // Mark attendance steps as completed (simplified - in real app, you'd map specific events to steps)
  for (const step of attendanceSteps) {
    const existing = await prisma.pathwayProgress.findFirst({
      where: { stepId: step.id, userId }
    })

    if (!existing) {
      await prisma.pathwayProgress.create({
        data: {
          stepId: step.id,
          userId,
          notes: `Auto-completed via attendance at event ${eventId}`
        }
      })
    }
  }

  // Check for pathway completion after marking attendance
  await detectPathwayCompletion(userId, pathwayId)
}