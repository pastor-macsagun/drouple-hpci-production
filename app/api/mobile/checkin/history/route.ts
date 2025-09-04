import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get user's check-in history
    const checkins = await prisma.checkin.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        service: {
          include: {
            localChurch: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                state: true
              }
            }
          }
        }
      },
      orderBy: {
        checkedInAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const totalCount = await prisma.checkin.count({
      where: {
        userId: session.user.id
      }
    })

    // Format for mobile consumption
    const formattedCheckins = checkins.map(checkin => ({
      id: checkin.id,
      checkedInAt: checkin.checkedInAt,
      isNewBeliever: checkin.isNewBeliever,
      service: {
        id: checkin.service.id,
        date: checkin.service.date,
        church: {
          id: checkin.service.localChurch.id,
          name: checkin.service.localChurch.name,
          address: checkin.service.localChurch.address,
          city: checkin.service.localChurch.city,
          state: checkin.service.localChurch.state
        }
      }
    }))

    return NextResponse.json({
      success: true,
      data: {
        checkins: formattedCheckins,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      }
    })

  } catch (error) {
    console.error('Get checkin history error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get checkin history',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}