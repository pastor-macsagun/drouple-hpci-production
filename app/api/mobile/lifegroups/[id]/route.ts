import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MembershipStatus, RequestStatus } from '@prisma/client'

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

    const lifeGroupId = params.id

    // Verify life group exists and user has access (tenant isolation)
    const lifeGroup = await prisma.lifeGroup.findFirst({
      where: {
        id: lifeGroupId,
        localChurchId: session.user.tenantId || undefined
      },
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            bio: true
          }
        },
        localChurch: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            country: true,
            phone: true,
            email: true
          }
        },
        memberships: {
          where: {
            status: MembershipStatus.ACTIVE
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                profileVisibility: true,
                allowContact: true
              }
            }
          },
          orderBy: {
            joinedAt: 'asc'
          }
        },
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

    if (!lifeGroup) {
      return NextResponse.json(
        {
          success: false,
          error: 'Life group not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Check user's relationship with this group
    const userMembership = lifeGroup.memberships.find(m => m.userId === session.user.id)
    const isLeader = lifeGroup.leaderId === session.user.id

    // Check for pending request
    const pendingRequest = !userMembership ? await prisma.lifeGroupMemberRequest.findFirst({
      where: {
        lifeGroupId,
        userId: session.user.id,
        status: RequestStatus.PENDING
      },
      select: {
        id: true,
        message: true,
        requestedAt: true
      }
    }) : null

    // Filter member list based on privacy settings and user permissions
    const filteredMembers = lifeGroup.memberships.map(membership => {
      const user = membership.user
      const canViewDetails = isLeader || 
                           user.profileVisibility === 'PUBLIC' || 
                           user.profileVisibility === 'MEMBERS' ||
                           user.id === session.user.id

      return {
        id: user.id,
        name: user.name,
        joinedAt: membership.joinedAt,
        isLeader: membership.userId === lifeGroup.leaderId,
        isYou: user.id === session.user.id,
        contact: canViewDetails && user.allowContact ? {
          email: user.email,
          phone: user.phone
        } : null
      }
    })

    const spotsLeft = lifeGroup.capacity - lifeGroup._count.memberships

    const formattedGroup = {
      id: lifeGroup.id,
      name: lifeGroup.name,
      description: lifeGroup.description,
      capacity: lifeGroup.capacity,
      memberCount: lifeGroup._count.memberships,
      spotsLeft: Math.max(0, spotsLeft),
      isFull: spotsLeft <= 0,
      isActive: lifeGroup.isActive,
      createdAt: lifeGroup.createdAt,
      leader: {
        id: lifeGroup.leader.id,
        name: lifeGroup.leader.name,
        email: lifeGroup.leader.email,
        phone: lifeGroup.leader.phone,
        bio: lifeGroup.leader.bio,
        isYou: lifeGroup.leaderId === session.user.id
      },
      church: {
        id: lifeGroup.localChurch.id,
        name: lifeGroup.localChurch.name,
        address: lifeGroup.localChurch.address,
        city: lifeGroup.localChurch.city,
        state: lifeGroup.localChurch.state,
        zipCode: lifeGroup.localChurch.zipCode,
        country: lifeGroup.localChurch.country,
        phone: lifeGroup.localChurch.phone,
        email: lifeGroup.localChurch.email
      },
      members: filteredMembers,
      userStatus: {
        isMember: !!userMembership,
        isLeader,
        memberSince: userMembership?.joinedAt || null,
        hasPendingRequest: !!pendingRequest,
        pendingRequest: pendingRequest ? {
          id: pendingRequest.id,
          message: pendingRequest.message,
          requestedAt: pendingRequest.requestedAt
        } : null,
        canJoin: !userMembership && !pendingRequest && spotsLeft > 0 && lifeGroup.isActive,
        canRequestJoin: !userMembership && !pendingRequest && spotsLeft <= 0 && lifeGroup.isActive,
        canLeave: !!userMembership && !isLeader // Leaders typically can't leave their own groups
      }
    }

    return NextResponse.json({
      success: true,
      data: formattedGroup
    })

  } catch (error) {
    console.error('Get life group details error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get life group details',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}