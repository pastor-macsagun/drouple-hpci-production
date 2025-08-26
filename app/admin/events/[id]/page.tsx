import { getEventById } from '@/app/events/actions'
import { AttendeesList } from '@/app/events/[id]/attendees-list'
import { ExportButton } from './export-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Calendar, MapPin, Users, DollarSign, Edit, ArrowLeft } from 'lucide-react'
import { EventScope, RsvpStatus, UserRole } from '@prisma/client'
import { AppLayout } from '@/components/layout/app-layout'
import { getCurrentUser } from '@/lib/rbac'
import { redirect } from 'next/navigation'

export default async function AdminEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  if (!([UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN] as UserRole[]).includes(user.role)) {
    redirect('/dashboard')
  }
  const resolvedParams = await params
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
  const goingCount = event.rsvps.filter(r => r.status === RsvpStatus.GOING).length
  const waitlistCount = event.rsvps.filter(r => r.status === RsvpStatus.WAITLIST).length
  const paidCount = event.rsvps.filter(r => r.hasPaid).length
  const totalRevenue = event.requiresPayment && event.feeAmount 
    ? paidCount * event.feeAmount 
    : 0

  return (
    <AppLayout user={user}>
      <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <Link href="/admin/events">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </Link>
        <div className="flex gap-2">
          <ExportButton eventId={event.id} eventName={event.name} />
          <Link href={`/admin/events/${resolvedParams.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Event
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{event.name}</CardTitle>
                  {event.description && (
                    <CardDescription className="mt-2">
                      {event.description}
                    </CardDescription>
                  )}
                </div>
                {event.scope === EventScope.WHOLE_CHURCH && (
                  <Badge variant="secondary">All Churches</Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div className="text-sm">
                      <p className="font-medium">Date & Time</p>
                      <p>{startDate.toLocaleString()}</p>
                    </div>
                  </div>

                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div className="text-sm">
                        <p className="font-medium">Location</p>
                        <p>{event.location}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <div className="text-sm">
                      <p className="font-medium">Capacity</p>
                      <p>{event.capacity} total spots</p>
                    </div>
                  </div>

                  {event.requiresPayment && event.feeAmount && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <div className="text-sm">
                        <p className="font-medium">Fee</p>
                        <p>${event.feeAmount.toFixed(2)} per person</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Attendees</h3>
                <AttendeesList 
                  eventId={event.id}
                  rsvps={event.rsvps} 
                  requiresPayment={event.requiresPayment}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Registration Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Going</span>
                <span className="font-medium">{goingCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Waitlist</span>
                <span className="font-medium">{waitlistCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Registered</span>
                <span className="font-medium">{goingCount + waitlistCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Spots Available</span>
                <span className="font-medium">{Math.max(0, event.capacity - goingCount)}</span>
              </div>
            </CardContent>
          </Card>

          {event.requiresPayment && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Paid</span>
                  <span className="font-medium">{paidCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="font-medium">{goingCount - paidCount}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Revenue</span>
                    <span className="font-semibold text-green-600">
                      ${totalRevenue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Visibility Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {event.visibleToRoles.length === 0 ? (
                <p className="text-sm text-gray-600">Visible to all members</p>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Restricted to:</p>
                  <div className="flex flex-wrap gap-1">
                    {event.visibleToRoles.map(role => (
                      <Badge key={role} variant="outline">{role}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </AppLayout>
  )
}