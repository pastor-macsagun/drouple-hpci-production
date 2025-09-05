/**
 * NotificationService Unit Tests
 */

import { NotificationService } from '../notificationService';
import { NotificationPreferencesService } from '../notificationPreferences';
import { PushNotificationService } from '../pushNotificationService';

// Mock dependencies
jest.mock('../pushNotificationService');
jest.mock('../notificationPreferences');
jest.mock('@/lib/monitoring/sentryService');

const mockPushNotificationService = PushNotificationService as jest.Mocked<typeof PushNotificationService>;
const mockNotificationPreferencesService = NotificationPreferencesService as jest.Mocked<typeof NotificationPreferencesService>;

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPushNotificationService.initialize.mockResolvedValue();
    mockNotificationPreferencesService.initialize.mockResolvedValue({
      announcements: true,
      eventReminders24h: true,
      eventReminders2h: true,
      pathwayMilestones: true,
      adminSyncErrors: false,
      adminCheckInFails: false,
      vipNewAssignments: false,
      leaderGroupUpdates: false,
      leaderVerificationRequests: false,
    });
    mockNotificationPreferencesService.isNotificationEnabled.mockReturnValue(true);
  });

  afterEach(() => {
    NotificationService.cleanup();
  });

  describe('initialize', () => {
    it('should initialize push notification service and preferences', async () => {
      await NotificationService.initialize();

      expect(mockPushNotificationService.initialize).toHaveBeenCalled();
      expect(mockNotificationPreferencesService.initialize).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      mockPushNotificationService.initialize.mockRejectedValue(new Error('Init failed'));

      await expect(NotificationService.initialize()).resolves.not.toThrow();
    });
  });

  describe('sendAnnouncement', () => {
    beforeEach(async () => {
      await NotificationService.initialize();
    });

    it('should send announcement when enabled', async () => {
      mockNotificationPreferencesService.isNotificationEnabled.mockReturnValue(true);
      mockPushNotificationService.sendLocalNotification.mockResolvedValue();

      await NotificationService.sendAnnouncement(
        'Test Announcement',
        'This is a test announcement'
      );

      expect(mockPushNotificationService.sendLocalNotification).toHaveBeenCalledWith(
        'Test Announcement',
        'This is a test announcement',
        {
          type: 'announcement',
        },
        {
          sound: true,
          channelId: 'announcements',
        }
      );
    });

    it('should not send announcement when disabled', async () => {
      mockNotificationPreferencesService.isNotificationEnabled.mockReturnValue(false);

      await NotificationService.sendAnnouncement(
        'Test Announcement',
        'This is a test announcement'
      );

      expect(mockPushNotificationService.sendLocalNotification).not.toHaveBeenCalled();
    });
  });

  describe('scheduleEventReminders', () => {
    beforeEach(async () => {
      await NotificationService.initialize();
    });

    it('should schedule both 24h and 2h reminders when enabled', async () => {
      const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
      mockNotificationPreferencesService.isNotificationEnabled
        .mockReturnValueOnce(true) // 24h
        .mockReturnValueOnce(true); // 2h
      mockPushNotificationService.scheduleLocalNotification
        .mockResolvedValueOnce('notif_24h')
        .mockResolvedValueOnce('notif_2h');

      await NotificationService.scheduleEventReminders(
        'event123',
        'Sunday Service',
        futureDate,
        'Main Sanctuary'
      );

      expect(mockPushNotificationService.scheduleLocalNotification).toHaveBeenCalledTimes(2);
    });

    it('should not schedule reminders for past events', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      mockNotificationPreferencesService.isNotificationEnabled.mockReturnValue(true);

      await NotificationService.scheduleEventReminders(
        'event123',
        'Past Event',
        pastDate
      );

      expect(mockPushNotificationService.scheduleLocalNotification).not.toHaveBeenCalled();
    });
  });

  describe('sendPathwayMilestone', () => {
    beforeEach(async () => {
      await NotificationService.initialize();
    });

    it('should send pathway milestone notification when enabled', async () => {
      mockNotificationPreferencesService.isNotificationEnabled.mockReturnValue(true);
      mockPushNotificationService.sendLocalNotification.mockResolvedValue();

      const milestoneData = {
        pathwayId: 'roots123',
        pathwayName: 'ROOTS',
        stepName: 'Baptism',
        stepNumber: 3,
        totalSteps: 5,
        percentage: 60,
      };

      await NotificationService.sendPathwayMilestone(milestoneData);

      expect(mockPushNotificationService.sendLocalNotification).toHaveBeenCalledWith(
        '🎉 Pathway Progress!',
        'Congratulations! You completed "Baptism" in ROOTS. 60% complete!',
        {
          type: 'pathway_milestone',
          ...milestoneData,
        },
        {
          sound: true,
          channelId: 'pathways',
        }
      );
    });
  });

  describe('sendAdminAlert', () => {
    beforeEach(async () => {
      await NotificationService.initialize();
    });

    it('should send sync error alert when enabled', async () => {
      mockNotificationPreferencesService.isNotificationEnabled.mockReturnValue(true);
      mockPushNotificationService.sendLocalNotification.mockResolvedValue();

      const alertData = {
        alertType: 'sync_error' as const,
        message: 'Database sync failed',
        severity: 'medium' as const,
      };

      await NotificationService.sendAdminAlert(alertData);

      expect(mockPushNotificationService.sendLocalNotification).toHaveBeenCalledWith(
        '⚠️ Admin Alert',
        'Database sync failed',
        {
          type: 'admin_alert',
          ...alertData,
        },
        {
          sound: false,
          channelId: 'admin',
        }
      );
    });

    it('should not send when preference is disabled', async () => {
      mockNotificationPreferencesService.isNotificationEnabled.mockReturnValue(false);

      const alertData = {
        alertType: 'sync_error' as const,
        message: 'Database sync failed',
        severity: 'medium' as const,
      };

      await NotificationService.sendAdminAlert(alertData);

      expect(mockPushNotificationService.sendLocalNotification).not.toHaveBeenCalled();
    });
  });

  describe('sendVipAssignment', () => {
    beforeEach(async () => {
      await NotificationService.initialize();
    });

    it('should send VIP assignment notification', async () => {
      mockNotificationPreferencesService.isNotificationEnabled.mockReturnValue(true);
      mockPushNotificationService.sendLocalNotification.mockResolvedValue();

      const assignmentData = {
        firstTimerId: 'member123',
        firstTimerName: 'John Doe',
        assignedDate: '2025-01-06',
        serviceName: 'Sunday Service',
        isNewBeliever: true,
      };

      await NotificationService.sendVipAssignment(assignmentData);

      expect(mockPushNotificationService.sendLocalNotification).toHaveBeenCalledWith(
        '👋 New First-timer Assignment',
        'John Doe from Sunday Service has been assigned to you (New Believer!)',
        {
          type: 'vip_assignment',
          ...assignmentData,
        },
        {
          sound: true,
          channelId: 'vip',
        }
      );
    });
  });

  describe('sendLeaderVerification', () => {
    beforeEach(async () => {
      await NotificationService.initialize();
    });

    it('should send leader verification request', async () => {
      mockNotificationPreferencesService.isNotificationEnabled.mockReturnValue(true);
      mockPushNotificationService.sendLocalNotification.mockResolvedValue();

      const verificationData = {
        requestId: 'req123',
        memberName: 'Jane Smith',
        pathwayName: 'ROOTS',
        stepName: 'Baptism',
        requestedDate: '2025-01-06',
      };

      await NotificationService.sendLeaderVerification(verificationData);

      expect(mockPushNotificationService.sendLocalNotification).toHaveBeenCalledWith(
        '✅ Verification Request',
        'Jane Smith is requesting verification for "Baptism" in ROOTS',
        {
          type: 'leader_verification',
          ...verificationData,
        },
        {
          sound: true,
          channelId: 'pathways',
        }
      );
    });
  });

  describe('utility methods', () => {
    beforeEach(async () => {
      await NotificationService.initialize();
    });

    it('should handle test notifications', async () => {
      mockPushNotificationService.sendLocalNotification.mockResolvedValue();

      await NotificationService.sendTestNotification();

      expect(mockPushNotificationService.sendLocalNotification).toHaveBeenCalledWith(
        'Test Notification',
        'This is a test notification from Drouple Mobile',
        { type: 'test' }
      );
    });

    it('should clear all notifications', async () => {
      mockPushNotificationService.clearAllNotifications.mockResolvedValue();

      await NotificationService.clearAllNotifications();

      expect(mockPushNotificationService.clearAllNotifications).toHaveBeenCalled();
    });

    it('should set badge count', async () => {
      mockPushNotificationService.setBadgeCount.mockResolvedValue();

      await NotificationService.setBadgeCount(5);

      expect(mockPushNotificationService.setBadgeCount).toHaveBeenCalledWith(5);
    });
  });
});