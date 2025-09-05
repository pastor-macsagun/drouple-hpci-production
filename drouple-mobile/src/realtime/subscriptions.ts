/**
 * Realtime Subscriptions Manager
 * Handles React Query cache updates and screen integrations
 */

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeClient, type RealtimeEvent, type RealtimeEventType } from './client';
import { attendanceRepo } from '../data/repos/attendance';
import { membersRepo } from '../data/repos/members';
import { eventsRepo } from '../data/repos/events';
import { announcementsRepo } from '../data/repos/announcements';

// React Query cache keys
export const QUERY_KEYS = {
  MEMBERS: ['members'] as const,
  EVENTS: ['events'] as const,
  ANNOUNCEMENTS: ['announcements'] as const,
  ATTENDANCE: ['attendance'] as const,
  DASHBOARD_STATS: ['dashboard', 'stats'] as const,
} as const;

class RealtimeSubscriptionsManager {
  private queryClient: any = null;
  private subscriptions = new Set<() => void>();
  private isInitialized = false;

  initialize(queryClient: any): void {
    if (this.isInitialized) return;
    
    this.queryClient = queryClient;
    this.setupSubscriptions();
    this.isInitialized = true;
    
    console.log('Realtime subscriptions initialized');
  }

  private setupSubscriptions(): void {
    // Attendance events
    this.subscriptions.add(
      realtimeClient.subscribe('attendance.created', this.handleAttendanceCreated.bind(this))
    );
    this.subscriptions.add(
      realtimeClient.subscribe('attendance.updated', this.handleAttendanceUpdated.bind(this))
    );

    // Event updates
    this.subscriptions.add(
      realtimeClient.subscribe('event.created', this.handleEventCreated.bind(this))
    );
    this.subscriptions.add(
      realtimeClient.subscribe('event.updated', this.handleEventUpdated.bind(this))
    );

    // Member updates
    this.subscriptions.add(
      realtimeClient.subscribe('member.updated', this.handleMemberUpdated.bind(this))
    );

    // Announcements
    this.subscriptions.add(
      realtimeClient.subscribe('announcement.published', this.handleAnnouncementPublished.bind(this))
    );
  }

  // Event handlers
  private async handleAttendanceCreated(event: RealtimeEvent): Promise<void> {
    console.log('Attendance created:', event.data);
    
    try {
      // Invalidate attendance queries to trigger refetch
      this.queryClient?.invalidateQueries({ queryKey: QUERY_KEYS.ATTENDANCE });
      this.queryClient?.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });
      
