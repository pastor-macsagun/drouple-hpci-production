/**
 * Realtime Hook
 * React hook for realtime WebSocket communication
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { realtimeClient, RealtimeClient } from '../lib/realtime/client';

interface RealtimeEvent {
  type: string;
  payload: any;
  timestamp: string;
  userId?: string;
  churchId?: string;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
type TransportMode = 'websocket' | 'polling';

interface RealtimeStatus {
  status: ConnectionStatus;
  transport: TransportMode;
  connectedAt?: string;
  lastPingAt?: string;
  reconnectAttempt: number;
  isOnline: boolean;
}

interface UseRealtimeOptions {
  autoConnect?: boolean;
  connectOnForeground?: boolean;
  eventTypes?: string[];
}

interface UseRealtimeReturn {
  status: RealtimeStatus;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribe: (eventType: string, callback: (event: RealtimeEvent) => void) => () => void;
  events: RealtimeEvent[];
  clearEvents: () => void;
}

/**
 * Main realtime hook
 */
export const useRealtime = (options: UseRealtimeOptions = {}): UseRealtimeReturn => {
  const {
    autoConnect = true,
    connectOnForeground = true,
    eventTypes = [],
  } = options;

  const [status, setStatus] = useState<RealtimeStatus>(() => realtimeClient.getStatus());
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const subscriptionsRef = useRef<Map<string, () => void>>(new Map());

  // Connect to realtime server
  const connect = useCallback(async () => {
    try {
      await realtimeClient.connect();
    } catch (error) {
      console.error('Failed to connect to realtime server:', error);
    }
  }, []);

  // Disconnect from realtime server
  const disconnect = useCallback(() => {
    realtimeClient.disconnect();
  }, []);

  // Subscribe to realtime event
  const subscribe = useCallback((
    eventType: string,
    callback: (event: RealtimeEvent) => void
  ) => {
    return realtimeClient.subscribe(eventType, callback);
  }, []);

  // Clear events history
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      // Cleanup subscriptions
      subscriptionsRef.current.forEach(unsubscribe => unsubscribe());
      subscriptionsRef.current.clear();
    };
  }, [autoConnect, connect]);

  // Connect on app foreground
  useEffect(() => {
    if (!connectOnForeground) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && status.status === 'disconnected') {
        connect();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [connectOnForeground, connect, status.status]);

  // Subscribe to specified event types
  useEffect(() => {
    // Unsubscribe from previous subscriptions
    subscriptionsRef.current.forEach(unsubscribe => unsubscribe());
    subscriptionsRef.current.clear();

    // Subscribe to new event types
    eventTypes.forEach(eventType => {
      const unsubscribe = realtimeClient.subscribe(eventType, (event) => {
        setEvents(prev => [...prev, event].slice(-100)); // Keep last 100 events
      });
      subscriptionsRef.current.set(eventType, unsubscribe);
    });

    return () => {
      subscriptionsRef.current.forEach(unsubscribe => unsubscribe());
      subscriptionsRef.current.clear();
    };
  }, [eventTypes]);

  // Status monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(realtimeClient.getStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    status,
    isConnected: status.status === 'connected',
    connect,
    disconnect,
    subscribe,
    events,
    clearEvents,
  };
};

/**
 * Hook for specific event subscription
 */
export const useRealtimeEvent = (
  eventType: string,
  callback: (event: RealtimeEvent) => void,
  deps: React.DependencyList = []
) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const unsubscribe = realtimeClient.subscribe(eventType, (event) => {
      callbackRef.current(event);
    });

    return unsubscribe;
  }, [eventType, ...deps]);
};

/**
 * Hook for connection status
 */
export const useRealtimeStatus = () => {
  const [status, setStatus] = useState<RealtimeStatus>(() => realtimeClient.getStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(realtimeClient.getStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return status;
};

/**
 * Hook for check-in realtime events
 */
export const useCheckinEvents = () => {
  const [checkins, setCheckins] = useState<any[]>([]);

  useRealtimeEvent('checkin:new', (event) => {
    setCheckins(prev => [event.payload, ...prev].slice(0, 50));
  });

  useRealtimeEvent('checkin:update', (event) => {
    setCheckins(prev => 
      prev.map(checkin => 
        checkin.id === event.payload.id ? event.payload : checkin
      )
    );
  });

  return checkins;
};

/**
 * Hook for event RSVP realtime updates
 */
export const useEventRSVPUpdates = (eventId: string) => {
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [spotsLeft, setSpotsLeft] = useState<number | null>(null);

  useRealtimeEvent('event:rsvp', (event) => {
    if (event.payload.eventId === eventId) {
      setRsvps(prev => [event.payload, ...prev]);
      if (event.payload.spotsLeft !== undefined) {
        setSpotsLeft(event.payload.spotsLeft);
      }
    }
  }, [eventId]);

  useRealtimeEvent('event:rsvp:cancel', (event) => {
    if (event.payload.eventId === eventId) {
      setRsvps(prev => prev.filter(rsvp => rsvp.id !== event.payload.rsvpId));
      if (event.payload.spotsLeft !== undefined) {
        setSpotsLeft(event.payload.spotsLeft);
      }
    }
  }, [eventId]);

  return { rsvps, spotsLeft };
};

/**
 * Hook for service attendance realtime updates
 */
export const useServiceAttendance = (serviceId: string) => {
  const [attendanceCount, setAttendanceCount] = useState<number>(0);
  const [recentCheckins, setRecentCheckins] = useState<any[]>([]);

  useRealtimeEvent('service:checkin', (event) => {
    if (event.payload.serviceId === serviceId) {
      setAttendanceCount(event.payload.attendanceCount);
      setRecentCheckins(prev => [event.payload.checkin, ...prev].slice(0, 10));
    }
  }, [serviceId]);

  return { attendanceCount, recentCheckins };
};

export default useRealtime;