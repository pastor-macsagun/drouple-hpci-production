/**
 * Notification Service
 * High-level notification management with MVP features
 */

import { PushNotificationService } from './pushNotificationService';
import { NotificationPreferencesService } from './notificationPreferences';
import { SentryService } from '@/lib/monitoring/sentryService';
import { syncManager } from '@/lib/sync/syncManager';
import type { User } from '@/types/auth';

export interface NotificationPayload {
  type: 'announcement' | 'event_reminder' | 'pathway_milestone' | 'admin_alert' | 'vip_assignment' | 'leader_verification';
  title: string;
  body: string;
  data?: Record<string, any>;
  userId?: string;
  churchId?: string;
}

export interface EventReminderData {
  eventId: string;
  eventName: string;
  eventDate: string;
  location?: string;
  reminderType: '24h' | '2h';
}

export interface PathwayMilestoneData {
  pathwayId: string;
  pathwayName: string;
  stepName: string;
  stepNumber: number;
  totalSteps: number;
  percentage: number;
}

export interface AdminAlertData {
  alertType: 'sync_error' | 'checkin_failure' | 'system_error';
  message: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface VipAssignmentData {
  firstTimerId: string;
  firstTimerName: string;
  assignedDate: string;
  serviceName: string;
  isNewBeliever: boolean;
}

export interface LeaderVerificationData {
  requestId: string;
  memberName: string;
  pathwayName: string;
  stepName: string;
  requestedDate: string;
}

export class NotificationService {
  private static isInitialized = false;
  private static scheduledNotifications = new Map<string, string>();

  /**
   * Initialize notification service
   */
  static async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      // Initialize push notifications
      await PushNotificationService.initialize();
      
      // Initialize preferences
      await NotificationPreferencesService.initialize();
      
