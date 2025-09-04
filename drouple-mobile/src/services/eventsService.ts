/**
 * Events Service
 * Handles event fetching, RSVP actions, and offline queue integration
 */

import { QueryClient } from '@tanstack/react-query';
import type { RSVPRequest } from '@drouple/contracts';

import { apiClient } from '@/lib/api/client';
import { database } from '@/lib/db/database';
import { ENDPOINTS } from '@/config/endpoints';
import { getUpcomingEvents, getEventById, MockEvent } from '@/data/mockEvents';
import { notificationService } from '@/services/notificationService';
import toast from '@/utils/toast';

const EVENTS_CACHE_KEY = 'cached_events';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export interface RSVPAction {
  clientRequestId: string;
  eventId: string;
  action: 'RSVP' | 'CANCEL';
  timestamp: string;
}

class EventsService {
  private queryClient: QueryClient;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  /**
   * Fetch events with offline caching
   */
  async fetchEvents(): Promise<MockEvent[]> {
    try {
      // Try to fetch from API first
      // const response = await apiClient.get(ENDPOINTS.EVENTS.LIST);

      // For now, use mock data
      const events = getUpcomingEvents();

      // Cache the events
      await this.cacheEvents(events);

      return events;
    } catch (error) {
      console.log('Failed to fetch events from API, using cache:', error);

      // Fallback to cached events
      const cachedEvents = await this.getCachedEvents();
      if (cachedEvents.length > 0) {
        return cachedEvents;
      }

      // Last resort: use mock data
      return getUpcomingEvents();
    }
  }

  /**
   * Get single event by ID
   */
  async getEvent(eventId: string): Promise<MockEvent | null> {
    try {
      // Try API first
      // const response = await apiClient.get(`${ENDPOINTS.EVENTS.LIST}/${eventId}`);

      // For now, use mock data
      const event = getEventById(eventId);
      return event || null;
    } catch (error) {
      console.error('Failed to fetch event:', error);

      // Fallback to mock data
      return getEventById(eventId) || null;
    }
  }

  /**
   * RSVP to event with offline support
   */
  async rsvpToEvent(
    eventId: string,
    action: 'RSVP' | 'CANCEL'
  ): Promise<boolean> {
    const clientRequestId = this.generateRequestId();

    const rsvpRequest: RSVPAction = {
      clientRequestId,
      eventId,
      action,
      timestamp: new Date().toISOString(),
    };

    try {
      // Try online submission first
      await this.submitRSVP(rsvpRequest);

      // Update local state optimistically
      await this.updateLocalRSVPStatus(eventId, action);

      // Show success notification
      const event = getEventById(eventId);
      if (event && action === 'RSVP') {
        try {
          const status = event.spotsLeft === 0 ? 'waitlisted' : 'confirmed';
          await notificationService.showRSVPConfirmation(event.title, status);
        } catch (error) {
          console.log('Failed to show RSVP notification:', error);
        }
      }

      toast.success(action === 'RSVP' ? 'RSVP confirmed!' : 'RSVP cancelled');

      // Invalidate queries to refetch
      this.queryClient.invalidateQueries({ queryKey: ['events'] });

      return true;
    } catch (error) {
      console.log('Online RSVP failed, queuing for offline sync:', error);

      // Queue for offline sync
      await database.enqueue('RSVP', rsvpRequest);

      // Update local state optimistically
      await this.updateLocalRSVPStatus(eventId, action);

      toast.info(
        action === 'RSVP'
          ? 'RSVP queued - will sync when online'
          : 'Cancellation queued - will sync when online'
      );

      // Invalidate queries to show updated state
      this.queryClient.invalidateQueries({ queryKey: ['events'] });

      return false; // Indicate it was queued, not completed
    }
  }

  /**
   * Submit RSVP to API
   */
  private async submitRSVP(rsvpRequest: RSVPAction): Promise<void> {
    const payload: RSVPRequest = {
      clientRequestId: rsvpRequest.clientRequestId,
      eventId: rsvpRequest.eventId,
      action: rsvpRequest.action,
    };

    const response = await apiClient.post(
      ENDPOINTS.EVENTS.RSVP(rsvpRequest.eventId),
      payload
    );

    if (!response.success) {
      throw new Error(response.error || 'RSVP failed');
    }
  }

  /**
   * Update local RSVP status optimistically
   */
  private async updateLocalRSVPStatus(
    eventId: string,
    action: 'RSVP' | 'CANCEL'
  ): Promise<void> {
    try {
      // Get current cached events
      const cachedEvents = await this.getCachedEvents();

      // Update the specific event
      const updatedEvents = cachedEvents.map(event => {
        if (event.id === eventId) {
          const updatedEvent = { ...event };

          if (action === 'RSVP') {
            if (event.spotsLeft !== undefined && event.spotsLeft > 0) {
              updatedEvent.userRSVPStatus = 'confirmed';
              updatedEvent.currentAttendees += 1;
              updatedEvent.spotsLeft = event.spotsLeft - 1;
            } else {
              updatedEvent.userRSVPStatus = 'waitlisted';
              updatedEvent.waitlistCount += 1;
            }
          } else {
            // CANCEL
            if (event.userRSVPStatus === 'confirmed') {
              updatedEvent.userRSVPStatus = 'none';
              updatedEvent.currentAttendees -= 1;
              if (updatedEvent.spotsLeft !== undefined) {
                updatedEvent.spotsLeft += 1;
              }
            } else if (event.userRSVPStatus === 'waitlisted') {
              updatedEvent.userRSVPStatus = 'none';
              updatedEvent.waitlistCount -= 1;
            }
          }

          return updatedEvent;
        }
        return event;
      });

      // Save updated events to cache
      await this.cacheEvents(updatedEvents);
    } catch (error) {
      console.error('Failed to update local RSVP status:', error);
    }
  }

  /**
   * Cache events in key-value store
   */
  private async cacheEvents(events: MockEvent[]): Promise<void> {
    const cacheData = {
      events,
      timestamp: Date.now(),
    };

    await database.setKV(EVENTS_CACHE_KEY, cacheData);
  }

  /**
   * Get cached events
   */
  private async getCachedEvents(): Promise<MockEvent[]> {
    try {
      const cached = await database.getKVJson<{
        events: MockEvent[];
        timestamp: number;
      }>(EVENTS_CACHE_KEY);

      if (!cached) {
        return [];
      }

      // Check if cache is still valid
      const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
      if (isExpired) {
        console.log('Events cache expired');
        return [];
      }

      return cached.events || [];
    } catch (error) {
      console.error('Failed to get cached events:', error);
      return [];
    }
  }

  /**
   * Check if events are cached
   */
  async hasCachedEvents(): Promise<boolean> {
    const cached = await this.getCachedEvents();
    return cached.length > 0;
  }

  /**
   * Clear events cache
   */
  async clearCache(): Promise<void> {
    await database.deleteKV(EVENTS_CACHE_KEY);
    this.queryClient.removeQueries({ queryKey: ['events'] });
  }

  /**
   * Generate unique request ID for idempotency
   */
  private generateRequestId(): string {
    return `rsvp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get user's RSVP'd events
   */
  async getUserRSVPs(): Promise<MockEvent[]> {
    const events = await this.getCachedEvents();
    return events.filter(
      event =>
        event.userRSVPStatus === 'confirmed' ||
        event.userRSVPStatus === 'waitlisted'
    );
  }
}

// Export singleton instance (will be initialized with queryClient)
export let eventsService: EventsService;

export const initializeEventsService = (queryClient: QueryClient) => {
  eventsService = new EventsService(queryClient);
  return eventsService;
};

export default EventsService;
