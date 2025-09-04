import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MembershipStatus, RequestStatus } from '@prisma/client'
import { z } from 'zod'

const joinRequestSchema = z.object({
  message: z.string().optional(),
  autoJoin: z.boolean().default(false) // For groups with available spots
})

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

    const lifeGroupId = params.id
    const body = await request.json()
    
    // Validate input
    const { message, autoJoin } = joinRequestSchema.parse(body)

    // Verify life group exists and user has access (tenant isolation)
    const lifeGroup = await prisma.lifeGroup.findFirst({
      where: {
        id: lifeGroupId,
        localChurchId: session.user.tenantId || undefined
      },
      select: {
        id: true,
        name: true,
        capacity: true,
        isActive: true,
        localChurchId: true,
        _count: {
          select: {
            memberships: {
              where: {
                status: MembershipStatus.ACTIVE
              }
            }
          }
        }
      }
    })

    if (!lifeGroup || !lifeGroup.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Life group not found or inactive',
          code: 'GROUP_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Verify tenant access
    if (lifeGroup.localChurchId !== session.user.tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot join life group from another church',
          code: 'ACCESS_DENIED'
        },
        { status: 403 }
      )
    }

    // Check if already a member
    const existingMembership = await prisma.lifeGroupMembership.findUnique({
      where: {
        lifeGroupId_userId: {
          lifeGroupId,
          userId: session.user.id
        }
      }
    })

    if (existingMembership?.status === MembershipStatus.ACTIVE) {
      return NextResponse.json(
        {
          success: false,
          error: 'Already a member of this life group',
          code: 'ALREADY_MEMBER',
          data: {
            membership: {
              joinedAt: existingMembership.joinedAt,
              status: existingMembership.status
            }
          }
        },
        { status: 409 }
      )
    }

    // Check for existing pending request
    const existingRequest = await prisma.lifeGroupMemberRequest.findFirst({
      where: {
        lifeGroupId,
        userId: session.user.id,
        status: RequestStatus.PENDING
      }
    })

    if (existingRequest) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request already pending',
          code: 'REQUEST_PENDING',
          data: {
            request: {
              id: existingRequest.id,
              requestedAt: existingRequest.requestedAt,
              message: existingRequest.message
            }
          }
        },
        { status: 409 }
      )
    }

    const spotsLeft = lifeGroup.capacity - lifeGroup._count.memberships
    const hasAvailableSpots = spotsLeft > 0

    if (autoJoin && hasAvailableSpots) {
      // Auto-join if spots are available
      const membership = await prisma.lifeGroupMembership.create({
        data: {
          lifeGroupId,
          userId: session.user.id,
          status: MembershipStatus.ACTIVE
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          type: 'membership',
          membership: {
            id: membership.id,
            lifeGroupId: membership.lifeGroupId,
            joinedAt: membership.joinedAt,
            status: membership.status
          },
          message: `Successfully joined ${lifeGroup.name}!`
        }
      })
    } else {
      // Create a join request
      const request = await prisma.lifeGroupMemberRequest.create({
        data: {
          lifeGroupId,
          userId: session.user.id,
          message
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          type: 'request',
          request: {
            id: request.id,
            lifeGroupId: request.lifeGroupId,
            requestedAt: request.requestedAt,
            message: request.message,
            status: request.status
          },
          message: hasAvailableSpots 
            ? `Join request submitted for ${lifeGroup.name}. The leader will review your request.`
            : `You've been added to the waitlist for ${lifeGroup.name}. You'll be notified when a spot opens up.`
        }
      })
    }

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

    console.error('Join life group error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to join life group',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

// Leave a life group
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

    const lifeGroupId = params.id

    // Find the membership
    const membership = await prisma.lifeGroupMembership.findFirst({
      where: {
        lifeGroupId,
        userId: session.user.id,
        status: MembershipStatus.ACTIVE
      },
      include: {
        lifeGroup: {
          select: {
            name: true,
            leaderId: true
          }
        }
      }
    })

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not a member of this life group',
          code: 'NOT_MEMBER'
        },
        { status: 404 }
      )
    }

    // Prevent leaders from leaving their own groups
    if (membership.lifeGroup.leaderId === session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Leaders cannot leave their own life groups',
          code: 'LEADER_CANNOT_LEAVE'
        },
        { status: 403 }
      )
    }

    // Update membership status to LEFT
    await prisma.lifeGroupMembership.update({
      where: {
        lifeGroupId_userId: {
          lifeGroupId,
          userId: session.user.id
        }
      },
      data: {
        status: MembershipStatus.LEFT,
        leftAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        message: `You have left ${membership.lifeGroup.name}`
      }
    })

  } catch (error) {
    console.error('Leave life group error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to leave life group',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}