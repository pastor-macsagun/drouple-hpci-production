import { getEvents } from '@/app/events/actions'
import { UserRole } from '@prisma/client'
import { AppLayout } from '@/components/layout/app-layout'
import { getCurrentUser } from '@/lib/rbac'
import { redirect } from 'next/navigation'
import { EventsManager } from './events-manager'

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
      <AppLayout user={user}>
        <div className="container mx-auto p-6">
          <div className="text-center text-destructive">
            Failed to load events. Please try again later.
          </div>
        </div>
      </AppLayout>
    )
  }

  const events = result.data || []

  return (
    <AppLayout user={user}>
      <EventsManager initialEvents={events} />
    </AppLayout>
  )
}