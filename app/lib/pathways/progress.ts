import { db } from '@/app/lib/db'
import { EnrollmentStatus } from '@prisma/client'

export async function completeStep(
  stepId: string,
  userId: string,
  completedBy?: string,
  notes?: string
) {
  const step = await db.pathwayStep.findUnique({
    where: { id: stepId },
    select: { id: true, pathwayId: true },
  })

  if (!step) {
    throw new Error('Step not found')
  }

  const existingProgress = await db.pathwayProgress.findFirst({
    where: { stepId, userId },
  })

  if (existingProgress) {
    return existingProgress
  }

  const progress = await db.pathwayProgress.create({
    data: {
      stepId,
      userId,
      completedBy,
      notes,
    },
  })

  const isComplete = await isPathwayComplete(step.pathwayId, userId)
  if (isComplete) {
    const enrollment = await db.pathwayEnrollment.findFirst({
      where: {
        pathwayId: step.pathwayId,
        userId,
        status: EnrollmentStatus.ENROLLED,
      },
    })

    if (enrollment) {
      await db.pathwayEnrollment.update({
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
  return await db.pathwayProgress.findMany({
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
  const totalSteps = await db.pathwayStep.count({
    where: { pathwayId },
  })

  const completedSteps = await db.pathwayProgress.findMany({
    where: {
      userId,
      step: { pathwayId },
    },
    select: { stepId: true },
  })

  return completedSteps.length === totalSteps
}

export async function getUserProgress(userId: string) {
  const enrollments = await db.pathwayEnrollment.findMany({
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