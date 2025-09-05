/**
 * Realtime Subscriptions Unit Tests
 * 
 * Tests basic subscription functionality without JSX
 */

import { describe, it, expect, vi } from 'vitest'

// Mock the realtime client
vi.mock('@/lib/realtime/client', () => ({
  getRealtimeClient: vi.fn(() => ({
    connect: vi.fn(),
    subscribeTenant: vi.fn(() => vi.fn()),
    isClientConnected: vi.fn(() => true),
    getMetrics: vi.fn(() => ({
      backlog: 0,
      handlerLatency: 0,
      eventCount: 0,
      connectionState: 'connected',
      p95Latency: 0
    }))
  }))
}))

describe('Realtime Subscriptions', () => {
  it('should export subscription hooks', async () => {
    const { useAttendanceSubscriptions } = await import('@/lib/realtime/subscriptions')
    expect(typeof useAttendanceSubscriptions).toBe('function')
  })

  it('should export event subscriptions', async () => {
    const { useEventSubscriptions } = await import('@/lib/realtime/subscriptions')
    expect(typeof useEventSubscriptions).toBe('function')
  })

  it('should export dashboard subscriptions', async () => {
    const { useDashboardSubscriptions } = await import('@/lib/realtime/subscriptions')
    expect(typeof useDashboardSubscriptions).toBe('function')
  })
})