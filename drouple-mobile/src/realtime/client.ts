/**
 * Realtime WebSocket Client
 * Authenticates with mobile JWT, SSE fallback, throttled updates
 */

import { getSecureItem } from '../lib/auth/secure';

export type RealtimeEventType = 
  | 'attendance.created'
  | 'attendance.updated'
  | 'event.created'
  | 'event.updated'
  | 'member.updated'
  | 'announcement.published';

export interface RealtimeEvent {
  type: RealtimeEventType;
  data: any;
  timestamp: string;
  tenantId: string;
}

export interface RealtimeConfig {
  wsUrl?: string;
  sseUrl?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export type RealtimeEventHandler = (event: RealtimeEvent) => void;
export type RealtimeConnectionHandler = (connected: boolean) => void;

class RealtimeClient {
  private ws: WebSocket | null = null;
  private eventSource: EventSource | null = null;
  private config: Required<RealtimeConfig>;
  private isConnected = false;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  
  // Event handlers
  private eventHandlers = new Map<RealtimeEventType, Set<RealtimeEventHandler>>();
  private connectionHandlers = new Set<RealtimeConnectionHandler>();
  
  // Throttling for burst protection
  private eventQueue: RealtimeEvent[] = [];
  private processQueueTimer: NodeJS.Timeout | null = null;
  private readonly THROTTLE_DELAY = 100; // ms
  private readonly MAX_QUEUE_SIZE = 50;

  constructor(config: RealtimeConfig = {}) {
    this.config = {
      wsUrl: config.wsUrl || process.env.EXPO_PUBLIC_WS_URL || 'wss://staging.drouple.com/ws',
      sseUrl: config.sseUrl || process.env.EXPO_PUBLIC_SSE_URL || 'https://staging.drouple.com/sse',
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
    };
  }

  async connect(): Promise<void> {
    const token = await getSecureItem('auth_token');
    if (!token) {
      throw new Error('No authentication token available');
    }

    // Try WebSocket first, fall back to SSE
    try {
      await this.connectWebSocket(token);
    } catch (error) {
      console.warn('WebSocket connection failed, falling back to SSE:', error);
      await this.connectSSE(token);
    }
  }

  private async connectWebSocket(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `${this.config.wsUrl}?token=${encodeURIComponent(token)}`;
      this.ws = new WebSocket(wsUrl);

      const connectTimeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 10000);

      this.ws.onopen = () => {
        clearTimeout(connectTimeout);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.notifyConnectionChange(true);
        console.log('WebSocket connected');
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const realtimeEvent: RealtimeEvent = JSON.parse(event.data);
          this.enqueueEvent(realtimeEvent);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        clearTimeout(connectTimeout);
        this.handleDisconnection();
        
        if (event.code !== 1000) { // Not a normal closure
          console.warn('WebSocket closed unexpectedly:', event.code, event.reason);
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        clearTimeout(connectTimeout);
        console.error('WebSocket error:', error);
        reject(error);
      };
    });
  }

  private async connectSSE(token: string): Promise<void> {
    const sseUrl = `${this.config.sseUrl}?token=${encodeURIComponent(token)}`;
    this.eventSource = new EventSource(sseUrl);

    this.eventSource.onopen = () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectionChange(true);
      console.log('SSE connected');
    };

    this.eventSource.onmessage = (event) => {
      try {
        const realtimeEvent: RealtimeEvent = JSON.parse(event.data);
        this.enqueueEvent(realtimeEvent);
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      this.handleDisconnection();
      this.scheduleReconnect();
    };
  }

  private enqueueEvent(event: RealtimeEvent): void {
    // Add to queue
    this.eventQueue.push(event);
    
    // Limit queue size to prevent memory issues
    if (this.eventQueue.length > this.MAX_QUEUE_SIZE) {
      this.eventQueue.shift(); // Remove oldest event
    }

    // Schedule processing if not already scheduled
    if (!this.processQueueTimer) {
      this.processQueueTimer = setTimeout(() => {
        this.processEventQueue();
        this.processQueueTimer = null;
      }, this.THROTTLE_DELAY);
    }
  }

  private processEventQueue(): void {
    if (this.eventQueue.length === 0) return;

    // Process events in batches to avoid UI blocking
    const events = [...this.eventQueue];
    this.eventQueue = [];

    // Group by event type for more efficient processing
    const eventsByType = events.reduce((acc, event) => {
      if (!acc[event.type]) acc[event.type] = [];
      acc[event.type].push(event);
      return acc;
    }, {} as Record<RealtimeEventType, RealtimeEvent[]>);

    // Dispatch events by type
    for (const [type, typeEvents] of Object.entries(eventsByType)) {
      const handlers = this.eventHandlers.get(type as RealtimeEventType);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            // Pass the most recent event of each type (coalescence)
            const latestEvent = typeEvents[typeEvents.length - 1];
            handler(latestEvent);
          } catch (error) {
            console.error(`Error in realtime event handler for ${type}:`, error);
          }
        });
      }
    }

    console.log(`Processed ${events.length} realtime events across ${Object.keys(eventsByType).length} types`);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private handleDisconnection(): void {
    this.isConnected = false;
    this.stopHeartbeat();
    this.notifyConnectionChange(false);
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts);
    console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  private notifyConnectionChange(connected: boolean): void {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        console.error('Error in connection handler:', error);
      }
    });
  }

  // Public API
  subscribe(eventType: RealtimeEventType, handler: RealtimeEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    
    this.eventHandlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.eventHandlers.delete(eventType);
        }
      }
    };
  }

  onConnectionChange(handler: RealtimeConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  isConnectedNow(): boolean {
    return this.isConnected;
  }

  getConnectionStats(): {
    connected: boolean;
    reconnectAttempts: number;
    queueSize: number;
    activeSubscriptions: number;
  } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      queueSize: this.eventQueue.length,
      activeSubscriptions: Array.from(this.eventHandlers.values())
        .reduce((sum, handlers) => sum + handlers.size, 0),
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.processQueueTimer) {
      clearTimeout(this.processQueueTimer);
      this.processQueueTimer = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.handleDisconnection();
  }
}

// Singleton instance
export const realtimeClient = new RealtimeClient();