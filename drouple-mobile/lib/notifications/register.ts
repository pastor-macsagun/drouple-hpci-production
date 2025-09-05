import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

export interface DeviceRegistrationData {
  deviceId: string;
  platform: 'ios' | 'android';
  pushToken?: string;
  appVersion: string;
  osVersion: string;
}

/**
 * Request notification permissions with rationale (after onboarding as per PRD)
 */
export async function requestNotificationPermissions(): Promise<NotificationPermissionStatus> {
  if (!Device.isDevice) {
    return {
      granted: false,
      canAskAgain: false,
      status: 'unavailable_on_simulator',
    };
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    
    return {
      granted: status === 'granted',
      canAskAgain: status !== 'denied',
      status,
    };
  }

  return {
    granted: true,
    canAskAgain: true,
    status: existingStatus,
  };
}

/**
 * Get push notification token
 */
export async function getPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.warn('Push notifications not supported on simulator');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Set up platform-specific notification channels and categories
 */
export async function setupNotificationPlatform() {
  if (Platform.OS === 'android') {
    // Set up Android notification channels as per PRD
    await Notifications.setNotificationChannelAsync('general', {
      name: 'General',
      description: 'General church notifications and updates',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });

    await Notifications.setNotificationChannelAsync('prayer_requests', {
      name: 'Prayer Requests',
      description: 'Prayer request notifications',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1e7ce8',
    });

    await Notifications.setNotificationChannelAsync('announcements', {
      name: 'Announcements', 
      description: 'Important church announcements',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#e5c453',
    });
  } else if (Platform.OS === 'ios') {
    // Set up iOS notification categories with actions as per PRD
    await Notifications.setNotificationCategoryAsync('RSVP', [
      {
        identifier: 'rsvp_yes',
        buttonTitle: 'Going',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'rsvp_no',
        buttonTitle: 'Not Going',
        options: {
          opensAppToForeground: false,
        },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('PRAYER', [
      {
        identifier: 'mark_prayed',
        buttonTitle: 'Mark as Prayed',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: 'view_request',
        buttonTitle: 'View Request',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);
  }
}

/**
 * Get device information for registration
 */
export async function getDeviceInfo(): Promise<DeviceRegistrationData> {
  const deviceId = await Device.getDeviceTypeAsync();
  const platform = Platform.OS as 'ios' | 'android';
  
  return {
    deviceId: Device.deviceName || `${platform}_${deviceId}_${Date.now()}`,
    platform,
    pushToken: await getPushToken() || undefined,
    appVersion: '1.0.0', // This should come from app config
    osVersion: Device.osVersion || Platform.Version.toString(),
  };
}

/**
 * Register device with backend
 */
export async function registerDevice(
  apiClient: any, // Your API client instance
  preferences?: NotificationPreferences
): Promise<boolean> {
  try {
    const deviceInfo = await getDeviceInfo();
    
    const response = await apiClient.post('/api/v2/notifications/register', {
      ...deviceInfo,
      preferences: preferences || {
        general: true,
        prayerRequests: true,
        announcements: true,
        events: true,
        pathways: true,
      },
    });

    return response.success;
  } catch (error) {
    console.error('Device registration failed:', error);
    return false;
  }
}

export interface NotificationPreferences {
  general: boolean;
  prayerRequests: boolean;
  announcements: boolean;
  events: boolean;
  pathways: boolean;
}

/**
 * Complete notification setup flow as per PRD
 * Call this after onboarding with proper rationale
 */
export async function setupNotifications(
  apiClient: any,
  preferences?: NotificationPreferences
): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> {
  try {
    // 1. Set up platform-specific channels/categories
    await setupNotificationPlatform();
    
    // 2. Request permissions with rationale
    const permissionResult = await requestNotificationPermissions();
    
    if (!permissionResult.granted) {
      return {
        success: false,
        error: 'Notification permissions not granted',
      };
    }
    
    // 3. Get push token
    const pushToken = await getPushToken();
    
    if (!pushToken) {
      return {
        success: false,
        error: 'Could not get push token',
      };
    }
    
    // 4. Register with backend
    const registered = await registerDevice(apiClient, preferences);
    
    if (!registered) {
      return {
        success: false,
        error: 'Backend registration failed',
      };
    }
    
    return {
      success: true,
      token: pushToken,
    };
  } catch (error) {
    console.error('Notification setup error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}