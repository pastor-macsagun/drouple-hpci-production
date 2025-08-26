import { getEvents } from '@/app/events/actions'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EventScope, UserRole } from '@prisma/client'
import { Calendar, MapPin, Users, Edit, Eye } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { getCurrentUser } from '@/lib/rbac'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminEventsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  if (!([UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN] as UserRole[]).includes(user.role)) {
    redirect('/dashboard')
  }
  const result = await getEvents()
  
  if (!result.success) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600">
          Failed to load events. Please try again later.
        </div>
      </div>
    )
  }

  const events = result.data || []

  return (
    <AppLayout user={user}>
      <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Events</h1>
        <Link href="/admin/events/new">
          <Button>Create Event</Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">No events created yet.</p>
            <Link href="/admin/events/new">
              <Button className="mt-4">Create Your First Event</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const startDate = new Date(event.startDateTime)
            const attendeeCount = event._count.rsvps
            const isFull = attendeeCount >= event.capacity

            return (
              <Card key={event.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{event.name}</CardTitle>
                      {event.description && (
                        <CardDescription>{event.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {event.scope === EventScope.WHOLE_CHURCH && (
                        <Badge variant="secondary">All Churches</Badge>
                      )}
                      {!event.isActive && (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{startDate.toLocaleDateString()}</span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>
                        {attendeeCount} / {event.capacity}
                        {isFull && <Badge variant="destructive" className="ml-2">Full</Badge>}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/admin/events/${event.id}`}>
                      <Button size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/admin/events/${event.id}/edit`}>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      </div>
    </AppLayout>
  )
}