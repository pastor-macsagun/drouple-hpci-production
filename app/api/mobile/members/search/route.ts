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
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const role = searchParams.get('role') as UserRole | null
    const activeOnly = searchParams.get('activeOnly') !== 'false' // Default true

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Search query must be at least 2 characters',
          code: 'INVALID_QUERY'
        },
        { status: 400 }
      )
    }

    const searchTerm = query.trim().toLowerCase()
    const isLeader = hasMinRole(session.user.role, UserRole.LEADER)
    const isAdmin = hasMinRole(session.user.role, UserRole.ADMIN)

    // Apply tenant isolation for member search
    const whereClause = await createTenantWhereClause(
      session.user,
      {
        ...(activeOnly && { memberStatus: MemberStatus.ACTIVE }),
        ...(role && { role }),
        // Search filters
        OR: [
          {
            name: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            email: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          }
        ],
        // Filter by profile visibility based on user's role
        ...(!isAdmin && {
          AND: [{
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
          }]
        })
      },
      undefined,
      'tenantId'
    )

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
          },
          take: 1 // Just the primary membership
        }
      },
      take: limit,
      skip: offset,
      orderBy: [
        // Prioritize exact name matches
        {
          name: {
            sort: 'asc',
            nulls: 'last'
          }
        }
      ]
    })

    // Format search results with privacy controls
    const formattedResults = users.map(user => {
      const canViewFullProfile = isAdmin || 
                                user.id === session.user.id ||
                                (isLeader && user.profileVisibility === ProfileVisibility.LEADERS) ||
                                user.profileVisibility === ProfileVisibility.PUBLIC ||
                                user.profileVisibility === ProfileVisibility.MEMBERS

      const canContact = canViewFullProfile && user.allowContact
      const primaryMembership = user.memberships[0]

      // Highlight matching terms in name and email
      const highlightMatch = (text: string | null, term: string) => {
        if (!text) return null
        const regex = new RegExp(`(${term})`, 'gi')
        return text.replace(regex, '<mark>$1</mark>')
      }

      return {
        id: user.id,
        name: user.name,
        highlightedName: highlightMatch(user.name, searchTerm),
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
          highlightedEmail: highlightMatch(user.email, searchTerm),
          phone: user.phone
        } : {
          email: isAdmin ? user.email : null,
          highlightedEmail: isAdmin ? highlightMatch(user.email, searchTerm) : null,
          phone: null
        },
        profile: canViewFullProfile ? {
          bio: user.bio,
          allowContact: user.allowContact
        } : null,
        privacyLevel: canViewFullProfile ? 'full' : 'limited',
        // Search relevance score (simple implementation)
        relevance: calculateRelevance(user, searchTerm)
      }
    })

    // Sort by relevance
    formattedResults.sort((a, b) => b.relevance - a.relevance)

    // Get total count for search results
    const totalCount = await prisma.user.count({
      where: whereClause
    })

    return NextResponse.json({
      success: true,
      data: {
        members: formattedResults,
        query: searchTerm,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        },
        searchInfo: {
          resultsFound: formattedResults.length,
          searchTerm: query,
          filters: {
            role,
            activeOnly
          }
        }
      }
    })

  } catch (error) {
    console.error('Search members error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search members',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

// Simple relevance scoring function
function calculateRelevance(user: any, searchTerm: string): number {
  let score = 0
  const term = searchTerm.toLowerCase()
  
  if (user.name) {
    const name = user.name.toLowerCase()
    if (name === term) score += 100 // Exact match
    else if (name.startsWith(term)) score += 75 // Starts with
    else if (name.includes(term)) score += 50 // Contains
  }
  
  if (user.email) {
    const email = user.email.toLowerCase()
    if (email === term) score += 80 // Exact match
    else if (email.startsWith(term)) score += 60 // Starts with
    else if (email.includes(term)) score += 30 // Contains
  }
  
  // Role-based boosting (prioritize leaders/admins in search)
  if (user.role === UserRole.ADMIN || user.role === UserRole.PASTOR) score += 10
  else if (user.role === UserRole.LEADER || user.role === UserRole.VIP) score += 5
  
  return score
}