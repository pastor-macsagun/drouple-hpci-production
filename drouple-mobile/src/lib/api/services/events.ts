/**
 * Events API Service
 * Handles events listing and RSVP functionality
 */

import { httpClient } from '../http';
import { ENDPOINTS } from '../../../config/endpoints';
import type { EventDTO, RSVPRequest } from '@drouple/contracts';
import { z } from 'zod';

// Event schema
const EventSchema = z.object({
  id: z.string(),
  title: z.string(),
  startsAt: z.string(),
  location: z.string().optional(),
  capacity: z.number().optional(),
  spotsLeft: z.number().optional(),
  description: z.string().optional(),
  isRsvpRequired: z.boolean().default(false),
  hasUserRsvped: z.boolean().default(false),
  fee: z.number().optional(),
});

// Types
export interface Event extends EventDTO {
  description?: string;
  isRsvpRequired: boolean;
  hasUserRsvped: boolean;
  fee?: number;
}

export interface RSVPResponse {
  status: 'confirmed' | 'waitlisted';
  message: string;
}

/**
 * Events Service Class
 */
export class EventsService {
  /**
   * Get list of events
   */
  static async getEvents(): Promise<Event[]> {
    try {
      const response = await httpClient.get<Event[]>(ENDPOINTS.EVENTS.LIST);

      if (response.success && response.data) {
        // Validate response data
        const events = z.array(EventSchema).parse(response.data);
        return events;
      }

      throw new Error(response.error || 'Failed to get events');
    } catch (error) {
      console.error('Get events error:', error);
      throw error;
    }
  }

  /**
   * Get event details by ID
   */
  static async getEvent(eventId: string): Promise<Event> {
    try {
      const response = await httpClient.get<Event>(ENDPOINTS.EVENTS.DETAILS(eventId));

      if (response.success && response.data) {
        // Validate response data
        const event = EventSchema.parse(response.data);
        return event;
      }

      throw new Error(response.error || 'Failed to get event');
    } catch (error) {
      console.error('Get event error:', error);
      throw error;
    }
  }

  /**
   * RSVP to an event
   */
  static async rsvpToEvent(eventId: string, userId: string): Promise<RSVPResponse> {
    try {
      // Generate client request ID
      const clientRequestId = `rsvp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const rsvpRequest: RSVPRequest = {
        clientRequestId,
        eventId,
        action: 'RSVP',
      };

      const response = await httpClient.post<RSVPResponse>(
        ENDPOINTS.EVENTS.RSVP(eventId),
        rsvpRequest
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error || 'RSVP failed');
    } catch (error) {
      console.error('RSVP error:', error);
      throw error;
    }
  }

  /**
   * Cancel RSVP to an event
   */
  static async cancelRSVP(eventId: string): Promise<{ message: string }> {
    try {
      // Generate client request ID
      const clientRequestId = `cancel-rsvp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const rsvpRequest: RSVPRequest = {
        clientRequestId,
        eventId,
        action: 'CANCEL',
      };

      const response = await httpClient.post<{ message: string }>(
        ENDPOINTS.EVENTS.CANCEL_RSVP,
        rsvpRequest
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error || 'Cancel RSVP failed');
    } catch (error) {
      console.error('Cancel RSVP error:', error);
      throw error;
    }
  }

  /**
   * Get upcoming events (next 7 days)
   */
  static async getUpcomingEvents(): Promise<Event[]> {
    try {
      const events = await this.getEvents();
      
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Filter events for next 7 days
      const upcomingEvents = events.filter(event => {
        const eventDate = new Date(event.startsAt);
        return eventDate >= now && eventDate <= nextWeek;
      });

      // Sort by start time
      upcomingEvents.sort((a, b) => 
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
      );

      return upcomingEvents;
    } catch (error) {
      console.error('Get upcoming events error:', error);
      throw error;
    }
  }

  /**
   * Get user's RSVP events
   */
  static async getUserRSVPEvents(): Promise<Event[]> {
    try {
      const events = await this.getEvents();
      
      // Filter events where user has RSVP'd
      return events.filter(event => event.hasUserRsvped);
    } catch (error) {
      console.error('Get user RSVP events error:', error);
      throw error;
    }
  }

  /**
   * Check if user can RSVP to event
   */
  static canRSVPToEvent(event: Event): { canRSVP: boolean; reason?: string } {
    // Check if RSVP is required
    if (!event.isRsvpRequired) {
      return { canRSVP: false, reason: 'RSVP not required for this event' };
    }

    // Check if already RSVP'd
    if (event.hasUserRsvped) {
      return { canRSVP: false, reason: 'Already RSVP\'d to this event' };
    }

    // Check if event has passed
    const eventDate = new Date(event.startsAt);
    const now = new Date();
    
    if (eventDate < now) {
      return { canRSVP: false, reason: 'Event has already passed' };
    }

    // Check if spots available (if capacity is set)
    if (event.capacity && event.spotsLeft !== undefined && event.spotsLeft <= 0) {
      return { canRSVP: true, reason: 'Will be added to waitlist' };
    }

    return { canRSVP: true };
  }
}

export default EventsService;