      this.isInitialized = true;
      console.log('NotificationService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize NotificationService:', error);
      SentryService.captureError(error as Error, {
        feature: 'notifications',
        action: 'initialize',
      });
    }
  }

  /**
   * Send announcement notification
   */
  static async sendAnnouncement(
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    if (!NotificationPreferencesService.isNotificationEnabled('announcements')) {
      return;
    }

    try {
      await PushNotificationService.sendLocalNotification(
        title,
        message,
        {
          type: 'announcement',
          ...data,
        },
        {
          sound: true,
          channelId: 'announcements',
        }
      );
    } catch (error) {
      console.error('Error sending announcement notification:', error);
      SentryService.captureError(error as Error, {
        feature: 'notifications',
        action: 'send_announcement',
      });
    }
  }

  /**
   * Schedule event reminder notifications
   */
  static async scheduleEventReminders(
    eventId: string,
    eventName: string,
    eventDate: Date,
    location?: string
  ): Promise<void> {
    try {
      const now = new Date();
      const eventTime = eventDate.getTime();
      const currentTime = now.getTime();

      // Schedule 24-hour reminder
      if (NotificationPreferencesService.isNotificationEnabled('eventReminders24h')) {
        const reminder24h = new Date(eventTime - 24 * 60 * 60 * 1000);
        if (reminder24h.getTime() > currentTime) {
          const notifId = await PushNotificationService.scheduleLocalNotification(
            'Event Reminder',
            `${eventName} is tomorrow${location ? ` at ${location}` : ''}`,
            reminder24h,
            {
              type: 'event_reminder',
              eventId,
              eventName,
              reminderType: '24h',
              eventDate: eventDate.toISOString(),
              location,
            } as EventReminderData,
            {
              identifier: `event_24h_${eventId}`,
              sound: true,
              channelId: 'events',
            }
          );

          if (notifId) {
            this.scheduledNotifications.set(`event_24h_${eventId}`, notifId);
          }
        }
      }

      // Schedule 2-hour reminder
      if (NotificationPreferencesService.isNotificationEnabled('eventReminders2h')) {
        const reminder2h = new Date(eventTime - 2 * 60 * 60 * 1000);
        if (reminder2h.getTime() > currentTime) {
          const notifId = await PushNotificationService.scheduleLocalNotification(
            'Event Starting Soon',
            `${eventName} starts in 2 hours${location ? ` at ${location}` : ''}`,
            reminder2h,
            {
              type: 'event_reminder',
              eventId,
              eventName,
              reminderType: '2h',
              eventDate: eventDate.toISOString(),
              location,
            } as EventReminderData,
            {
              identifier: `event_2h_${eventId}`,
              sound: true,
              channelId: 'events',
            }
          );

          if (notifId) {
            this.scheduledNotifications.set(`event_2h_${eventId}`, notifId);
          }
        }
      }
    } catch (error) {
      console.error('Error scheduling event reminders:', error);
      SentryService.captureError(error as Error, {
        feature: 'notifications',
        action: 'schedule_event_reminders',
        context: { eventId, eventName },
      });
    }
  }

  /**
   * Cancel event reminder notifications
   */
  static async cancelEventReminders(eventId: string): Promise<void> {
    try {
      const reminders = [`event_24h_${eventId}`, `event_2h_${eventId}`];
      
      for (const reminderId of reminders) {
        const notifId = this.scheduledNotifications.get(reminderId);
        if (notifId) {
          await PushNotificationService.cancelScheduledNotification(notifId);
          this.scheduledNotifications.delete(reminderId);
        }
      }
    } catch (error) {
      console.error('Error canceling event reminders:', error);
    }
  }

  /**
   * Send pathway milestone notification
   */
  static async sendPathwayMilestone(data: PathwayMilestoneData): Promise<void> {
    if (!NotificationPreferencesService.isNotificationEnabled('pathwayMilestones')) {
      return;
    }

    try {
      const title = '🎉 Pathway Progress!';
      const body = `Congratulations! You completed "${data.stepName}" in ${data.pathwayName}. ${data.percentage}% complete!`;

      await PushNotificationService.sendLocalNotification(
        title,
        body,
        {
          type: 'pathway_milestone',
          ...data,
        },
        {
          sound: true,
          channelId: 'pathways',
        }
      );
    } catch (error) {
      console.error('Error sending pathway milestone notification:', error);
      SentryService.captureError(error as Error, {
        feature: 'notifications',
        action: 'send_pathway_milestone',
        context: { pathwayId: data.pathwayId },
      });
    }
  }

  /**
   * Send admin alert notification
   */
  static async sendAdminAlert(data: AdminAlertData): Promise<void> {
    const enabledSyncErrors = NotificationPreferencesService.isNotificationEnabled('adminSyncErrors');
    const enabledCheckInFails = NotificationPreferencesService.isNotificationEnabled('adminCheckInFails');

    // Check if notification is enabled for this alert type
    if (data.alertType === 'sync_error' && !enabledSyncErrors) return;
    if (data.alertType === 'checkin_failure' && !enabledCheckInFails) return;

    try {
      const severityEmojis = {
        low: 'ℹ️',
        medium: '⚠️',
        high: '🚨',
        critical: '🔴',
      };

      const title = `${severityEmojis[data.severity]} Admin Alert`;
      const body = data.message;

      await PushNotificationService.sendLocalNotification(
        title,
        body,
        {
          type: 'admin_alert',
          ...data,
        },
        {
          sound: data.severity === 'critical' || data.severity === 'high',
          channelId: 'admin',
        }
      );
    } catch (error) {
      console.error('Error sending admin alert notification:', error);
      SentryService.captureError(error as Error, {
        feature: 'notifications',
        action: 'send_admin_alert',
        context: { alertType: data.alertType, severity: data.severity },
      });
    }
  }

  /**
   * Send VIP assignment notification
   */
  static async sendVipAssignment(data: VipAssignmentData): Promise<void> {
    if (!NotificationPreferencesService.isNotificationEnabled('vipNewAssignments')) {
      return;
    }

    try {
      const title = '👋 New First-timer Assignment';
      const believerText = data.isNewBeliever ? ' (New Believer!)' : '';
      const body = `${data.firstTimerName} from ${data.serviceName} has been assigned to you${believerText}`;

      await PushNotificationService.sendLocalNotification(
        title,
        body,
        {
          type: 'vip_assignment',
          ...data,
        },
        {
          sound: true,
          channelId: 'vip',
        }
      );
    } catch (error) {
      console.error('Error sending VIP assignment notification:', error);
      SentryService.captureError(error as Error, {
        feature: 'notifications',
        action: 'send_vip_assignment',
        context: { firstTimerId: data.firstTimerId },
      });
    }
  }

  /**
   * Send leader verification request notification
   */
  static async sendLeaderVerification(data: LeaderVerificationData): Promise<void> {
    if (!NotificationPreferencesService.isNotificationEnabled('leaderVerificationRequests')) {
      return;
    }

    try {
      const title = '✅ Verification Request';
      const body = `${data.memberName} is requesting verification for "${data.stepName}" in ${data.pathwayName}`;

      await PushNotificationService.sendLocalNotification(
        title,
        body,
        {
          type: 'leader_verification',
          ...data,
        },
        {
          sound: true,
          channelId: 'pathways',
        }
      );
    } catch (error) {
      console.error('Error sending leader verification notification:', error);
      SentryService.captureError(error as Error, {
        feature: 'notifications',
        action: 'send_leader_verification',
        context: { requestId: data.requestId },
      });
    }
  }

  /**
   * Handle sync error notifications for admins
   */
  static async notifySyncError(errorType: string, errorMessage: string): Promise<void> {
    await this.sendAdminAlert({
      alertType: 'sync_error',
      message: `Sync failed: ${errorMessage}`,
      details: { errorType },
      severity: 'medium',
    });
  }

  /**
   * Handle check-in failure notifications for admins
   */
  static async notifyCheckInFailure(memberId: string, serviceId: string, error: string): Promise<void> {
    await this.sendAdminAlert({
      alertType: 'checkin_failure',
      message: `Check-in failed for member ${memberId}`,
      details: { memberId, serviceId, error },
      severity: 'low',
    });
  }

  /**
   * Get notification settings for user
   */
  static getNotificationSettings() {
    return PushNotificationService.getNotificationSettings();
  }

  /**
   * Request notification permissions
   */
  static async requestPermissions(): Promise<boolean> {
    return await PushNotificationService.requestPermissions();
  }

  /**
   * Clear all notifications
   */
  static async clearAllNotifications(): Promise<void> {
    await PushNotificationService.clearAllNotifications();
  }

  /**
   * Set badge count
   */
  static async setBadgeCount(count: number): Promise<void> {
    await PushNotificationService.setBadgeCount(count);
  }

  /**
   * Test notification (for development/debugging)
   */
  static async sendTestNotification(type: string = 'test'): Promise<void> {
    await PushNotificationService.sendLocalNotification(
      'Test Notification',
      'This is a test notification from Drouple Mobile',
      { type }
    );
  }

  /**
   * Cleanup service
   */
  static cleanup(): void {
    PushNotificationService.cleanup();
    this.scheduledNotifications.clear();
    this.isInitialized = false;
  }
}

export default NotificationService;