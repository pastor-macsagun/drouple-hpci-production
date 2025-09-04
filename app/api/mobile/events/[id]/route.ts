import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasMinRole, createTenantWhereClause } from '@/lib/rbac'
import { UserRole, EventScope, RsvpStatus } from '@prisma/client'

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

    const eventId = params.id

    const event = await prisma.event.findUnique({
      where: { id: eventId },
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
            state: true,
            zipCode: true,
            country: true,
            phone: true,
            email: true
          }
        },
        rsvps: {
          where: { 
            status: { not: RsvpStatus.CANCELLED },
          },
          select: {
            id: true,
            status: true,
            rsvpAt: true,
            hasPaid: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { rsvpAt: 'asc' },
        },
      },
    })

    if (!event || !event.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Event not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      )
    }

    const isAdmin = hasMinRole(session.user.role, UserRole.ADMIN)

    // Check visibility for non-admins
    if (!isAdmin) {
      // Check role-based visibility
      if (event.visibleToRoles.length > 0 && 
          !event.visibleToRoles.includes(session.user.role)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Event not found',
            code: 'NOT_FOUND'
          },
          { status: 404 }
        )
      }

      // Check scope visibility using tenant isolation
      if (event.scope === EventScope.LOCAL_CHURCH) {
        const whereClause = await createTenantWhereClause(
          session.user, 
          { id: eventId }, 
          undefined, 
          'localChurchId'
        )
        if (whereClause.localChurchId !== event.localChurchId) {
          return NextResponse.json(
            {
              success: false,
              error: 'Event not found',
              code: 'NOT_FOUND'
            },
            { status: 404 }
          )
        }
      }
    }

    // Get user's RSVP status
    const userRsvp = await prisma.eventRsvp.findFirst({
      where: {
        eventId,
        userId: session.user.id,
        status: { not: RsvpStatus.CANCELLED },
      },
    })

    // Calculate attendance stats
    const goingAttendees = event.rsvps.filter(rsvp => rsvp.status === RsvpStatus.GOING)
    const waitlistAttendees = event.rsvps.filter(rsvp => rsvp.status === RsvpStatus.WAITLIST)
    const spotsLeft = event.capacity - goingAttendees.length

    // Format for mobile consumption
    const formattedEvent = {
      id: event.id,
      name: event.name,
      description: event.description,
      startDateTime: event.startDateTime,
      endDateTime: event.endDateTime,
      location: event.location,
      capacity: event.capacity,
      scope: event.scope,
      requiresPayment: event.requiresPayment,
      feeAmount: event.feeAmount,
      church: event.localChurch ? {
        id: event.localChurch.id,
        name: event.localChurch.name,
        address: event.localChurch.address,
        city: event.localChurch.city,
        state: event.localChurch.state,
        zipCode: event.localChurch.zipCode,
        country: event.localChurch.country,
        phone: event.localChurch.phone,
        email: event.localChurch.email
      } : null,
      attendance: {
        going: goingAttendees.length,
        waitlist: waitlistAttendees.length,
        total: event.rsvps.length,
        spotsLeft: Math.max(0, spotsLeft),
        isFull: spotsLeft <= 0
      },
      userRsvp: userRsvp ? {
        id: userRsvp.id,
        status: userRsvp.status,
        rsvpAt: userRsvp.rsvpAt,
        hasPaid: userRsvp.hasPaid
      } : null,
      canRsvp: !userRsvp, // Can RSVP if no existing RSVP
      // Only include attendee list for admins or if scope allows
      attendees: isAdmin ? {
        going: goingAttendees.map(rsvp => ({
          id: rsvp.user.id,
          name: rsvp.user.name,
          email: rsvp.user.email,
          rsvpAt: rsvp.rsvpAt,
          hasPaid: rsvp.hasPaid
        })),
        waitlist: waitlistAttendees.map(rsvp => ({
          id: rsvp.user.id,
          name: rsvp.user.name,
          email: rsvp.user.email,
          rsvpAt: rsvp.rsvpAt,
          hasPaid: rsvp.hasPaid
        }))
      } : null
    }

    return NextResponse.json({
      success: true,
      data: formattedEvent
    })

  } catch (error) {
    console.error('Get event details error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get event details',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}