import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createTenantWhereClause, hasMinRole } from '@/lib/rbac'
import { UserRole, ProfileVisibility, MemberStatus } from '@prisma/client'

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
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const role = searchParams.get('role') as UserRole | null
    const activeOnly = searchParams.get('activeOnly') !== 'false' // Default true

    const isLeader = hasMinRole(session.user.role, UserRole.LEADER)
    const isAdmin = hasMinRole(session.user.role, UserRole.ADMIN)

    // Apply tenant isolation for member lookup
    const whereClause = await createTenantWhereClause(
      session.user,
      {
        ...(activeOnly && { memberStatus: MemberStatus.ACTIVE }),
        ...(role && { role }),
        // Filter by profile visibility based on user's role
        ...(!isAdmin && {
          OR: [
            // Public profiles visible to all
            { profileVisibility: ProfileVisibility.PUBLIC },
            // Member profiles visible to other members
            { profileVisibility: ProfileVisibility.MEMBERS },
            // Leader profiles visible to leaders and above
            ...(isLeader ? [{ profileVisibility: ProfileVisibility.LEADERS }] : []),
            // User's own profile is always visible
            { id: session.user.id }
          ]
        })
      },
      undefined,
      'tenantId'
    )

    // Get members with memberships for church info
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isNewBeliever: true,
        memberStatus: true,
        phone: true,
        bio: true,
        profileVisibility: true,
        allowContact: true,
        joinedAt: true,
        memberships: {
          where: {
            leftAt: null // Only active memberships
          },
          include: {
            localChurch: {
              select: {
                id: true,
                name: true,
                city: true,
                state: true
              }
            }
          },
          orderBy: {
            joinedAt: 'desc'
          }
        }
      },
      take: limit,
      skip: offset,
      orderBy: {
        name: 'asc'
      }
    })

    // Format for mobile consumption with privacy controls
    const formattedMembers = users.map(user => {
      const canViewFullProfile = isAdmin || 
                                user.id === session.user.id ||
                                (isLeader && user.profileVisibility === ProfileVisibility.LEADERS) ||
                                user.profileVisibility === ProfileVisibility.PUBLIC ||
                                user.profileVisibility === ProfileVisibility.MEMBERS

      const canContact = canViewFullProfile && user.allowContact

      const primaryMembership = user.memberships[0] // Most recent active membership

      return {
        id: user.id,
        name: user.name,
        role: user.role,
        isNewBeliever: user.isNewBeliever,
        memberStatus: user.memberStatus,
        joinedAt: user.joinedAt,
        profileVisibility: user.profileVisibility,
        isYou: user.id === session.user.id,
        church: primaryMembership ? {
          id: primaryMembership.localChurch.id,
          name: primaryMembership.localChurch.name,
          city: primaryMembership.localChurch.city,
          state: primaryMembership.localChurch.state,
          memberSince: primaryMembership.joinedAt
        } : null,
        // Conditional fields based on privacy settings
        contact: canContact ? {
          email: user.email,
          phone: user.phone
        } : null,
        profile: canViewFullProfile ? {
          bio: user.bio,
          allowContact: user.allowContact
        } : null,
        // Indicate privacy level to mobile app
        privacyLevel: canViewFullProfile ? 'full' : 'limited'
      }
    })

    // Get total count for pagination
    const totalCount = await prisma.user.count({
      where: whereClause
    })

    // Get role counts for filtering UI
    const roleCounts = isAdmin ? await prisma.user.groupBy({
      by: ['role'],
      where: {
        tenantId: session.user.tenantId || undefined,
        ...(activeOnly && { memberStatus: MemberStatus.ACTIVE })
      },
      _count: {
        role: true
      }
    }) : []

    const roleCountMap = roleCounts.reduce((acc, item) => {
      acc[item.role] = item._count.role
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      data: {
        members: formattedMembers,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        },
        filters: {
          roleCounts: roleCountMap,
          currentRole: role,
          activeOnly
        },
        userPermissions: {
          isLeader,
          isAdmin,
          canViewAllProfiles: isAdmin
        }
      }
    })

  } catch (error) {
    console.error('Get members error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get members',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}