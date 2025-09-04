import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PathwayType, EnrollmentStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all' // 'all', 'enrolled', 'available'
    const includeCompleted = searchParams.get('includeCompleted') === 'true'

    // Get user's enrollments first to determine enrollment status
    const enrollments = await prisma.pathwayEnrollment.findMany({
      where: { 
        userId: session.user.id,
        ...(includeCompleted ? {} : { status: { not: EnrollmentStatus.COMPLETED } })
      },
      include: {
        pathway: {
          include: {
            steps: {
              orderBy: { orderIndex: 'asc' }
            }
          }
        }
      }
    })

    // Get progress for enrolled pathways
    const enrolledPathwayIds = enrollments.map(e => e.pathwayId)
    const progressRecords = enrolledPathwayIds.length > 0 ? await prisma.pathwayProgress.findMany({
      where: {
        userId: session.user.id,
        step: {
          pathwayId: { in: enrolledPathwayIds }
        }
      },
      include: {
        step: {
          select: {
            id: true,
            pathwayId: true,
            name: true,
            orderIndex: true
          }
        }
      }
    }) : []

    // Group progress by pathway
    const progressByPathway = new Map<string, typeof progressRecords>()
    progressRecords.forEach(progress => {
      const pathwayId = progress.step.pathwayId
      if (!progressByPathway.has(pathwayId)) {
        progressByPathway.set(pathwayId, [])
      }
      progressByPathway.get(pathwayId)!.push(progress)
    })

    if (type === 'enrolled' || type === 'all') {
      // Format enrolled pathways with progress
      const enrolledPathways = enrollments.map(enrollment => {
        const progress = progressByPathway.get(enrollment.pathwayId) || []
        const completedStepIds = new Set(progress.map(p => p.stepId))
        const progressPercentage = enrollment.pathway.steps.length > 0 
          ? Math.round((progress.length / enrollment.pathway.steps.length) * 100)
          : 0

        return {
          id: enrollment.pathway.id,
          name: enrollment.pathway.name,
          description: enrollment.pathway.description,
          type: enrollment.pathway.type,
          isActive: enrollment.pathway.isActive,
          enrollment: {
            id: enrollment.id,
            status: enrollment.status,
            enrolledAt: enrollment.enrolledAt,
            completedAt: enrollment.completedAt,
            droppedAt: enrollment.droppedAt
          },
          progress: {
            totalSteps: enrollment.pathway.steps.length,
            completedSteps: progress.length,
            percentage: progressPercentage,
            nextStep: enrollment.pathway.steps.find(step => !completedStepIds.has(step.id))
          },
          steps: enrollment.pathway.steps.map(step => {
            const stepProgress = progress.find(p => p.stepId === step.id)
            return {
              id: step.id,
              name: step.name,
              description: step.description,
              orderIndex: step.orderIndex,
              isCompleted: !!stepProgress,
              completedAt: stepProgress?.completedAt || null,
              completedBy: stepProgress?.completedBy || null,
              notes: stepProgress?.notes || null
            }
          }),
          userStatus: {
            isEnrolled: true,
            canComplete: enrollment.status === EnrollmentStatus.ENROLLED,
            canDrop: enrollment.status === EnrollmentStatus.ENROLLED
          }
        }
      })

      if (type === 'enrolled') {
        return NextResponse.json({
          success: true,
          data: {
            pathways: enrolledPathways,
            totalEnrolled: enrolledPathways.length
          }
        })
      }
    }

    // Get available pathways (not enrolled in)
    if (type === 'available' || type === 'all') {
      const enrolledPathwayIds = new Set(enrollments.map(e => e.pathwayId))
      
      const availablePathways = await prisma.pathway.findMany({
        where: {
          tenantId: session.user.tenantId || undefined,
          isActive: true,
          id: { notIn: Array.from(enrolledPathwayIds) },
          // Hide ROOTS from manual enrollment - it's auto-enrolled
          type: { not: PathwayType.ROOTS }
        },
        include: {
          steps: {
            orderBy: { orderIndex: 'asc' },
            select: {
              id: true,
              name: true,
              description: true,
              orderIndex: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      })

      const formattedAvailable = availablePathways.map(pathway => ({
        id: pathway.id,
        name: pathway.name,
        description: pathway.description,
        type: pathway.type,
        isActive: pathway.isActive,
        createdAt: pathway.createdAt,
        stepCount: pathway.steps.length,
        steps: pathway.steps,
        userStatus: {
          isEnrolled: false,
          canEnroll: pathway.isActive
        }
      }))

      if (type === 'available') {
        return NextResponse.json({
          success: true,
          data: {
            pathways: formattedAvailable,
            totalAvailable: formattedAvailable.length
          }
        })
      }

      // Return both for 'all' type
      return NextResponse.json({
        success: true,
        data: {
          enrolled: enrollments.map(enrollment => {
            const progress = progressByPathway.get(enrollment.pathwayId) || []
            const progressPercentage = enrollment.pathway.steps.length > 0 
              ? Math.round((progress.length / enrollment.pathway.steps.length) * 100)
              : 0

            return {
              id: enrollment.pathway.id,
              name: enrollment.pathway.name,
              description: enrollment.pathway.description,
              type: enrollment.pathway.type,
              enrollment: {
                status: enrollment.status,
                enrolledAt: enrollment.enrolledAt,
                completedAt: enrollment.completedAt
              },
              progress: {
                totalSteps: enrollment.pathway.steps.length,
                completedSteps: progress.length,
                percentage: progressPercentage
              }
            }
          }),
          available: formattedAvailable,
          summary: {
            totalEnrolled: enrollments.length,
            totalAvailable: formattedAvailable.length,
            totalCompleted: enrollments.filter(e => e.status === EnrollmentStatus.COMPLETED).length
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        pathways: [],
        message: 'Invalid type parameter'
      }
    })

  } catch (error) {
    console.error('Get pathways error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get pathways',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}