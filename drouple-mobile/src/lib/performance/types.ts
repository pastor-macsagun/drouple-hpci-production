/**
 * Performance & Accessibility Types
 * Type definitions for performance monitoring and accessibility features
 */

export interface PerformanceMetrics {
  appLaunchTime: number;
  screenLoadTime: number;
  apiResponseTime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  renderTime: {
    average: number;
    max: number;
    min: number;
  };
  networkMetrics: {
    bytesDownloaded: number;
    bytesUploaded: number;
    requestCount: number;
    errorCount: number;
  };
  cacheMetrics: {
    hitRate: number;
    missRate: number;
    size: number;
    evictions: number;
  };
}

export interface CacheConfig {
  maxSize: number; // bytes
  maxAge: number; // milliseconds
  strategy: 'lru' | 'fifo' | 'lfu';
  compressionEnabled: boolean;
  persistToDisk: boolean;
  categories: {
    images: {
      maxSize: number;
      maxAge: number;
      quality: number; // 0-1
    };
    api: {
      maxSize: number;
      maxAge: number;
      staleWhileRevalidate: boolean;
    };
    static: {
      maxSize: number;
      maxAge: number;
    };
  };
}

export interface AccessibilitySettings {
  screenReader: {
    enabled: boolean;
    speakOnFocus: boolean;
    announcePageChanges: boolean;
  };
  visualAids: {
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
    colorBlindFriendly: boolean;
  };
  navigation: {
    tabNavigation: boolean;
    gestureNavigation: boolean;
    voiceControl: boolean;
  };
  customizations: {
    fontSize: number; // percentage: 100, 125, 150, 200
    lineHeight: number; // multiplier: 1.0, 1.2, 1.4, 1.6
    buttonSize: number; // percentage: 100, 125, 150
    colorScheme: 'default' | 'high-contrast' | 'dark' | 'light';
  };
}

export interface ImageOptimizationConfig {
  quality: number; // 0-1
  maxWidth: number;
  maxHeight: number;
  format: 'webp' | 'jpeg' | 'png';
  progressive: boolean;
  placeholder: 'blur' | 'color' | 'none';
}

export interface MemoryWarning {
  level: 'low' | 'medium' | 'high' | 'critical';
  currentUsage: number;
  threshold: number;
  recommendations: string[];
  timestamp: Date;
}

export interface RenderingOptimization {
  virtualization: {
    enabled: boolean;
    windowSize: number;
    overscan: number;
  };
  lazy: {
    enabled: boolean;
    threshold: number; // pixels
    rootMargin: string;
  };
  debouncing: {
    search: number; // ms
    scroll: number; // ms
    resize: number; // ms
  };
}

export interface NetworkOptimization {
  requestBatching: {
    enabled: boolean;
    maxBatchSize: number;
    batchDelay: number; // ms
  };
  compression: {
    enabled: boolean;
    threshold: number; // bytes
  };
  prefetching: {
    enabled: boolean;
    maxPrefetch: number;
    priority: ('high' | 'normal' | 'low')[];
  };
}

export interface PerformanceThreshold {
  appLaunch: number; // ms
  screenLoad: number; // ms
  apiResponse: number; // ms
  memoryUsage: number; // percentage
  renderTime: number; // ms
  cacheHitRate: number; // percentage
}

export interface AccessibilityAuditResult {
  score: number; // 0-100
  issues: {
    level: 'error' | 'warning' | 'info';
    rule: string;
    description: string;
    element: string;
    suggestion: string;
  }[];
  passedChecks: number;
  totalChecks: number;
}

export interface PerformanceReport {
  timestamp: Date;
  sessionId: string;
  deviceInfo: {
    model: string;
    osVersion: string;
    appVersion: string;
    memorySize: number;
    storageSize: number;
  };
  metrics: PerformanceMetrics;
  thresholds: PerformanceThreshold;
  violations: {
    metric: string;
    actual: number;
    expected: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }[];
  recommendations: string[];
}
