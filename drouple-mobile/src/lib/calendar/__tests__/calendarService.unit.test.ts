/**
 * CalendarService Unit Tests
 */

import { CalendarService } from '../calendarService';
import * as Calendar from 'expo-calendar';
import { Alert, Linking } from 'react-native';

// Mock dependencies
jest.mock('expo-calendar');
jest.mock('react-native', () => ({
  Platform: { select: jest.fn(), OS: 'ios' },
  Alert: { alert: jest.fn() },
  Linking: { openSettings: jest.fn() },
}));

jest.mock('@/lib/monitoring/sentryService', () => ({
  SentryService: {
    captureError: jest.fn(),
  },
}));

const mockCalendar = Calendar as jest.Mocked<typeof Calendar>;
const mockAlert = Alert as jest.Mocked<typeof Alert>;
const mockLinking = Linking as jest.Mocked<typeof Linking>;

describe('CalendarService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkPermissions', () => {
    it('should return granted status when permissions are granted', async () => {
      mockCalendar.getCalendarPermissionsAsync.mockResolvedValue({
        status: 'granted',
        canAskAgain: true,
        granted: true,
      } as any);

      const result = await CalendarService.checkPermissions();

      expect(result).toEqual({
        granted: true,
        canAskAgain: true,
        message: undefined,
      });
    });

    it('should return denied status with message when permissions are denied', async () => {
      mockCalendar.getCalendarPermissionsAsync.mockResolvedValue({
        status: 'denied',
        canAskAgain: false,
        granted: false,
      } as any);

      const result = await CalendarService.checkPermissions();

      expect(result).toEqual({
        granted: false,
        canAskAgain: false,
        message: 'Calendar permissions denied. Please enable in Settings.',
      });
    });

    it('should handle errors gracefully', async () => {
      mockCalendar.getCalendarPermissionsAsync.mockRejectedValue(new Error('Calendar error'));

      const result = await CalendarService.checkPermissions();

      expect(result).toEqual({
        granted: false,
        canAskAgain: false,
        message: 'Unable to access calendar permissions',
      });
    });
  });

  describe('requestPermissions', () => {
    it('should return granted status when permissions are granted', async () => {
      mockCalendar.requestCalendarPermissionsAsync.mockResolvedValue({
        status: 'granted',
        canAskAgain: true,
        granted: true,
      } as any);

      const result = await CalendarService.requestPermissions();

      expect(result).toEqual({
        granted: true,
        canAskAgain: true,
        message: undefined,
      });
    });

    it('should return denied status with message when permissions are denied', async () => {
      mockCalendar.requestCalendarPermissionsAsync.mockResolvedValue({
        status: 'denied',
        canAskAgain: false,
        granted: false,
      } as any);

      const result = await CalendarService.requestPermissions();

      expect(result).toEqual({
        granted: false,
        canAskAgain: false,
        message: 'Calendar permissions denied. Please enable in Settings.',
      });
    });
  });

  describe('addEventToCalendar', () => {
    const mockEvent = {
      id: 'test-event',
      title: 'Test Event',
      startDate: new Date('2025-01-07T10:00:00Z'),
      endDate: new Date('2025-01-07T11:00:00Z'),
      location: 'Test Location',
      notes: 'Test description',
      allDay: false,
    };

    beforeEach(() => {
      // Mock successful permissions
      mockCalendar.getCalendarPermissionsAsync.mockResolvedValue({
        status: 'granted',
        granted: true,
      } as any);
      
      // Mock calendars
      mockCalendar.getCalendarsAsync.mockResolvedValue([
        {
          id: 'existing-calendar',
          title: 'Drouple Events',
          allowsModifications: true,
          accessLevel: Calendar.CalendarAccessLevel.OWNER,
        },
      ] as any);
    });

    it('should add event to calendar successfully', async () => {
      mockCalendar.createEventAsync.mockResolvedValue('new-event-id');

      const result = await CalendarService.addEventToCalendar(mockEvent);

      expect(result).toBe('new-event-id');
      expect(mockCalendar.createEventAsync).toHaveBeenCalledWith('existing-calendar', {
        title: mockEvent.title,
        startDate: mockEvent.startDate,
        endDate: mockEvent.endDate,
        location: mockEvent.location,
        notes: mockEvent.notes,
        allDay: false,
      });
    });

    it('should request permissions if not granted', async () => {
      mockCalendar.getCalendarPermissionsAsync.mockResolvedValueOnce({
        status: 'undetermined',
        granted: false,
        canAskAgain: true,
      } as any);
      
      mockCalendar.requestCalendarPermissionsAsync.mockResolvedValue({
        status: 'granted',
        granted: true,
      } as any);
      
      mockCalendar.createEventAsync.mockResolvedValue('new-event-id');

      const result = await CalendarService.addEventToCalendar(mockEvent);

      expect(mockCalendar.requestCalendarPermissionsAsync).toHaveBeenCalled();
      expect(result).toBe('new-event-id');
    });

    it('should show alert and return null if permissions are denied', async () => {
      mockCalendar.getCalendarPermissionsAsync.mockResolvedValue({
        status: 'denied',
        granted: false,
        canAskAgain: false,
      } as any);

      const result = await CalendarService.addEventToCalendar(mockEvent);

      expect(mockAlert.alert).toHaveBeenCalledWith(
        'Calendar Permission Required',
        'Please enable calendar permissions in Settings to add events.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: expect.any(Function) },
        ]
      );
      expect(result).toBeNull();
    });

    it('should create Drouple calendar if it does not exist', async () => {
      // Mock no existing Drouple calendar
      mockCalendar.getCalendarsAsync.mockResolvedValue([
        {
          id: 'other-calendar',
          title: 'Other Calendar',
          source: { id: 'source-id', name: 'Default' },
          isPrimary: true,
          allowsModifications: true,
          accessLevel: Calendar.CalendarAccessLevel.OWNER,
        },
      ] as any);

      mockCalendar.createCalendarAsync.mockResolvedValue('new-drouple-calendar');
      mockCalendar.createEventAsync.mockResolvedValue('new-event-id');

      const result = await CalendarService.addEventToCalendar(mockEvent);

      expect(mockCalendar.createCalendarAsync).toHaveBeenCalledWith({
        title: 'Drouple Events',
        color: '#1e7ce8',
        entityType: Calendar.EntityTypes.EVENT,
        sourceId: 'source-id',
        source: expect.objectContaining({ id: 'source-id', name: 'Default' }),
        name: 'Drouple Events',
        ownerAccount: 'personal',
        accessLevel: Calendar.CalendarAccessLevel.OWNER,
      });
      expect(result).toBe('new-event-id');
    });

    it('should handle errors and show alert', async () => {
      mockCalendar.createEventAsync.mockRejectedValue(new Error('Calendar error'));

      const result = await CalendarService.addEventToCalendar(mockEvent);

      expect(mockAlert.alert).toHaveBeenCalledWith(
        'Calendar Error',
        'Unable to add event to calendar. Please try again later.',
        [{ text: 'OK' }]
      );
      expect(result).toBeNull();
    });
  });

  describe('removeEventFromCalendar', () => {
    it('should remove event from calendar successfully', async () => {
      mockCalendar.getCalendarPermissionsAsync.mockResolvedValue({
        status: 'granted',
        granted: true,
      } as any);
      mockCalendar.deleteEventAsync.mockResolvedValue();

      const result = await CalendarService.removeEventFromCalendar('event-id');

      expect(result).toBe(true);
      expect(mockCalendar.deleteEventAsync).toHaveBeenCalledWith('event-id');
    });

    it('should return false if permissions are not granted', async () => {
      mockCalendar.getCalendarPermissionsAsync.mockResolvedValue({
        status: 'denied',
        granted: false,
      } as any);

      const result = await CalendarService.removeEventFromCalendar('event-id');

      expect(result).toBe(false);
      expect(mockCalendar.deleteEventAsync).not.toHaveBeenCalled();
    });

    it('should handle errors and return false', async () => {
      mockCalendar.getCalendarPermissionsAsync.mockResolvedValue({
        status: 'granted',
        granted: true,
      } as any);
      mockCalendar.deleteEventAsync.mockRejectedValue(new Error('Delete error'));

      const result = await CalendarService.removeEventFromCalendar('event-id');

      expect(result).toBe(false);
    });
  });

  describe('updateCalendarEvent', () => {
    it('should update event successfully', async () => {
      mockCalendar.getCalendarPermissionsAsync.mockResolvedValue({
        status: 'granted',
        granted: true,
      } as any);
      mockCalendar.updateEventAsync.mockResolvedValue();

      const updates = {
        title: 'Updated Title',
        location: 'Updated Location',
      };

      const result = await CalendarService.updateCalendarEvent('event-id', updates);

      expect(result).toBe(true);
      expect(mockCalendar.updateEventAsync).toHaveBeenCalledWith('event-id', {
        title: 'Updated Title',
        location: 'Updated Location',
      });
    });

    it('should return false if permissions are not granted', async () => {
      mockCalendar.getCalendarPermissionsAsync.mockResolvedValue({
        status: 'denied',
        granted: false,
      } as any);

      const result = await CalendarService.updateCalendarEvent('event-id', { title: 'New Title' });

      expect(result).toBe(false);
      expect(mockCalendar.updateEventAsync).not.toHaveBeenCalled();
    });
  });

  describe('isCalendarAvailable', () => {
    it('should return true when calendar is available', () => {
      mockCalendar.getCalendarPermissionsAsync = jest.fn();

      const result = CalendarService.isCalendarAvailable();

      expect(result).toBe(true);
    });

    it('should return false when calendar is not available', () => {
      // Mock undefined Calendar module
      (Calendar as any).getCalendarPermissionsAsync = undefined;

      const result = CalendarService.isCalendarAvailable();

      expect(result).toBe(false);
    });
  });

  describe('formatEventForCalendar', () => {
    it('should format event correctly', () => {
      const startDate = new Date('2025-01-07T10:00:00Z');
      const endDate = new Date('2025-01-07T11:00:00Z');

      const result = CalendarService.formatEventForCalendar(
        'Test Event',
        'Test Description',
        startDate,
        endDate,
        'Test Location'
      );

      expect(result).toEqual({
        id: '',
        title: 'Test Event',
        startDate,
        endDate,
        location: 'Test Location',
        notes: 'Test Description',
        allDay: false,
      });
    });
  });
});