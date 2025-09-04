import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasMinRole, createTenantWhereClause } from '@/lib/rbac'
import { UserRole, EventScope, RsvpStatus } from '@prisma/client'

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
    const upcoming = searchParams.get('upcoming') === 'true'

    const isAdmin = hasMinRole(session.user.role, UserRole.ADMIN)

    // Get tenant-scoped events using proper isolation
    const localChurchWhere = await createTenantWhereClause(
      session.user,
      { scope: EventScope.LOCAL_CHURCH },
      undefined,
      'localChurchId'
    )

    const baseWhere = {
      isActive: true,
      ...(upcoming && {
        startDateTime: {
          gte: new Date()
        }
      }),
      OR: [
        // WHOLE_CHURCH events visible to all
        { scope: EventScope.WHOLE_CHURCH },
        // LOCAL_CHURCH events using tenant isolation
        localChurchWhere,
      ],
    }

    let events = await prisma.event.findMany({
      where: baseWhere,
      select: {
        id: true,
        name: true,
        description: true,
        startDateTime: true,
        endDateTime: true,
        location: true,
        capacity: true,
        scope: true,
        localChurchId: true,
        requiresPayment: true,
        feeAmount: true,
        visibleToRoles: true,
        isActive: true,
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
            rsvps: {
              where: { status: RsvpStatus.GOING },
            },
          },
        },
      },
      orderBy: { startDateTime: 'asc' },
      take: limit,
      skip: offset
    })

    // Filter by role visibility if not admin
    if (!isAdmin) {
      events = events.filter(event => 
        event.visibleToRoles.length === 0 || 
        event.visibleToRoles.includes(session.user.role)
      )
    }

    // Get user's RSVP status for each event
    const eventIds = events.map(e => e.id)
    const userRsvps = await prisma.eventRsvp.findMany({
      where: {
        eventId: { in: eventIds },
        userId: session.user.id,
        status: { not: RsvpStatus.CANCELLED }
      },
      select: {
        eventId: true,
        status: true,
        rsvpAt: true,
        hasPaid: true
      }
    })

    const rsvpMap = new Map(userRsvps.map(rsvp => [rsvp.eventId, rsvp]))

    // Format for mobile consumption
    const formattedEvents = events.map(event => {
      const userRsvp = rsvpMap.get(event.id)
      const attendeeCount = event._count.rsvps
      const spotsLeft = event.capacity - attendeeCount

      return {
        id: event.id,
        name: event.name,
        description: event.description,
        startDateTime: event.startDateTime,
        endDateTime: event.endDateTime,
        location: event.location,
        capacity: event.capacity,
        attendeeCount,
        spotsLeft: Math.max(0, spotsLeft),
        isFull: spotsLeft <= 0,
        scope: event.scope,
        requiresPayment: event.requiresPayment,
        feeAmount: event.feeAmount,
        church: event.localChurch ? {
          id: event.localChurch.id,
          name: event.localChurch.name,
          address: event.localChurch.address,
          city: event.localChurch.city,
          state: event.localChurch.state
        } : null,
        userRsvp: userRsvp ? {
          status: userRsvp.status,
          rsvpAt: userRsvp.rsvpAt,
          hasPaid: userRsvp.hasPaid
        } : null,
        canRsvp: !userRsvp // Can RSVP if no existing RSVP
      }
    })

    // Get total count for pagination
    const totalCount = await prisma.event.count({
      where: baseWhere
    })

    return NextResponse.json({
      success: true,
      data: {
        events: formattedEvents,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      }
    })

  } catch (error) {
    console.error('Get events error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get events',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}