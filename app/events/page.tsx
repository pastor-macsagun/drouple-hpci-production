export const dynamic = 'force-dynamic'

import { getEvents } from './actions'
import { EventCard } from './event-card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserRole } from '@prisma/client'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/patterns/empty-state'
import { Calendar, Plus } from 'lucide-react'
import { getCurrentUser } from '@/lib/rbac'

export default async function EventsPage() {
  const user = await getCurrentUser()
  const isAdmin = user?.role === UserRole.ADMIN || 
                 user?.role === UserRole.SUPER_ADMIN

  const result = await getEvents()
  
  if (!result.success) {
    return (
      <AppLayout user={user ? {email: user.email || '', name: user.name, role: user.role} : undefined}>
        <PageHeader title="Events" description="Browse and RSVP for upcoming events" />
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-center">
          <p className="text-destructive">
            Failed to load events. Please try again later.
          </p>
        </div>
      </AppLayout>
    )
  }

  const events = result.data || []

  return (
    <AppLayout user={user ? {email: user.email || '', name: user.name, role: user.role} : undefined}>
      <PageHeader 
        title="Events" 
        description="Browse and RSVP for upcoming events"
      >
        {isAdmin && (
          <Button asChild>
            <Link href="/admin/events/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Link>
          </Button>
        )}
      </PageHeader>

      {events.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-12 w-12" />}
          title="No events available"
          description="Check back later for upcoming events or contact your church administrator"
          action={isAdmin ? {
            label: "Create First Event",
            href: "/admin/events/new"
          } : undefined}
        />
      ) : (
        <div className="card-grid">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </AppLayout>
  )
}