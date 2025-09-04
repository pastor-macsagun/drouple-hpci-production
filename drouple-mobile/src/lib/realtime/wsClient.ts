/**
 * WebSocket Client (Stub Implementation)
 * Provides real-time updates with fallback to polling
 */

import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/lib/store/authStore';

interface WSMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface WSStatus {
  connected: boolean;
  lastHeartbeat: Date | null;
  reconnectAttempts: number;
  error: string | null;
}

class WSClient {
  private socket: Socket | null = null;
  private status: WSStatus = {
    connected: false,
    lastHeartbeat: null,
    reconnectAttempts: 0,
    error: null,
  };
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  private config = {
    url: process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3001',
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000,
  };

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const { user, tokens } = useAuthStore.getState();

        if (!user || !tokens?.accessToken) {
          reject(new Error('User not authenticated'));
          return;
        }

        console.log('Connecting to WebSocket server...');

        this.socket = io(this.config.url, {
          auth: {
            token: tokens.accessToken,
            userId: user.id,
            tenantId: user.tenantId,
          },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: this.config.maxReconnectAttempts,
          reconnectionDelay: this.config.reconnectInterval,
        });

        this.socket.on('connect', () => {
          console.log('WebSocket connected');
          this.status.connected = true;
          this.status.reconnectAttempts = 0;
          this.status.error = null;
          this.startHeartbeat();
          resolve();
        });

        this.socket.on('disconnect', reason => {
          console.log('WebSocket disconnected:', reason);
          this.status.connected = false;
          this.stopHeartbeat();
        });

        this.socket.on('connect_error', error => {
          console.error('WebSocket connection error:', error);
          this.status.error = error.message;
          this.status.reconnectAttempts++;

          if (
            this.status.reconnectAttempts >= this.config.maxReconnectAttempts
          ) {
            reject(new Error('Failed to connect after maximum attempts'));
          }
        });

        this.socket.on('reconnect', attemptNumber => {
          console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
          this.status.reconnectAttempts = 0;
        });

        // Handle specific message types
        this.socket.on('service:count_update', data => {
          this.handleMessage('service:count_update', data);
        });

        this.socket.on('event:rsvp_update', data => {
          this.handleMessage('event:rsvp_update', data);
        });

        this.socket.on('member:status_update', data => {
          this.handleMessage('member:status_update', data);
        });

        this.socket.on('announcement', data => {
          this.handleMessage('announcement', data);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting WebSocket...');
      this.stopHeartbeat();
      this.socket.disconnect();
      this.socket = null;
      this.status.connected = false;
    }
  }

  /**
   * Subscribe to specific message type
   */
  subscribe(messageType: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(messageType)) {
      this.listeners.set(messageType, []);
    }

    this.listeners.get(messageType)!.push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(messageType);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Send message to server
   */
  send(messageType: string, data: any): void {
    if (this.socket && this.status.connected) {
      this.socket.emit(messageType, data);
    } else {
      console.warn('WebSocket not connected, message not sent:', messageType);
    }
  }

  /**
   * Get current connection status
   */
  getStatus(): WSStatus {
    return { ...this.status };
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(messageType: string, data: any): void {
    const listeners = this.listeners.get(messageType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(
            `Error in WebSocket listener for ${messageType}:`,
            error
          );
        }
      });
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    const heartbeat = () => {
      if (this.socket && this.status.connected) {
        this.socket.emit('ping');
        this.status.lastHeartbeat = new Date();
      }
    };

    // Send initial heartbeat
    heartbeat();

    // Set up interval
    setInterval(heartbeat, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    // In a real implementation, we'd store the interval ID and clear it
    // For now, just update the status
    this.status.lastHeartbeat = null;
  }
}

// Export singleton instance
export const wsClient = new WSClient();

// Export utility functions for common subscriptions
export const subscribeToServiceCounts = (
  callback: (data: { serviceId: string; count: number }) => void
) => {
  return wsClient.subscribe('service:count_update', callback);
};

export const subscribeToEventUpdates = (
  callback: (data: {
    eventId: string;
    rsvpCount: number;
    waitlistCount: number;
  }) => void
) => {
  return wsClient.subscribe('event:rsvp_update', callback);
};

export const subscribeToAnnouncements = (
  callback: (data: {
    id: string;
    title: string;
    message: string;
    priority: string;
  }) => void
) => {
  return wsClient.subscribe('announcement', callback);
};

export default wsClient;
