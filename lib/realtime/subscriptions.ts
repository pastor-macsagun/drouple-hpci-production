/**
 * Realtime Subscriptions with React Query Cache Integration
 * 
 * Handles incremental cache updates for:
 * - attendance.created|updated
 * - event.created|updated
 * - member.updated  
 * - announcement.published
 */

import { useQueryClient, QueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { getRealtimeClient, RealtimeEvent } from './client'
import { useSession } from 'next-auth/react'

export interface SubscriptionConfig {
  events: string[]
  enableAutoInvalidate?: boolean
  enableOptimisticUpdates?: boolean
}

interface Attendance {
  id: string
  memberId: string
  serviceId: string
  [key: string]: unknown
}

interface Event {
  id: string
  [key: string]: unknown
}

interface Member {
  id: string
  [key: string]: unknown
}

interface Announcement {
  id: string
  [key: string]: unknown
}


/**
 * Hook to manage realtime subscriptions with React Query cache integration
 */
export function useRealtimeSubscriptions(config: SubscriptionConfig) {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const unsubscribeFunctions = useRef<(() => void)[]>([])
  const realtimeClient = getRealtimeClient()

  useEffect(() => {
    if (!session?.user?.tenantId) return

    const connect = async () => {
      try {
        if (!realtimeClient.isClientConnected()) {
          await realtimeClient.connect()
        }

        // Subscribe to each event type
        for (const eventType of config.events) {
          const unsubscribe = realtimeClient.subscribeTenant(
            eventType,
            session.user.tenantId!,
            (event: RealtimeEvent) => {
              handleRealtimeEvent(event, queryClient, config)
            }
          )
          unsubscribeFunctions.current.push(unsubscribe)
        }
      } catch (error) {
        console.error('[RealtimeSubscriptions] Failed to connect:', error)
      }
    }

    connect()

    return () => {
      // Cleanup subscriptions
      unsubscribeFunctions.current.forEach(unsubscribe => unsubscribe())
      unsubscribeFunctions.current = []
    }
  }, [session?.user?.tenantId, config, queryClient, realtimeClient])

  return {
    isConnected: realtimeClient.isClientConnected(),
    metrics: realtimeClient.getMetrics()
  }
}

/**
 * Handle realtime events and update React Query cache
 */
function handleRealtimeEvent(
  event: RealtimeEvent,
  queryClient: QueryClient,
  config: SubscriptionConfig
) {

  switch (event.type) {
    case 'attendance.created':
    case 'attendance.updated':
      handleAttendanceEvent(event, queryClient, config)
      break
    
    case 'event.created':
    case 'event.updated':
      handleEventEvent(event, queryClient, config)
      break
      
    case 'member.updated':
      handleMemberEvent(event, queryClient, config)
      break
      
    case 'announcement.published':
      handleAnnouncementEvent(event, queryClient, config)
      break
      
    default:
      console.warn('[RealtimeSubscriptions] Unhandled event type:', event.type)
  }
}

/**
 * Handle attendance events - update service attendance, member check-ins
 */
function handleAttendanceEvent(
  event: RealtimeEvent,
  queryClient: QueryClient,
  config: SubscriptionConfig
) {
  const { data } = event

  // Update service attendance lists
  if (config.enableOptimisticUpdates) {
    queryClient.setQueryData(
      ['services', data.serviceId, 'attendances'],
      (old: Attendance[]) => {
        if (!old) return old

        const existingIndex = old.findIndex((attendance: Attendance) => 
          attendance.id === data.id || attendance.memberId === data.memberId
        )

        if (event.type === 'attendance.created') {
          return existingIndex >= 0 ? old : [...old, data]
        } else {
          return existingIndex >= 0 
            ? old.map((attendance: Attendance, index: number) => 
                index === existingIndex ? { ...attendance, ...data } : attendance
              )
            : old
        }
      }
    )
  }

  // Invalidate related queries
  if (config.enableAutoInvalidate !== false) {
    queryClient.invalidateQueries({ queryKey: ['services', data.serviceId] })
    queryClient.invalidateQueries({ queryKey: ['attendances'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
  }
}

/**
 * Handle event events - update event lists, RSVPs
 */
function handleEventEvent(
  event: RealtimeEvent,
  queryClient: QueryClient,
  config: SubscriptionConfig
) {
  const { data } = event

  // Update events list
  if (config.enableOptimisticUpdates) {
    queryClient.setQueryData(['events'], (old: Event[]) => {
      if (!old) return old

      const existingIndex = old.findIndex((evt: Event) => evt.id === data.id)

      if (event.type === 'event.created') {
        return existingIndex >= 0 ? old : [data, ...old]
      } else {
        return existingIndex >= 0
          ? old.map((evt: Event, index: number) =>
              index === existingIndex ? { ...evt, ...data } : evt
            )
          : old
      }
    })

    // Update individual event cache
    queryClient.setQueryData(['events', data.id], (old: Event[]) => {
      return old ? { ...old, ...data } : data
    })
  }

  // Invalidate related queries
  if (config.enableAutoInvalidate !== false) {
    queryClient.invalidateQueries({ queryKey: ['events'] })
    queryClient.invalidateQueries({ queryKey: ['events', data.id] })
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'upcoming-events'] })
  }
}

/**
 * Handle member events - update member profiles, directories
 */
function handleMemberEvent(
  event: RealtimeEvent,
  queryClient: QueryClient,
  config: SubscriptionConfig
) {
  const { data } = event

  // Update members list
  if (config.enableOptimisticUpdates) {
    queryClient.setQueryData(['members'], (old: Member[]) => {
      if (!old) return old

      const existingIndex = old.findIndex((member: Member) => member.id === data.id)
      
      return existingIndex >= 0
        ? old.map((member: Member, index: number) =>
            index === existingIndex ? { ...member, ...data } : member
          )
        : old
    })

    // Update individual member cache
    queryClient.setQueryData(['members', data.id], (old: Event[]) => {
      return old ? { ...old, ...data } : data
    })
  }

  // Invalidate related queries
  if (config.enableAutoInvalidate !== false) {
    queryClient.invalidateQueries({ queryKey: ['members'] })
    queryClient.invalidateQueries({ queryKey: ['members', data.id] })
    queryClient.invalidateQueries({ queryKey: ['directory'] })
  }
}

/**
 * Handle announcement events - update announcement feeds
 */
function handleAnnouncementEvent(
  event: RealtimeEvent,
  queryClient: QueryClient,
  config: SubscriptionConfig
) {
  const { data } = event

  // Update announcements list
  if (config.enableOptimisticUpdates) {
    queryClient.setQueryData(['announcements'], (old: Announcement[]) => {
      if (!old) return old

      const existingIndex = old.findIndex((announcement: Announcement) => 
        announcement.id === data.id
      )

      return existingIndex >= 0 ? old : [data, ...old]
    })
  }

  // Invalidate related queries
  if (config.enableAutoInvalidate !== false) {
    queryClient.invalidateQueries({ queryKey: ['announcements'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'announcements'] })
  }
}

/**
 * Hook for specific attendance subscriptions
 */
export function useAttendanceSubscriptions() {
  return useRealtimeSubscriptions({
    events: ['attendance.created', 'attendance.updated'],
    enableOptimisticUpdates: true
  })
}

/**
 * Hook for specific event subscriptions
 */
export function useEventSubscriptions() {
  return useRealtimeSubscriptions({
    events: ['event.created', 'event.updated'],
    enableOptimisticUpdates: true
  })
}

/**
 * Hook for specific member subscriptions
 */
export function useMemberSubscriptions() {
  return useRealtimeSubscriptions({
    events: ['member.updated'],
    enableOptimisticUpdates: true
  })
}

/**
 * Hook for announcement subscriptions
 */
export function useAnnouncementSubscriptions() {
  return useRealtimeSubscriptions({
    events: ['announcement.published'],
    enableOptimisticUpdates: true
  })
}

/**
 * Hook for dashboard - subscribes to all relevant events
 */
export function useDashboardSubscriptions() {
  return useRealtimeSubscriptions({
    events: [
      'attendance.created',
      'attendance.updated',
      'event.created',
      'event.updated',
      'announcement.published'
    ],
    enableOptimisticUpdates: false, // Dashboard prefers invalidation over optimistic updates
    enableAutoInvalidate: true
  })
}