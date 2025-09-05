/**
 * Notification Preferences Service
 * Manages user notification preferences with role-based defaults
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/lib/store/authStore';
import { productionApiClient } from '@/lib/api/productionClient';
import type { User } from '@/types/auth';

export interface NotificationPreferences {
  // Announcement alerts (role scoped)
  announcements: boolean;
  
  // Event reminders
  eventReminders24h: boolean;
  eventReminders2h: boolean;
  
  // Pathway milestones
  pathwayMilestones: boolean;
  
  // Admin alerts (admin+ roles only)
  adminSyncErrors: boolean;
  adminCheckInFails: boolean;
  
  // VIP team notifications
  vipNewAssignments: boolean;
  
  // Leader notifications
  leaderGroupUpdates: boolean;
  leaderVerificationRequests: boolean;
}

export interface RoleBasedTopics {
  MEMBER: string[];
  LEADER: string[];
  VIP: string[];
  ADMIN: string[];
  PASTOR: string[];
  SUPER_ADMIN: string[];
}

const STORAGE_KEY = 'notification_preferences';

// Role-based notification topics for server-side targeting
export const NOTIFICATION_TOPICS: RoleBasedTopics = {
  MEMBER: ['announcements', 'events', 'pathways'],
  LEADER: ['announcements', 'events', 'pathways', 'groups', 'verification_requests'],
  VIP: ['announcements', 'events', 'pathways', 'vip_assignments'],
  ADMIN: ['announcements', 'events', 'admin_alerts', 'sync_errors'],
  PASTOR: ['announcements', 'events', 'admin_alerts', 'sync_errors'],
  SUPER_ADMIN: ['announcements', 'events', 'admin_alerts', 'sync_errors', 'system_health']
};

// Default preferences based on user role
const getDefaultPreferences = (user: User | null): NotificationPreferences => {
  const defaults: NotificationPreferences = {
    announcements: true,
    eventReminders24h: true,
    eventReminders2h: true,
    pathwayMilestones: true,
    adminSyncErrors: false,
    adminCheckInFails: false,
    vipNewAssignments: false,
    leaderGroupUpdates: false,
    leaderVerificationRequests: false,
  };

  if (!user) return defaults;

  // Enable role-specific preferences
  switch (user.role) {
    case 'SUPER_ADMIN':
    case 'PASTOR':
    case 'ADMIN':
      defaults.adminSyncErrors = true;
      defaults.adminCheckInFails = true;
      break;
    case 'VIP':
      defaults.vipNewAssignments = true;
      break;
    case 'LEADER':
      defaults.leaderGroupUpdates = true;
      defaults.leaderVerificationRequests = true;
      break;
  }

  return defaults;
};

export class NotificationPreferencesService {
  private static preferences: NotificationPreferences | null = null;

  /**
   * Initialize preferences from storage or defaults
   */
  static async initialize(): Promise<NotificationPreferences> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const authState = useAuthStore.getState();
      const defaults = getDefaultPreferences(authState.user);

      if (stored) {
        // Merge stored preferences with defaults (in case new preferences were added)
        const parsed = JSON.parse(stored) as Partial<NotificationPreferences>;
        this.preferences = { ...defaults, ...parsed };
      } else {
        this.preferences = defaults;
        await this.saveLocal();
      }

      // Try to sync with server
      await this.syncWithServer();

      return this.preferences;
    } catch (error) {
      console.error('Error initializing notification preferences:', error);
      const authState = useAuthStore.getState();
      this.preferences = getDefaultPreferences(authState.user);
      return this.preferences;
    }
  }

  /**
   * Get current preferences
   */
  static getPreferences(): NotificationPreferences {
    if (!this.preferences) {
      const authState = useAuthStore.getState();
      this.preferences = getDefaultPreferences(authState.user);
    }
    return this.preferences;
  }

  /**
   * Update preferences
   */
  static async updatePreferences(
    updates: Partial<NotificationPreferences>
  ): Promise<void> {
    if (!this.preferences) {
      await this.initialize();
    }

    this.preferences = { ...this.preferences!, ...updates };
    
    // Save locally
    await this.saveLocal();
    
    // Sync with server
    await this.syncWithServer();
  }

  /**
   * Save preferences to local storage
   */
  private static async saveLocal(): Promise<void> {
    try {
      if (this.preferences) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences));
      }
    } catch (error) {
      console.error('Error saving notification preferences locally:', error);
    }
  }

  /**
   * Sync preferences with server (if endpoint exists)
   */
  private static async syncWithServer(): Promise<void> {
    try {
      const authState = useAuthStore.getState();
      if (!authState.isAuthenticated || !authState.user || !this.preferences) {
        return;
      }

      // Try to sync with server
      const response = await productionApiClient.post(
        '/api/mobile/notifications/preferences',
        {
          preferences: this.preferences,
          topics: this.getTopicsForUser(authState.user),
        }
      );

      if (!response.success && response.error !== 'ENDPOINT_NOT_FOUND') {
        console.warn('Failed to sync notification preferences with server:', response.error);
      }
    } catch (error) {
      // Ignore server sync errors - preferences still work locally
      console.debug('Server sync for preferences unavailable:', error);
    }
  }

  /**
   * Get notification topics for user role
   */
  static getTopicsForUser(user: User): string[] {
    return NOTIFICATION_TOPICS[user.role] || NOTIFICATION_TOPICS.MEMBER;
  }

  /**
   * Check if specific notification type is enabled
   */
  static isNotificationEnabled(type: keyof NotificationPreferences): boolean {
    const prefs = this.getPreferences();
    return prefs[type];
  }

  /**
   * Get preferences for notification settings screen
   */
  static getPreferencesForRole(user: User): Array<{
    key: keyof NotificationPreferences;
    title: string;
    description: string;
    enabled: boolean;
    visible: boolean;
  }> {
    const prefs = this.getPreferences();
    const isAdmin = ['SUPER_ADMIN', 'PASTOR', 'ADMIN'].includes(user.role);
    const isVip = user.role === 'VIP';
    const isLeader = user.role === 'LEADER';

    return [
      {
        key: 'announcements',
        title: 'Church Announcements',
        description: 'Important announcements from your church',
        enabled: prefs.announcements,
        visible: true,
      },
      {
        key: 'eventReminders24h',
        title: 'Event Reminders (24 hours)',
        description: 'Remind me 1 day before events I\'m attending',
        enabled: prefs.eventReminders24h,
        visible: true,
      },
      {
        key: 'eventReminders2h',
        title: 'Event Reminders (2 hours)',
        description: 'Remind me 2 hours before events I\'m attending',
        enabled: prefs.eventReminders2h,
        visible: true,
      },
      {
        key: 'pathwayMilestones',
        title: 'Pathway Milestones',
        description: 'Celebrate when you complete pathway steps',
        enabled: prefs.pathwayMilestones,
        visible: true,
      },
      {
        key: 'adminSyncErrors',
        title: 'System Sync Errors',
        description: 'Notify when data sync fails',
        enabled: prefs.adminSyncErrors,
        visible: isAdmin,
      },
      {
        key: 'adminCheckInFails',
        title: 'Check-in Failures',
        description: 'Notify when check-ins fail to process',
        enabled: prefs.adminCheckInFails,
        visible: isAdmin,
      },
      {
        key: 'vipNewAssignments',
        title: 'New First-timer Assignments',
        description: 'Notify when new first-timers are assigned to you',
        enabled: prefs.vipNewAssignments,
        visible: isVip,
      },
      {
        key: 'leaderGroupUpdates',
        title: 'Life Group Updates',
        description: 'Updates about your life groups',
        enabled: prefs.leaderGroupUpdates,
        visible: isLeader,
      },
      {
        key: 'leaderVerificationRequests',
        title: 'Verification Requests',
        description: 'Members requesting pathway step verification',
        enabled: prefs.leaderVerificationRequests,
        visible: isLeader,
      },
    ].filter(pref => pref.visible);
  }

  /**
   * Reset to defaults
   */
  static async resetToDefaults(): Promise<void> {
    const authState = useAuthStore.getState();
    this.preferences = getDefaultPreferences(authState.user);
    await this.saveLocal();
    await this.syncWithServer();
  }
}

export default NotificationPreferencesService;