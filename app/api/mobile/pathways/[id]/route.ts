import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EnrollmentStatus } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authenticated',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    }

    const pathwayId = params.id

    // Get pathway with steps
    const pathway = await prisma.pathway.findFirst({
      where: {
        id: pathwayId,
        tenantId: session.user.tenantId || undefined
      },
      include: {
        steps: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    })

    if (!pathway) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pathway not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Get user's enrollment status
    const enrollment = await prisma.pathwayEnrollment.findFirst({
      where: {
        pathwayId,
        userId: session.user.id
      }
    })

    // Get user's progress if enrolled
    const progress = enrollment ? await prisma.pathwayProgress.findMany({
      where: {
        userId: session.user.id,
        step: {
          pathwayId
        }
      },
      include: {
        step: {
          select: {
            id: true,
            name: true,
            orderIndex: true
          }
        }
      },
      orderBy: {
        completedAt: 'asc'
      }
    }) : []

    const completedStepIds = new Set(progress.map(p => p.stepId))
    const progressPercentage = pathway.steps.length > 0 
      ? Math.round((progress.length / pathway.steps.length) * 100)
      : 0

    // Find next incomplete step
    const nextStep = pathway.steps.find(step => !completedStepIds.has(step.id))

    const formattedPathway = {
      id: pathway.id,
      name: pathway.name,
      description: pathway.description,
      type: pathway.type,
      isActive: pathway.isActive,
      createdAt: pathway.createdAt,
      updatedAt: pathway.updatedAt,
      enrollment: enrollment ? {
        id: enrollment.id,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
        droppedAt: enrollment.droppedAt
      } : null,
      progress: {
        totalSteps: pathway.steps.length,
        completedSteps: progress.length,
        percentage: progressPercentage,
        nextStep: nextStep ? {
          id: nextStep.id,
          name: nextStep.name,
          description: nextStep.description,
          orderIndex: nextStep.orderIndex
        } : null
      },
      steps: pathway.steps.map(step => {
        const stepProgress = progress.find(p => p.stepId === step.id)
        return {
          id: step.id,
          name: step.name,
          description: step.description,
          orderIndex: step.orderIndex,
          isCompleted: !!stepProgress,
          completedAt: stepProgress?.completedAt || null,
          completedBy: stepProgress?.completedBy || null,
          notes: stepProgress?.notes || null,
          isNext: nextStep?.id === step.id
        }
      }),
      userStatus: {
        isEnrolled: !!enrollment,
        canEnroll: !enrollment && pathway.isActive,
        canComplete: enrollment?.status === EnrollmentStatus.ENROLLED,
        canDrop: enrollment?.status === EnrollmentStatus.ENROLLED,
        isCompleted: enrollment?.status === EnrollmentStatus.COMPLETED,
        isDropped: enrollment?.status === EnrollmentStatus.DROPPED
      }
    }

    return NextResponse.json({
      success: true,
      data: formattedPathway
    })

  } catch (error) {
    console.error('Get pathway details error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get pathway details',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}