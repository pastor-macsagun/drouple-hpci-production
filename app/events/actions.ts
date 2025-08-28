'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole, EventScope, RsvpStatus } from '@prisma/client'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { hasMinRole, createTenantWhereClause } from '@/lib/rbac'

const createEventSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDateTime: z.date(),
  endDateTime: z.date(),
  location: z.string().optional(),
  capacity: z.number().min(1),
  scope: z.nativeEnum(EventScope),
  localChurchId: z.string().optional(),
  requiresPayment: z.boolean().default(false),
  feeAmount: z.number().optional(),
  visibleToRoles: z.array(z.nativeEnum(UserRole)).default([]),
}).refine(
  (data) => {
    // If scope is LOCAL_CHURCH, localChurchId must be provided
    if (data.scope === EventScope.LOCAL_CHURCH) {
      return !!data.localChurchId
    }
    // If scope is WHOLE_CHURCH, localChurchId should be null/undefined
    if (data.scope === EventScope.WHOLE_CHURCH) {
      return !data.localChurchId
    }
    return true
  },
  {
    message: 'LOCAL_CHURCH scope requires localChurchId, WHOLE_CHURCH scope must not have localChurchId',
    path: ['localChurchId'],
  }
)

export async function createEvent(data: z.infer<typeof createEventSchema>) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Only admins can create events
    if (!hasMinRole(session.user.role, UserRole.ADMIN)) {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = createEventSchema.parse(data)

    // For LOCAL_CHURCH scope, ensure localChurchId is provided
    if (validated.scope === EventScope.LOCAL_CHURCH && !validated.localChurchId) {
      return { success: false, error: 'Local church ID required for local events' }
    }

    const event = await prisma.event.create({
      data: validated,
    })

    revalidatePath('/events')
    return { success: true, data: event }
  } catch (error) {
    console.error('Create event error:', error)
    return { success: false, error: 'Failed to create event' }
  }
}

export async function updateEvent(
  eventId: string, 
  data: Partial<z.infer<typeof createEventSchema>>
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Only admins can update events
    if (!hasMinRole(session.user.role, UserRole.ADMIN)) {
      return { success: false, error: 'Unauthorized' }
    }

    const event = await prisma.event.update({
      where: { id: eventId },
      data,
    })

    revalidatePath('/events')
    revalidatePath(`/events/${eventId}`)
    return { success: true, data: event }
  } catch (error) {
    console.error('Update event error:', error)
    return { success: false, error: 'Failed to update event' }
  }
}

export async function deleteEvent(eventId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Only admins can delete events
    if (!hasMinRole(session.user.role, UserRole.ADMIN)) {
      return { success: false, error: 'Unauthorized' }
    }

    await prisma.event.delete({
      where: { id: eventId },
    })

    revalidatePath('/events')
    return { success: true }
  } catch (error) {
    console.error('Delete event error:', error)
    return { success: false, error: 'Failed to delete event' }
  }
}

export async function rsvpToEvent(eventId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event || !event.isActive) {
      return { success: false, error: 'Event not available' }
    }

    // Check role-based visibility
    if (event.visibleToRoles.length > 0 && 
        !event.visibleToRoles.includes(session.user.role)) {
      return { success: false, error: 'Event not available' }
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
        return { success: false, error: 'Event not available' }
      }
    }

    // Check for existing RSVP
    const existingRsvp = await prisma.eventRsvp.findFirst({
      where: {
        eventId,
        userId: session.user.id,
        status: { not: RsvpStatus.CANCELLED },
      },
    })

    if (existingRsvp) {
      return { success: false, error: 'Already registered for this event' }
    }

    // Use transaction to prevent race conditions in capacity checking
    const rsvp = await prisma.$transaction(async (tx) => {
      // Count current attendees within transaction
      const currentAttendees = await tx.eventRsvp.count({
        where: {
          eventId,
          status: RsvpStatus.GOING,
        },
      })

      // Determine RSVP status based on capacity
      const status = currentAttendees < event.capacity 
        ? RsvpStatus.GOING 
        : RsvpStatus.WAITLIST

      // Create RSVP within same transaction
      return await tx.eventRsvp.create({
        data: {
          eventId,
          userId: session.user.id,
          status,
        },
      })
    }, {
      isolationLevel: 'Serializable'
    })

    revalidatePath('/events')
    revalidatePath(`/events/${eventId}`)
    return { success: true, data: rsvp }
  } catch (error) {
    console.error('RSVP error:', error)
    return { success: false, error: 'Failed to RSVP' }
  }
}

