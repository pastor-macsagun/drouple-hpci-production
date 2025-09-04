import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EnrollmentStatus } from '@prisma/client'
import { z } from 'zod'

const completeStepSchema = z.object({
  notes: z.string().optional(),
  completedBy: z.string().optional(), // For leader verification
})

export async function POST(
  request: NextRequest,
  { params }: { params: { pathwayId: string; stepId: string } }
) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authenticated',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    }

    const { pathwayId, stepId } = params
    const body = await request.json()
    
    // Validate input
    const { notes, completedBy } = completeStepSchema.parse(body)

    // Verify user is enrolled in the pathway
    const enrollment = await prisma.pathwayEnrollment.findFirst({
      where: {
        pathwayId,
        userId: session.user.id,
        status: EnrollmentStatus.ENROLLED
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not enrolled in this pathway',
          code: 'NOT_ENROLLED'
        },
        { status: 403 }
      )
    }

    // Verify step belongs to the pathway and exists
    const step = await prisma.pathwayStep.findFirst({
      where: {
        id: stepId,
        pathwayId
      },
      include: {
        pathway: {
          select: {
            name: true,
            tenantId: true
          }
        }
      }
    })

    if (!step) {
      return NextResponse.json(
        {
          success: false,
          error: 'Step not found',
          code: 'STEP_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Verify tenant access
    if (step.pathway.tenantId !== session.user.tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        },
        { status: 403 }
      )
    }

    // Check if step is already completed
    const existingProgress = await prisma.pathwayProgress.findFirst({
      where: {
        stepId,
        userId: session.user.id
      }
    })

    if (existingProgress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Step already completed',
          code: 'ALREADY_COMPLETED',
          data: {
            progress: {
              id: existingProgress.id,
              completedAt: existingProgress.completedAt,
              completedBy: existingProgress.completedBy,
              notes: existingProgress.notes
            }
          }
        },
        { status: 409 }
      )
    }

    // Create progress record
    const progress = await prisma.pathwayProgress.create({
      data: {
        stepId,
        userId: session.user.id,
        completedBy: completedBy || session.user.id,
        notes
      }
    })

    // Check if this completes the pathway
    const totalSteps = await prisma.pathwayStep.count({
      where: { pathwayId }
    })

    const completedSteps = await prisma.pathwayProgress.count({
      where: {
        userId: session.user.id,
        step: { pathwayId }
      }
    })

    let pathwayCompleted = false
    if (completedSteps === totalSteps) {
      // Mark pathway as completed
      await prisma.pathwayEnrollment.update({
        where: { id: enrollment.id },
        data: {
          status: EnrollmentStatus.COMPLETED,
          completedAt: new Date()
        }
      })
      pathwayCompleted = true
    }

    // Get next incomplete step
    const nextStep = await prisma.pathwayStep.findFirst({
      where: {
        pathwayId,
        id: { not: stepId },
        NOT: {
          progress: {
            some: {
              userId: session.user.id
            }
          }
        }
      },
      orderBy: { orderIndex: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: {
        progress: {
          id: progress.id,
          stepId: progress.stepId,
          completedAt: progress.completedAt,
          completedBy: progress.completedBy,
          notes: progress.notes
        },
        step: {
          id: step.id,
          name: step.name,
          description: step.description,
          orderIndex: step.orderIndex
        },
        pathway: {
          id: pathwayId,
          name: step.pathway.name,
          isCompleted: pathwayCompleted,
          progress: {
            totalSteps,
            completedSteps,
            percentage: Math.round((completedSteps / totalSteps) * 100)
          }
        },
        nextStep: nextStep ? {
          id: nextStep.id,
          name: nextStep.name,
          description: nextStep.description,
          orderIndex: nextStep.orderIndex
        } : null,
        message: pathwayCompleted 
          ? `Congratulations! You have completed the ${step.pathway.name} pathway!`
          : `Step "${step.name}" completed successfully!`
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('Complete step error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to complete step',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}