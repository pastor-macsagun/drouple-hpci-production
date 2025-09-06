import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasMinRole, createTenantWhereClause } from '@/lib/rbac'
import { UserRole, EventScope, RsvpStatus } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new Response('Not authenticated', { status: 401 })
    }

    // Only admins can export
    if (!hasMinRole(session.user.role, UserRole.ADMIN)) {
      return new Response('Unauthorized', { status: 403 })
    }

    const event = await prisma.event.findUnique({
      where: { id: params.eventId },
      select: {
        id: true,
        name: true,
        scope: true,
        localChurchId: true,
        requiresPayment: true,
      }
    })

    if (!event) {
      return new Response('Event not found', { status: 404 })
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
        return new Response('Cannot export attendees for another church', { status: 403 })
      }
    }

    const rsvps = await prisma.eventRsvp.findMany({
      where: { 
        eventId: params.eventId,
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

    // Generate CSV with proper headers
    const headers = [
      'Name',
      'Email', 
      'Status',
      'Payment Status',
      'RSVP Date'
    ]

    const rows = [
      headers,
      ...rsvps.map(rsvp => [
        rsvp.user.name || 'N/A',
        rsvp.user.email,
        rsvp.status,
        event.requiresPayment ? (rsvp.hasPaid ? 'PAID' : 'UNPAID') : 'N/A',
        rsvp.rsvpAt.toLocaleDateString()
      ])
    ]

    const csv = rows.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${event.name.replace(/[^a-z0-9]/gi, '_')}_attendees.csv"`
      }
    })
  } catch (error) {
    console.error('Export attendees error:', error)
    return new Response('Failed to export attendees', { status: 500 })
  }
}