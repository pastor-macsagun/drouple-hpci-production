import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from 'expo-server-sdk';
import { PrismaClient } from '@prisma/client';
import { ratelimit } from '@/lib/rate-limit';

const prisma = new PrismaClient();
const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN,
  useFcmV1: true,
});

export interface PushNotificationData {
  type: 'announcement' | 'event_reminder' | 'pathway_milestone' | 'admin_alert' | 'service_update';
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default' | null;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
}

export interface SendNotificationOptions {
  userIds?: string[];
  tenantIds?: string[];
  roles?: string[];
  churchIds?: string[];
  platforms?: ('ios' | 'android')[];
  ttl?: number; // Time to live in seconds
}

export class PushNotificationService {
  /**
   * Send push notification to specific users or groups
   */
  async sendNotification(
    notification: PushNotificationData,
    options: SendNotificationOptions = {}
  ): Promise<{
    success: boolean;
    sentCount: number;
    failureCount: number;
    tickets: ExpoPushTicket[];
  }> {
    try {
      // Get target devices
      const devices = await this.getTargetDevices(options);
      
      if (devices.length === 0) {
        return {
          success: true,
          sentCount: 0,
          failureCount: 0,
          tickets: [],
        };
      }

      // Create push messages
      const messages: ExpoPushMessage[] = devices
        .filter(device => Expo.isExpoPushToken(device.pushToken))
        .map(device => ({
          to: device.pushToken,
          title: notification.title,
          body: notification.body,
          data: {
            ...notification.data,
            type: notification.type,
            userId: device.userId,
            tenantId: device.tenantId,
          },
          sound: notification.sound || 'default',
          badge: notification.badge,
          priority: notification.priority || 'default',
          ttl: options.ttl || 86400, // 24 hours default
        }));

      // Send in chunks
      const chunks = expo.chunkPushNotifications(messages);
      const allTickets: ExpoPushTicket[] = [];
      let sentCount = 0;
      let failureCount = 0;

      for (const chunk of chunks) {
        try {
          const tickets = await expo.sendPushNotificationsAsync(chunk);
          allTickets.push(...tickets);

          // Count successes and failures
          tickets.forEach(ticket => {
            if (ticket.status === 'ok') {
              sentCount++;
            } else {
              failureCount++;
              console.error('Push notification failed:', ticket);
            }
          });
        } catch (error) {
          console.error('Failed to send push notification chunk:', error);
          failureCount += chunk.length;
        }
      }

      // Store notification record
      await this.storeNotificationRecord({
        type: notification.type,
        title: notification.title,
        body: notification.body,
        targetCount: devices.length,
        sentCount,
        failureCount,
        data: notification.data,
        options,
      });

      return {
        success: true,
        sentCount,
        failureCount,
        tickets: allTickets,
      };
    } catch (error) {
      console.error('Push notification service error:', error);
      throw error;
    }
  }

  /**
   * Send announcement to all users in a tenant
   */
  async sendAnnouncement(
    title: string,
    body: string,
    tenantIds: string[],
    data?: Record<string, string>
  ) {
    return this.sendNotification(
      {
        type: 'announcement',
        title,
        body,
        data,
        priority: 'high',
        sound: 'default',
      },
      { tenantIds }
    );
  }

  /**
   * Send event reminder to RSVP'd users
   */
  async sendEventReminder(
    eventId: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ) {
    // Get users who RSVP'd to the event
    const rsvps = await prisma.eventRSVP.findMany({
      where: {
        eventId,
        status: 'confirmed',
      },
      include: {
        user: true,
      },
    });

    const userIds = rsvps.map(rsvp => rsvp.userId);

    return this.sendNotification(
      {
        type: 'event_reminder',
        title,
        body,
        data: {
          ...data,
          eventId,
        },
      },
      { userIds }
    );
  }

  /**
   * Send pathway milestone notification
   */
  async sendPathwayMilestone(
    userId: string,
    pathwayName: string,
    milestone: string,
    data?: Record<string, string>
  ) {
    return this.sendNotification(
      {
        type: 'pathway_milestone',
        title: `Congratulations! 🎉`,
        body: `You've completed ${milestone} in ${pathwayName}`,
        data,
        sound: 'default',
        badge: 1,
      },
      { userIds: [userId] }
    );
  }