export async function cancelRsvp(eventId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const rsvp = await prisma.eventRsvp.findFirst({
      where: {
        eventId,
        userId: session.user.id,
        status: { not: RsvpStatus.CANCELLED },
      },
    })

    if (!rsvp) {
      return { success: false, error: 'RSVP not found' }
    }

    // Use transaction to cancel and potentially promote from waitlist
    await prisma.$transaction(async (tx) => {
      // Cancel the RSVP
      await tx.eventRsvp.update({
        where: { id: rsvp.id },
        data: {
          status: RsvpStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      })

      // If user was GOING, promote first person from waitlist
      if (rsvp.status === RsvpStatus.GOING) {
        const firstWaitlisted = await tx.eventRsvp.findFirst({
          where: {
            eventId,
            status: RsvpStatus.WAITLIST,
          },
          orderBy: { rsvpAt: 'asc' },
        })

        if (firstWaitlisted) {
          await tx.eventRsvp.update({
            where: { id: firstWaitlisted.id },
            data: { status: RsvpStatus.GOING },
          })
        }
      }
    })

    revalidatePath('/events')
    revalidatePath(`/events/${eventId}`)
    return { success: true }
  } catch (error) {
    console.error('Cancel RSVP error:', error)
    return { success: false, error: 'Failed to cancel RSVP' }
  }
}

export async function getEvents() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const isAdmin = hasMinRole(session.user.role, UserRole.ADMIN)

    // Get tenant-scoped events using proper isolation
    const localChurchWhere = await createTenantWhereClause(
      session.user,
      { scope: EventScope.LOCAL_CHURCH },
      undefined,
      'localChurchId'
    )

    let events = await prisma.event.findMany({
      where: {
        isActive: true,
        OR: [
          // WHOLE_CHURCH events visible to all
          { scope: EventScope.WHOLE_CHURCH },
          // LOCAL_CHURCH events using tenant isolation
          localChurchWhere,
        ],
      },
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
            name: true
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
    })

    // Filter by role visibility if not admin
    if (!isAdmin) {
      events = events.filter(event => 
        event.visibleToRoles.length === 0 || 
        event.visibleToRoles.includes(session.user.role)
      )
    }

    return { success: true, data: events }
  } catch (error) {
    console.error('Get events error:', error)
    return { success: false, error: 'Failed to fetch events' }
  }
}

export async function getEventById(eventId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

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
            name: true
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

    if (!event) {
      return { success: false, error: 'Event not found' }
    }

    const isAdmin = hasMinRole(session.user.role, UserRole.ADMIN)

    // Check visibility for non-admins
    if (!isAdmin) {
      if (event.visibleToRoles.length > 0 && 
          !event.visibleToRoles.includes(session.user.role)) {
        return { success: false, error: 'Event not available' }
      }

      if (event.scope === EventScope.LOCAL_CHURCH) {
        const whereClause = await createTenantWhereClause(
          session.user, 
          { id: eventId }, 
          undefined, 
          'localChurchId'
        )
        if (whereClause.localChurchId !== event.localChurchId) {
          return { success: false, error: 'Event not available' }
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

    return { 
      success: true, 
      data: {
        ...event,
        userRsvp,
      },
    }
  } catch (error) {
    console.error('Get event error:', error)
    return { success: false, error: 'Failed to fetch event' }
  }
}

export async function markAsPaid(rsvpId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Only admins can mark as paid
    if (!hasMinRole(session.user.role, UserRole.ADMIN)) {
      return { success: false, error: 'Unauthorized' }
    }

    const rsvp = await prisma.eventRsvp.update({
      where: { id: rsvpId },
      data: { hasPaid: true },
    })

    revalidatePath('/events')
    revalidatePath('/admin/events')
    return { success: true, data: rsvp }
  } catch (error) {
    console.error('Mark as paid error:', error)
    return { success: false, error: 'Failed to update payment status' }
  }
}

export async function exportEventAttendees(eventId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Only admins can export
    if (!hasMinRole(session.user.role, UserRole.ADMIN)) {
      return { success: false, error: 'Unauthorized' }
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      return { success: false, error: 'Event not found' }
    }

    // Verify admin has access to this event using tenant isolation
    if (event.scope === EventScope.LOCAL_CHURCH) {
      const whereClause = await createTenantWhereClause(
        session.user, 
        {}, 
        undefined, 
        'localChurchId'
      )
      if (session.user.role !== UserRole.SUPER_ADMIN && 
          whereClause.localChurchId !== event.localChurchId) {
        return { success: false, error: 'Unauthorized' }
      }
    }

    const rsvps = await prisma.eventRsvp.findMany({
      where: { 
        eventId,
        status: { not: RsvpStatus.CANCELLED },
      },
      select: {
        id: true,
        status: true,
        rsvpAt: true,
        hasPaid: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { rsvpAt: 'asc' },
    })

    // Generate CSV
    const csvHeader = 'Name,Email,Status,Paid,RSVP Date\n'
    const csvRows = rsvps.map(rsvp => {
      const name = rsvp.user.name || 'N/A'
      const email = rsvp.user.email
      const status = rsvp.status
      const paid = rsvp.hasPaid ? 'Yes' : 'No'
      const date = rsvp.rsvpAt.toLocaleDateString()
      return `${name},${email},${status},${paid},${date}`
    }).join('\n')

    const csv = csvHeader + csvRows

    return { success: true, data: csv }
  } catch (error) {
    console.error('Export error:', error)
    return { success: false, error: 'Failed to export attendees' }
  }
}