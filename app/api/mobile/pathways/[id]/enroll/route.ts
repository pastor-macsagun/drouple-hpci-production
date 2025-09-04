import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PathwayType, EnrollmentStatus } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const pathwayId = params.id

    // Verify pathway exists and user has access (tenant isolation)
    const pathway = await prisma.pathway.findFirst({
      where: {
        id: pathwayId,
        tenantId: session.user.tenantId || undefined
      },
      select: {
        id: true,
        name: true,
        type: true,
        isActive: true,
        tenantId: true
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

    if (!pathway.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'This pathway is no longer active',
          code: 'PATHWAY_INACTIVE'
        },
        { status: 403 }
      )
    }

    // Prevent manual enrollment in ROOTS - it's auto-enrolled for new believers
    if (pathway.type === PathwayType.ROOTS) {
      return NextResponse.json(
        {
          success: false,
          error: 'ROOTS pathway is automatically assigned to new believers',
          code: 'AUTO_ENROLLMENT_ONLY'
        },
        { status: 403 }
      )
    }

    // Check for existing enrollment
    const existingEnrollment = await prisma.pathwayEnrollment.findFirst({
      where: {
        pathwayId,
        userId: session.user.id
      }
    })

    if (existingEnrollment) {
      const statusMessage = {
        [EnrollmentStatus.ENROLLED]: 'Already enrolled in this pathway',
        [EnrollmentStatus.COMPLETED]: 'Already completed this pathway',
        [EnrollmentStatus.DROPPED]: 'Previously dropped this pathway'
      }

      return NextResponse.json(
        {
          success: false,
          error: statusMessage[existingEnrollment.status],
          code: 'ALREADY_ENROLLED',
          data: {
            enrollment: {
              id: existingEnrollment.id,
              status: existingEnrollment.status,
              enrolledAt: existingEnrollment.enrolledAt,
              completedAt: existingEnrollment.completedAt,
              droppedAt: existingEnrollment.droppedAt
            }
          }
        },
        { status: 409 }
      )
    }

    // Create enrollment
    const enrollment = await prisma.pathwayEnrollment.create({
      data: {
        pathwayId,
        userId: session.user.id,
        status: EnrollmentStatus.ENROLLED
      },
      include: {
        pathway: {
          select: {
            name: true,
            steps: {
              select: {
                id: true,
                name: true
              },
              orderBy: { orderIndex: 'asc' },
              take: 1 // Get first step
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        enrollment: {
          id: enrollment.id,
          pathwayId: enrollment.pathwayId,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt
        },
        pathway: {
          id: pathway.id,
          name: pathway.name,
          type: pathway.type
        },
        nextStep: enrollment.pathway.steps[0] || null,
        message: `Successfully enrolled in ${pathway.name}!`
      }
    })

  } catch (error) {
    console.error('Enroll in pathway error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to enroll in pathway',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

// Drop from pathway
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const pathwayId = params.id

    // Find enrollment
    const enrollment = await prisma.pathwayEnrollment.findFirst({
      where: {
        pathwayId,
        userId: session.user.id,
        status: EnrollmentStatus.ENROLLED
      },
      include: {
        pathway: {
          select: {
            name: true,
            type: true
          }
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not enrolled in this pathway',
          code: 'NOT_ENROLLED'
        },
        { status: 404 }
      )
    }

    // Prevent dropping from ROOTS pathway
    if (enrollment.pathway.type === PathwayType.ROOTS) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot drop from ROOTS pathway',
          code: 'REQUIRED_PATHWAY'
        },
        { status: 403 }
      )
    }

    // Update enrollment status to DROPPED
    const updatedEnrollment = await prisma.pathwayEnrollment.update({
      where: {
        id: enrollment.id
      },
      data: {
        status: EnrollmentStatus.DROPPED,
        droppedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        enrollment: {
          id: updatedEnrollment.id,
          status: updatedEnrollment.status,
          droppedAt: updatedEnrollment.droppedAt
        },
        message: `Successfully dropped from ${enrollment.pathway.name}`
      }
    })

  } catch (error) {
    console.error('Drop from pathway error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to drop from pathway',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}