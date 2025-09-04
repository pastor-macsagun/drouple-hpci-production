import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createTenantWhereClause } from '@/lib/rbac'
import { EventScope, RsvpStatus } from '@prisma/client'
import { z } from 'zod'

const rsvpSchema = z.object({
  isNewBeliever: z.boolean().default(false).optional(),
  notes: z.string().optional()
})

export async function POST(
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
    const body = await request.json()
    
    // Validate input (optional fields for mobile)
    const { isNewBeliever, notes } = rsvpSchema.parse(body)

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event || !event.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Event not available',
          code: 'EVENT_NOT_AVAILABLE'
        },
        { status: 404 }
      )
    }

    // Check role-based visibility
    if (event.visibleToRoles.length > 0 && 
        !event.visibleToRoles.includes(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Event not available',
          code: 'EVENT_NOT_AVAILABLE'
        },
        { status: 403 }
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
            error: 'Event not available',
            code: 'EVENT_NOT_AVAILABLE'
          },
          { status: 403 }
        )
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
      return NextResponse.json(
        {
          success: false,
          error: 'Already registered for this event',
          code: 'ALREADY_REGISTERED',
          data: {
            rsvp: {
              id: existingRsvp.id,
              status: existingRsvp.status,
              rsvpAt: existingRsvp.rsvpAt,
              hasPaid: existingRsvp.hasPaid
            }
          }
        },
        { status: 409 }
      )
    }

    // Atomic capacity check and RSVP creation
    const rsvp = await prisma.$transaction(async (tx) => {
      // Count current attendees within transaction
      const currentAttendees = await tx.eventRsvp.count({
        where: {
          eventId,
          status: RsvpStatus.GOING,
        },
      })

      // Auto-waitlist when at capacity
      const status = currentAttendees < event.capacity 
        ? RsvpStatus.GOING 
        : RsvpStatus.WAITLIST

      // Create RSVP within same transaction
      const newRsvp = await tx.eventRsvp.create({
        data: {
          eventId,
          userId: session.user.id,
          status,
        },
      })

      // Store notes if provided
      if (notes) {
        const notesKey = `rsvp_notes_${newRsvp.id}`
        await tx.keyValue.create({
          key: notesKey,
          value: JSON.stringify({
            rsvpId: newRsvp.id,
            notes,
            createdAt: new Date().toISOString()
          })
        }).catch(() => {
          // Notes storage is optional
        })
      }

      return newRsvp
    }, {
      isolationLevel: 'Serializable'
    })

    // Handle new believer logic if specified
    if (isNewBeliever) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { isNewBeliever: true }
      }).catch(() => {
        // Don't fail RSVP if user update fails
      })

      // Auto-enroll in ROOTS pathway
      const rootsPathway = await prisma.pathway.findFirst({
        where: {
          type: 'ROOTS',
          tenantId: session.user.tenantId || undefined
        }
      })

      if (rootsPathway) {
        await prisma.pathwayEnrollment.create({
          data: {
            pathwayId: rootsPathway.id,
            userId: session.user.id
          }
        }).catch(() => {
          // Ignore duplicate enrollment errors
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        rsvp: {
          id: rsvp.id,
          eventId: rsvp.eventId,
          status: rsvp.status,
          rsvpAt: rsvp.rsvpAt,
          hasPaid: rsvp.hasPaid
        },
        event: {
          id: event.id,
          name: event.name,
          requiresPayment: event.requiresPayment,
          feeAmount: event.feeAmount
        },
        message: rsvp.status === RsvpStatus.GOING 
          ? 'RSVP successful! You are confirmed for this event.'
          : 'You have been added to the waitlist. We will notify you if a spot opens up.'
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('RSVP error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to RSVP',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const rsvp = await prisma.eventRsvp.findFirst({
      where: {
        eventId,
        userId: session.user.id,
        status: { not: RsvpStatus.CANCELLED },
      },
    })

    if (!rsvp) {
      return NextResponse.json(
        {
          success: false,
          error: 'RSVP not found',
          code: 'RSVP_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Atomic cancellation with waitlist promotion
    await prisma.$transaction(async (tx) => {
      // Cancel the user's RSVP
      await tx.eventRsvp.update({
        where: { id: rsvp.id },
        data: {
          status: RsvpStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      })

      // Promote waitlisted person when GOING attendee cancels
      if (rsvp.status === RsvpStatus.GOING) {
        const firstWaitlisted = await tx.eventRsvp.findFirst({
          where: {
            eventId,
            status: RsvpStatus.WAITLIST,
          },
          orderBy: { rsvpAt: 'asc' }, // FIFO promotion
        })

        if (firstWaitlisted) {
          await tx.eventRsvp.update({
            where: { id: firstWaitlisted.id },
            data: { status: RsvpStatus.GOING },
          })
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        message: 'RSVP cancelled successfully'
      }
    })

  } catch (error) {
    console.error('Cancel RSVP error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cancel RSVP',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}