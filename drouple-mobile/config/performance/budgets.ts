/**
 * Performance budgets for Drouple Mobile App
 * Based on PRD specifications and PERF-ANALYST requirements
 */

export interface PerformanceBudgets {
  startup: {
    coldStart: {
      ios: number; // milliseconds
      android: number; // milliseconds
    };
    homeTTI: number; // Time to Interactive for home screen
  };
  rendering: {
    maxLongFrames: number; // percentage
    targetFPS: number;
    maxJankFrames: number; // consecutive frames
  };
  memory: {
    maxHeapSize: number; // MB
    maxNativeHeap: number; // MB (Android)
  };
  bundle: {
    maxBaseSize: number; // MB
    maxInstalledSize: number; // MB
    maxRouteSize: number; // KB
  };
  network: {
    maxApiResponseTime: number; // milliseconds
    maxImageLoadTime: number; // milliseconds
  };
}

export const PERFORMANCE_BUDGETS: PerformanceBudgets = {
  startup: {
    coldStart: {
      ios: 1500, // <1.5s for iOS
      android: 2500, // <2.5s for Android
    },
    homeTTI: 2000, // <2.0s for Home TTI
  },
  rendering: {
    maxLongFrames: 1.0, // <1% long frames
    targetFPS: 60,
    maxJankFrames: 3,
  },
  memory: {
    maxHeapSize: 150, // 150MB heap
    maxNativeHeap: 200, // 200MB native heap (Android)
  },
  bundle: {
    maxBaseSize: 50, // ≤50MB base bundle
    maxInstalledSize: 120, // ≤120MB installed
    maxRouteSize: 200, // 200KB per route chunk
  },
  network: {
    maxApiResponseTime: 500, // 500ms p95
    maxImageLoadTime: 1000, // 1s for images
  },
};

export const PERFORMANCE_THRESHOLDS = {
  // Warning thresholds (80% of budget)
  WARNING: {
    startup: {
      coldStart: {
        ios: PERFORMANCE_BUDGETS.startup.coldStart.ios * 0.8,
        android: PERFORMANCE_BUDGETS.startup.coldStart.android * 0.8,
      },
      homeTTI: PERFORMANCE_BUDGETS.startup.homeTTI * 0.8,
    },
    rendering: {
      maxLongFrames: PERFORMANCE_BUDGETS.rendering.maxLongFrames * 0.8,
    },
    bundle: {
      maxBaseSize: PERFORMANCE_BUDGETS.bundle.maxBaseSize * 0.8,
      maxInstalledSize: PERFORMANCE_BUDGETS.bundle.maxInstalledSize * 0.8,
    },
  },
  // Critical thresholds (95% of budget)
  CRITICAL: {
    startup: {
      coldStart: {
        ios: PERFORMANCE_BUDGETS.startup.coldStart.ios * 0.95,
        android: PERFORMANCE_BUDGETS.startup.coldStart.android * 0.95,
      },
      homeTTI: PERFORMANCE_BUDGETS.startup.homeTTI * 0.95,
    },
    rendering: {
      maxLongFrames: PERFORMANCE_BUDGETS.rendering.maxLongFrames * 0.95,
    },
    bundle: {
      maxBaseSize: PERFORMANCE_BUDGETS.bundle.maxBaseSize * 0.95,
      maxInstalledSize: PERFORMANCE_BUDGETS.bundle.maxInstalledSize * 0.95,
    },
  },
};

export type MetricCategory = 'startup' | 'rendering' | 'memory' | 'bundle' | 'network';
export type AlertLevel = 'info' | 'warning' | 'critical' | 'budget_exceeded';

export interface PerformanceMetric {
  name: string;
  category: MetricCategory;
  value: number;
  unit: string;
  budget: number;
  alertLevel: AlertLevel;
  timestamp: string;
  platform?: 'ios' | 'android';
  buildType?: 'debug' | 'release';
}

/**
 * Calculate alert level based on metric value and budget
 */
export function calculateAlertLevel(value: number, budget: number): AlertLevel {
  const warningThreshold = budget * 0.8;
  const criticalThreshold = budget * 0.95;

  if (value >= budget) {
    return 'budget_exceeded';
  } else if (value >= criticalThreshold) {
    return 'critical';
  } else if (value >= warningThreshold) {
    return 'warning';
  } else {
    return 'info';
  }
}

/**
 * Validate performance metric against budgets
 */
export function validateMetric(
  name: string,
  category: MetricCategory,
  value: number,
  unit: string,
  budget: number,
  platform?: 'ios' | 'android',
  buildType?: 'debug' | 'release'
): PerformanceMetric {
  return {
    name,
    category,
    value,
    unit,
    budget,
    alertLevel: calculateAlertLevel(value, budget),
    timestamp: new Date().toISOString(),
    platform,
    buildType,
  };
}

/**
 * Performance budget validation results
 */
export interface BudgetValidationResult {
  passed: boolean;
  metrics: PerformanceMetric[];
  summary: {
    total: number;
    passed: number;
    warnings: number;
    critical: number;
    exceeded: number;
  };
}