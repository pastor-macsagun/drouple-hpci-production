/**
 * Realtime WebSocket Client with JWT Authentication and SSE Fallback
 * 
 * Provides real-time updates for:
 * - attendance.created|updated
 * - event.created|updated  
 * - member.updated
 * - announcement.published
 */

import { getSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'

export interface RealtimeEvent {
  type: 'attendance.created' | 'attendance.updated' | 'event.created' | 'event.updated' | 'member.updated' | 'announcement.published'
  tenantId: string
  data: Record<string, unknown>
  timestamp: number
  eventId: string
}

export interface RealtimeMetrics {
  backlog: number
  handlerLatency: number
  lastEventTime?: number
  eventCount: number
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error'
  p95Latency: number
}

export interface RealtimeClientConfig {
  url?: string
  enableSSEFallback?: boolean
  maxRetries?: number
  retryDelay?: number
  heartbeatInterval?: number
}

export class RealtimeClient {
  private socket: Socket | null = null
  private eventSource: EventSource | null = null
  private isConnected = false
  private subscribers = new Map<string, Set<(event: RealtimeEvent) => void>>()
  private eventQueue: RealtimeEvent[] = []
  private metrics: RealtimeMetrics = {
    backlog: 0,
    handlerLatency: 0,
    eventCount: 0,
    connectionState: 'disconnected',
    p95Latency: 0
  }
  private latencyBuffer: number[] = []
  private maxLatencyBufferSize = 100
  private config: Required<RealtimeClientConfig>
  private tenantId: string | null = null
  private retryCount = 0
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private throttleTimer: ReturnType<typeof setTimeout> | null = null

  constructor(config: RealtimeClientConfig = {}) {
    this.config = {
      url: process.env.NEXT_PUBLIC_REALTIME_URL || 'ws://localhost:3001',
      enableSSEFallback: true,
      maxRetries: 5,
      retryDelay: 1000,
      heartbeatInterval: 30000,
      ...config
    }
  }

  async connect(): Promise<void> {
    const session = await getSession()
    if (!session?.user?.tenantId) {
      throw new Error('No valid session found')
    }

    this.tenantId = session.user.tenantId
    this.metrics.connectionState = 'connecting'

    try {
      await this.connectWebSocket(session)
    } catch (error) {
      console.warn('[RealtimeClient] WebSocket failed, trying SSE fallback:', error)
      if (this.config.enableSSEFallback) {
        await this.connectSSE(session)
      } else {
        throw error
      }
    }

    this.startHeartbeat()
  }

  private async connectWebSocket(session: { accessToken?: string; user: { id: string } }): Promise<void> {
    return new Promise((resolve, reject) => {
      const token = session.accessToken || session.user.id

      this.socket = io(this.config.url, {
        auth: {
          token,
          tenantId: this.tenantId
        },
        transports: ['websocket'],
        timeout: 10000
      })

      this.socket.on('connect', () => {
        this.isConnected = true
        this.retryCount = 0
        this.metrics.connectionState = 'connected'
        console.log('[RealtimeClient] WebSocket connected')
        resolve()
      })

      this.socket.on('disconnect', () => {
        this.isConnected = false
        this.metrics.connectionState = 'disconnected'
        console.log('[RealtimeClient] WebSocket disconnected')
        this.handleReconnect()
      })

      this.socket.on('connect_error', (error) => {
        this.metrics.connectionState = 'error'
        console.error('[RealtimeClient] WebSocket connection error:', error)
        reject(error)
      })

      this.socket.on('realtime-event', (event: RealtimeEvent) => {
        this.handleEvent(event)
      })

      this.socket.on('pong', () => {
        // Heartbeat response received
      })
    })
  }

  private async connectSSE(session: { accessToken?: string; user: { id: string } }): Promise<void> {
    return new Promise((resolve, reject) => {
      const token = session.accessToken || session.user.id
      const url = new URL('/api/realtime/sse', this.config.url.replace(/^ws/, 'http'))
      url.searchParams.set('token', token)
      url.searchParams.set('tenantId', this.tenantId!)

      this.eventSource = new EventSource(url.toString())

      this.eventSource.onopen = () => {
        this.isConnected = true
        this.retryCount = 0
        this.metrics.connectionState = 'connected'
        console.log('[RealtimeClient] SSE connected')
        resolve()
      }

      this.eventSource.onmessage = (event) => {
        try {
          const realtimeEvent: RealtimeEvent = JSON.parse(event.data)
          this.handleEvent(realtimeEvent)
        } catch (error) {
          console.error('[RealtimeClient] Failed to parse SSE event:', error)
        }
      }

      this.eventSource.onerror = (error) => {
        this.isConnected = false
        this.metrics.connectionState = 'error'
        console.error('[RealtimeClient] SSE error:', error)
        if (this.eventSource?.readyState === EventSource.CLOSED) {
          reject(error)
        }
        this.handleReconnect()
      }
    })
  }

  private handleEvent(event: RealtimeEvent): void {
    const startTime = performance.now()
    
    // Add to queue for throttling
    this.eventQueue.push(event)
    this.metrics.backlog = this.eventQueue.length
    this.metrics.eventCount++

    // Process events with throttling
    if (!this.throttleTimer) {
      this.throttleTimer = setTimeout(() => {
        this.processEventQueue()
        this.throttleTimer = null
      }, 100) // 100ms throttle
    }

    // Update latency metrics
    const latency = performance.now() - startTime
    this.recordLatency(latency)
  }

  private processEventQueue(): void {
    // Coalesce events of the same type
    const coalescedEvents = this.coalesceEvents(this.eventQueue)
    this.eventQueue = []
    this.metrics.backlog = 0

    // Dispatch events to subscribers
    for (const event of coalescedEvents) {
      const eventKey = `${event.type}:${event.tenantId}`
      const typeSubscribers = this.subscribers.get(event.type) || new Set()
      const tenantSubscribers = this.subscribers.get(eventKey) || new Set()

      const allSubscribers = new Set([...typeSubscribers, ...tenantSubscribers])
      
      for (const callback of allSubscribers) {
        try {
          callback(event)
        } catch (error) {
          console.error('[RealtimeClient] Subscriber error:', error)
        }
      }
    }
  }

  private coalesceEvents(events: RealtimeEvent[]): RealtimeEvent[] {
    const eventMap = new Map<string, RealtimeEvent>()

    for (const event of events) {
      const key = `${event.type}:${event.tenantId}:${JSON.stringify(event.data.id || event.data)}`
      
      // Keep only the latest event for each unique key
      if (!eventMap.has(key) || event.timestamp > eventMap.get(key)!.timestamp) {
        eventMap.set(key, event)
      }
    }

    return Array.from(eventMap.values()).sort((a, b) => a.timestamp - b.timestamp)
  }

  private recordLatency(latency: number): void {
    this.latencyBuffer.push(latency)
    
    if (this.latencyBuffer.length > this.maxLatencyBufferSize) {
      this.latencyBuffer.shift()
    }

    // Calculate p95 latency
    const sorted = [...this.latencyBuffer].sort((a, b) => a - b)
    const p95Index = Math.floor(sorted.length * 0.95)
    this.metrics.p95Latency = sorted[p95Index] || 0
    this.metrics.handlerLatency = latency

    // Warn if p95 fan-out > 2s (2000ms)
    if (this.metrics.p95Latency > 2000) {
      console.warn(`[RealtimeClient] High p95 latency detected: ${this.metrics.p95Latency.toFixed(2)}ms`)
    }
  }

  private handleReconnect(): void {
    if (this.retryCount >= this.config.maxRetries) {
      console.error('[RealtimeClient] Max retries reached, giving up')
      return
    }

    const delay = this.config.retryDelay * Math.pow(2, this.retryCount)
    this.retryCount++

    setTimeout(() => {
      console.log(`[RealtimeClient] Attempting reconnect (${this.retryCount}/${this.config.maxRetries})`)
      this.connect().catch(error => {
        console.error('[RealtimeClient] Reconnect failed:', error)
      })
    }, delay)
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping')
      }
    }, this.config.heartbeatInterval)
  }

  subscribe(eventType: string, callback: (event: RealtimeEvent) => void): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set())
    }

    this.subscribers.get(eventType)!.add(callback)

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(eventType)
      if (subscribers) {
        subscribers.delete(callback)
        if (subscribers.size === 0) {
          this.subscribers.delete(eventType)
        }
      }
    }
  }

  subscribeTenant(eventType: string, tenantId: string, callback: (event: RealtimeEvent) => void): () => void {
    const key = `${eventType}:${tenantId}`
    return this.subscribe(key, callback)
  }

  getMetrics(): RealtimeMetrics {
    return { ...this.metrics }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }

    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }

    if (this.throttleTimer) {
      clearTimeout(this.throttleTimer)
      this.throttleTimer = null
    }

    this.isConnected = false
    this.subscribers.clear()
    this.eventQueue = []
    this.metrics.connectionState = 'disconnected'
  }

  isClientConnected(): boolean {
    return this.isConnected
  }
}

// Global singleton instance
let realtimeClient: RealtimeClient | null = null

export function getRealtimeClient(): RealtimeClient {
  if (!realtimeClient) {
    realtimeClient = new RealtimeClient()
  }
  return realtimeClient
}