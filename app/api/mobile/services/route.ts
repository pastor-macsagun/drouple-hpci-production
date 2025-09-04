import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createTenantWhereClause } from '@/lib/rbac'
import { startOfDay, endOfDay, parseISO } from 'date-fns'

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
    const dateParam = searchParams.get('date')
    
    // Default to today if no date specified
    const targetDate = dateParam ? parseISO(dateParam) : new Date()
    const dayStart = startOfDay(targetDate)
    const dayEnd = endOfDay(targetDate)

    // Apply tenant isolation for services
    const whereClause = await createTenantWhereClause(
      session.user,
      {
        date: {
          gte: dayStart,
          lte: dayEnd
        }
      },
      undefined,
      'localChurchId'
    )

    const services = await prisma.service.findMany({
      where: whereClause,
      include: {
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
            checkins: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Format for mobile consumption
    const formattedServices = services.map(service => ({
      id: service.id,
      date: service.date,
      attendanceCount: service._count.checkins,
      church: {
        id: service.localChurch.id,
        name: service.localChurch.name,
        address: service.localChurch.address,
        city: service.localChurch.city,
        state: service.localChurch.state
      },
      canCheckIn: true // Users can always attempt to check in
    }))

    return NextResponse.json({
      success: true,
      data: {
        services: formattedServices,
        date: targetDate.toISOString()
      }
    })

  } catch (error) {
    console.error('Get services error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get services',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}