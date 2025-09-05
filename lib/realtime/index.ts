/**
 * Realtime Module - WebSocket Client with React Query Integration
 * 
 * Provides real-time updates with JWT authentication, SSE fallback,
 * and automatic React Query cache updates.
 */

export { RealtimeClient, getRealtimeClient } from './client'
export type { RealtimeEvent, RealtimeMetrics, RealtimeClientConfig } from './client'

export {
  useRealtimeSubscriptions,
  useAttendanceSubscriptions,
  useEventSubscriptions,
  useMemberSubscriptions,
  useAnnouncementSubscriptions,
  useDashboardSubscriptions
} from './subscriptions'
export type { SubscriptionConfig } from './subscriptions'