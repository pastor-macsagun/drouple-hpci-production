/**
 * Firebase Cloud Messaging (FCM) Integration
 * Handles push notification delivery via Firebase Admin SDK
 */

import * as admin from 'firebase-admin';
import type { 
  PushNotificationPayload,
  NotificationTopic,
  PushNotificationResult,
  DevicePlatform 
} from '@drouple/contracts';

// Initialize Firebase Admin SDK
let firebaseApp: admin.app.App | null = null;

export function initializeFirebase(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  // Check if running in test environment
  if (process.env.NODE_ENV === 'test') {
    console.log('Firebase initialization skipped in test environment');
    return {} as admin.app.App; // Mock object for tests
  }

  const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  // Validate required config
  if (!firebaseConfig.projectId || !firebaseConfig.clientEmail || !firebaseConfig.privateKey) {
    throw new Error('Firebase configuration missing. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
      projectId: firebaseConfig.projectId,
    });

    console.log('Firebase Admin SDK initialized');
    return firebaseApp;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw error;
  }
}

/**
 * Get Firebase Messaging instance
 */
export function getFirebaseMessaging(): admin.messaging.Messaging {
  const app = initializeFirebase();
  return admin.messaging(app);
}

/**
 * Send push notification to a single device token
 */
export async function sendNotificationToDevice(
  token: string,
  payload: PushNotificationPayload,
  platform: DevicePlatform = 'android'
): Promise<PushNotificationResult> {
  try {
    if (process.env.NODE_ENV === 'test') {
      // Mock success for tests
      return {
        success: true,
        messageId: `mock_${Date.now()}`,
        token,
      };
    }

    const messaging = getFirebaseMessaging();

    // Build platform-specific message
    const message = buildFCMMessage(token, payload, platform);

    // Send message
    const messageId = await messaging.send(message);

    return {
      success: true,
      messageId,
      token,
    };

  } catch (error) {
    console.error('Failed to send notification to device:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      token,
    };
  }
}

/**
 * Send push notifications to multiple device tokens
 */
export async function sendNotificationToDevices(
  tokens: string[],
  payload: PushNotificationPayload,
  platform: DevicePlatform = 'android'
): Promise<PushNotificationResult[]> {
  if (tokens.length === 0) {
    return [];
  }

  try {
    if (process.env.NODE_ENV === 'test') {
      // Mock success for tests
      return tokens.map(token => ({
        success: true,
        messageId: `mock_${Date.now()}_${token.slice(-4)}`,
        token,
      }));
    }

    const messaging = getFirebaseMessaging();

    // Build multicast message
    const message = buildMulticastMessage(tokens, payload, platform);

    // Send multicast message
    const response = await messaging.sendMulticast(message);

    // Process results
    const results: PushNotificationResult[] = [];
    
    response.responses.forEach((resp, index) => {
      const token = tokens[index];
      
      if (resp.success) {
        results.push({
          success: true,
          messageId: resp.messageId!,
          token,
        });
      } else {
        results.push({
          success: false,
          error: resp.error?.message || 'Unknown error',
          token,
          errorCode: resp.error?.code,
        });
      }
    });

    return results;

  } catch (error) {
    console.error('Failed to send notifications to devices:', error);
    
    // Return error for all tokens
    return tokens.map(token => ({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      token,
    }));
  }
}

/**
 * Subscribe device tokens to a topic
 */
