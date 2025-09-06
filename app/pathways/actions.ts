'use server'

import { prisma } from '@/lib/prisma'
import { PathwayType } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { detectPathwayCompletion } from '@/app/admin/pathways/actions'

// US-PWY-003: Member enroll in VINES pathway
export async function enrollInPathway(pathwayId: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Verify pathway exists and is active
  const pathway = await prisma.pathway.findUnique({
    where: { id: pathwayId }
  })

  if (!pathway || !pathway.isActive) {
    throw new Error('Pathway not available for enrollment')
  }

  // Only allow manual enrollment in VINES pathways
  if (pathway.type !== PathwayType.VINES) {
    throw new Error('Manual enrollment only allowed for VINES pathways')
  }

  // Check for existing enrollment
  const existingEnrollment = await prisma.pathwayEnrollment.findFirst({
    where: { userId: user.id, pathwayId }
  })

  if (existingEnrollment) {
    return { success: true, data: existingEnrollment }
  }

  // Create enrollment
  const enrollment = await prisma.pathwayEnrollment.create({
    data: {
      userId: user.id,
      pathwayId,
    },
  })

  revalidatePath('/pathways')
  return { success: true, data: enrollment }
}

// US-PWY-003: Mark step as complete (self-completion for non-leader-required steps)
export async function markStepComplete(stepId: string, enrollmentId: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Verify enrollment belongs to user
  const enrollment = await prisma.pathwayEnrollment.findUnique({
    where: { id: enrollmentId },
    include: { pathway: true }
  })

  if (!enrollment || enrollment.userId !== user.id) {
    throw new Error('Enrollment not found or unauthorized')
  }

  // Get step info
  const step = await prisma.pathwayStep.findUnique({
    where: { id: stepId }
  })

  if (!step) {
    throw new Error('Step not found')
  }

  // Don't allow self-completion of attendance-required steps
  if (step.requiresAttendance) {
    throw new Error('This step requires attendance verification')
  }

  // Check for existing progress
  const existing = await prisma.pathwayProgress.findFirst({
    where: { stepId, userId: user.id },
  })

  if (existing) {
    return { success: true, data: existing }
  }

  // Create progress
  const progress = await prisma.pathwayProgress.create({
    data: {
      stepId,
      userId: user.id,
      notes: 'Self-completed by member'
    },
  })

  // Check for pathway completion
  await detectPathwayCompletion(user.id, enrollment.pathwayId)

  revalidatePath('/pathways')
  return { success: true, data: progress }
}

// Get user's pathway enrollments and progress
export async function getMyPathways() {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const enrollments = await prisma.pathwayEnrollment.findMany({
    where: { userId: user.id },
    include: {
      pathway: {
        include: {
          steps: { 
            orderBy: { orderIndex: 'asc' },
            include: {
              progress: {
                where: { userId: user.id }
              }
            }
          }
        }
      }
    },
    orderBy: { enrolledAt: 'desc' }
  })

  return enrollments.map(enrollment => {
    const completedSteps = enrollment.pathway.steps.filter(step => step.progress.length > 0).length
    const totalSteps = enrollment.pathway.steps.length
    const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

    return {
      enrollment,
      completedSteps,
      totalSteps,
      progressPercentage,
      steps: enrollment.pathway.steps.map(step => ({
        ...step,
        completed: step.progress.length > 0,
        completedAt: step.progress[0]?.completedAt || null,
        notes: step.progress[0]?.notes || null
      }))
    }
  })
}

// Get available pathways for enrollment
export async function getAvailablePathways() {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Get all active pathways for user's tenant (excluding ROOTS which is auto-enrollment only)
  const availablePathways = await prisma.pathway.findMany({
    where: {
      tenantId: user.tenantId!,
      isActive: true,
      type: { not: PathwayType.ROOTS },
    },
  })

  // Get user's enrollments to filter out already enrolled pathways
  const userEnrollments = await prisma.pathwayEnrollment.findMany({
    where: { userId: user.id },
    select: { pathwayId: true }
  })

  const enrolledPathwayIds = new Set(userEnrollments.map(e => e.pathwayId))

  return availablePathways.filter(pathway => !enrolledPathwayIds.has(pathway.id))
}