/**
 * Feature Flags Service for Pilot Phase
 * Enables controlled rollout and remote kill-switches for risky features
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type FeatureFlag =
  | 'ENABLE_DIRECTORY_CONTACT'
  | 'ENABLE_LEADER_ATTENDANCE'
  | 'ENABLE_PUSH_NOTIFICATIONS'
  | 'ENABLE_OFFLINE_SYNC'
  | 'ENABLE_MEMBER_MESSAGING'
  | 'ENABLE_EVENT_PAYMENTS'
  | 'ENABLE_ADVANCED_SEARCH'
  | 'ENABLE_BULK_OPERATIONS'
  | 'ENABLE_ANALYTICS_TRACKING'
  | 'ENABLE_BETA_FEATURES';

interface FeatureFlagConfig {
  enabled: boolean;
  rolloutPercentage: number;
  killSwitchActive: boolean;
  lastUpdated: string;
  description: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface FeatureFlagsResponse {
  flags: Record<FeatureFlag, FeatureFlagConfig>;
  userId: string;
  tenantId: string;
  version: string;
  timestamp: string;
}

class FeatureFlagsService {
  private flags: Map<FeatureFlag, FeatureFlagConfig> = new Map();
  private cacheKey = '@drouple_feature_flags';
  private lastFetchTime = 0;
  private fetchInterval = 5 * 60 * 1000; // 5 minutes
  private retryAttempts = 0;
  private maxRetries = 3;

  // Default flag configurations (fallback)
  private defaultFlags: Record<FeatureFlag, FeatureFlagConfig> = {
    ENABLE_DIRECTORY_CONTACT: {
      enabled: false,
      rolloutPercentage: 0,
      killSwitchActive: true,
      lastUpdated: new Date().toISOString(),
      description: 'Member directory contact actions (email, phone, message)',
      riskLevel: 'HIGH',
    },
    ENABLE_LEADER_ATTENDANCE: {
      enabled: false,
      rolloutPercentage: 25,
      killSwitchActive: false,
      lastUpdated: new Date().toISOString(),
      description: 'Leader attendance management and bulk operations',
      riskLevel: 'HIGH',
    },
    ENABLE_PUSH_NOTIFICATIONS: {
      enabled: true,
      rolloutPercentage: 100,
      killSwitchActive: false,
      lastUpdated: new Date().toISOString(),
      description: 'Push notification registration and delivery',
      riskLevel: 'MEDIUM',
    },
    ENABLE_OFFLINE_SYNC: {
      enabled: true,
      rolloutPercentage: 75,
      killSwitchActive: false,
      lastUpdated: new Date().toISOString(),
      description: 'Offline data synchronization',
      riskLevel: 'CRITICAL',
    },
    ENABLE_MEMBER_MESSAGING: {
      enabled: false,
      rolloutPercentage: 0,
      killSwitchActive: true,
      lastUpdated: new Date().toISOString(),
      description: 'Direct member-to-member messaging',
      riskLevel: 'MEDIUM',
    },
    ENABLE_EVENT_PAYMENTS: {
      enabled: false,
      rolloutPercentage: 0,
      killSwitchActive: true,
      lastUpdated: new Date().toISOString(),
      description: 'Event payment processing and fee collection',
      riskLevel: 'HIGH',
    },
    ENABLE_ADVANCED_SEARCH: {
      enabled: true,
      rolloutPercentage: 100,
      killSwitchActive: false,
      lastUpdated: new Date().toISOString(),
      description: 'Advanced search filters and sorting',
      riskLevel: 'LOW',
    },
    ENABLE_BULK_OPERATIONS: {
      enabled: false,
      rolloutPercentage: 0,
      killSwitchActive: true,
      lastUpdated: new Date().toISOString(),
      description: 'Bulk member operations (import, export, update)',
      riskLevel: 'CRITICAL',
    },
    ENABLE_ANALYTICS_TRACKING: {
      enabled: true,
      rolloutPercentage: 100,
      killSwitchActive: false,
      lastUpdated: new Date().toISOString(),
      description: 'User behavior analytics and tracking',
      riskLevel: 'LOW',
    },
    ENABLE_BETA_FEATURES: {
      enabled: true,
      rolloutPercentage: 100,
      killSwitchActive: false,
      lastUpdated: new Date().toISOString(),
      description: 'Beta features for pilot testing',
      riskLevel: 'MEDIUM',
    },
  };

  constructor() {
    this.initializeFlags();
  }

  private async initializeFlags(): Promise<void> {
    try {
      // Load cached flags
      const cachedFlags = await this.loadCachedFlags();
      if (cachedFlags) {
        this.flags = new Map(Object.entries(cachedFlags));
      } else {
        // Use default flags if no cache
        this.flags = new Map(Object.entries(this.defaultFlags));
      }

      // Fetch latest flags from server
      await this.fetchLatestFlags();
    } catch (error) {
      console.warn(
        '[FeatureFlags] Initialization failed, using defaults:',
        error
      );
      this.flags = new Map(Object.entries(this.defaultFlags));
    }
  }

  private async loadCachedFlags(): Promise<Record<
    FeatureFlag,
    FeatureFlagConfig
  > | null> {
    try {
      const cached = await AsyncStorage.getItem(this.cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Check cache age (max 1 hour)
        const cacheAge = Date.now() - new Date(parsed.timestamp).getTime();
        if (cacheAge < 60 * 60 * 1000) {
          return parsed.flags;
        }
      }
      return null;
    } catch (error) {
      console.warn('[FeatureFlags] Failed to load cached flags:', error);
      return null;
    }
  }

  private async fetchLatestFlags(): Promise<void> {
    const now = Date.now();
    if (
      now - this.lastFetchTime < this.fetchInterval &&
      this.retryAttempts === 0
    ) {
      return; // Skip if recently fetched
    }

    try {
      const response = await fetch('/api/mobile/feature-flags', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${await this.getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000, // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: FeatureFlagsResponse = await response.json();

      // Update flags
      this.flags = new Map(Object.entries(data.flags));

      // Cache the response
      await this.cacheFlags(data);

      this.lastFetchTime = now;
      this.retryAttempts = 0;

      console.log(
        `[FeatureFlags] Updated ${Object.keys(data.flags).length} flags`
      );
    } catch (error) {
      console.warn('[FeatureFlags] Failed to fetch latest flags:', error);

      if (this.retryAttempts < this.maxRetries) {
        this.retryAttempts++;
        // Exponential backoff: 2s, 4s, 8s
        const delay = Math.pow(2, this.retryAttempts) * 1000;
        setTimeout(() => this.fetchLatestFlags(), delay);
      } else {
        this.retryAttempts = 0;
        console.warn(
          '[FeatureFlags] Max retries exceeded, using cached/default flags'
        );
      }
    }
  }

  private async cacheFlags(data: FeatureFlagsResponse): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.cacheKey,
        JSON.stringify({
          flags: data.flags,
          timestamp: data.timestamp,
          version: data.version,
        })
      );
    } catch (error) {
      console.warn('[FeatureFlags] Failed to cache flags:', error);
    }
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem('@drouple_auth_token');
      return token;
    } catch (error) {
      console.warn('[FeatureFlags] Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * Check if a feature flag is enabled for the current user
   */
  public async isEnabled(flag: FeatureFlag): Promise<boolean> {
    await this.ensureFlagsLoaded();

    const config = this.flags.get(flag) || this.defaultFlags[flag];

    // Check kill switch first
    if (config.killSwitchActive) {
      return false;
    }

    // Check if feature is globally disabled
    if (!config.enabled) {
      return false;
    }

    // Check rollout percentage
    if (config.rolloutPercentage < 100) {
      const userId = await this.getCurrentUserId();
      const userHash = this.hashString(userId + flag);
      const userPercentile = userHash % 100;

      return userPercentile < config.rolloutPercentage;
    }

    return true;
  }

  /**
   * Get detailed configuration for a feature flag
   */
  public async getFlagConfig(flag: FeatureFlag): Promise<FeatureFlagConfig> {
    await this.ensureFlagsLoaded();
    return this.flags.get(flag) || this.defaultFlags[flag];
  }

  /**
   * Get all flag configurations (for debugging/admin)
   */
  public async getAllFlags(): Promise<Record<FeatureFlag, FeatureFlagConfig>> {
    await this.ensureFlagsLoaded();
    const result: Record<FeatureFlag, FeatureFlagConfig> = {} as any;

    for (const [key, value] of this.flags.entries()) {
      result[key as FeatureFlag] = value;
    }

    return result;
  }

  /**
   * Force refresh flags from server
   */
  public async refreshFlags(): Promise<void> {
    this.lastFetchTime = 0; // Force refresh
    await this.fetchLatestFlags();
  }

  /**
   * Activate kill switch for a feature (local override)
   */
  public async activateKillSwitch(flag: FeatureFlag): Promise<void> {
    const config = this.flags.get(flag) || this.defaultFlags[flag];
    config.killSwitchActive = true;
    config.lastUpdated = new Date().toISOString();

    this.flags.set(flag, config);

    console.warn(`[FeatureFlags] Kill switch activated for ${flag}`);

    // Report kill switch activation
    this.reportKillSwitchActivation(flag);
  }

  private async ensureFlagsLoaded(): Promise<void> {
    if (this.flags.size === 0) {
      await this.initializeFlags();
    }
  }

  private async getCurrentUserId(): Promise<string> {
    try {
      const userId = await AsyncStorage.getItem('@drouple_user_id');
      return userId || 'anonymous';
    } catch (error) {
      return 'anonymous';
    }
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private async reportKillSwitchActivation(flag: FeatureFlag): Promise<void> {
    try {
      await fetch('/api/mobile/feature-flags/kill-switch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await this.getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flag,
          timestamp: new Date().toISOString(),
          reason: 'Local kill switch activation',
          clientVersion: '1.0.0', // TODO: Get from app config
        }),
      });
    } catch (error) {
      console.warn(
        '[FeatureFlags] Failed to report kill switch activation:',
        error
      );
    }
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagsService();

