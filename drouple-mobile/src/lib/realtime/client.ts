/**
 * Realtime Client
 * WebSocket client with polling fallback for realtime updates
 */

import { io, Socket } from 'socket.io-client';
import NetInfo from '@react-native-community/netinfo';
import { ENDPOINTS } from '../../config/endpoints';
import { APP_CONFIG } from '../../config/app';
import { TokenManager } from '../api/http';

interface RealtimeEvent {
  type: string;
  payload: any;
  timestamp: string;
  userId?: string;
  churchId?: string;
}

interface ConnectionConfig {
  autoConnect: boolean;
  reconnectAttempts: number;
  reconnectDelay: number;
  maxReconnectDelay: number;
  pingTimeout: number;
  pingInterval: number;
  enablePollingFallback: boolean;
  pollingInterval: number;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
type TransportMode = 'websocket' | 'polling';
type EventListener = (event: RealtimeEvent) => void;

interface RealtimeStatus {
  status: ConnectionStatus;
  transport: TransportMode;
  connectedAt?: string;
  lastPingAt?: string;
  reconnectAttempt: number;
  isOnline: boolean;
}

export class RealtimeClient {
  private socket: Socket | null = null;
  private status: RealtimeStatus;
  private config: ConnectionConfig;
  private listeners: Map<string, EventListener[]> = new Map();
  private pollingTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private networkUnsubscribe: (() => void) | null = null;
  private isPollingFallback = false;

  constructor() {
    this.config = {
      autoConnect: APP_CONFIG.features.enableRealtimeSync,
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      maxReconnectDelay: 30000,
      pingTimeout: 60000,
      pingInterval: 25000,
      enablePollingFallback: true,
      pollingInterval: 30000, // 30 seconds
    };

    this.status = {
      status: 'disconnected',
      transport: 'websocket',
      reconnectAttempt: 0,
      isOnline: true,
    };

    this.setupNetworkListener();
  }

  /**
   * Initialize and connect to realtime server
   */
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      console.log('Already connected to realtime server');
      return;
    }

