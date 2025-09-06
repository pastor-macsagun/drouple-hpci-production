'use client'

/**
 * Realtime Events Content Component
 * 
 * Client-side version that:
 * - Uses React Query for event data
 * - Subscribes to event.created|updated events
 * - Shows live updates when events change
 */

import { useQuery } from '@tanstack/react-query'
import { EventCard } from './event-card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserRole } from '@prisma/client'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/patterns/empty-state'
import { Calendar, Plus, Wifi, WifiOff } from 'lucide-react'
import { useEventSubscriptions } from '@/lib/realtime'
import { EventLoadingCard } from '@/components/patterns/loading-card'
import { PullToRefresh } from '@/components/mobile/pull-to-refresh'
import { getEvents } from './actions'

interface RealtimeEventsContentProps {
  user: {
    id: string
    role: UserRole
    email: string | null
    name?: string | null
  } | null
}

async function fetchEvents() {
  const result = await getEvents()
  if (!result.success) {
    throw new Error(result.error || 'Failed to load events')
  }
  return result.data || []
}

export function RealtimeEventsContent({ user }: RealtimeEventsContentProps) {
  // Subscribe to realtime event updates
  const { isConnected, metrics } = useEventSubscriptions()

  const isAdmin = user?.role === UserRole.ADMIN || 
                 user?.role === UserRole.SUPER_ADMIN

  // Fetch events with React Query
  const { 
    data: events = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
    staleTime: 60000, // 1 minute
    gcTime: 300000,   // 5 minutes
    refetchInterval: isConnected ? false : 30000, // Poll only when not connected
  })

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Failed to load events</p>
        <Button 
          variant="outline" 
          onClick={() => refetch()}
        >
          Try Again
        </Button>
      </div>
    )
  }

  const handleRefresh = async () => {
    await refetch()
  }

  return (
    <>
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

      <PullToRefresh onRefresh={handleRefresh} className="min-h-[400px]">
        {/* Live connection indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-green-600">Live updates active</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Offline mode</span>
              </>
            )}
          </div>
        </div>

        {/* Performance warning */}
        {metrics.p95Latency > 2000 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-6">
            <p className="text-sm text-yellow-800">
              ⚠️ High update latency detected ({metrics.p95Latency.toFixed(0)}ms). 
              New events may take longer to appear.
            </p>
          </div>
        )}

        {/* Show event count and update info */}
        {metrics.eventCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-6">
            <p className="text-sm text-blue-800">
              📡 {metrics.eventCount} live updates received - events list is synchronized
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="card-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <EventLoadingCard key={i} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={<Calendar className="h-12 w-12" />}
            title="No events available"
            description={
              isConnected 
                ? "No upcoming events. New events will appear here automatically."
                : "Check back later for upcoming events or contact your church administrator"
            }
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
      </PullToRefresh>
    </>
  )
}