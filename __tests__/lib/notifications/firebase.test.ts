/**
 * @file Tests for Firebase push notification integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as admin from 'firebase-admin';
import {
  initializeFirebase,
  getFirebaseMessaging,
  sendNotificationToDevice,
  sendNotificationToDevices,
  subscribeToTopic,
  unsubscribeFromTopic,
  sendNotificationToTopic,
  isValidFCMToken,
  cleanupFirebase,
} from '@/lib/notifications/firebase';

// Mock firebase-admin
vi.mock('firebase-admin', () => ({
  default: {
    initializeApp: vi.fn(),
    credential: {
      cert: vi.fn(),
    },
    messaging: vi.fn(),
  },
  initializeApp: vi.fn(),
  credential: {
    cert: vi.fn(),
  },
  messaging: vi.fn(),
}));

describe('Firebase Push Notifications', () => {
  const mockMessaging = {
    send: vi.fn(),
    sendMulticast: vi.fn(),
    subscribeToTopic: vi.fn(),
    unsubscribeFromTopic: vi.fn(),
  };

  const mockApp = {
    delete: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset environment variables
    process.env.FIREBASE_PROJECT_ID = 'test-project';
    process.env.FIREBASE_CLIENT_EMAIL = 'test@example.com';
    process.env.FIREBASE_PRIVATE_KEY = 'test-private-key';
    process.env.NODE_ENV = 'test';

    // Mock Firebase admin methods
    vi.mocked(admin.initializeApp).mockReturnValue(mockApp as any);
    vi.mocked(admin.messaging).mockReturnValue(mockMessaging as any);
    vi.mocked(admin.credential.cert).mockReturnValue({} as any);
  });

  afterEach(() => {
    cleanupFirebase();
  });

  describe('Initialization', () => {
    it('should skip initialization in test environment', () => {
      const app = initializeFirebase();
      expect(app).toEqual({});
      expect(admin.initializeApp).not.toHaveBeenCalled();
    });

    it('should initialize with valid config in production', () => {
      process.env.NODE_ENV = 'production';
      
      const app = initializeFirebase();
      
      expect(admin.credential.cert).toHaveBeenCalledWith({
        projectId: 'test-project',
        clientEmail: 'test@example.com',
        privateKey: 'test-private-key',
      });
      expect(admin.initializeApp).toHaveBeenCalled();
    });

    it('should throw error with missing config', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.FIREBASE_PROJECT_ID;
      
      expect(() => initializeFirebase()).toThrow('Firebase configuration missing');
    });

    it('should return existing app on multiple calls', () => {
      const app1 = initializeFirebase();
      const app2 = initializeFirebase();
      expect(app1).toBe(app2);
    });
  });

  describe('Token Validation', () => {
    it('should validate correct FCM token format', () => {
      const validToken = 'A'.repeat(150); // Valid length FCM token
      expect(isValidFCMToken(validToken)).toBe(true);
    });

    it('should reject invalid FCM tokens', () => {
      expect(isValidFCMToken('')).toBe(false);
      expect(isValidFCMToken('short')).toBe(false);
      expect(isValidFCMToken('invalid-characters!')).toBe(false);
      expect(isValidFCMToken(null as any)).toBe(false);
      expect(isValidFCMToken(undefined as any)).toBe(false);
    });
  });

  describe('Single Device Notifications', () => {
    it('should send notification to single device successfully', async () => {
      const token = 'valid-device-token';
      const payload = {
        title: 'Test Notification',
        body: 'This is a test',
        priority: 'MEDIUM' as const,
      };

      const result = await sendNotificationToDevice(token, payload, 'android');

      expect(result.success).toBe(true);
      expect(result.token).toBe(token);
      expect(result.messageId).toMatch(/^mock_/);
    });

    it('should handle single device notification failure', async () => {
      process.env.NODE_ENV = 'production';
      mockMessaging.send.mockRejectedValueOnce(new Error('FCM Error'));

      const token = 'invalid-token';
      const payload = {
        title: 'Test Notification',
        body: 'This is a test',
        priority: 'MEDIUM' as const,
      };

      const result = await sendNotificationToDevice(token, payload, 'android');

      expect(result.success).toBe(false);
      expect(result.error).toBe('FCM Error');
      expect(result.token).toBe(token);
    });

    it('should build correct FCM message for Android', async () => {
      process.env.NODE_ENV = 'production';
      mockMessaging.send.mockResolvedValueOnce('msg123');

      const token = 'android-token';
      const payload = {
        title: 'Android Test',
        body: 'Android message',
        priority: 'HIGH' as const,
        imageUrl: 'https://example.com/image.png',
        data: { customKey: 'customValue' },
      };

      await sendNotificationToDevice(token, payload, 'android');

      expect(mockMessaging.send).toHaveBeenCalledWith({
        token,
        notification: {
          title: 'Android Test',
          body: 'Android message',
          imageUrl: 'https://example.com/image.png',
        },
        data: {
          customKey: 'customValue',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          timestamp: expect.any(String),
        },
        android: {
          priority: 'high',
          notification: {
            priority: 'high',
            sound: 'default',
            channelId: 'drouple_high_priority',
            color: '#1e7ce8',
          },
        },
      });
    });

    it('should build correct FCM message for iOS', async () => {
      process.env.NODE_ENV = 'production';
      mockMessaging.send.mockResolvedValueOnce('msg123');

      const token = 'ios-token';
      const payload = {
        title: 'iOS Test',
        body: 'iOS message',
        priority: 'LOW' as const,
        badge: 5,
      };

      await sendNotificationToDevice(token, payload, 'ios');

      expect(mockMessaging.send).toHaveBeenCalledWith({
        token,
        notification: {
          title: 'iOS Test',
          body: 'iOS message',
        },
        data: {
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          timestamp: expect.any(String),
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: 'iOS Test',
                body: 'iOS message',
              },
              sound: 'default',
              badge: 5,
              'mutable-content': 1,
            },
          },
        },
      });
    });
  });

  describe('Multiple Device Notifications', () => {
    it('should send notifications to multiple devices successfully', async () => {
      const tokens = ['token1', 'token2', 'token3'];
      const payload = {
        title: 'Broadcast Test',
        body: 'Message to all',
        priority: 'MEDIUM' as const,
      };

      const results = await sendNotificationToDevices(tokens, payload, 'android');

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.token).toBe(tokens[index]);
        expect(result.messageId).toMatch(/^mock_/);
      });
    });

    it('should handle mixed success/failure results', async () => {
      process.env.NODE_ENV = 'production';
      
      const mockResponse = {
        responses: [
          { success: true, messageId: 'msg1' },
          { success: false, error: { message: 'Invalid token', code: 'messaging/invalid-registration-token' } },
          { success: true, messageId: 'msg3' },
        ],
      };
      
      mockMessaging.sendMulticast.mockResolvedValueOnce(mockResponse);

      const tokens = ['valid1', 'invalid', 'valid2'];
      const payload = {
        title: 'Mixed Test',
        body: 'Some will fail',
        priority: 'MEDIUM' as const,
      };

      const results = await sendNotificationToDevices(tokens, payload, 'android');

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({
        success: true,
        messageId: 'msg1',
        token: 'valid1',
      });
      expect(results[1]).toEqual({
        success: false,
        error: 'Invalid token',
        token: 'invalid',
        errorCode: 'messaging/invalid-registration-token',
      });
      expect(results[2]).toEqual({
        success: true,
        messageId: 'msg3',
        token: 'valid2',
      });
    });

    it('should return empty array for no tokens', async () => {
      const results = await sendNotificationToDevices([], {
        title: 'Test',
        body: 'Test',
        priority: 'MEDIUM',
      });

      expect(results).toEqual([]);
    });
  });

  describe('Topic Operations', () => {
    it('should subscribe tokens to topic successfully', async () => {
      const tokens = ['token1', 'token2'];
      const topic = 'announcements';

      const result = await subscribeToTopic(tokens, topic);

      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(result.errors).toBeUndefined();
    });

    it('should unsubscribe tokens from topic successfully', async () => {
      const tokens = ['token1', 'token2'];
      const topic = 'announcements';

      const result = await unsubscribeFromTopic(tokens, topic);

      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
    });

    it('should handle topic subscription errors', async () => {
      process.env.NODE_ENV = 'production';
      mockMessaging.subscribeToTopic.mockRejectedValueOnce(new Error('Topic error'));

      const tokens = ['token1'];
      const topic = 'announcements';

      const result = await subscribeToTopic(tokens, topic);

      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(1);
      expect(result.errors).toEqual(['Topic error']);
    });

    it('should send notification to topic', async () => {
      const topic = 'announcements';
      const payload = {
        title: 'Topic Message',
        body: 'Message for topic',
        priority: 'HIGH' as const,
      };

      const result = await sendNotificationToTopic(topic, payload);

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^topic_mock_/);
    });

    it('should handle topic notification errors', async () => {
      process.env.NODE_ENV = 'production';
      mockMessaging.send.mockRejectedValueOnce(new Error('Topic send error'));

      const topic = 'announcements';
      const payload = {
        title: 'Topic Message',
        body: 'Message for topic',
        priority: 'HIGH' as const,
      };

      const result = await sendNotificationToTopic(topic, payload);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Topic send error');
    });

    it('should return empty results for empty token array', async () => {
      const result = await subscribeToTopic([], 'announcements');
      expect(result).toEqual({ successCount: 0, failureCount: 0 });

      const result2 = await unsubscribeFromTopic([], 'announcements');
      expect(result2).toEqual({ successCount: 0, failureCount: 0 });
    });
  });

  describe('Notification Channel IDs', () => {
    it('should use correct channel ID for different priorities', async () => {
      process.env.NODE_ENV = 'production';
      mockMessaging.send.mockResolvedValue('msg123');

      // Test LOW priority
      await sendNotificationToDevice('token1', { 
        title: 'Low', body: 'Low priority', priority: 'LOW' 
      }, 'android');
      
      expect(mockMessaging.send).toHaveBeenCalledWith(
        expect.objectContaining({
          android: expect.objectContaining({
            notification: expect.objectContaining({
              channelId: 'drouple_low_priority',
            }),
          }),
        })
      );

      // Test HIGH priority
      await sendNotificationToDevice('token2', { 
        title: 'High', body: 'High priority', priority: 'HIGH' 
      }, 'android');
      
      expect(mockMessaging.send).toHaveBeenCalledWith(
        expect.objectContaining({
          android: expect.objectContaining({
            notification: expect.objectContaining({
              channelId: 'drouple_high_priority',
            }),
          }),
        })
      );

      // Test MEDIUM/default priority
      await sendNotificationToDevice('token3', { 
        title: 'Medium', body: 'Medium priority', priority: 'MEDIUM' 
      }, 'android');
      
      expect(mockMessaging.send).toHaveBeenCalledWith(
        expect.objectContaining({
          android: expect.objectContaining({
            notification: expect.objectContaining({
              channelId: 'drouple_default',
            }),
          }),
        })
      );
    });
  });

  describe('Cleanup', () => {
    it('should clean up Firebase app', () => {
      process.env.NODE_ENV = 'production';
      initializeFirebase();
      
      cleanupFirebase();
      
      expect(mockApp.delete).toHaveBeenCalled();
    });

    it('should handle cleanup without initialized app', () => {
      expect(() => cleanupFirebase()).not.toThrow();
    });
  });
});