/**
 * Notifications Hook
 * React hook for push notification management
 */

import React, { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationManager, NotificationManager } from '../lib/notifications/manager';

interface NotificationPermissions {
  granted: boolean;
  canAskAgain: boolean;
  ios?: {
    status: Notifications.IosAuthorizationStatus;
    allowsAlert: boolean;
    allowsBadge: boolean;
    allowsSound: boolean;
  };
}

interface NotificationSettings {
  enabled: boolean;
  allowSound: boolean;
  allowBadge: boolean;
  allowBanner: boolean;
  categories: {
    checkin: boolean;
    events: boolean;
    announcements: boolean;
    reminders: boolean;
  };
}

interface UseNotificationsReturn {
  permissions: NotificationPermissions | null;
  settings: NotificationSettings;
  isRegistered: boolean;
  deviceToken: string | null;
  lastNotification: Notifications.Notification | null;
  isLoading: boolean;
  
  // Actions
  requestPermissions: () => Promise<NotificationPermissions>;
  registerDevice: () => Promise<boolean>;
  unregisterDevice: () => Promise<boolean>;
  updateSettings: (updates: Partial<NotificationSettings>) => Promise<void>;
  scheduleNotification: (title: string, body: string, data?: any, trigger?: Notifications.NotificationTriggerInput) => Promise<string>;
  cancelNotification: (identifier: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
}

/**
 * Main notifications hook
 */
export const useNotifications = (): UseNotificationsReturn => {
  const [permissions, setPermissions] = useState<NotificationPermissions | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>(() => notificationManager.getSettings());
  const [isRegistered, setIsRegistered] = useState<boolean>(() => notificationManager.isDeviceRegistered());
  const [deviceToken, setDeviceToken] = useState<string | null>(() => notificationManager.getDeviceToken());
  const [lastNotification, setLastNotification] = useState<Notifications.Notification | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize notification manager
  useEffect(() => {
    const initializeNotifications = async () => {
      setIsLoading(true);
      try {
        await notificationManager.initialize();
        
        // Update state
        const currentPermissions = await notificationManager.getPermissions();
        setPermissions(currentPermissions);
        setSettings(notificationManager.getSettings());
        setIsRegistered(notificationManager.isDeviceRegistered());
        setDeviceToken(notificationManager.getDeviceToken());
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeNotifications();
  }, []);

  // Set up notification listeners
  useEffect(() => {
    // Listen for incoming notifications
    const notificationListener = notificationManager.onNotificationReceived((notification) => {
      setLastNotification(notification);
      console.log('Notification received:', notification);
    });

    // Listen for notification taps
    const responseListener = notificationManager.onNotificationTapped((response) => {
      console.log('Notification tapped:', response);
      // Handle navigation based on notification data
      handleNotificationTap(response);
    });

    return () => {
      notificationListener();
      responseListener();
    };
  }, []);

  // Request permissions
  const requestPermissions = useCallback(async (): Promise<NotificationPermissions> => {
    setIsLoading(true);
    try {
      const newPermissions = await notificationManager.requestPermissions();
      setPermissions(newPermissions);
      
      // Update registration status
      setIsRegistered(notificationManager.isDeviceRegistered());
      setDeviceToken(notificationManager.getDeviceToken());
      
      return newPermissions;
    } catch (error) {
      console.error('Failed to request permissions:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register device
  const registerDevice = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await notificationManager.registerDevice();
      
      if (success) {
        setIsRegistered(true);
        setDeviceToken(notificationManager.getDeviceToken());
      }
      
      return success;
    } catch (error) {
      console.error('Failed to register device:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Unregister device
  const unregisterDevice = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await notificationManager.unregisterDevice();
      
      if (success) {
        setIsRegistered(false);
        setDeviceToken(null);
      }
      
      return success;
    } catch (error) {
      console.error('Failed to unregister device:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update settings
  const updateSettings = useCallback(async (updates: Partial<NotificationSettings>): Promise<void> => {
    try {
      await notificationManager.updateSettings(updates);
      setSettings(notificationManager.getSettings());
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }, []);

  // Schedule notification
  const scheduleNotification = useCallback(async (
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> => {
    try {
      return await notificationManager.scheduleLocalNotification(title, body, data, trigger);
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      throw error;
    }
  }, []);

  // Cancel notification
  const cancelNotification = useCallback(async (identifier: string): Promise<void> => {
    try {
      await notificationManager.cancelNotification(identifier);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
      throw error;
    }
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(async (): Promise<void> => {
    try {
      await notificationManager.clearAllNotifications();
      setLastNotification(null);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      throw error;
    }
  }, []);

  return {
    permissions,
    settings,
    isRegistered,
    deviceToken,
    lastNotification,
    isLoading,
    requestPermissions,
    registerDevice,
    unregisterDevice,
    updateSettings,
    scheduleNotification,
    cancelNotification,
    clearAllNotifications,
  };
};

/**
 * Hook for notification permission status
 */
export const useNotificationPermissions = () => {
  const [permissions, setPermissions] = useState<NotificationPermissions | null>(null);

  useEffect(() => {
    const checkPermissions = async () => {
      const currentPermissions = await notificationManager.getPermissions();
      setPermissions(currentPermissions);
    };

    checkPermissions();
  }, []);

  return permissions;
};

/**
 * Hook for incoming notifications
 */
export const useIncomingNotifications = () => {
  const [notifications, setNotifications] = useState<Notifications.Notification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationManager.onNotificationReceived((notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
    });

    return unsubscribe;
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return { notifications, clearNotifications };
};

/**
 * Hook for scheduling reminders
 */
export const useNotificationReminders = () => {
  const scheduleEventReminder = useCallback(async (
    eventTitle: string,
    eventDate: Date,
    reminderMinutesBefore: number = 30
  ): Promise<string> => {
    const reminderTime = new Date(eventDate.getTime() - reminderMinutesBefore * 60000);
    
    if (reminderTime <= new Date()) {
      throw new Error('Reminder time is in the past');
    }

    return await notificationManager.scheduleLocalNotification(
      'Event Reminder',
      `${eventTitle} starts in ${reminderMinutesBefore} minutes`,
      {
        type: 'event_reminder',
        eventTitle,
        eventDate: eventDate.toISOString(),
      },
      {
        date: reminderTime,
      }
    );
  }, []);

  const scheduleCheckinReminder = useCallback(async (
    serviceDate: Date,
    reminderHoursBefore: number = 1
  ): Promise<string> => {
    const reminderTime = new Date(serviceDate.getTime() - reminderHoursBefore * 60 * 60000);
    
    if (reminderTime <= new Date()) {
      throw new Error('Reminder time is in the past');
    }

    return await notificationManager.scheduleLocalNotification(
      'Check-in Reminder',
      `Don't forget to check in to today's service!`,
      {
        type: 'checkin_reminder',
        serviceDate: serviceDate.toISOString(),
      },
      {
        date: reminderTime,
      }
    );
  }, []);

  return {
    scheduleEventReminder,
    scheduleCheckinReminder,
  };
};

/**
 * Handle notification tap navigation
 */
function handleNotificationTap(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data;
  
  // This would integrate with your navigation system
  // For now, just log the data
  console.log('Handling notification tap:', data);
  
  // Example navigation logic:
  // if (data.type === 'event_reminder' && data.eventId) {
  //   navigation.navigate('EventDetail', { eventId: data.eventId });
  // } else if (data.type === 'checkin_reminder') {
  //   navigation.navigate('CheckIn');
  // } else if (data.type === 'announcement') {
  //   navigation.navigate('Announcements', { announcementId: data.announcementId });
  // }
}

export default useNotifications;