    try {
      this.status.status = 'connecting';
      this.emit('status', this.status);

      // Get auth token for connection
      const token = await TokenManager.getAccessToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Create socket connection
      this.socket = io(ENDPOINTS.WEBSOCKET, {
        auth: {
          token,
        },
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: this.config.reconnectAttempts,
        reconnectionDelay: this.config.reconnectDelay,
        reconnectionDelayMax: this.config.maxReconnectDelay,
        timeout: this.config.pingTimeout,
        transports: ['websocket', 'polling'],
      });

      // Setup event handlers
      this.setupSocketHandlers();

      // Connect
      this.socket.connect();

      console.log('Connecting to realtime server...');
    } catch (error) {
      console.error('Failed to connect to realtime server:', error);
      this.handleConnectionError(error as Error);
    }
  }

  /**
   * Disconnect from realtime server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.stopPolling();
    this.stopPing();

    this.status.status = 'disconnected';
    this.status.connectedAt = undefined;
    this.status.lastPingAt = undefined;
    this.status.reconnectAttempt = 0;

    this.emit('status', this.status);
    console.log('Disconnected from realtime server');
  }

  /**
   * Subscribe to realtime events
   */
  subscribe(eventType: string, listener: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    this.listeners.get(eventType)!.push(listener);

    // If using WebSocket, subscribe on server
    if (this.socket?.connected && !this.isPollingFallback) {
      this.socket.emit('subscribe', { eventType });
    }

    return () => this.unsubscribe(eventType, listener);
  }

  /**
   * Unsubscribe from realtime events
   */
  private unsubscribe(eventType: string, listener: EventListener): void {
    const eventListeners = this.listeners.get(eventType);
    if (!eventListeners) return;

    const index = eventListeners.indexOf(listener);
    if (index > -1) {
      eventListeners.splice(index, 1);
    }

    // If no more listeners, unsubscribe on server
    if (eventListeners.length === 0 && this.socket?.connected && !this.isPollingFallback) {
      this.socket.emit('unsubscribe', { eventType });
      this.listeners.delete(eventType);
    }
  }

  /**
   * Get connection status
   */
  getStatus(): RealtimeStatus {
    return { ...this.status };
  }

  /**
   * Force polling mode (useful for debugging)
   */
  enablePollingMode(): void {
    if (this.socket?.connected) {
      this.disconnect();
    }

    this.isPollingFallback = true;
    this.status.transport = 'polling';
    this.startPolling();
  }

  /**
   * Setup socket event handlers
   */
  private setupSocketHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.status.status = 'connected';
      this.status.transport = this.socket?.io.engine.transport.name as TransportMode || 'websocket';
      this.status.connectedAt = new Date().toISOString();
      this.status.reconnectAttempt = 0;
      this.isPollingFallback = false;

      this.emit('status', this.status);
      this.startPing();

      console.log(`Connected to realtime server via ${this.status.transport}`);

      // Resubscribe to events
      this.resubscribeToEvents();
    });

    this.socket.on('disconnect', (reason) => {
      this.status.status = 'disconnected';
      this.status.connectedAt = undefined;
      this.status.lastPingAt = undefined;

      this.emit('status', this.status);
      this.stopPing();

      console.log('Disconnected from realtime server:', reason);

      // Fallback to polling if WebSocket fails
      if (reason === 'transport error' && this.config.enablePollingFallback && !this.isPollingFallback) {
        console.log('Falling back to polling mode');
        this.enablePollingMode();
      }
    });

    this.socket.on('connect_error', (error) => {
      this.handleConnectionError(error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected to realtime server (attempt ${attemptNumber})`);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      this.status.reconnectAttempt = attemptNumber;
      this.emit('status', this.status);
      console.log(`Reconnecting to realtime server (attempt ${attemptNumber})`);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect to realtime server');
      
      // Fallback to polling
      if (this.config.enablePollingFallback && !this.isPollingFallback) {
        console.log('Falling back to polling mode');
        this.enablePollingMode();
      }
    });

    // Realtime events
    this.socket.on('event', (data: RealtimeEvent) => {
      this.handleRealtimeEvent(data);
    });

    // Ping/Pong for connection health
    this.socket.on('pong', () => {
      this.status.lastPingAt = new Date().toISOString();
      this.emit('status', this.status);
    });
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(error: Error): void {
    this.status.status = 'error';
    this.emit('status', this.status);
    this.emit('error', { message: 'Connection error', error });

    console.error('Realtime connection error:', error);
  }

  /**
   * Handle incoming realtime events
   */
  private handleRealtimeEvent(event: RealtimeEvent): void {
    const listeners = this.listeners.get(event.type);
    if (!listeners || listeners.length === 0) {
      return;
    }

    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in realtime event listener:', error);
      }
    });
  }

  /**
   * Resubscribe to events after reconnection
   */
  private resubscribeToEvents(): void {
    if (!this.socket?.connected || this.isPollingFallback) {
      return;
    }

    for (const eventType of this.listeners.keys()) {
      this.socket.emit('subscribe', { eventType });
    }
  }

  /**
   * Start polling mode as fallback
   */
  private startPolling(): void {
    if (this.pollingTimer || !this.config.enablePollingFallback) {
      return;
    }

    this.pollingTimer = setInterval(() => {
      this.pollForUpdates();
    }, this.config.pollingInterval);

    console.log(`Started polling mode with ${this.config.pollingInterval}ms interval`);
  }

  /**
   * Stop polling mode
   */
  private stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
      console.log('Stopped polling mode');
    }
  }

  /**
   * Poll for updates (fallback mechanism)
   */
  private async pollForUpdates(): Promise<void> {
    if (!this.status.isOnline || this.listeners.size === 0) {
      return;
    }

    try {
      // This would call a REST endpoint that returns recent events
      // For now, we'll emit a mock polling event
      const pollingEvent: RealtimeEvent = {
        type: 'polling_heartbeat',
        payload: {
          timestamp: new Date().toISOString(),
          subscribedEvents: Array.from(this.listeners.keys()),
        },
        timestamp: new Date().toISOString(),
      };

      this.handleRealtimeEvent(pollingEvent);
    } catch (error) {
      console.error('Polling error:', error);
    }
  }

  /**
   * Start ping timer for connection health
   */
  private startPing(): void {
    if (this.pingTimer || !this.socket?.connected) {
      return;
    }

    this.pingTimer = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, this.config.pingInterval);
  }

  /**
   * Stop ping timer
   */
  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  /**
   * Setup network connectivity listener
   */
  private setupNetworkListener(): void {
    this.networkUnsubscribe = NetInfo.addEventListener(state => {
      const wasOnline = this.status.isOnline;
      const isOnline = state.isConnected ?? false;

      this.status.isOnline = isOnline;

      if (!wasOnline && isOnline) {
        // Reconnect when network comes back
        console.log('Network reconnected, attempting realtime reconnection');
        setTimeout(() => {
          if (this.config.autoConnect && !this.socket?.connected) {
            this.connect();
          }
        }, 1000);
      } else if (wasOnline && !isOnline) {
        // Handle network disconnection
        console.log('Network disconnected');
        this.status.status = 'disconnected';
      }

      this.emit('status', this.status);
    });
  }

  /**
   * Emit event to listeners
   */
  private emit(type: string, data: any): void {
    // This would emit to status listeners if we had them
    // For now, just log important status changes
    if (type === 'status') {
      console.log('Realtime status:', data.status, data.transport);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.disconnect();
    this.stopPolling();

    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = null;
    }

    this.listeners.clear();
  }
}

// Singleton instance
export const realtimeClient = new RealtimeClient();

export default realtimeClient;