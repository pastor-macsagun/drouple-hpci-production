export const dynamic = 'force-dynamic'

import { RealtimeEventsContent } from './realtime-events-content'
import { AppLayout } from '@/components/layout/app-layout'
import { getCurrentUser } from '@/lib/rbac'
import { DataFetchErrorBoundary } from '@/components/patterns/error-boundary'

export default async function EventsPage() {
  const user = await getCurrentUser()

  return (
    <AppLayout user={user ? {email: user.email || '', name: user.name, role: user.role} : undefined}>
      <DataFetchErrorBoundary>
        <RealtimeEventsContent 
          user={user ? {
            id: user.id,
            role: user.role,
            email: user.email,
            name: user.name
          } : null} 
        />
      </DataFetchErrorBoundary>
    </AppLayout>
  )
}