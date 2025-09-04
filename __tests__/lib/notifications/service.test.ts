/**
 * @file Tests for push notification service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  registerDevice,
  unregisterDevice,
  sendNotificationToUser,
  sendNotificationToRoles,
  sendBroadcastNotification,
  getUserDeviceRegistrations,
  cleanupExpiredDeviceRegistrations,
} from '@/lib/notifications/service';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    keyValue: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/notifications/firebase', () => ({
  isValidFCMToken: vi.fn(),
}));

vi.mock('@/lib/notifications/queue', () => ({
  queueSingleNotification: vi.fn(),
  queueMultipleNotifications: vi.fn(),
  queueTopicSubscription: vi.fn(),
}));

vi.mock('@/lib/auth/rbac', () => ({
  createTenantWhereClause: vi.fn(),
}));

describe('Push Notification Service', () => {
  const { prisma } = vi.mocked(await import('@/lib/db'));
  const { isValidFCMToken } = vi.mocked(await import('@/lib/notifications/firebase'));
  const { 
    queueSingleNotification, 
    queueMultipleNotifications, 
    queueTopicSubscription 
  } = vi.mocked(await import('@/lib/notifications/queue'));
  const { createTenantWhereClause } = vi.mocked(await import('@/lib/auth/rbac'));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Device Registration', () => {
    it('should register device successfully', async () => {
      isValidFCMToken.mockReturnValue(true);
      prisma.keyValue.findUnique.mockResolvedValue(null); // No existing device
      prisma.keyValue.create.mockResolvedValue({} as any);

      const result = await registerDevice('user123', 'valid-token', 'android', '1.0.0');

      expect(result.success).toBe(true);
      expect(prisma.keyValue.create).toHaveBeenCalledWith({
        data: {
          key: 'device_token:valid-token',
          value: JSON.stringify({
            userId: 'user123',
            platform: 'android',
            appVersion: '1.0.0',
            registeredAt: expect.any(String),
            lastSeen: expect.any(String),
          }),
        },
      });
      expect(queueTopicSubscription).toHaveBeenCalled(); // Auto-subscribe to topics
    });

    it('should update existing device registration', async () => {
      isValidFCMToken.mockReturnValue(true);
      prisma.keyValue.findUnique.mockResolvedValue({
        key: 'device_token:existing-token',
        value: JSON.stringify({ userId: 'user123' }),
      } as any);
      prisma.keyValue.update.mockResolvedValue({} as any);

      const result = await registerDevice('user123', 'existing-token', 'ios', '1.1.0');

      expect(result.success).toBe(true);
      expect(prisma.keyValue.update).toHaveBeenCalledWith({
        where: { key: 'device_token:existing-token' },
        data: {
          value: JSON.stringify({
            userId: 'user123',
            platform: 'ios',
            appVersion: '1.1.0',
            registeredAt: expect.any(String),
            lastSeen: expect.any(String),
          }),
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should reject invalid FCM token', async () => {
      isValidFCMToken.mockReturnValue(false);

      const result = await registerDevice('user123', 'invalid-token', 'android');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid FCM token format');
      expect(prisma.keyValue.create).not.toHaveBeenCalled();
    });

    it('should handle registration errors', async () => {
      isValidFCMToken.mockReturnValue(true);
      prisma.keyValue.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await registerDevice('user123', 'valid-token', 'android');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('Device Unregistration', () => {
    it('should unregister device successfully', async () => {
      prisma.keyValue.delete.mockResolvedValue({} as any);
      prisma.keyValue.findUnique.mockResolvedValue({
        value: JSON.stringify(['token1', 'token2']),
      } as any);
      prisma.keyValue.update.mockResolvedValue({} as any);

      const result = await unregisterDevice('user123', 'token1');

      expect(result.success).toBe(true);
      expect(prisma.keyValue.delete).toHaveBeenCalledWith({
        where: { key: 'device_token:token1' },
      });
    });

    it('should handle unregistration errors', async () => {
      prisma.keyValue.delete.mockRejectedValue(new Error('Delete error'));

      const result = await unregisterDevice('user123', 'token1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete error');
    });
  });

  describe('Send Notifications to User', () => {
    it('should send notification to user with registered devices', async () => {
      // Mock user devices lookup
      prisma.keyValue.findUnique
        .mockResolvedValueOnce({
          value: JSON.stringify(['token1', 'token2']),
        } as any)
        .mockResolvedValueOnce({
          value: JSON.stringify({ platform: 'android' }),
        } as any)
        .mockResolvedValueOnce({
          value: JSON.stringify({ platform: 'ios' }),
        } as any);

      queueSingleNotification.mockResolvedValue({ id: 'job1' } as any);

      const result = await sendNotificationToUser(
        'user123',
        'Test Title',
        'Test message',
        { priority: 'HIGH' }
      );

      expect(result.success).toBe(true);
      expect(result.jobCount).toBe(2);
      expect(queueSingleNotification).toHaveBeenCalledTimes(2);
    });

    it('should return error when user has no registered devices', async () => {
      prisma.keyValue.findUnique.mockResolvedValue(null);

      const result = await sendNotificationToUser('user123', 'Title', 'Message');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No registered devices found');
      expect(result.jobCount).toBe(0);
    });

    it('should handle notification sending errors', async () => {
      prisma.keyValue.findUnique.mockRejectedValue(new Error('Lookup error'));

      const result = await sendNotificationToUser('user123', 'Title', 'Message');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Lookup error');
    });
  });

  describe('Send Notifications to Roles', () => {
    it('should send notification to users with specified roles', async () => {
      createTenantWhereClause.mockReturnValue({ tenantId: 'tenant123' });
      
      // Mock users lookup
      prisma.user.findMany.mockResolvedValue([
        { id: 'user1' },
        { id: 'user2' },
      ] as any);

      // Mock device tokens lookup
      prisma.keyValue.findUnique
        .mockResolvedValueOnce({
          value: JSON.stringify(['token1']),
        } as any)
        .mockResolvedValueOnce({
          value: JSON.stringify({ platform: 'android' }),
        } as any)
        .mockResolvedValueOnce({
          value: JSON.stringify(['token2']),
        } as any)
        .mockResolvedValueOnce({
          value: JSON.stringify({ platform: 'ios' }),
        } as any);

      queueMultipleNotifications.mockResolvedValue({ id: 'job1' } as any);

      const result = await sendNotificationToRoles(
        'tenant123',
        ['ADMIN'],
        'Admin Alert',
        'Important message',
        { priority: 'HIGH' }
      );

      expect(result.success).toBe(true);
      expect(result.userCount).toBe(2);
      expect(result.jobCount).toBe(2); // One for Android, one for iOS
    });

    it('should return error when no users found with specified roles', async () => {
      createTenantWhereClause.mockReturnValue({ tenantId: 'tenant123' });
      prisma.user.findMany.mockResolvedValue([]);

      const result = await sendNotificationToRoles(
        'tenant123',
        ['ADMIN'],
        'Title',
        'Message'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('No users found with specified roles');
      expect(result.userCount).toBe(0);
    });

    it('should return error when no devices found for users', async () => {
      createTenantWhereClause.mockReturnValue({ tenantId: 'tenant123' });
      prisma.user.findMany.mockResolvedValue([{ id: 'user1' }] as any);
      prisma.keyValue.findUnique.mockResolvedValue(null); // No devices

      const result = await sendNotificationToRoles(
        'tenant123',
        ['ADMIN'],
        'Title',
        'Message'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('No registered devices found');
      expect(result.userCount).toBe(1);
      expect(result.jobCount).toBe(0);
    });
  });

  describe('Broadcast Notifications', () => {
    it('should send broadcast notification to all users', async () => {
      createTenantWhereClause.mockReturnValue({ tenantId: 'tenant123' });
      prisma.user.findMany.mockResolvedValue([{ id: 'user1' }] as any);
      prisma.keyValue.findUnique
        .mockResolvedValueOnce({
          value: JSON.stringify(['token1']),
        } as any)
        .mockResolvedValueOnce({
          value: JSON.stringify({ platform: 'android' }),
        } as any);

      queueMultipleNotifications.mockResolvedValue({ id: 'job1' } as any);

      const result = await sendBroadcastNotification(
        'tenant123',
        'Broadcast',
        'Message for everyone'
      );

      expect(result.success).toBe(true);
      expect(result.userCount).toBe(1);
      expect(result.jobCount).toBe(1);
    });
  });

  describe('Device Management', () => {
    it('should get user device registrations', async () => {
      prisma.keyValue.findUnique
        .mockResolvedValueOnce({
          value: JSON.stringify(['token1', 'token2']),
        } as any)
        .mockResolvedValueOnce({
          value: JSON.stringify({
            userId: 'user123',
            platform: 'android',
            appVersion: '1.0.0',
            registeredAt: '2024-01-01T00:00:00.000Z',
            lastSeen: '2024-01-02T00:00:00.000Z',
          }),
        } as any)
        .mockResolvedValueOnce({
          value: JSON.stringify({
            userId: 'user123',
            platform: 'ios',
            appVersion: '1.1.0',
            registeredAt: '2024-01-01T00:00:00.000Z',
          }),
        } as any);

      const registrations = await getUserDeviceRegistrations('user123');

      expect(registrations).toHaveLength(2);
      expect(registrations[0]).toMatchObject({
        token: 'token1',
        userId: 'user123',
        platform: 'android',
        appVersion: '1.0.0',
      });
      expect(registrations[1]).toMatchObject({
        token: 'token2',
        userId: 'user123',
        platform: 'ios',
        appVersion: '1.1.0',
      });
    });

    it('should return empty array when user has no devices', async () => {
      prisma.keyValue.findUnique.mockResolvedValue(null);

      const registrations = await getUserDeviceRegistrations('user123');

      expect(registrations).toEqual([]);
    });

    it('should handle device registration lookup errors', async () => {
      prisma.keyValue.findUnique.mockRejectedValue(new Error('Lookup error'));

      const registrations = await getUserDeviceRegistrations('user123');

      expect(registrations).toEqual([]);
    });
  });

  describe('Cleanup Operations', () => {
    it('should clean up expired device registrations', async () => {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const recentDate = new Date();

      prisma.keyValue.findMany.mockResolvedValue([
        {
          key: 'device_token:expired',
          value: JSON.stringify({
            userId: 'user1',
            lastSeen: new Date(ninetyDaysAgo.getTime() - 1000).toISOString(),
          }),
        },
        {
          key: 'device_token:recent',
          value: JSON.stringify({
            userId: 'user2',
            lastSeen: recentDate.toISOString(),
          }),
        },
      ] as any);

      prisma.keyValue.delete.mockResolvedValue({} as any);
      prisma.keyValue.findUnique.mockResolvedValue({
        value: JSON.stringify(['expired', 'other-token']),
      } as any);
      prisma.keyValue.update.mockResolvedValue({} as any);

      const cleanedCount = await cleanupExpiredDeviceRegistrations();

      expect(cleanedCount).toBe(1);
      expect(prisma.keyValue.delete).toHaveBeenCalledWith({
        where: { key: 'device_token:expired' },
      });
    });

    it('should handle cleanup errors gracefully', async () => {
      prisma.keyValue.findMany.mockRejectedValue(new Error('Cleanup error'));

      const cleanedCount = await cleanupExpiredDeviceRegistrations();

      expect(cleanedCount).toBe(0);
    });
  });
});