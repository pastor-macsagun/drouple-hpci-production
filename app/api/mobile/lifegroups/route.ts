import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createTenantWhereClause } from '@/lib/rbac'
import { MembershipStatus, RequestStatus } from '@prisma/client'

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
    const type = searchParams.get('type') || 'available' // 'available', 'my', 'all'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (type === 'my') {
      // Get user's life groups
      const memberships = await prisma.lifeGroupMembership.findMany({
        where: {
          userId: session.user.id,
          status: MembershipStatus.ACTIVE
        },
        include: {
          lifeGroup: {
            include: {
              leader: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              },
              localChurch: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  city: true,
                  state: true
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
          }
        },
        take: limit,
        skip: offset
      })

      const formattedGroups = memberships.map(membership => ({
        id: membership.lifeGroup.id,
        name: membership.lifeGroup.name,
        description: membership.lifeGroup.description,
        capacity: membership.lifeGroup.capacity,
        memberCount: membership.lifeGroup._count.memberships,
        isActive: membership.lifeGroup.isActive,
        joinedAt: membership.joinedAt,
        membershipStatus: membership.status,
        leader: {
          id: membership.lifeGroup.leader.id,
          name: membership.lifeGroup.leader.name,
          email: membership.lifeGroup.leader.email,
          phone: membership.lifeGroup.leader.phone
        },
        church: {
          id: membership.lifeGroup.localChurch.id,
          name: membership.lifeGroup.localChurch.name,
          address: membership.lifeGroup.localChurch.address,
          city: membership.lifeGroup.localChurch.city,
          state: membership.lifeGroup.localChurch.state
        },
        userRole: 'member', // Could be enhanced with leader detection
        canLeave: true
      }))

      return NextResponse.json({
        success: true,
        data: {
          lifeGroups: formattedGroups,
          pagination: {
            total: formattedGroups.length,
            limit,
            offset,
            hasMore: false // Simple implementation
          }
        }
      })
    }

    // Get available life groups (not yet joined)
    const whereClause = await createTenantWhereClause(
      session.user,
      {
        isActive: true,
        ...(type === 'available' && {
          NOT: {
            memberships: {
              some: {
                userId: session.user.id,
                status: MembershipStatus.ACTIVE
              }
            }
          }
        })
      },
      undefined,
      'localChurchId'
    )

    const lifeGroups = await prisma.lifeGroup.findMany({
      where: whereClause,
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        localChurch: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true
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
      },
      take: limit,
      skip: offset,
      orderBy: {
        name: 'asc'
      }
    })

    // Check for pending requests
    const pendingRequests = await prisma.lifeGroupMemberRequest.findMany({
      where: {
        userId: session.user.id,
        status: RequestStatus.PENDING
      },
      select: {
        lifeGroupId: true,
        requestedAt: true,
        message: true
      }
    })

    const pendingGroupIds = new Map(
      pendingRequests.map(r => [r.lifeGroupId, { requestedAt: r.requestedAt, message: r.message }])
    )

    // Check current memberships for type 'all'
    const currentMemberships = type === 'all' ? await prisma.lifeGroupMembership.findMany({
      where: {
        userId: session.user.id,
        lifeGroupId: { in: lifeGroups.map(g => g.id) },
        status: MembershipStatus.ACTIVE
      },
      select: {
        lifeGroupId: true,
        joinedAt: true
      }
    }) : []

    const membershipMap = new Map(
      currentMemberships.map(m => [m.lifeGroupId, m.joinedAt])
    )

    const formattedGroups = lifeGroups.map(group => {
      const pendingRequest = pendingGroupIds.get(group.id)
      const memberSince = membershipMap.get(group.id)
      const spotsLeft = group.capacity - group._count.memberships

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        capacity: group.capacity,
        memberCount: group._count.memberships,
        spotsLeft: Math.max(0, spotsLeft),
        isFull: spotsLeft <= 0,
        isActive: group.isActive,
        leader: {
          id: group.leader.id,
          name: group.leader.name,
          email: group.leader.email,
          phone: group.leader.phone
        },
        church: {
          id: group.localChurch.id,
          name: group.localChurch.name,
          address: group.localChurch.address,
          city: group.localChurch.city,
          state: group.localChurch.state
        },
        userStatus: {
          isMember: !!memberSince,
          memberSince: memberSince || null,
          hasPendingRequest: !!pendingRequest,
          pendingRequestDate: pendingRequest?.requestedAt || null,
          pendingRequestMessage: pendingRequest?.message || null,
          canJoin: !memberSince && !pendingRequest && spotsLeft > 0,
          canRequestJoin: !memberSince && !pendingRequest && spotsLeft <= 0
        }
      }
    })

    // Get total count for pagination
    const totalCount = await prisma.lifeGroup.count({
      where: whereClause
    })

    return NextResponse.json({
      success: true,
      data: {
        lifeGroups: formattedGroups,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      }
    })

  } catch (error) {
    console.error('Get life groups error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get life groups',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}