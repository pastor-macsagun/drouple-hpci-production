import { prisma } from '@/lib/prisma'
import { EnrollmentStatus } from '@prisma/client'

/**
 * Marks pathway step as complete and auto-completes pathway if all steps done.
 * Implements automatic pathway completion when final step is finished.
 * 
 * @param stepId ID of the step to mark complete
 * @param userId ID of the user completing the step  
 * @param completedBy Optional ID of leader/admin who verified completion
 * @param notes Optional completion notes
 * @returns PathwayProgress record
 */
export async function completeStep(
  stepId: string,
  userId: string,
  completedBy?: string,
  notes?: string
) {
  const step = await prisma.pathwayStep.findUnique({
    where: { id: stepId },
    select: { id: true, pathwayId: true },
  })

  if (!step) {
    throw new Error('Step not found')
  }

  const existingProgress = await prisma.pathwayProgress.findFirst({
    where: { stepId, userId },
  })

  if (existingProgress) {
    return existingProgress
  }

  const progress = await prisma.pathwayProgress.create({
    data: {
      stepId,
      userId,
      completedBy,
      notes,
    },
  })

  // Automatic pathway completion logic when all steps are finished
  const isComplete = await isPathwayComplete(step.pathwayId, userId)
  if (isComplete) {
    const enrollment = await prisma.pathwayEnrollment.findFirst({
      where: {
        pathwayId: step.pathwayId,
        userId,
        status: EnrollmentStatus.ENROLLED,
      },
    })

    if (enrollment) {
      await prisma.pathwayEnrollment.update({
        where: { id: enrollment.id },
        data: {
          status: EnrollmentStatus.COMPLETED,
          completedAt: new Date(),
        },
      })
    }
  }

  return progress
}

export async function getPathwayProgress(pathwayId: string, userId: string) {
  return await prisma.pathwayProgress.findMany({
    where: {
      userId,
      step: { pathwayId },
    },
    include: {
      step: true,
    },
    orderBy: { completedAt: 'asc' },
  })
}

export async function isPathwayComplete(pathwayId: string, userId: string) {
  const totalSteps = await prisma.pathwayStep.count({
    where: { pathwayId },
  })

  const completedSteps = await prisma.pathwayProgress.findMany({
    where: {
      userId,
      step: { pathwayId },
    },
    select: { stepId: true },
  })

  return completedSteps.length === totalSteps
}

export async function getUserProgress(userId: string) {
  const enrollments = await prisma.pathwayEnrollment.findMany({
    where: { userId },
    include: {
      pathway: {
        include: {
          steps: {
            orderBy: { orderIndex: 'asc' },
          },
        },
      },
    },
  })

  const progressByPathway = await Promise.all(
    enrollments.map(async (enrollment) => {
      const progress = await getPathwayProgress(enrollment.pathwayId, userId)
      const completedStepIds = new Set(progress.map(p => p.stepId))
      
      return {
        enrollment,
        steps: enrollment.pathway.steps.map(step => ({
          ...step,
          completed: completedStepIds.has(step.id),
          completedAt: progress.find(p => p.stepId === step.id)?.completedAt,
        })),
        progressPercentage: Math.round(
          (progress.length / enrollment.pathway.steps.length) * 100
        ),
      }
    })
  )

  return progressByPathway
}