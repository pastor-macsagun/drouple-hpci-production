/**
 * Push Notification Manager
 * Handles push notification registration, permissions, and device token management
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { httpClient } from '../api/http';
import { ENDPOINTS } from '../../config/endpoints';
import { APP_CONFIG } from '../../config/app';
import type { DeviceRegisterRequest } from '@drouple/contracts';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationPermissions {
  granted: boolean;
  canAskAgain: boolean;
  ios?: {
    status: Notifications.IosAuthorizationStatus;
    allowsAlert: boolean;
    allowsBadge: boolean;
    allowsSound: boolean;
    allowsCriticalAlerts: boolean;
    allowsAnnouncements: boolean;
    allowsDisplayInNotificationCenter: boolean;
    allowsDisplayInCarPlay: boolean;
    allowsDisplayOnLockScreen: boolean;
  };
}

interface DeviceInfo {
  token: string;
  platform: 'ios' | 'android';
  deviceId: string;
  deviceName: string;
  osVersion: string;
  appVersion: string;
  timezone: string;
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

const STORAGE_KEYS = {
  DEVICE_TOKEN: 'push_notification_token',
  DEVICE_REGISTERED: 'device_registered',
  NOTIFICATION_SETTINGS: 'notification_settings',
  PERMISSION_REQUESTED: 'notification_permission_requested',
} as const;

export class NotificationManager {
  private deviceToken: string | null = null;
  private isRegistered = false;
  private settings: NotificationSettings;

  constructor() {
    this.settings = {
      enabled: true,
      allowSound: true,
      allowBadge: true,
      allowBanner: true,
      categories: {
        checkin: true,
        events: true,
        announcements: true,
        reminders: true,
      },
    };

    this.configureNotifications();
  }

  /**
   * Initialize notification manager
   */
  async initialize(): Promise<void> {
    try {
      // Load saved settings
      await this.loadSettings();

      // Configure notification channels (Android)
      if (Platform.OS === 'android') {
        await this.createNotificationChannels();
      }

      // Register device if not already registered
      if (APP_CONFIG.features.enableNotifications) {
        await this.registerDevice();
      }

      console.log('Notification manager initialized');
    } catch (error) {
      console.error('Failed to initialize notification manager:', error);
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<NotificationPermissions> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      // If permissions not determined, ask for permission
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: true,
            allowCriticalAlerts: false,
            allowDisplayInNotificationCenter: true,
            allowDisplayInCarPlay: true,
            allowDisplayOnLockScreen: true,
          },
        });
        finalStatus = status;

        // Track permission request
        await AsyncStorage.setItem(STORAGE_KEYS.PERMISSION_REQUESTED, 'true');
      }

      const permissions = await this.getDetailedPermissions();

      if (permissions.granted) {
        console.log('Push notification permissions granted');
        await this.registerDevice();
      } else {
        console.warn('Push notification permissions denied');
      }

      return permissions;
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return { granted: false, canAskAgain: true };
    }
  }

  /**
   * Get detailed permission status
   */
  async getPermissions(): Promise<NotificationPermissions> {
    try {
      return await this.getDetailedPermissions();
    } catch (error) {
      console.error('Failed to get notification permissions:', error);
      return { granted: false, canAskAgain: true };
    }
  }

  /**
   * Register device for push notifications
   */
  async registerDevice(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.warn('Push notifications not supported on emulator/simulator');
        return false;
      }

      // Check permissions first
      const permissions = await this.getDetailedPermissions();
      if (!permissions.granted) {
        console.warn('No push notification permissions');
        return false;
      }

      // Get or generate push token
      const token = await this.getExpoPushToken();
      if (!token) {
        console.warn('Failed to get push token');
        return false;
      }

      // Check if already registered with same token
      const savedToken = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_TOKEN);
      const isRegistered = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_REGISTERED);

      if (savedToken === token && isRegistered === 'true') {
        console.log('Device already registered with current token');
        this.deviceToken = token;
        this.isRegistered = true;
        return true;
      }

      // Get device info
      const deviceInfo = await this.getDeviceInfo(token);

      // Register with backend
      const registerRequest: DeviceRegisterRequest = {
        token: deviceInfo.token,
        platform: deviceInfo.platform,
        appVersion: deviceInfo.appVersion,
      };

      const response = await httpClient.post(
        ENDPOINTS.NOTIFICATIONS.REGISTER_DEVICE,
        registerRequest
      );

      if (response.success) {
        // Save registration info
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.DEVICE_TOKEN, token),
          AsyncStorage.setItem(STORAGE_KEYS.DEVICE_REGISTERED, 'true'),
        ]);

        this.deviceToken = token;
        this.isRegistered = true;

        console.log('Device registered for push notifications');
        return true;
      } else {
        throw new Error(response.error || 'Device registration failed');
      }
    } catch (error) {
      console.error('Failed to register device:', error);
      return false;
    }
  }

  /**
   * Unregister device from push notifications
   */
  async unregisterDevice(): Promise<boolean> {
    try {
      // TODO: Implement backend unregistration endpoint
      // For now, just clear local storage

      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.DEVICE_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.DEVICE_REGISTERED),
      ]);

      this.deviceToken = null;
      this.isRegistered = false;

      console.log('Device unregistered from push notifications');
      return true;
    } catch (error) {
      console.error('Failed to unregister device:', error);
      return false;
    }
  }

  /**
   * Get current device token
   */
  getDeviceToken(): string | null {
    return this.deviceToken;
  }

  /**
   * Check if device is registered
   */
  isDeviceRegistered(): boolean {
    return this.isRegistered;
  }

  /**
   * Get notification settings
   */
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * Update notification settings
   */
  async updateSettings(updates: Partial<NotificationSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...updates };
      await AsyncStorage.setItem(
        STORAGE_KEYS.NOTIFICATION_SETTINGS,
        JSON.stringify(this.settings)
      );

      console.log('Notification settings updated');
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  }

  /**
   * Handle incoming notifications (when app is running)
   */
  onNotificationReceived(callback: (notification: Notifications.Notification) => void): () => void {
    const subscription = Notifications.addNotificationReceivedListener(callback);
    return () => subscription.remove();
  }

  /**
   * Handle notification taps (when user taps notification)
   */
  onNotificationTapped(callback: (response: Notifications.NotificationResponse) => void): () => void {
    const subscription = Notifications.addNotificationResponseReceivedListener(callback);
    return () => subscription.remove();
  }

  /**
   * Schedule local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: this.settings.allowSound,
          badge: this.settings.allowBadge ? 1 : undefined,
        },
        trigger: trigger || null, // null = immediate
      });

      return identifier;
    } catch (error) {
      console.error('Failed to schedule local notification:', error);
      throw error;
    }
  }

  /**
   * Cancel scheduled notification
   */
  async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }

  /**
   * Configure notification behavior
   */
  private configureNotifications(): void {
    // Set notification handler (how to show notifications when app is running)
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: this.settings.enabled && this.settings.allowBanner,
        shouldPlaySound: this.settings.enabled && this.settings.allowSound,
        shouldSetBadge: this.settings.enabled && this.settings.allowBadge,
      }),
    });
  }

  /**
   * Create notification channels for Android
   */
  private async createNotificationChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      // Default channel
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1e7ce8',
        sound: 'default',
      });

      // Check-in channel
      await Notifications.setNotificationChannelAsync('checkin', {
        name: 'Check-in Notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1e7ce8',
      });

      // Events channel
      await Notifications.setNotificationChannelAsync('events', {
        name: 'Event Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#e5c453',
      });

      // Announcements channel
      await Notifications.setNotificationChannelAsync('announcements', {
        name: 'Announcements',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#1e7ce8',
      });

      console.log('Notification channels created');
    } catch (error) {
      console.error('Failed to create notification channels:', error);
    }
  }

  /**
   * Get Expo push token
   */
  private async getExpoPushToken(): Promise<string | null> {
    try {
      const { data: token } = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      return token;
    } catch (error) {
      console.error('Failed to get Expo push token:', error);
      return null;
    }
  }

  /**
   * Get detailed device information
   */
  private async getDeviceInfo(token: string): Promise<DeviceInfo> {
    return {
      token,
      platform: Platform.OS as 'ios' | 'android',
      deviceId: Constants.sessionId || 'unknown',
      deviceName: Device.deviceName || 'Unknown Device',
      osVersion: Device.osVersion || 'unknown',
      appVersion: Constants.expoConfig?.version || '1.0.0',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  /**
   * Get detailed permissions
   */
  private async getDetailedPermissions(): Promise<NotificationPermissions> {
    const permissions = await Notifications.getPermissionsAsync();

    return {
      granted: permissions.status === 'granted',
      canAskAgain: permissions.canAskAgain,
      ios: permissions.ios ? {
        status: permissions.ios.status,
        allowsAlert: permissions.ios.allowsAlert ?? false,
        allowsBadge: permissions.ios.allowsBadge ?? false,
        allowsSound: permissions.ios.allowsSound ?? false,
        allowsCriticalAlerts: permissions.ios.allowsCriticalAlerts ?? false,
        allowsAnnouncements: permissions.ios.allowsAnnouncements ?? false,
        allowsDisplayInNotificationCenter: permissions.ios.allowsDisplayInNotificationCenter ?? false,
        allowsDisplayInCarPlay: permissions.ios.allowsDisplayInCarPlay ?? false,
        allowsDisplayOnLockScreen: permissions.ios.allowsDisplayOnLockScreen ?? false,
      } : undefined,
    };
  }

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const savedSettings = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }

      const deviceToken = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_TOKEN);
      const isRegistered = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_REGISTERED);

      this.deviceToken = deviceToken;
      this.isRegistered = isRegistered === 'true';
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }
}

// Singleton instance
export const notificationManager = new NotificationManager();

export default notificationManager;