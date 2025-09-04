/**
 * Push Notification Service
 * High-level service for sending notifications with device registry management
 */

import { prisma } from '@/lib/db';
import { createTenantWhereClause } from '@/lib/auth/rbac';
import { 
  queueSingleNotification,
  queueMultipleNotifications,
  queueTopicNotification,
  queueTopicSubscription 
} from './queue';
import { isValidFCMToken } from './firebase';
import type {
  PushNotificationPayload,
  NotificationTopic,
  DevicePlatform,
  UserRole
} from '@drouple/contracts';

export interface DeviceRegistration {
  token: string;
  userId: string;
  platform: DevicePlatform;
  appVersion?: string;
  registeredAt: Date;
  lastSeen?: Date;
}

export interface NotificationOptions {
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  badge?: number;
  imageUrl?: string;
  clickAction?: string;
  data?: Record<string, string>;
  scheduleAt?: Date;
}

/**
 * Register device for push notifications
 */
export async function registerDevice(
  userId: string,
  token: string,
  platform: DevicePlatform,
  appVersion?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate FCM token format
    if (!isValidFCMToken(token)) {
      return { success: false, error: 'Invalid FCM token format' };
    }

    // Check if device already exists
    const existingDevice = await prisma.keyValue.findUnique({
      where: { key: `device_token:${token}` },
    });

    const deviceData = {
      userId,
      platform,
      appVersion,
      registeredAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    };

    if (existingDevice) {
      // Update existing device
      await prisma.keyValue.update({
        where: { key: `device_token:${token}` },
        data: {
          value: JSON.stringify(deviceData),
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new device registration
      await prisma.keyValue.create({
        data: {
          key: `device_token:${token}`,
          value: JSON.stringify(deviceData),
        },
      });
    }

    // Update user devices list
    await updateUserDevicesList(userId, token);

    // Auto-subscribe to default topics
    await autoSubscribeToTopics(userId, token, platform);

    return { success: true };

  } catch (error) {
    console.error('Device registration error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Registration failed' 
    };
  }
}

/**
 * Unregister device (remove from notifications)
 */
export async function unregisterDevice(
  userId: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Remove device registration
    await prisma.keyValue.delete({
      where: { key: `device_token:${token}` },
    });

    // Remove from user devices list
    const userDevicesKey = `user_devices:${userId}`;
    const userDevices = await prisma.keyValue.findUnique({
      where: { key: userDevicesKey },
    });

    if (userDevices) {
      try {
        const devicesList: string[] = JSON.parse(userDevices.value);
        const updatedList = devicesList.filter(t => t !== token);

        if (updatedList.length > 0) {
          await prisma.keyValue.update({
            where: { key: userDevicesKey },
            data: {
              value: JSON.stringify(updatedList),
              updatedAt: new Date(),
            },
          });
        } else {
          // Remove the record if no devices left
          await prisma.keyValue.delete({
            where: { key: userDevicesKey },
          });
        }
      } catch (error) {
        console.error('Error updating user devices list:', error);
      }
    }

    return { success: true };

  } catch (error) {
    console.error('Device unregistration error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unregistration failed' 
    };
  }
}

/**
 * Send notification to specific user
 */
export async function sendNotificationToUser(
  userId: string,
  title: string,
  body: string,
  options: NotificationOptions = {}
): Promise<{ success: boolean; jobCount: number; error?: string }> {
  try {
    const userTokens = await getUserDeviceTokens(userId);
    
    if (userTokens.length === 0) {
      return { success: false, jobCount: 0, error: 'No registered devices found' };
    }

    const payload: PushNotificationPayload = {
      title,
      body,
      priority: options.priority || 'MEDIUM',
      badge: options.badge,
      imageUrl: options.imageUrl,
      clickAction: options.clickAction,
      data: options.data,
    };

    // Queue notifications for all user devices
    let jobCount = 0;
    for (const device of userTokens) {
      await queueSingleNotification(
        device.token,
        payload,
        device.platform,
        userId,
        options.scheduleAt ? { delay: options.scheduleAt.getTime() - Date.now() } : {}
      );
      jobCount++;
    }

    return { success: true, jobCount };

  } catch (error) {
    console.error('Send user notification error:', error);
    return { 
      success: false, 
      jobCount: 0,
      error: error instanceof Error ? error.message : 'Send failed' 
    };
  }
}

/**
 * Send notification to users with specific roles in tenant
 */
export async function sendNotificationToRoles(
  tenantId: string,
  roles: UserRole[],
  title: string,
  body: string,
  options: NotificationOptions = {},
  churchId?: string
): Promise<{ success: boolean; userCount: number; jobCount: number; error?: string }> {
  try {
    // Build where clause for tenant and church filtering
    const tenantWhere = createTenantWhereClause(tenantId, ['SUPER_ADMIN']); // Use SUPER_ADMIN to avoid filtering
    
    // Get users with specified roles
    const users = await prisma.user.findMany({
      where: {
        ...tenantWhere,
        roles: {
          hasSome: roles,
        },
        isActive: true,
        ...(churchId && {
          membership: {
            churchId: churchId,
          },
        }),
      },
      select: {
        id: true,
      },
    });

    if (users.length === 0) {
      return { success: false, userCount: 0, jobCount: 0, error: 'No users found with specified roles' };
    }

    // Get all device tokens for these users
    const allTokens: Array<{ token: string; platform: DevicePlatform }> = [];
    
    for (const user of users) {
      const userTokens = await getUserDeviceTokens(user.id);
      allTokens.push(...userTokens);
    }

    if (allTokens.length === 0) {
      return { success: false, userCount: users.length, jobCount: 0, error: 'No registered devices found' };
    }

    const payload: PushNotificationPayload = {
      title,
      body,
      priority: options.priority || 'MEDIUM',
      badge: options.badge,
      imageUrl: options.imageUrl,
      clickAction: options.clickAction,
      data: options.data,
    };

    // Group tokens by platform for efficient sending
    const androidTokens = allTokens.filter(t => t.platform === 'android').map(t => t.token);
    const iosTokens = allTokens.filter(t => t.platform === 'ios').map(t => t.token);

    let jobCount = 0;

    if (androidTokens.length > 0) {
      await queueMultipleNotifications(
        androidTokens,
        payload,
        'android',
        options.scheduleAt ? { delay: options.scheduleAt.getTime() - Date.now() } : {}
      );
      jobCount++;
    }

    if (iosTokens.length > 0) {
      await queueMultipleNotifications(
        iosTokens,
        payload,
        'ios',
        options.scheduleAt ? { delay: options.scheduleAt.getTime() - Date.now() } : {}
      );
      jobCount++;
    }

    return { success: true, userCount: users.length, jobCount };

  } catch (error) {
    console.error('Send role notification error:', error);
    return { 
      success: false, 
      userCount: 0,
      jobCount: 0,
      error: error instanceof Error ? error.message : 'Send failed' 
    };
  }
}

/**
 * Send notification to all users in tenant/church
 */
export async function sendBroadcastNotification(
  tenantId: string,
  title: string,
  body: string,
  options: NotificationOptions = {},
  churchId?: string
): Promise<{ success: boolean; userCount: number; jobCount: number; error?: string }> {
  // Use all roles for broadcast
  const allRoles: UserRole[] = ['SUPER_ADMIN', 'PASTOR', 'ADMIN', 'LEADER', 'VIP', 'MEMBER'];
  
  return sendNotificationToRoles(
    tenantId,
    allRoles,
    title,
    body,
    options,
    churchId
  );
}

/**
 * Send notification to topic
 */
export async function sendNotificationToTopic(
  topic: NotificationTopic,
  title: string,
  body: string,
  options: NotificationOptions = {}
): Promise<{ success: boolean; jobId?: string; error?: string }> {
  try {
    const payload: PushNotificationPayload = {
      title,
      body,
      priority: options.priority || 'MEDIUM',
      badge: options.badge,
      imageUrl: options.imageUrl,
      clickAction: options.clickAction,
      data: options.data,
    };

    const job = await queueTopicNotification(
      topic,
      payload,
      options.scheduleAt ? { delay: options.scheduleAt.getTime() - Date.now() } : {}
    );

    return { success: true, jobId: job.id?.toString() };

  } catch (error) {
    console.error('Send topic notification error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Send failed' 
    };
  }
}

/**
 * Get user device tokens
 */
async function getUserDeviceTokens(userId: string): Promise<Array<{ token: string; platform: DevicePlatform }>> {
  try {
    const userDevices = await prisma.keyValue.findUnique({
      where: { key: `user_devices:${userId}` },
    });

    if (!userDevices) {
      return [];
    }

    const tokensList: string[] = JSON.parse(userDevices.value);
    const devices: Array<{ token: string; platform: DevicePlatform }> = [];

    // Get device details for each token
    for (const token of tokensList) {
      try {
        const deviceRecord = await prisma.keyValue.findUnique({
          where: { key: `device_token:${token}` },
        });

        if (deviceRecord) {
          const deviceData = JSON.parse(deviceRecord.value);
          devices.push({
            token,
            platform: deviceData.platform || 'android',
          });
        }
      } catch (error) {
        console.error(`Error fetching device data for token ${token}:`, error);
      }
    }

    return devices;

  } catch (error) {
    console.error('Error getting user device tokens:', error);
    return [];
  }
}

/**
 * Update user devices list
 */
async function updateUserDevicesList(userId: string, token: string): Promise<void> {
  const userDevicesKey = `user_devices:${userId}`;
  const userDevices = await prisma.keyValue.findUnique({
    where: { key: userDevicesKey },
  });

  let devicesList: string[] = [];
  if (userDevices) {
    try {
      devicesList = JSON.parse(userDevices.value);
    } catch {
      devicesList = [];
    }
  }

  // Add token if not already there
  if (!devicesList.includes(token)) {
    devicesList.push(token);

    if (userDevices) {
      await prisma.keyValue.update({
        where: { key: userDevicesKey },
        data: {
          value: JSON.stringify(devicesList),
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.keyValue.create({
        data: {
          key: userDevicesKey,
          value: JSON.stringify(devicesList),
        },
      });
    }
  }
}

/**
 * Auto-subscribe device to default topics based on user context
 */
async function autoSubscribeToTopics(
  userId: string,
  token: string,
  platform: DevicePlatform
): Promise<void> {
  try {
    // Get user data to determine appropriate topics
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        roles: true,
        tenantId: true,
        membership: {
          select: {
            churchId: true,
          },
        },
      },
    });

    if (!user) return;

    const defaultTopics: NotificationTopic[] = ['announcements'];

    // Add role-specific topics
    if (user.roles.some(role => ['SUPER_ADMIN', 'PASTOR', 'ADMIN'].includes(role))) {
      defaultTopics.push('admin_alerts');
    }

    // Subscribe to default topics
    for (const topic of defaultTopics) {
      await queueTopicSubscription([token], topic, true);
    }

  } catch (error) {
    console.error('Auto-subscribe to topics error:', error);
  }
}

/**
 * Get device registrations for user
 */
export async function getUserDeviceRegistrations(userId: string): Promise<DeviceRegistration[]> {
  try {
    const userDevices = await prisma.keyValue.findUnique({
      where: { key: `user_devices:${userId}` },
    });

    if (!userDevices) {
      return [];
    }

    const tokensList: string[] = JSON.parse(userDevices.value);
    const registrations: DeviceRegistration[] = [];

    for (const token of tokensList) {
      try {
        const deviceRecord = await prisma.keyValue.findUnique({
          where: { key: `device_token:${token}` },
        });

        if (deviceRecord) {
          const deviceData = JSON.parse(deviceRecord.value);
          registrations.push({
            token,
            userId: deviceData.userId,
            platform: deviceData.platform,
            appVersion: deviceData.appVersion,
            registeredAt: new Date(deviceData.registeredAt),
            lastSeen: deviceData.lastSeen ? new Date(deviceData.lastSeen) : undefined,
          });
        }
      } catch (error) {
        console.error(`Error fetching device registration for token ${token}:`, error);
      }
    }

    return registrations;

  } catch (error) {
    console.error('Error getting user device registrations:', error);
    return [];
  }
}

/**
 * Clean up expired device registrations (older than 90 days)
 */
export async function cleanupExpiredDeviceRegistrations(): Promise<number> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  let cleanedCount = 0;

  try {
    // Get all device token records
    const deviceRecords = await prisma.keyValue.findMany({
      where: {
        key: {
          startsWith: 'device_token:',
        },
      },
    });

    for (const record of deviceRecords) {
      try {
        const deviceData = JSON.parse(record.value);
        const lastSeen = deviceData.lastSeen 
          ? new Date(deviceData.lastSeen)
          : new Date(deviceData.registeredAt);

        if (lastSeen < ninetyDaysAgo) {
          // Remove device registration
          await prisma.keyValue.delete({
            where: { key: record.key },
          });

          // Remove from user devices list
          const token = record.key.replace('device_token:', '');
          const userId = deviceData.userId;
          
          if (userId) {
            await removeTokenFromUserDevicesList(userId, token);
          }

          cleanedCount++;
        }
      } catch (error) {
        console.error(`Error processing device record ${record.key}:`, error);
      }
    }

    console.log(`Cleaned up ${cleanedCount} expired device registrations`);
    return cleanedCount;

  } catch (error) {
    console.error('Error cleaning up device registrations:', error);
    return 0;
  }
}

/**
 * Remove token from user devices list
 */
async function removeTokenFromUserDevicesList(userId: string, token: string): Promise<void> {
  try {
    const userDevicesKey = `user_devices:${userId}`;
    const userDevices = await prisma.keyValue.findUnique({
      where: { key: userDevicesKey },
    });

    if (userDevices) {
      const devicesList: string[] = JSON.parse(userDevices.value);
      const updatedList = devicesList.filter(t => t !== token);

      if (updatedList.length > 0) {
        await prisma.keyValue.update({
          where: { key: userDevicesKey },
          data: {
            value: JSON.stringify(updatedList),
            updatedAt: new Date(),
          },
        });
      } else {
        await prisma.keyValue.delete({
          where: { key: userDevicesKey },
        });
      }
    }
  } catch (error) {
    console.error('Error removing token from user devices list:', error);
  }
}