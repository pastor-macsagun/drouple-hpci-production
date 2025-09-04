/**
 * Environment Configuration
 * Centralized configuration for different environments
 */

import Constants from 'expo-constants';

export type Environment = 'development' | 'staging' | 'production';

interface Config {
  environment: Environment;
  apiUrl: string;
  apiTimeout: number;
  enableLogging: boolean;
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
  enablePerformanceMonitoring: boolean;
  cacheTimeout: number;
  maxRetries: number;
  sentryDsn?: string;
  amplitudeApiKey?: string;
  oneSignalAppId?: string;
  features: {
    offlineMode: boolean;
    biometricAuth: boolean;
    pushNotifications: boolean;
    locationServices: boolean;
    cameraAccess: boolean;
    socialSharing: boolean;
    darkMode: boolean;
    analytics: boolean;
  };
  storage: {
    encryptionEnabled: boolean;
    backupEnabled: boolean;
    maxCacheSize: number; // MB
  };
  security: {
    certificatePinning: boolean;
    jailbreakDetection: boolean;
    debuggerDetection: boolean;
    maxLoginAttempts: number;
    sessionTimeout: number; // minutes
  };
  performance: {
    enableBundleAnalysis: boolean;
    enableMemoryProfiling: boolean;
    imageOptimization: boolean;
    lazyLoading: boolean;
  };
}

const getEnvironment = (): Environment => {
  const env =
    Constants.expoConfig?.extra?.environment || __DEV__
      ? 'development'
      : 'production';
  return env as Environment;
};

const getApiUrl = (): string => {
  const extra = Constants.expoConfig?.extra;
  return extra?.apiUrl || 'https://api.drouple.com';
};

const isDevelopment = (): boolean => getEnvironment() === 'development';
const isStaging = (): boolean => getEnvironment() === 'staging';
const isProduction = (): boolean => getEnvironment() === 'production';

const config: Config = {
  environment: getEnvironment(),
  apiUrl: getApiUrl(),
  apiTimeout: isProduction() ? 10000 : 30000, // 10s prod, 30s dev/staging
  enableLogging: !isProduction(),
  enableAnalytics: !isDevelopment(),
  enableCrashReporting: !isDevelopment(),
  enablePerformanceMonitoring: isProduction(),
  cacheTimeout: isProduction() ? 300000 : 60000, // 5min prod, 1min dev/staging
  maxRetries: 3,

  // Third-party service keys
  sentryDsn: Constants.expoConfig?.extra?.sentryDsn,
  amplitudeApiKey: Constants.expoConfig?.extra?.amplitudeApiKey,
  oneSignalAppId: Constants.expoConfig?.extra?.oneSignalAppId,

  features: {
    offlineMode: true,
    biometricAuth: isProduction(),
    pushNotifications: !isDevelopment(),
    locationServices: true,
    cameraAccess: true,
    socialSharing: !isDevelopment(),
    darkMode: true,
    analytics: !isDevelopment(),
  },

  storage: {
    encryptionEnabled: isProduction(),
    backupEnabled: false, // Disabled for privacy compliance
    maxCacheSize: isProduction() ? 50 : 100, // MB
  },

  security: {
    certificatePinning: isProduction(),
    jailbreakDetection: isProduction(),
    debuggerDetection: isProduction(),
    maxLoginAttempts: 5,
    sessionTimeout: isProduction() ? 30 : 60, // minutes
  },

  performance: {
    enableBundleAnalysis: isDevelopment(),
    enableMemoryProfiling: isDevelopment(),
    imageOptimization: true,
    lazyLoading: true,
  },
};

// Environment-specific overrides
if (isDevelopment()) {
  // Development-specific settings
  config.apiTimeout = 30000;
  config.cacheTimeout = 10000; // 10 seconds for faster development
  config.maxRetries = 1;
  config.security.maxLoginAttempts = 10; // More lenient for testing
  config.security.sessionTimeout = 120; // 2 hours for development
}

if (isStaging()) {
  // Staging-specific settings
  config.apiTimeout = 20000;
  config.cacheTimeout = 30000; // 30 seconds
  config.maxRetries = 2;
  config.enableLogging = true; // Enable logging in staging for debugging
  config.security.sessionTimeout = 45; // 45 minutes
}

if (isProduction()) {
  // Production-specific settings
  config.apiTimeout = 10000;
  config.cacheTimeout = 300000; // 5 minutes
  config.maxRetries = 3;
  config.enableLogging = false;
  config.security.sessionTimeout = 30; // 30 minutes
}

// Validation
if (!config.apiUrl) {
  console.error('API URL is not configured');
}

if (config.enableCrashReporting && !config.sentryDsn) {
  console.warn('Crash reporting is enabled but Sentry DSN is not configured');
}

if (config.enableAnalytics && !config.amplitudeApiKey) {
  console.warn('Analytics is enabled but Amplitude API key is not configured');
}

if (config.features.pushNotifications && !config.oneSignalAppId) {
  console.warn(
    'Push notifications are enabled but OneSignal App ID is not configured'
  );
}

// Export configuration
export default config;

// Export individual configurations for easier access
export const {
  environment,
  apiUrl,
  apiTimeout,
  enableLogging,
  enableAnalytics,
  enableCrashReporting,
  enablePerformanceMonitoring,
  cacheTimeout,
  maxRetries,
  features,
  storage,
  security,
  performance,
} = config;

// Export helper functions
export { isDevelopment, isStaging, isProduction, getEnvironment, getApiUrl };

// Export constants
export const APP_VERSION = Constants.expoConfig?.version || '1.0.0';
export const BUILD_NUMBER =
  Constants.expoConfig?.ios?.buildNumber ||
  Constants.expoConfig?.android?.versionCode?.toString() ||
  '1';
export const BUNDLE_ID =
  Constants.expoConfig?.ios?.bundleIdentifier ||
  Constants.expoConfig?.android?.package ||
  'com.drouple.mobile';

// Feature flags
export const FEATURE_FLAGS = {
  NEW_DASHBOARD: isProduction() ? true : true, // Enable in all environments
  ADVANCED_ANALYTICS: isProduction(),
  BETA_FEATURES: isDevelopment() || isStaging(),
  EXPERIMENTAL_UI: isDevelopment(),
  A_B_TESTING: isProduction(),
} as const;

// Debug utilities
if (__DEV__) {
  console.log('🔧 Environment Configuration:', {
    environment: config.environment,
    apiUrl: config.apiUrl,
    enableLogging: config.enableLogging,
    enableAnalytics: config.enableAnalytics,
    features: config.features,
    featureFlags: FEATURE_FLAGS,
  });
}

// Runtime environment checks
export const checkEnvironmentHealth = (): {
  healthy: boolean;
  issues: string[];
} => {
  const issues: string[] = [];

  if (!config.apiUrl) {
    issues.push('API URL is not configured');
  }

  if (config.enableCrashReporting && !config.sentryDsn) {
    issues.push('Sentry DSN is missing');
  }

  if (config.enableAnalytics && !config.amplitudeApiKey) {
    issues.push('Amplitude API key is missing');
  }

  if (config.features.pushNotifications && !config.oneSignalAppId) {
    issues.push('OneSignal App ID is missing');
  }

  return {
    healthy: issues.length === 0,
    issues,
  };
};

export type { Config };
