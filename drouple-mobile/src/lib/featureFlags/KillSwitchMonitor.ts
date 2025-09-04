/**
 * Kill Switch Monitor
 * Monitors app health metrics and automatically activates kill switches
 * when error thresholds are breached during pilot phase
 */

import { featureFlags, FeatureFlag } from './index';

interface HealthMetrics {
  crashRate: number;
  apiResponseTime: number;
  offlineSuccessRate: number;
  pushNotificationErrors: number;
  dataSyncFailures: number;
  timestamp: string;
}

interface KillSwitchThresholds {
  crashRate: number;
  apiResponseTime: number;
  offlineSuccessRate: number;
  pushNotificationErrors: number;
  dataSyncFailures: number;
}

interface KillSwitchRule {
  flag: FeatureFlag;
  thresholds: KillSwitchThresholds;
  cooldownMinutes: number;
  description: string;
}

class KillSwitchMonitor {
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastActivations: Map<FeatureFlag, Date> = new Map();
  private metricsHistory: HealthMetrics[] = [];
  private maxHistorySize = 100;

  // Kill switch rules configuration
  private killSwitchRules: KillSwitchRule[] = [
    {
      flag: 'ENABLE_PUSH_NOTIFICATIONS',
      thresholds: {
        crashRate: 0.5, // 0.5%
        apiResponseTime: 2000, // 2 seconds
        offlineSuccessRate: 90, // 90%
        pushNotificationErrors: 10, // 10%
        dataSyncFailures: 15, // 15%
      },
      cooldownMinutes: 30,
      description: 'Push notification registration causing high error rates',
    },
    {
      flag: 'ENABLE_OFFLINE_SYNC',
      thresholds: {
        crashRate: 1.0, // 1.0%
        apiResponseTime: 3000, // 3 seconds
        offlineSuccessRate: 80, // 80%
        pushNotificationErrors: 100, // Not applicable
        dataSyncFailures: 20, // 20%
      },
      cooldownMinutes: 15,
      description: 'Offline sync causing data corruption or high failure rate',
    },
    {
      flag: 'ENABLE_DIRECTORY_CONTACT',
      thresholds: {
        crashRate: 0.3, // 0.3%
        apiResponseTime: 1500, // 1.5 seconds
        offlineSuccessRate: 95, // 95%
        pushNotificationErrors: 100, // Not applicable
        dataSyncFailures: 10, // 10%
      },
      cooldownMinutes: 60,
      description:
        'Directory contact actions causing privacy or performance issues',
    },
    {
      flag: 'ENABLE_LEADER_ATTENDANCE',
      thresholds: {
        crashRate: 0.4, // 0.4%
        apiResponseTime: 2500, // 2.5 seconds
        offlineSuccessRate: 92, // 92%
        pushNotificationErrors: 100, // Not applicable
        dataSyncFailures: 25, // 25%
      },
      cooldownMinutes: 45,
      description:
        'Leader attendance management causing bulk operation failures',
    },
  ];

  /**
   * Start monitoring health metrics and auto-activating kill switches
   */
  public startMonitoring(): void {
    if (this.isMonitoring) {
      console.warn('[KillSwitchMonitor] Already monitoring');
      return;
    }

    this.isMonitoring = true;
    console.log('[KillSwitchMonitor] Started monitoring');

    // Check metrics every 2 minutes
    this.monitoringInterval = setInterval(
      async () => {
        try {
          await this.checkHealthMetrics();
        } catch (error) {
          console.error(
            '[KillSwitchMonitor] Error checking health metrics:',
            error
          );
        }
      },
      2 * 60 * 1000
    );

    // Initial check
    this.checkHealthMetrics();
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('[KillSwitchMonitor] Stopped monitoring');
  }

  /**
   * Manually check health metrics and activate kill switches if needed
   */
  public async checkHealthMetrics(): Promise<void> {
    try {
      const metrics = await this.fetchHealthMetrics();

      if (!metrics) {
        console.warn('[KillSwitchMonitor] Failed to fetch health metrics');
        return;
      }

      // Store metrics for trend analysis
      this.metricsHistory.push(metrics);
      if (this.metricsHistory.length > this.maxHistorySize) {
        this.metricsHistory.shift();
      }

      // Check each kill switch rule
      for (const rule of this.killSwitchRules) {
        await this.evaluateKillSwitchRule(rule, metrics);
      }
    } catch (error) {
      console.error('[KillSwitchMonitor] Error in health check:', error);
    }
  }