  /**
   * Send admin alert to church leadership
   */
  async sendAdminAlert(
    tenantId: string,
    title: string,
    body: string,
    urgency: 'low' | 'medium' | 'high' = 'medium',
    data?: Record<string, string>
  ) {
    return this.sendNotification(
      {
        type: 'admin_alert',
        title,
        body,
        data,
        priority: urgency === 'high' ? 'high' : 'normal',
        sound: urgency === 'high' ? 'default' : null,
      },
      {
        tenantIds: [tenantId],
        roles: ['ADMIN', 'PASTOR', 'SUPER_ADMIN'],
      }
    );
  }

  /**
   * Get target devices based on options
   */
  private async getTargetDevices(options: SendNotificationOptions) {
    const whereConditions: any[] = [
      { isActive: true },
    ];

    if (options.userIds?.length) {
      whereConditions.push({ userId: { in: options.userIds } });
    }

    if (options.tenantIds?.length) {
      whereConditions.push({ tenantId: { in: options.tenantIds } });
    }

    if (options.platforms?.length) {
      whereConditions.push({ platform: { in: options.platforms } });
    }

    if (options.roles?.length || options.churchIds?.length) {
      const userConditions: any = {};
      
      if (options.roles?.length) {
        userConditions.role = { in: options.roles };
      }
      
      if (options.churchIds?.length) {
        userConditions.membership = {
          some: {
            churchId: { in: options.churchIds },
            status: 'ACTIVE',
          },
        };
      }

      whereConditions.push({
        user: userConditions,
      });
    }

    const devices = await prisma.device.findMany({
      where: {
        AND: whereConditions,
      },
      include: {
        user: {
          select: {
            id: true,
            role: true,
            tenantId: true,
          },
        },
      },
    });

    return devices;
  }

  /**
   * Store notification record for tracking and analytics
   */
  private async storeNotificationRecord(record: {
    type: string;
    title: string;
    body: string;
    targetCount: number;
    sentCount: number;
    failureCount: number;
    data?: Record<string, string>;
    options: SendNotificationOptions;
  }) {
    try {
      await prisma.notificationLog.create({
        data: {
          type: record.type,
          title: record.title,
          body: record.body,
          targetCount: record.targetCount,
          sentCount: record.sentCount,
          failureCount: record.failureCount,
          payload: {
            data: record.data,
            options: record.options,
          },
          createdAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to store notification record:', error);
      // Don't throw - this is just for tracking
    }
  }

  /**
   * Handle push notification receipts
   */
  async handleReceipts(receiptIds: string[]) {
    try {
      const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
      
      for (const chunk of receiptIdChunks) {
        const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
        
        for (const receiptId in receipts) {
          const receipt = receipts[receiptId];
          
          if (receipt.status === 'error') {
            console.error('Push notification error:', {
              receiptId,
              error: receipt.message,
              details: receipt.details,
            });
            
            // Handle specific errors
            if (receipt.details && receipt.details.error === 'DeviceNotRegistered') {
              // Remove invalid device tokens
              await this.removeInvalidDeviceToken(receiptId);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to handle push notification receipts:', error);
    }
  }

  /**
   * Remove invalid device token
   */
  private async removeInvalidDeviceToken(receiptId: string) {
    try {
      // This would require storing receipt IDs with device records
      // For now, we'll log the invalid token
      console.warn('Invalid device token detected:', receiptId);
    } catch (error) {
      console.error('Failed to remove invalid device token:', error);
    }
  }

  /**
   * Test push notification system
   */
  async testNotification(userId: string, message: string = 'Test notification') {
    return this.sendNotification(
      {
        type: 'admin_alert',
        title: 'Test Notification',
        body: message,
        data: { test: 'true' },
      },
      { userIds: [userId] }
    );
  }
}

export const pushNotificationService = new PushNotificationService();