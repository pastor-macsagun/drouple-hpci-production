/**
 * Notification Service
 * Handles push notifications, permission management, and local notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type:
    | 'event_reminder'
    | 'rsvp_confirmation'
    | 'service_reminder'
    | 'announcement';
  eventId?: string;
  serviceId?: string;
  announcementId?: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export interface PushTokenData {
  token: string;
  userId: string;
  churchId: string;
  deviceInfo: {
    platform: string;
    modelName?: string;
    osVersion?: string;
  };
}

class NotificationService {
  private pushToken: string | null = null;
  private isInitialized = false;
  private permissionGranted = false;

  /**
   * Initialize the notification service
   */
  async initialize(userId: string, churchId: string): Promise<boolean> {
    try {
      console.log('Initializing notifications service...');

      // Check if device supports notifications
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return false;
      }

      // Request permissions
      this.permissionGranted = await this.requestPermissions();
      if (!this.permissionGranted) {
        console.warn('Notification permissions not granted');
        return false;
      }

      // Get push token
      const tokenData = await this.getPushToken();
      if (tokenData) {
        // Send token to server
        await this.registerTokenWithServer(tokenData, userId, churchId);
        this.pushToken = tokenData.token;
      }

      this.isInitialized = true;
      console.log('Notifications service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      return false;
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Permission to access notifications was denied');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(
          'church-notifications',
          {
            name: 'Church Notifications',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#1e7ce8',
            sound: 'default',
          }
        );
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Get push notification token
   */
  async getPushToken(): Promise<{ token: string; deviceInfo: any } | null> {
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      const deviceInfo = {
        platform: Platform.OS,
        modelName: Device.modelName,
        osVersion: Device.osVersion,
      };

      return {
        token: tokenData.data,
        deviceInfo,
      };
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Register push token with server
   */
  async registerTokenWithServer(
    tokenData: { token: string; deviceInfo: any },
    userId: string,
    churchId: string
  ): Promise<void> {
    try {
      // In a real app, send this to your backend
      const payload: PushTokenData = {
        token: tokenData.token,
        userId,
        churchId,
        deviceInfo: tokenData.deviceInfo,
      };

      // Mock API call - replace with actual endpoint
      console.log('Registering push token with server:', payload);

      // await apiClient.post('/api/notifications/register', payload);

      // For demo purposes, store in device storage
      await this.storeTokenLocally(payload);
    } catch (error) {
      console.error('Failed to register token with server:', error);
      throw error;
    }
  }

  /**
   * Store token locally for demo purposes
   */
  private async storeTokenLocally(tokenData: PushTokenData): Promise<void> {
    try {
      // Store token data locally (in a real app, this would be sent to server)
      const tokensJson = JSON.stringify(tokenData);
      console.log('Push token stored locally:', tokensJson);
    } catch (error) {
      console.error('Failed to store token locally:', error);
    }
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    data: NotificationData,
    triggerDate?: Date
  ): Promise<string> {
    try {
      if (!this.permissionGranted) {
        throw new Error('Notification permissions not granted');
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.message,
          data: data.data || {},
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: triggerDate ? { type: 'date', date: triggerDate } : null,
      });

      console.log('Local notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Failed to schedule local notification:', error);
      throw error;
    }
  }

  /**
   * Show immediate notification
   */
  async showNotification(data: NotificationData): Promise<string> {
    return this.scheduleLocalNotification(data);
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<
    Notifications.NotificationRequest[]
  > {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Handle notification response (when user taps notification)
   */
  handleNotificationResponse(
    response: Notifications.NotificationResponse
  ): void {
    const { notification } = response;
    const { type, eventId, serviceId, announcementId } =
      notification.request.content.data || {};

    console.log('Notification tapped:', type, {
      eventId,
      serviceId,
      announcementId,
    });

    // Navigate based on notification type
    switch (type) {
      case 'event_reminder':
      case 'rsvp_confirmation':
        if (eventId) {
          // Navigate to event detail
          console.log('Navigate to event:', eventId);
        }
        break;
      case 'service_reminder':
        if (serviceId) {
          // Navigate to service or check-in
          console.log('Navigate to check-in for service:', serviceId);
        }
        break;
      case 'announcement':
        if (announcementId) {
          // Navigate to announcement detail
          console.log('Navigate to announcement:', announcementId);
        }
        break;
      default:
        console.log('Unknown notification type:', type);
    }
  }

  /**
   * Schedule event reminder
   */
  async scheduleEventReminder(
    eventId: string,
    eventTitle: string,
    eventDate: Date,
    reminderMinutes: number = 60
  ): Promise<string> {
    const reminderDate = new Date(
      eventDate.getTime() - reminderMinutes * 60 * 1000
    );

    // Don't schedule if reminder time is in the past
    if (reminderDate < new Date()) {
      throw new Error('Cannot schedule reminder in the past');
    }

    const notificationData: NotificationData = {
      type: 'event_reminder',
      eventId,
      title: 'Event Reminder',
      message: `${eventTitle} starts in ${reminderMinutes} minutes`,
      data: { eventId, eventTitle },
    };

    return this.scheduleLocalNotification(notificationData, reminderDate);
  }

  /**
   * Schedule service reminder
   */
  async scheduleServiceReminder(
    serviceId: string,
    serviceName: string,
    serviceDate: Date,
    reminderMinutes: number = 30
  ): Promise<string> {
    const reminderDate = new Date(
      serviceDate.getTime() - reminderMinutes * 60 * 1000
    );

    if (reminderDate < new Date()) {
      throw new Error('Cannot schedule reminder in the past');
    }

    const notificationData: NotificationData = {
      type: 'service_reminder',
      serviceId,
      title: 'Service Reminder',
      message: `${serviceName} starts in ${reminderMinutes} minutes`,
      data: { serviceId, serviceName },
    };

    return this.scheduleLocalNotification(notificationData, reminderDate);
  }

  /**
   * Show RSVP confirmation
   */
  async showRSVPConfirmation(
    eventTitle: string,
    status: 'confirmed' | 'waitlisted'
  ): Promise<string> {
    const message =
      status === 'confirmed'
        ? `Your RSVP for "${eventTitle}" has been confirmed!`
        : `You've been added to the waitlist for "${eventTitle}"`;

    const notificationData: NotificationData = {
      type: 'rsvp_confirmation',
      title: 'RSVP Update',
      message,
      data: { eventTitle, status },
    };

    return this.showNotification(notificationData);
  }

  /**
   * Get notification permission status
   */
  async getPermissionStatus(): Promise<string> {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current push token
   */
  getCurrentPushToken(): string | null {
    return this.pushToken;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

export default notificationService;
