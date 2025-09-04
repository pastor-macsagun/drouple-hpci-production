/**
 * Privacy Manager
 * Handles user privacy preferences, data retention, and GDPR compliance
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type {
  PrivacySettings,
  PermissionRequest,
  DataClassification,
} from './types';

export class PrivacyManager {
  private static instance: PrivacyManager;
  private settings: PrivacySettings;
  private readonly PRIVACY_STORAGE_KEY = 'drouple_privacy_settings';

  private constructor(defaultSettings: PrivacySettings) {
    this.settings = defaultSettings;
  }

  public static getInstance(defaultSettings: PrivacySettings): PrivacyManager {
    if (!PrivacyManager.instance) {
      PrivacyManager.instance = new PrivacyManager(defaultSettings);
    }
    return PrivacyManager.instance;
  }

  /**
   * Initialize privacy settings from storage
   */
  public async initialize(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.PRIVACY_STORAGE_KEY);
      if (stored) {
        const storedSettings = JSON.parse(stored);
        this.settings = { ...this.settings, ...storedSettings };
      }
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
    }
  }

  /**
   * Get current privacy settings
   */
  public getSettings(): PrivacySettings {
    return { ...this.settings };
  }

  /**
   * Update privacy settings
   */
  public async updateSettings(
    updates: Partial<PrivacySettings>
  ): Promise<void> {
    this.settings = {
      ...this.settings,
      ...updates,
      dataCollection: {
        ...this.settings.dataCollection,
        ...updates.dataCollection,
      },
      dataRetention: {
        ...this.settings.dataRetention,
        ...updates.dataRetention,
      },
      permissions: {
        ...this.settings.permissions,
        ...updates.permissions,
      },
      sharing: {
        ...this.settings.sharing,
        ...updates.sharing,
      },
    };

    try {
      await AsyncStorage.setItem(
        this.PRIVACY_STORAGE_KEY,
        JSON.stringify(this.settings)
      );
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
      throw new Error('Failed to save privacy settings');
    }
  }

  /**
   * Request specific permission with context
   */
  public async requestPermission(request: PermissionRequest): Promise<{
    granted: boolean;
    status: string;
    canAskAgain: boolean;
  }> {
    try {
      switch (request.permission) {
        case 'location':
          return await this.requestLocationPermission(request);
        case 'notifications':
          return await this.requestNotificationPermission(request);
        case 'camera':
          return await this.requestCameraPermission(request);
        default:
          return {
            granted: false,
            status: 'unsupported',
            canAskAgain: false,
          };
      }
    } catch (error) {
      console.error(
        `Permission request failed for ${request.permission}:`,
        error
      );
      return {
        granted: false,
        status: 'error',
        canAskAgain: false,
      };
    }
  }

  /**
   * Request location permission
   */
  private async requestLocationPermission(request: PermissionRequest): Promise<{
    granted: boolean;
    status: string;
    canAskAgain: boolean;
  }> {
    const { status: currentStatus } =
      await Location.getForegroundPermissionsAsync();

    if (currentStatus === 'granted') {
      await this.updateSettings({
        permissions: { ...this.settings.permissions, location: 'whenInUse' },
      });

      return {
        granted: true,
        status: currentStatus,
        canAskAgain: false,
      };
    }

    // Request permission with context
    const { status } = await Location.requestForegroundPermissionsAsync();

    const locationSetting = status === 'granted' ? 'whenInUse' : 'denied';
    await this.updateSettings({
      permissions: { ...this.settings.permissions, location: locationSetting },
    });

    return {
      granted: status === 'granted',
      status,
      canAskAgain: status === 'undetermined',
    };
  }

  /**
   * Request notification permission
   */
  private async requestNotificationPermission(
    request: PermissionRequest
  ): Promise<{
    granted: boolean;
    status: string;
    canAskAgain: boolean;
  }> {
    const { status: currentStatus } = await Notifications.getPermissionsAsync();

    if (currentStatus.granted) {
      await this.updateSettings({
        permissions: { ...this.settings.permissions, notifications: true },
      });

      return {
        granted: true,
        status: currentStatus.status,
        canAskAgain: false,
      };
    }

    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowAnnouncements: false,
      },
    });

    await this.updateSettings({
      permissions: {
        ...this.settings.permissions,
        notifications: status.granted,
      },
    });

    return {
      granted: status.granted,
      status: status.status,
      canAskAgain: status.canAskAgain,
    };
  }

  /**
   * Request camera permission
   */
  private async requestCameraPermission(request: PermissionRequest): Promise<{
    granted: boolean;
    status: string;
    canAskAgain: boolean;
  }> {
    // Camera permission would be handled by expo-camera
    // This is a placeholder implementation
    await this.updateSettings({
      permissions: { ...this.settings.permissions, camera: false },
    });

    return {
      granted: false,
      status: 'not_implemented',
      canAskAgain: false,
    };
  }

  /**
   * Check if analytics collection is allowed
   */
  public isAnalyticsAllowed(): boolean {
    return this.settings.dataCollection.analytics;
  }

  /**
   * Check if crash reporting is allowed
   */
  public isCrashReportingAllowed(): boolean {
    return this.settings.dataCollection.crashReporting;
  }

  /**
   * Check if performance metrics collection is allowed
   */
  public isPerformanceMetricsAllowed(): boolean {
    return this.settings.dataCollection.performanceMetrics;
  }

  /**
   * Check if user behavior tracking is allowed
   */
  public isUserBehaviorTrackingAllowed(): boolean {
    return this.settings.dataCollection.userBehavior;
  }

  /**
   * Get data retention period for specific data type
   */
  public getDataRetentionPeriod(
    dataType: 'cache' | 'logs' | 'offline'
  ): number {
    switch (dataType) {
      case 'cache':
        return this.settings.dataRetention.cacheExpiry;
      case 'logs':
        return this.settings.dataRetention.logRetention;
      case 'offline':
        return this.settings.dataRetention.offlineDataRetention;
      default:
        return 30; // Default 30 days
    }
  }

  /**
   * Clean up expired data based on retention policies
   */
  public async cleanupExpiredData(): Promise<{
    cacheCleared: boolean;
    logsCleared: boolean;
    offlineDataCleared: boolean;
  }> {
    const results = {
      cacheCleared: false,
      logsCleared: false,
      offlineDataCleared: false,
    };

    try {
      // Clear expired cache
      const cacheExpiry = this.getDataRetentionPeriod('cache');
      const cacheExpired = await this.isDataExpired('cache', cacheExpiry);
      if (cacheExpired) {
        await this.clearCacheData();
        results.cacheCleared = true;
      }

      // Clear expired logs
      const logRetention = this.getDataRetentionPeriod('logs');
      const logsExpired = await this.isDataExpired('logs', logRetention);
      if (logsExpired) {
        await this.clearLogData();
        results.logsCleared = true;
      }

      // Clear expired offline data
      const offlineRetention = this.getDataRetentionPeriod('offline');
      const offlineExpired = await this.isDataExpired(
        'offline',
        offlineRetention
      );
      if (offlineExpired) {
        await this.clearOfflineData();
        results.offlineDataCleared = true;
      }
    } catch (error) {
      console.error('Data cleanup failed:', error);
    }

    return results;
  }

  /**
   * Export user data for GDPR compliance
   */
  public async exportUserData(): Promise<{
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
  }> {
    try {
      const userData = {
        privacySettings: this.settings,
        preferences: await this.getUserPreferences(),
        profileData: await this.getProfileData(),
        activityLogs: await this.getActivityLogs(),
        exportDate: new Date().toISOString(),
      };

      return {
        success: true,
        data: userData,
      };
    } catch (error) {
      return {
        success: false,
        error: `Data export failed: ${error}`,
      };
    }
  }

  /**
   * Delete all user data (GDPR right to erasure)
   */
  public async deleteAllUserData(): Promise<{
    success: boolean;
    itemsDeleted: string[];
    error?: string;
  }> {
    const itemsDeleted: string[] = [];

    try {
      // Clear privacy settings
      await AsyncStorage.removeItem(this.PRIVACY_STORAGE_KEY);
      itemsDeleted.push('privacy_settings');

      // Clear cache data
      await this.clearCacheData();
      itemsDeleted.push('cache_data');

      // Clear log data
      await this.clearLogData();
      itemsDeleted.push('log_data');

      // Clear offline data
      await this.clearOfflineData();
      itemsDeleted.push('offline_data');

      // Clear user preferences
      await AsyncStorage.removeItem('user_preferences');
      itemsDeleted.push('user_preferences');

      return {
        success: true,
        itemsDeleted,
      };
    } catch (error) {
      return {
        success: false,
        itemsDeleted,
        error: `Data deletion failed: ${error}`,
      };
    }
  }

  /**
   * Check if sharing is allowed for specific feature
   */
  public isSharingAllowed(
    feature: 'profile' | 'events' | 'directory'
  ): boolean {
    switch (feature) {
      case 'profile':
        return this.settings.sharing.allowProfileVisibility;
      case 'events':
        return this.settings.sharing.allowEventSharing;
      case 'directory':
        return this.settings.sharing.allowDirectoryListing;
      default:
        return false;
    }
  }

  /**
   * Get privacy-compliant data classification
   */
  public classifyData(dataType: string): DataClassification {
    const classifications: Record<string, DataClassification> = {
      profile: {
        type: 'confidential',
        retention: 365, // 1 year
        encryptionRequired: true,
        auditRequired: true,
      },
      messages: {
        type: 'confidential',
        retention: 90, // 3 months
        encryptionRequired: true,
        auditRequired: false,
      },
      analytics: {
        type: 'internal',
        retention: 180, // 6 months
        encryptionRequired: false,
        auditRequired: false,
      },
      logs: {
        type: 'internal',
        retention: 30, // 1 month
        encryptionRequired: false,
        auditRequired: true,
      },
    };

    return (
      classifications[dataType] || {
        type: 'public',
        retention: 30,
        encryptionRequired: false,
        auditRequired: false,
      }
    );
  }

  /**
   * Helper methods for data management
   */
  private async isDataExpired(
    dataType: string,
    retentionDays: number
  ): Promise<boolean> {
    try {
      const lastCleanup = await AsyncStorage.getItem(
        `last_cleanup_${dataType}`
      );
      if (!lastCleanup) return true;

      const lastCleanupDate = new Date(lastCleanup);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() - retentionDays);

      return lastCleanupDate < expiryDate;
    } catch {
      return true;
    }
  }

  private async clearCacheData(): Promise<void> {
    // Implementation would clear cached API responses, images, etc.
    await AsyncStorage.setItem('last_cleanup_cache', new Date().toISOString());
  }

  private async clearLogData(): Promise<void> {
    // Implementation would clear application logs
    await AsyncStorage.setItem('last_cleanup_logs', new Date().toISOString());
  }

  private async clearOfflineData(): Promise<void> {
    // Implementation would clear offline queue and cached data
    await AsyncStorage.setItem(
      'last_cleanup_offline',
      new Date().toISOString()
    );
  }

  private async getUserPreferences(): Promise<Record<string, unknown>> {
    try {
      const prefs = await AsyncStorage.getItem('user_preferences');
      return prefs ? JSON.parse(prefs) : {};
    } catch {
      return {};
    }
  }

  private async getProfileData(): Promise<Record<string, unknown>> {
    // Implementation would get user profile data
    return {};
  }

  private async getActivityLogs(): Promise<unknown[]> {
    // Implementation would get user activity logs
    return [];
  }
}
