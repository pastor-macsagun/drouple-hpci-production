/**
 * Calendar Service
 * Handles device calendar integration using expo-calendar
 */

import * as Calendar from 'expo-calendar';
import { Platform, Alert, Linking } from 'react-native';
import { SentryService } from '@/lib/monitoring/sentryService';

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
  allDay?: boolean;
}

export interface CalendarPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  message?: string;
}

export class CalendarService {
  private static defaultCalendarId: string | null = null;
  private static permissionStatus: CalendarPermissionStatus | null = null;

  /**
   * Check and request calendar permissions
   */
  static async checkPermissions(): Promise<CalendarPermissionStatus> {
    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      
      this.permissionStatus = {
        granted: status === 'granted',
        canAskAgain: status !== 'denied',
        message: status === 'denied' ? 'Calendar permissions denied. Please enable in Settings.' : undefined,
      };

      return this.permissionStatus;
    } catch (error) {
      console.error('Error checking calendar permissions:', error);
      SentryService.captureError(error as Error, {
        feature: 'calendar',
        action: 'check_permissions',
      });

      return {
        granted: false,
        canAskAgain: false,
        message: 'Unable to access calendar permissions',
      };
    }
  }

  /**
   * Request calendar permissions
   */
  static async requestPermissions(): Promise<CalendarPermissionStatus> {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      
      this.permissionStatus = {
        granted: status === 'granted',
        canAskAgain: status !== 'denied',
        message: status === 'denied' ? 'Calendar permissions denied. Please enable in Settings.' : undefined,
      };

      return this.permissionStatus;
    } catch (error) {
      console.error('Error requesting calendar permissions:', error);
      SentryService.captureError(error as Error, {
        feature: 'calendar',
        action: 'request_permissions',
      });

      return {
        granted: false,
        canAskAgain: false,
        message: 'Unable to request calendar permissions',
      };
    }
  }

  /**
   * Get or create the default calendar for the app
   */
  private static async getDefaultCalendar(): Promise<string | null> {
    if (this.defaultCalendarId) {
      return this.defaultCalendarId;
    }

    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      
      // Find existing Drouple calendar
      let droupleCalendar = calendars.find(cal => cal.title === 'Drouple Events');
      
      if (!droupleCalendar) {
        // Create Drouple calendar if it doesn't exist
        const defaultCalendarSource = Platform.select({
          ios: calendars.find(cal => cal.source?.name === 'Default')?.source,
          android: calendars.find(cal => cal.isPrimary)?.source,
        });

        if (defaultCalendarSource) {
          const newCalendarId = await Calendar.createCalendarAsync({
            title: 'Drouple Events',
            color: '#1e7ce8', // Drouple blue
            entityType: Calendar.EntityTypes.EVENT,
            sourceId: defaultCalendarSource.id,
            source: defaultCalendarSource,
            name: 'Drouple Events',
            ownerAccount: 'personal',
            accessLevel: Calendar.CalendarAccessLevel.OWNER,
          });

          this.defaultCalendarId = newCalendarId;
          return newCalendarId;
        }
      } else {
        this.defaultCalendarId = droupleCalendar.id;
        return droupleCalendar.id;
      }

      // Fallback to first available calendar
      const fallbackCalendar = calendars.find(cal => 
        cal.allowsModifications && 
        cal.accessLevel === Calendar.CalendarAccessLevel.OWNER
      );
      
      if (fallbackCalendar) {
        this.defaultCalendarId = fallbackCalendar.id;
        return fallbackCalendar.id;
      }

      return null;
    } catch (error) {
      console.error('Error getting default calendar:', error);
      SentryService.captureError(error as Error, {
        feature: 'calendar',
        action: 'get_default_calendar',
      });
      return null;
    }
  }

  /**
   * Add event to device calendar
   */
  static async addEventToCalendar(event: CalendarEvent): Promise<string | null> {
    try {
      // Check permissions first
      let permissions = await this.checkPermissions();
      if (!permissions.granted && permissions.canAskAgain) {
        permissions = await this.requestPermissions();
      }

      if (!permissions.granted) {
        Alert.alert(
          'Calendar Permission Required',
          permissions.message || 'Please enable calendar permissions in Settings to add events.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return null;
      }

      const calendarId = await this.getDefaultCalendar();
      if (!calendarId) {
        throw new Error('No suitable calendar found');
      }

      const eventId = await Calendar.createEventAsync(calendarId, {
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        notes: event.notes,
        allDay: event.allDay || false,
      });

      console.log(`Event "${event.title}" added to calendar with ID: ${eventId}`);
      return eventId;
    } catch (error) {
      console.error('Error adding event to calendar:', error);
      SentryService.captureError(error as Error, {
        feature: 'calendar',
        action: 'add_event',
        context: { eventTitle: event.title },
      });

      Alert.alert(
        'Calendar Error',
        'Unable to add event to calendar. Please try again later.',
        [{ text: 'OK' }]
      );

      return null;
    }
  }

  /**
   * Remove event from calendar
   */
  static async removeEventFromCalendar(eventId: string): Promise<boolean> {
    try {
      const permissions = await this.checkPermissions();
      if (!permissions.granted) {
        return false;
      }

      await Calendar.deleteEventAsync(eventId);
      console.log(`Event removed from calendar: ${eventId}`);
      return true;
    } catch (error) {
      console.error('Error removing event from calendar:', error);
      SentryService.captureError(error as Error, {
        feature: 'calendar',
        action: 'remove_event',
        context: { eventId },
      });
      return false;
    }
  }

  /**
   * Update existing calendar event
   */
  static async updateCalendarEvent(eventId: string, event: Partial<CalendarEvent>): Promise<boolean> {
    try {
      const permissions = await this.checkPermissions();
      if (!permissions.granted) {
        return false;
      }

      const updateData: any = {};
      if (event.title) updateData.title = event.title;
      if (event.startDate) updateData.startDate = event.startDate;
      if (event.endDate) updateData.endDate = event.endDate;
      if (event.location !== undefined) updateData.location = event.location;
      if (event.notes !== undefined) updateData.notes = event.notes;
      if (event.allDay !== undefined) updateData.allDay = event.allDay;

      await Calendar.updateEventAsync(eventId, updateData);
      console.log(`Calendar event updated: ${eventId}`);
      return true;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      SentryService.captureError(error as Error, {
        feature: 'calendar',
        action: 'update_event',
        context: { eventId },
      });
      return false;
    }
  }

  /**
   * Check if calendar integration is available
   */
  static isCalendarAvailable(): boolean {
    try {
      // Basic check if Calendar module is available
      return Calendar && Calendar.getCalendarPermissionsAsync !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Get current permission status (cached)
   */
  static getPermissionStatus(): CalendarPermissionStatus | null {
    return this.permissionStatus;
  }

  /**
   * Format event for calendar display
   */
  static formatEventForCalendar(
    title: string,
    description: string,
    startDate: Date,
    endDate: Date,
    location?: string
  ): CalendarEvent {
    return {
      id: '', // Will be set by calendar
      title,
      startDate,
      endDate,
      location,
      notes: description,
      allDay: false,
    };
  }
}

export default CalendarService;