      // Optionally update local data directly
      // (server data is authoritative, so we'll refetch instead)
      
    } catch (error) {
      console.error('Failed to handle attendance.created:', error);
    }
  }

  private async handleAttendanceUpdated(event: RealtimeEvent): Promise<void> {
    console.log('Attendance updated:', event.data);
    
    try {
      this.queryClient?.invalidateQueries({ queryKey: QUERY_KEYS.ATTENDANCE });
      this.queryClient?.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });
    } catch (error) {
      console.error('Failed to handle attendance.updated:', error);
    }
  }

  private async handleEventCreated(event: RealtimeEvent): Promise<void> {
    console.log('Event created:', event.data);
    
    try {
      // Update local cache with new event
      const eventData = event.data;
      await eventsRepo.batchUpsertLocal([{
        id: eventData.id,
        title: eventData.title,
        description: eventData.description,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        location: eventData.location,
        capacity: eventData.capacity,
        fee: eventData.fee,
        status: eventData.status,
        createdAt: eventData.createdAt,
        updatedAt: eventData.updatedAt,
        syncedAt: new Date().toISOString(),
      }]);

      // Invalidate events queries
      this.queryClient?.invalidateQueries({ queryKey: QUERY_KEYS.EVENTS });
      
      // Show toast notification for new events
      this.showEventNotification('New event available', eventData.title);
      
    } catch (error) {
      console.error('Failed to handle event.created:', error);
    }
  }

  private async handleEventUpdated(event: RealtimeEvent): Promise<void> {
    console.log('Event updated:', event.data);
    
    try {
      const eventData = event.data;
      await eventsRepo.batchUpsertLocal([{
        id: eventData.id,
        title: eventData.title,
        description: eventData.description,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        location: eventData.location,
        capacity: eventData.capacity,
        fee: eventData.fee,
        status: eventData.status,
        createdAt: eventData.createdAt,
        updatedAt: eventData.updatedAt,
        syncedAt: new Date().toISOString(),
      }]);

      this.queryClient?.invalidateQueries({ queryKey: QUERY_KEYS.EVENTS });
      
    } catch (error) {
      console.error('Failed to handle event.updated:', error);
    }
  }

  private async handleMemberUpdated(event: RealtimeEvent): Promise<void> {
    console.log('Member updated:', event.data);
    
    try {
      const memberData = event.data;
      await membersRepo.upsertLocal({
        id: memberData.id,
        name: memberData.name,
        email: memberData.email,
        phone: memberData.phone,
        role: memberData.role,
        church: memberData.churchName || memberData.church,
        isActive: memberData.isActive ?? true,
        createdAt: memberData.createdAt,
        updatedAt: memberData.updatedAt,
        syncedAt: new Date().toISOString(),
      });

      this.queryClient?.invalidateQueries({ queryKey: QUERY_KEYS.MEMBERS });
      
    } catch (error) {
      console.error('Failed to handle member.updated:', error);
    }
  }

  private async handleAnnouncementPublished(event: RealtimeEvent): Promise<void> {
    console.log('Announcement published:', event.data);
    
    try {
      const announcementData = event.data;
      await announcementsRepo.batchUpsertLocal([{
        id: announcementData.id,
        title: announcementData.title,
        content: announcementData.content,
        priority: announcementData.priority,
        publishedAt: announcementData.publishedAt,
        expiresAt: announcementData.expiresAt,
        createdAt: announcementData.createdAt,
        updatedAt: announcementData.updatedAt,
        syncedAt: new Date().toISOString(),
      }]);

      this.queryClient?.invalidateQueries({ queryKey: QUERY_KEYS.ANNOUNCEMENTS });
      
      // Show notification for high-priority announcements
      if (announcementData.priority === 'high' || announcementData.priority === 'urgent') {
        this.showAnnouncementNotification(announcementData.title, announcementData.priority);
      }
      
    } catch (error) {
      console.error('Failed to handle announcement.published:', error);
    }
  }

  private showEventNotification(title: string, eventTitle: string): void {
    // This would integrate with your toast/notification system
    console.log(`📅 ${title}: ${eventTitle}`);
  }

  private showAnnouncementNotification(title: string, priority: string): void {
    const icon = priority === 'urgent' ? '🚨' : '⚠️';
    console.log(`${icon} ${title}`);
  }

  cleanup(): void {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
    this.isInitialized = false;
  }
}

// Singleton instance
export const subscriptionsManager = new RealtimeSubscriptionsManager();

// React hooks for realtime integration
export function useRealtimeConnection() {
  const [isConnected, setIsConnected] = useState(realtimeClient.isConnectedNow());
  const [stats, setStats] = useState(realtimeClient.getConnectionStats());

  useEffect(() => {
    // Connect on mount
    realtimeClient.connect().catch(console.error);

    // Listen for connection changes
    const unsubscribeConnection = realtimeClient.onConnectionChange(setIsConnected);
    
    // Update stats periodically
    const statsInterval = setInterval(() => {
      setStats(realtimeClient.getConnectionStats());
    }, 5000);

    return () => {
      unsubscribeConnection();
      clearInterval(statsInterval);
      // Don't disconnect on unmount - let it persist across screens
    };
  }, []);

  return { isConnected, stats };
}

export function useRealtimeEvent(
  eventType: RealtimeEventType,
  handler: (event: RealtimeEvent) => void,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    const unsubscribe = realtimeClient.subscribe(eventType, handler);
    return unsubscribe;
  }, deps);
}

// Screen-specific hooks
export function useRealtimeForHome() {
  const queryClient = useQueryClient();
  
  useRealtimeEvent('attendance.created', () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });
  });

  useRealtimeEvent('announcement.published', () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ANNOUNCEMENTS });
  });
}

export function useRealtimeForCheckins() {
  const queryClient = useQueryClient();
  
  useRealtimeEvent('attendance.created', () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ATTENDANCE });
  });

  useRealtimeEvent('attendance.updated', () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ATTENDANCE });
  });
}

export function useRealtimeForEvents() {
  const queryClient = useQueryClient();
  
  useRealtimeEvent('event.created', () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EVENTS });
  });

  useRealtimeEvent('event.updated', () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EVENTS });
  });
}

export function useRealtimeForDirectory() {
  const queryClient = useQueryClient();
  
  useRealtimeEvent('member.updated', () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MEMBERS });
  });
}

export function useRealtimeForAnnouncements() {
  const queryClient = useQueryClient();
  
  useRealtimeEvent('announcement.published', () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ANNOUNCEMENTS });
  });
}