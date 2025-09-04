/**
 * Push Notification Service
 * Manages push notifications using Expo Notifications
 * Handles registration, permissions, and notification processing
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { productionApiClient } from '@/lib/api/productionClient';
import { useAuthStore } from '@/lib/store/authStore';

export interface NotificationData {
  type: 'event' | 'checkin' | 'group' | 'pathway' | 'announcement' | 'reminder';
  id: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export interface PushToken {
  token: string;
  type: 'expo' | 'fcm' | 'apns';
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async notification => {
    const data = notification.request.content.data as any;

    // Determine if notification should be shown when app is in foreground
    const shouldShow = data?.showInForeground !== false;

    return {
      shouldShowAlert: shouldShow,
      shouldPlaySound: shouldShow,
      shouldSetBadge: true,
    };
  },
});

export class PushNotificationService {
  private static pushToken: string | null = null;
  private static isRegistered = false;
  private static notificationListener: any = null;
  private static responseListener: any = null;

  /**
   * Initialize push notification service
   */
  static async initialize(): Promise<void> {
    try {
      // Register for push notifications
      const token = await this.registerForPushNotifications();

      if (token) {
        this.pushToken = token;
        console.log('Push notifications initialized with token:', token);

        // Set up notification listeners
        this.setupNotificationListeners();

        // Register token with backend (if user is authenticated)
        const authState = useAuthStore.getState();
        if (authState.isAuthenticated && authState.user) {
          await this.registerTokenWithBackend(token);
        }

        this.isRegistered = true;
      } else {
        console.warn('Failed to get push notification token');
      }
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  /**
   * Register for push notifications and get token
   */
  static async registerForPushNotifications(): Promise<string | null> {
    try {
      // Check if running on physical device
      if (!Device.isDevice) {
        console.warn('Push notifications require a physical device');
        return null;
      }

      // Get existing permission status
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Ask for permission if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permission not granted');
        return null;
      }

      // Get push token
      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your actual project ID
      });

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1e7ce8',
          sound: 'default',
        });

        // Create additional channels for different notification types
        await this.createNotificationChannels();
      }

      return pushTokenData.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Create notification channels for Android
   */
  static async createNotificationChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      const channels = [
        {
          id: 'events',
          name: 'Event Notifications',
          description: 'Notifications about church events and RSVPs',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
        },
        {
          id: 'checkin',
          name: 'Check-in Reminders',
          description: 'Reminders to check in to services',
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: 'default',
        },
        {
          id: 'groups',
          name: 'Life Group Updates',
          description: 'Updates about your life groups',
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: 'default',
        },
        {
          id: 'pathways',
          name: 'Pathway Progress',
          description: 'Updates about your discipleship pathway',
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: 'default',
        },
        {
          id: 'announcements',
          name: 'Church Announcements',
          description: 'Important announcements from your church',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
        },
      ];

      for (const channel of channels) {
        await Notifications.setNotificationChannelAsync(channel.id, channel);
      }

      console.log('Created notification channels for Android');
    } catch (error) {
      console.error('Error creating notification channels:', error);
    }
  }

  /**
   * Set up notification event listeners
   */
  static setupNotificationListeners(): void {
    // Listener for notifications received while app is running
    this.notificationListener = Notifications.addNotificationReceivedListener(
      notification => {
        console.log('Notification received:', notification);
        this.handleNotificationReceived(notification);
      }
    );

    // Listener for user interaction with notifications
    this.responseListener =
      Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response:', response);
        this.handleNotificationResponse(response);
      });
  }

  /**
   * Handle notification received while app is running
   */
  static handleNotificationReceived(
    notification: Notifications.Notification
  ): void {
    const data = notification.request.content.data as any;

    // Update app badge count
    if (data?.badgeCount) {
      Notifications.setBadgeCountAsync(data.badgeCount);
    }

    // Handle specific notification types
    if (data?.type) {
      switch (data.type) {
        case 'event':
          // Could trigger event list refresh
          break;
        case 'checkin':
          // Could show check-in reminder
          break;
        case 'group':
          // Could refresh group data
          break;
        default:
          break;
      }
    }
  }

  /**
   * Handle user tapping on notification
   */
  static handleNotificationResponse(
    response: Notifications.NotificationResponse
  ): void {
    const data = response.notification.request.content.data as any;

    // Navigate to relevant screen based on notification type
    if (data?.type && data?.id) {
      switch (data.type) {
        case 'event':
          // Navigate to event detail screen
          // NavigationService.navigate('EventDetail', { eventId: data.id });
          break;
        case 'checkin':
          // Navigate to check-in screen
          // NavigationService.navigate('CheckIn');
          break;
        case 'group':
          // Navigate to group screen
          // NavigationService.navigate('GroupDetail', { groupId: data.id });
          break;
        case 'pathway':
          // Navigate to pathway screen
          // NavigationService.navigate('PathwayDetail', { pathwayId: data.id });
          break;
        default:
          // Navigate to relevant screen or show in-app notification
          break;
      }
    }
  }

  /**
   * Register push token with backend
   */
  static async registerTokenWithBackend(token: string): Promise<boolean> {
    try {
      const response = await productionApiClient.post(
        '/api/mobile/notifications/register',
        {
          pushToken: token,
          platform: Platform.OS,
          deviceInfo: {
            deviceId: Device.deviceName || 'unknown',
            deviceType: Device.deviceType,
            osVersion: Device.osVersion,
            appVersion: '1.0.0', // Could get from app.json
          },
        }
      );

      if (response.success) {
        console.log('Successfully registered push token with backend');
        return true;
      } else {
        console.error('Failed to register push token:', response.error);
        return false;
      }
    } catch (error) {
      console.error('Error registering push token with backend:', error);
      return false;
    }
  }

  /**
   * Unregister push token from backend
   */
  static async unregisterTokenFromBackend(): Promise<boolean> {
    try {
      if (!this.pushToken) {
        return true; // No token to unregister
      }

      const response = await productionApiClient.post(
        '/api/mobile/notifications/unregister',
        {
          pushToken: this.pushToken,
        }
      );

      if (response.success) {
        console.log('Successfully unregistered push token from backend');
        return true;
      } else {
        console.error('Failed to unregister push token:', response.error);
        return false;
      }
    } catch (error) {
      console.error('Error unregistering push token from backend:', error);
      return false;
    }
  }

  /**
   * Send local notification (for testing or offline scenarios)
   */
  static async sendLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>,
    options?: {
      sound?: boolean;
      badge?: number;
      channelId?: string;
    }
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: options?.sound !== false,
          badge: options?.badge,
        },
        trigger: null, // Show immediately
        identifier: `local_${Date.now()}`,
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  /**
   * Schedule a local notification for later
   */
  static async scheduleLocalNotification(
    title: string,
    body: string,
    trigger: Date | number,
    data?: Record<string, any>,
    options?: {
      sound?: boolean;
      badge?: number;
      channelId?: string;
      identifier?: string;
    }
  ): Promise<string | null> {
    try {
      const identifier = options?.identifier || `scheduled_${Date.now()}`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: options?.sound !== false,
          badge: options?.badge,
        },
        trigger: typeof trigger === 'number' ? { seconds: trigger } : trigger,
        identifier,
      });

      return identifier;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      return null;
    }
  }

  /**
   * Cancel scheduled notification
   */
  static async cancelScheduledNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Error canceling scheduled notification:', error);
    }
  }

  /**
   * Clear all notifications
   */
  static async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  /**
   * Set app badge count
   */
  static async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  /**
   * Get current notification settings
   */
  static async getNotificationSettings() {
    try {
      const settings = await Notifications.getPermissionsAsync();
      return {
        granted: settings.status === 'granted',
        canAskAgain: settings.canAskAgain,
        canSetBadge: settings.ios?.allowsBadge ?? true,
        canPlaySound: settings.ios?.allowsSound ?? true,
        canShowAlert: settings.ios?.allowsAlert ?? true,
        token: this.pushToken,
        isRegistered: this.isRegistered,
      };
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return {
        granted: false,
        canAskAgain: false,
        canSetBadge: false,
        canPlaySound: false,
        canShowAlert: false,
        token: null,
        isRegistered: false,
      };
    }
  }

  /**
   * Request notification permissions again
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Get current push token
   */
  static getCurrentToken(): string | null {
    return this.pushToken;
  }

  /**
   * Check if notifications are initialized
   */
  static isInitialized(): boolean {
    return this.isRegistered;
  }

  /**
   * Cleanup notification service
   */
  static cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }

    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }

    this.isRegistered = false;
    console.log('PushNotificationService cleanup complete');
  }
}

// Export commonly used types
export type { Notifications };

export default PushNotificationService;