  /**
   * Get current health metrics from monitoring endpoints
   */
  private async fetchHealthMetrics(): Promise<HealthMetrics | null> {
    try {
      const response = await fetch('/api/mobile/health-metrics', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${await this.getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.warn(
        '[KillSwitchMonitor] Failed to fetch health metrics:',
        error
      );
      return null;
    }
  }

  /**
   * Evaluate a specific kill switch rule against current metrics
   */
  private async evaluateKillSwitchRule(
    rule: KillSwitchRule,
    metrics: HealthMetrics
  ): Promise<void> {
    const { flag, thresholds, cooldownMinutes, description } = rule;

    // Check if we're in cooldown period
    const lastActivation = this.lastActivations.get(flag);
    if (lastActivation) {
      const cooldownMs = cooldownMinutes * 60 * 1000;
      const timeSinceActivation = Date.now() - lastActivation.getTime();

      if (timeSinceActivation < cooldownMs) {
        return; // Still in cooldown
      }
    }

    // Check if any threshold is breached
    const breaches: string[] = [];

    if (metrics.crashRate > thresholds.crashRate) {
      breaches.push(
        `Crash rate: ${metrics.crashRate}% > ${thresholds.crashRate}%`
      );
    }

    if (metrics.apiResponseTime > thresholds.apiResponseTime) {
      breaches.push(
        `API response time: ${metrics.apiResponseTime}ms > ${thresholds.apiResponseTime}ms`
      );
    }

    if (metrics.offlineSuccessRate < thresholds.offlineSuccessRate) {
      breaches.push(
        `Offline success rate: ${metrics.offlineSuccessRate}% < ${thresholds.offlineSuccessRate}%`
      );
    }

    if (
      thresholds.pushNotificationErrors < 100 &&
      metrics.pushNotificationErrors > thresholds.pushNotificationErrors
    ) {
      breaches.push(
        `Push notification errors: ${metrics.pushNotificationErrors}% > ${thresholds.pushNotificationErrors}%`
      );
    }

    if (metrics.dataSyncFailures > thresholds.dataSyncFailures) {
      breaches.push(
        `Data sync failures: ${metrics.dataSyncFailures}% > ${thresholds.dataSyncFailures}%`
      );
    }

    // Activate kill switch if any threshold is breached
    if (breaches.length > 0) {
      await this.activateKillSwitch(flag, description, breaches, metrics);
    }
  }

  /**
   * Activate kill switch for a feature flag
   */
  private async activateKillSwitch(
    flag: FeatureFlag,
    description: string,
    breaches: string[],
    metrics: HealthMetrics
  ): Promise<void> {
    try {
      // Activate the kill switch
      await featureFlags.activateKillSwitch(flag);

      // Record activation time
      this.lastActivations.set(flag, new Date());

      // Log the activation
      console.error(`[KillSwitchMonitor] KILL SWITCH ACTIVATED: ${flag}`);
      console.error(`Description: ${description}`);
      console.error(`Breaches: ${breaches.join(', ')}`);
      console.error(`Current metrics:`, metrics);

      // Report to monitoring service
      await this.reportKillSwitchActivation(
        flag,
        description,
        breaches,
        metrics
      );

      // Send alert to operations team
      await this.sendKillSwitchAlert(flag, description, breaches, metrics);
    } catch (error) {
      console.error(
        `[KillSwitchMonitor] Failed to activate kill switch for ${flag}:`,
        error
      );
    }
  }

  /**
   * Report kill switch activation to monitoring service
   */
  private async reportKillSwitchActivation(
    flag: FeatureFlag,
    description: string,
    breaches: string[],
    metrics: HealthMetrics
  ): Promise<void> {
    try {
      await fetch('/api/mobile/kill-switch-activation', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await this.getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flag,
          description,
          breaches,
          metrics,
          timestamp: new Date().toISOString(),
          clientVersion: await this.getAppVersion(),
          deviceInfo: await this.getDeviceInfo(),
        }),
      });
    } catch (error) {
      console.warn(
        '[KillSwitchMonitor] Failed to report kill switch activation:',
        error
      );
    }
  }

  /**
   * Send immediate alert to operations team
   */
  private async sendKillSwitchAlert(
    flag: FeatureFlag,
    description: string,
    breaches: string[],
    metrics: HealthMetrics
  ): Promise<void> {
    try {
      await fetch('/api/mobile/alerts/kill-switch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await this.getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          severity: 'CRITICAL',
          flag,
          description,
          breaches,
          metrics,
          timestamp: new Date().toISOString(),
          alertChannels: ['slack', 'email', 'pagerduty'],
        }),
      });
    } catch (error) {
      console.warn(
        '[KillSwitchMonitor] Failed to send kill switch alert:',
        error
      );
    }
  }

  /**
   * Get metrics trend analysis
   */
  public getMetricsTrend(
    metric: keyof HealthMetrics,
    minutes: number = 30
  ): number[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);

    return this.metricsHistory
      .filter(m => new Date(m.timestamp) > cutoff)
      .map(m => m[metric] as number)
      .filter(v => typeof v === 'number');
  }

  /**
   * Get kill switch activation history
   */
  public getKillSwitchHistory(): Array<{ flag: FeatureFlag; timestamp: Date }> {
    return Array.from(this.lastActivations.entries()).map(
      ([flag, timestamp]) => ({
        flag,
        timestamp,
      })
    );
  }

  /**
   * Reset kill switch cooldown for a flag (manual override)
   */
  public resetKillSwitchCooldown(flag: FeatureFlag): void {
    this.lastActivations.delete(flag);
    console.log(`[KillSwitchMonitor] Reset cooldown for ${flag}`);
  }

  // Helper methods
  private async getAuthToken(): Promise<string | null> {
    try {
      const AsyncStorage = await import(
        '@react-native-async-storage/async-storage'
      );
      return await AsyncStorage.default.getItem('@drouple_auth_token');
    } catch (error) {
      return null;
    }
  }

  private async getAppVersion(): Promise<string> {
    try {
      const Constants = await import('expo-constants');
      return Constants.default.expoConfig?.version || '1.0.0';
    } catch (error) {
      return '1.0.0';
    }
  }

  private async getDeviceInfo(): Promise<object> {
    try {
      const Device = await import('expo-device');
      return {
        brand: Device.default.brand,
        deviceName: Device.default.deviceName,
        modelName: Device.default.modelName,
        osName: Device.default.osName,
        osVersion: Device.default.osVersion,
        platformApiLevel: Device.default.platformApiLevel,
      };
    } catch (error) {
      return {};
    }
  }
}

// Singleton instance
export const killSwitchMonitor = new KillSwitchMonitor();

// Auto-start monitoring in production
if (process.env.NODE_ENV === 'production') {
  killSwitchMonitor.startMonitoring();
}