export async function subscribeToTopic(
  tokens: string[],
  topic: NotificationTopic
): Promise<{ successCount: number; failureCount: number; errors?: string[] }> {
  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0 };
  }

  try {
    if (process.env.NODE_ENV === 'test') {
      // Mock success for tests
      return { successCount: tokens.length, failureCount: 0 };
    }

    const messaging = getFirebaseMessaging();
    const response = await messaging.subscribeToTopic(tokens, topic);

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      errors: response.errors?.map(err => err.error.message),
    };

  } catch (error) {
    console.error('Failed to subscribe to topic:', error);
    
    return {
      successCount: 0,
      failureCount: tokens.length,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Unsubscribe device tokens from a topic
 */
export async function unsubscribeFromTopic(
  tokens: string[],
  topic: NotificationTopic
): Promise<{ successCount: number; failureCount: number; errors?: string[] }> {
  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0 };
  }

  try {
    if (process.env.NODE_ENV === 'test') {
      // Mock success for tests
      return { successCount: tokens.length, failureCount: 0 };
    }

    const messaging = getFirebaseMessaging();
    const response = await messaging.unsubscribeFromTopic(tokens, topic);

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      errors: response.errors?.map(err => err.error.message),
    };

  } catch (error) {
    console.error('Failed to unsubscribe from topic:', error);
    
    return {
      successCount: 0,
      failureCount: tokens.length,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Send notification to a topic
 */
export async function sendNotificationToTopic(
  topic: NotificationTopic,
  payload: PushNotificationPayload
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'test') {
      // Mock success for tests
      return { success: true, messageId: `topic_mock_${Date.now()}` };
    }

    const messaging = getFirebaseMessaging();

    const message = {
      topic,
      notification: {
        title: payload.title,
        body: payload.body,
        ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
      },
      data: {
        ...(payload.data || {}),
        clickAction: payload.clickAction || 'FLUTTER_NOTIFICATION_CLICK',
        timestamp: new Date().toISOString(),
      },
      android: {
        priority: 'high' as const,
        notification: {
          priority: 'high' as const,
          sound: 'default',
          channelId: getNotificationChannelId(payload.priority || 'MEDIUM'),
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: payload.title,
              body: payload.body,
            },
            sound: 'default',
            badge: payload.badge || 1,
          },
        },
      },
    };

    const messageId = await messaging.send(message);

    return { success: true, messageId };

  } catch (error) {
    console.error('Failed to send notification to topic:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Build FCM message for single device
 */
function buildFCMMessage(
  token: string,
  payload: PushNotificationPayload,
  platform: DevicePlatform
): admin.messaging.Message {
  const baseMessage = {
    token,
    notification: {
      title: payload.title,
      body: payload.body,
      ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
    },
    data: {
      ...(payload.data || {}),
      clickAction: payload.clickAction || 'FLUTTER_NOTIFICATION_CLICK',
      timestamp: new Date().toISOString(),
    },
  };

  if (platform === 'android') {
    return {
      ...baseMessage,
      android: {
        priority: 'high',
        notification: {
          priority: 'high',
          sound: 'default',
          channelId: getNotificationChannelId(payload.priority || 'MEDIUM'),
          color: '#1e7ce8', // Sacred blue color
        },
      },
    };
  } else {
    return {
      ...baseMessage,
      apns: {
        payload: {
          aps: {
            alert: {
              title: payload.title,
              body: payload.body,
            },
            sound: 'default',
            badge: payload.badge || 1,
            'mutable-content': 1,
          },
        },
      },
    };
  }
}

/**
 * Build multicast message for multiple devices
 */
function buildMulticastMessage(
  tokens: string[],
  payload: PushNotificationPayload,
  platform: DevicePlatform
): admin.messaging.MulticastMessage {
  const baseMessage = {
    tokens,
    notification: {
      title: payload.title,
      body: payload.body,
      ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
    },
    data: {
      ...(payload.data || {}),
      clickAction: payload.clickAction || 'FLUTTER_NOTIFICATION_CLICK',
      timestamp: new Date().toISOString(),
    },
  };

  if (platform === 'android') {
    return {
      ...baseMessage,
      android: {
        priority: 'high',
        notification: {
          priority: 'high',
          sound: 'default',
          channelId: getNotificationChannelId(payload.priority || 'MEDIUM'),
          color: '#1e7ce8', // Sacred blue color
        },
      },
    };
  } else {
    return {
      ...baseMessage,
      apns: {
        payload: {
          aps: {
            alert: {
              title: payload.title,
              body: payload.body,
            },
            sound: 'default',
            badge: payload.badge || 1,
            'mutable-content': 1,
          },
        },
      },
    };
  }
}

/**
 * Get notification channel ID based on priority
 */
function getNotificationChannelId(priority: 'LOW' | 'MEDIUM' | 'HIGH'): string {
  switch (priority) {
    case 'LOW':
      return 'drouple_low_priority';
    case 'HIGH':
      return 'drouple_high_priority';
    default:
      return 'drouple_default';
  }
}

/**
 * Validate FCM token format
 */
export function isValidFCMToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // FCM tokens are typically 163-183 characters long and contain specific patterns
  return /^[A-Za-z0-9_-]{140,}$/.test(token) && token.length >= 140;
}

/**
 * Clean up Firebase app (for testing)
 */
export function cleanupFirebase(): void {
  if (firebaseApp) {
    firebaseApp.delete().catch(console.error);
    firebaseApp = null;
  }
}