// React hook for easier usage in components
export function useFeatureFlag(flag: FeatureFlag): boolean {
  const [isEnabled, setIsEnabled] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    const checkFlag = async () => {
      try {
        const enabled = await featureFlags.isEnabled(flag);
        if (mounted) {
          setIsEnabled(enabled);
          setIsLoading(false);
        }
      } catch (error) {
        console.warn(`[FeatureFlags] Failed to check flag ${flag}:`, error);
        if (mounted) {
          setIsEnabled(false);
          setIsLoading(false);
        }
      }
    };

    checkFlag();

    return () => {
      mounted = false;
    };
  }, [flag]);

  return isEnabled;
}

// React hook for flag configuration
export function useFeatureFlagConfig(
  flag: FeatureFlag
): FeatureFlagConfig | null {
  const [config, setConfig] = React.useState<FeatureFlagConfig | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const getConfig = async () => {
      try {
        const flagConfig = await featureFlags.getFlagConfig(flag);
        if (mounted) {
          setConfig(flagConfig);
        }
      } catch (error) {
        console.warn(`[FeatureFlags] Failed to get config for ${flag}:`, error);
        if (mounted) {
          setConfig(null);
        }
      }
    };

    getConfig();

    return () => {
      mounted = false;
    };
  }, [flag]);

  return config;
}

// Import React for hooks
import React from 'react';
