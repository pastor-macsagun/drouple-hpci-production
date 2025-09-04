/**
 * Performance Monitor
 * Comprehensive performance tracking and optimization for React Native
 */

import { Platform, InteractionManager, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import type {
  PerformanceMetrics,
  PerformanceReport,
  PerformanceThreshold,
} from './types';

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics;
  private startTimes: Map<string, number> = new Map();
  private renderTimes: number[] = [];
  private apiTimes: number[] = [];
  private sessionId: string;
  private isMonitoring: boolean = false;

  private readonly STORAGE_KEY = 'performance_metrics';
  private readonly MAX_STORED_REPORTS = 50;

  private constructor() {
    this.sessionId = Date.now().toString(36);
    this.metrics = this.initializeMetrics();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start performance monitoring
   */
  public async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    await this.loadStoredMetrics();
    this.setupPerformanceObservers();
    this.schedulePeriodicReports();
  }

  /**
   * Stop performance monitoring
   */
  public stopMonitoring(): void {
    this.isMonitoring = false;
  }

  /**
   * Mark the start of a performance measurement
   */
  public markStart(label: string): void {
    this.startTimes.set(label, performance.now());
  }

  /**
   * Mark the end of a performance measurement
   */
  public markEnd(label: string): number {
    const startTime = this.startTimes.get(label);
    if (!startTime) return 0;

    const duration = performance.now() - startTime;
    this.startTimes.delete(label);

    this.recordMeasurement(label, duration);
    return duration;
  }

  /**
   * Measure app launch time
   */
  public measureAppLaunch(): Promise<void> {
    return new Promise(resolve => {
      InteractionManager.runAfterInteractions(() => {
        const launchTime = performance.now();
        this.metrics.appLaunchTime = launchTime;
        resolve();
      });
    });
  }

  /**
   * Measure screen load time
   */
  public measureScreenLoad(screenName: string): Promise<number> {
    return new Promise(resolve => {
      const startTime = performance.now();

      InteractionManager.runAfterInteractions(() => {
        const loadTime = performance.now() - startTime;
        this.metrics.screenLoadTime = loadTime;
        resolve(loadTime);
      });
    });
  }

  /**
   * Record API request performance
   */
  public recordApiRequest(
    url: string,
    method: string,
    duration: number,
    success: boolean,
    bytesTransferred?: { download: number; upload: number }
  ): void {
    this.apiTimes.push(duration);
    this.metrics.apiResponseTime = this.calculateAverage(this.apiTimes);

    this.metrics.networkMetrics.requestCount++;
    if (!success) {
      this.metrics.networkMetrics.errorCount++;
    }

    if (bytesTransferred) {
      this.metrics.networkMetrics.bytesDownloaded += bytesTransferred.download;
      this.metrics.networkMetrics.bytesUploaded += bytesTransferred.upload;
    }
  }

  /**
   * Record component render performance
   */
  public recordRender(componentName: string, renderTime: number): void {
    this.renderTimes.push(renderTime);

    if (this.renderTimes.length > 100) {
      this.renderTimes = this.renderTimes.slice(-50); // Keep last 50
    }

    this.metrics.renderTime = {
      average: this.calculateAverage(this.renderTimes),
      max: Math.max(...this.renderTimes),
      min: Math.min(...this.renderTimes),
    };
  }

  /**
   * Update memory usage metrics
   */
  public async updateMemoryUsage(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        // iOS memory tracking would use native modules
        const memory = await this.getIOSMemoryUsage();
        this.metrics.memoryUsage = memory;
      } else if (Platform.OS === 'android') {
        // Android memory tracking
        const memory = await this.getAndroidMemoryUsage();
        this.metrics.memoryUsage = memory;
      }
    } catch (error) {
      console.warn('Memory usage tracking failed:', error);
    }
  }

  /**
   * Update cache metrics
   */
  public updateCacheMetrics(
    hits: number,
    misses: number,
    size: number,
    evictions: number
  ): void {
    const total = hits + misses;
    this.metrics.cacheMetrics = {
      hitRate: total > 0 ? (hits / total) * 100 : 0,
      missRate: total > 0 ? (misses / total) * 100 : 0,
      size,
      evictions,
    };
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Generate performance report
   */
  public async generateReport(
    thresholds: PerformanceThreshold
  ): Promise<PerformanceReport> {
    await this.updateMemoryUsage();

    const violations = this.checkThresholds(thresholds);
    const recommendations = this.generateRecommendations(violations);

    const report: PerformanceReport = {
      timestamp: new Date(),
      sessionId: this.sessionId,
      deviceInfo: await this.getDeviceInfo(),
      metrics: { ...this.metrics },
      thresholds,
      violations,
      recommendations,
    };

    await this.storeReport(report);
    return report;
  }

  /**
   * Get performance recommendations
   */
  public getRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.appLaunchTime > 3000) {
      recommendations.push(
        'App launch time is slow. Consider optimizing initial bundle size.'
      );
    }

    if (this.metrics.memoryUsage.percentage > 80) {
      recommendations.push(
        'High memory usage detected. Implement memory optimization strategies.'
      );
    }

    if (this.metrics.renderTime.average > 16.67) {
      recommendations.push(
        'Render time exceeds 60fps threshold. Optimize component rendering.'
      );
    }

    if (this.metrics.cacheMetrics.hitRate < 70) {
      recommendations.push('Low cache hit rate. Review caching strategy.');
    }

    if (
      this.metrics.networkMetrics.errorCount /
        this.metrics.networkMetrics.requestCount >
      0.05
    ) {
      recommendations.push(
        'High API error rate detected. Check network reliability.'
      );
    }

    return recommendations;
  }

  /**
   * Export performance data for analysis
   */
  public async exportData(): Promise<{
    success: boolean;
    data?: PerformanceReport[];
    error?: string;
  }> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      const reports: PerformanceReport[] = stored ? JSON.parse(stored) : [];

      return {
        success: true,
        data: reports,
      };
    } catch (error) {
      return {
        success: false,
        error: `Export failed: ${error}`,
      };
    }
  }

  /**
   * Clear all performance data
   */
  public async clearData(): Promise<void> {
    await AsyncStorage.removeItem(this.STORAGE_KEY);
    this.metrics = this.initializeMetrics();
    this.renderTimes = [];
    this.apiTimes = [];
  }

  /**
   * Performance-aware component wrapper
   */
  public wrapComponent<T extends React.ComponentType<any>>(
    Component: T,
    displayName: string
  ): T {
    const WrappedComponent = (props: any) => {
      const startTime = performance.now();

      React.useEffect(() => {
        const renderTime = performance.now() - startTime;
        this.recordRender(displayName, renderTime);
      });

      return React.createElement(Component, props);
    };

    WrappedComponent.displayName = `PerformanceMonitor(${displayName})`;
    return WrappedComponent as T;
  }

  /**
   * Initialize default metrics
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      appLaunchTime: 0,
      screenLoadTime: 0,
      apiResponseTime: 0,
      memoryUsage: {
        used: 0,
        total: 0,
        percentage: 0,
      },
      renderTime: {
        average: 0,
        max: 0,
        min: 0,
      },
      networkMetrics: {
        bytesDownloaded: 0,
        bytesUploaded: 0,
        requestCount: 0,
        errorCount: 0,
      },
      cacheMetrics: {
        hitRate: 0,
        missRate: 0,
        size: 0,
        evictions: 0,
      },
    };
  }

  /**
   * Record performance measurement
   */
  private recordMeasurement(label: string, duration: number): void {
    switch (label) {
      case 'app_launch':
        this.metrics.appLaunchTime = duration;
        break;
      case 'screen_load':
        this.metrics.screenLoadTime = duration;
        break;
      case 'api_request':
        this.apiTimes.push(duration);
        this.metrics.apiResponseTime = this.calculateAverage(this.apiTimes);
        break;
    }
  }

  /**
   * Setup performance observers
   */
  private setupPerformanceObservers(): void {
    // React Navigation performance tracking
    if (__DEV__) {
      console.log('Performance monitoring started');
    }

    // Memory pressure warnings
    if (Platform.OS === 'ios') {
      // iOS memory warnings would be handled via native modules
    }
  }

  /**
   * Schedule periodic performance reports
   */
  private schedulePeriodicReports(): void {
    setInterval(async () => {
      if (this.isMonitoring) {
        const defaultThresholds: PerformanceThreshold = {
          appLaunch: 3000,
          screenLoad: 1000,
          apiResponse: 2000,
          memoryUsage: 80,
          renderTime: 16.67,
          cacheHitRate: 70,
        };

        await this.generateReport(defaultThresholds);
      }
    }, 60000); // Every minute
  }

  /**
   * Load stored performance metrics
   */
  private async loadStoredMetrics(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const reports: PerformanceReport[] = JSON.parse(stored);
        if (reports.length > 0) {
          const latest = reports[reports.length - 1];
          this.metrics = { ...latest.metrics };
        }
      }
    } catch (error) {
      console.warn('Failed to load performance metrics:', error);
    }
  }

  /**
   * Store performance report
   */
  private async storeReport(report: PerformanceReport): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      let reports: PerformanceReport[] = stored ? JSON.parse(stored) : [];

      reports.push(report);

      // Keep only the last N reports
      if (reports.length > this.MAX_STORED_REPORTS) {
        reports = reports.slice(-this.MAX_STORED_REPORTS);
      }

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(reports));
    } catch (error) {
      console.error('Failed to store performance report:', error);
    }
  }

  /**
   * Check performance against thresholds
   */
  private checkThresholds(
    thresholds: PerformanceThreshold
  ): PerformanceReport['violations'] {
    const violations: PerformanceReport['violations'] = [];

    if (this.metrics.appLaunchTime > thresholds.appLaunch) {
      violations.push({
        metric: 'appLaunchTime',
        actual: this.metrics.appLaunchTime,
        expected: thresholds.appLaunch,
        severity: this.getSeverity(
          this.metrics.appLaunchTime,
          thresholds.appLaunch
        ),
      });
    }

    if (this.metrics.memoryUsage.percentage > thresholds.memoryUsage) {
      violations.push({
        metric: 'memoryUsage',
        actual: this.metrics.memoryUsage.percentage,
        expected: thresholds.memoryUsage,
        severity: this.getSeverity(
          this.metrics.memoryUsage.percentage,
          thresholds.memoryUsage
        ),
      });
    }

    return violations;
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    violations: PerformanceReport['violations']
  ): string[] {
    return violations.map(violation => {
      switch (violation.metric) {
        case 'appLaunchTime':
          return 'Optimize app launch by reducing initial bundle size and deferring non-critical operations.';
        case 'memoryUsage':
          return 'Reduce memory usage by implementing proper cleanup and avoiding memory leaks.';
        case 'renderTime':
          return 'Optimize rendering performance by using React.memo, useMemo, and useCallback.';
        default:
          return `Optimize ${violation.metric} to improve overall app performance.`;
      }
    });
  }

  /**
   * Get device information
   */
  private async getDeviceInfo(): Promise<PerformanceReport['deviceInfo']> {
    return {
      model: Device.modelName || 'Unknown',
      osVersion: Device.osVersion || 'Unknown',
      appVersion: Constants.expoConfig?.version || '1.0.0',
      memorySize: 0, // Would need native module
      storageSize: 0, // Would need native module
    };
  }

  /**
   * Get iOS memory usage (placeholder)
   */
  private async getIOSMemoryUsage(): Promise<
    PerformanceMetrics['memoryUsage']
  > {
    // Would use native modules to get actual memory usage
    return { used: 0, total: 0, percentage: 0 };
  }

  /**
   * Get Android memory usage (placeholder)
   */
  private async getAndroidMemoryUsage(): Promise<
    PerformanceMetrics['memoryUsage']
  > {
    // Would use native modules to get actual memory usage
    return { used: 0, total: 0, percentage: 0 };
  }

  /**
   * Calculate average from array of numbers
   */
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  /**
   * Get violation severity
   */
  private getSeverity(
    actual: number,
    threshold: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = actual / threshold;
    if (ratio > 2) return 'critical';
    if (ratio > 1.5) return 'high';
    if (ratio > 1.2) return 'medium';
    return 'low';
  }
}
