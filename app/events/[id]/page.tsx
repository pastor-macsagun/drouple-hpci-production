import { getEventById } from '../actions'
import { RsvpButton } from './rsvp-button'
import { AttendeesList } from './attendees-list'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Users, DollarSign, Clock } from 'lucide-react'
import { auth } from '@/lib/auth'
import { UserRole, EventScope, RsvpStatus } from '@prisma/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/components/layout/app-layout'
import { getCurrentUser } from '@/lib/rbac'

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const user = await getCurrentUser()
  const session = await auth()
  const isAdmin = session?.user?.role === UserRole.ADMIN || 
                 session?.user?.role === UserRole.SUPER_ADMIN

  const result = await getEventById(resolvedParams.id)
  
  if (!result.success || !result.data) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600">
          {result.error || 'Event not found'}
        </div>
      </div>
    )
  }

  const event = result.data
  const startDate = new Date(event.startDateTime)
  const endDate = new Date(event.endDateTime)
  const goingCount = event.rsvps.filter(r => r.status === RsvpStatus.GOING).length
  const waitlistCount = event.rsvps.filter(r => r.status === RsvpStatus.WAITLIST).length
  const spotsLeft = Math.max(0, event.capacity - goingCount)
  const isFull = spotsLeft === 0

  return (
    <AppLayout user={user || undefined}>
      <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/events">
          <Button variant="ghost">← Back to Events</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl">{event.name}</CardTitle>
              {event.description && (
                <CardDescription className="mt-2 text-lg">
                  {event.description}
                </CardDescription>
              )}
            </div>
            <div className="flex gap-2">
              {event.scope === EventScope.WHOLE_CHURCH && (
                <Badge variant="secondary">All Churches</Badge>
              )}
              {isAdmin && (
                <Link href={`/admin/events/${resolvedParams.id}`}>
                  <Button variant="outline">Manage</Button>
                </Link>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">Date & Time</p>
                  <p className="text-sm text-gray-600">
                    {startDate.toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' - '}
                    {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-gray-600">{event.location}</p>
                  </div>
                </div>
              )}

              {event.requiresPayment && event.feeAmount && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Fee</p>
                    <p className="text-sm text-gray-600">${event.feeAmount.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">Attendance</p>
                  <p className="text-sm text-gray-600">
                    {goingCount} / {event.capacity} attending
                    {isFull && <Badge variant="destructive" className="ml-2">Full</Badge>}
                    {!isFull && spotsLeft <= 5 && (
                      <Badge variant="outline" className="ml-2">{spotsLeft} spots left</Badge>
                    )}
                  </p>
                  {waitlistCount > 0 && (
                    <p className="text-sm text-gray-600">
                      {waitlistCount} on waitlist
                    </p>
                  )}
                </div>
              </div>

              {event.localChurch && (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Hosted by</p>
                    <p className="text-sm text-gray-600">{event.localChurch.name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            <RsvpButton 
              eventId={event.id} 
              userRsvp={event.userRsvp}
              isFull={isFull}
              requiresPayment={event.requiresPayment}
            />
          </div>

          {isAdmin && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Attendees</h3>
              <AttendeesList 
                eventId={event.id}
                rsvps={event.rsvps} 
                requiresPayment={event.requiresPayment}
              />
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </AppLayout>
  )
}