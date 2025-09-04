import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApplicationError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    // Get current session
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

    // Fetch full user details with memberships
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        isNewBeliever: true,
        memberStatus: true,
        phone: true,
        bio: true,
        dateOfBirth: true,
        address: true,
        city: true,
        zipCode: true,
        emergencyContact: true,
        emergencyPhone: true,
        joinedAt: true,
        profileVisibility: true,
        allowContact: true,
        mustChangePassword: true,
        memberships: {
          include: {
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
            }
          },
          where: {
            leftAt: null // Only active memberships
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Format response for mobile consumption
    const primaryMembership = user.memberships
      .sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime())[0]

    const mobileUserData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      isNewBeliever: user.isNewBeliever,
      memberStatus: user.memberStatus,
      mustChangePassword: user.mustChangePassword,
      profile: {
        phone: user.phone,
        bio: user.bio,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        city: user.city,
        zipCode: user.zipCode,
        emergencyContact: user.emergencyContact,
        emergencyPhone: user.emergencyPhone,
        profileVisibility: user.profileVisibility,
        allowContact: user.allowContact,
        joinedAt: user.joinedAt
      },
      primaryChurch: primaryMembership ? {
        id: primaryMembership.localChurch.id,
        name: primaryMembership.localChurch.name,
        address: primaryMembership.localChurch.address,
        city: primaryMembership.localChurch.city,
        state: primaryMembership.localChurch.state,
        zipCode: primaryMembership.localChurch.zipCode,
        country: primaryMembership.localChurch.country,
        phone: primaryMembership.localChurch.phone,
        email: primaryMembership.localChurch.email,
        joinedAt: primaryMembership.joinedAt
      } : null,
      allMemberships: user.memberships.map(m => ({
        id: m.id,
        role: m.role,
        joinedAt: m.joinedAt,
        church: {
          id: m.localChurch.id,
          name: m.localChurch.name,
          city: m.localChurch.city,
          state: m.localChurch.state
        }
      }))
    }

    return NextResponse.json({
      success: true,
      data: {
        user: mobileUserData,
        sessionExpires: session.expires
      }
    })
    
  } catch (error) {
    console.error('Mobile session endpoint error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get session',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}