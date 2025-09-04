/**
 * App Configuration Manager
 * Production-ready configuration with environment-specific settings
 */

import Constants from 'expo-constants';

// Environment detection
export const APP_ENV = __DEV__ ? 'development' : 'production';
export const IS_DEVELOPMENT = __DEV__;
export const IS_PRODUCTION = !__DEV__;

// Get configuration value with type safety and fallbacks
function getConfigValue<T>(key: string, fallback: T): T {
  const value = Constants.expoConfig?.extra?.[key];
  return value !== undefined ? value : fallback;
}

// App Configuration
export const APP_CONFIG = {
  // Basic app info
  name: 'Drouple Mobile',
  version: Constants.expoConfig?.version || '1.0.0',
  buildNumber: getConfigValue('buildNumber', '1'),
  
  // Environment
  environment: APP_ENV,
  isDevelopment: IS_DEVELOPMENT,
  isProduction: IS_PRODUCTION,
  
  // API Configuration
  api: {
    baseUrl: getConfigValue('apiUrl', IS_DEVELOPMENT ? 'http://localhost:3000' : 'https://drouple-hpci-prod.vercel.app'),
    timeout: getConfigValue('apiTimeout', 30000),
    retries: getConfigValue('apiRetries', 3),
    enforceHttps: getConfigValue('enforceHttps', IS_PRODUCTION),
  },
  
  // Feature Flags
  features: {
    enableMockApis: getConfigValue('enableMockApis', IS_DEVELOPMENT),
    enableAnalytics: getConfigValue('enableAnalytics', IS_PRODUCTION),
    enableCrashReporting: getConfigValue('enableCrashReporting', IS_PRODUCTION),
    enableBiometrics: getConfigValue('enableBiometrics', true),
    enableNotifications: getConfigValue('enableNotifications', true),
    enablePerformanceMonitoring: getConfigValue('enablePerformanceMonitoring', IS_PRODUCTION),
    enableOfflineMode: getConfigValue('enableOfflineMode', true),
    enableRealtimeSync: getConfigValue('enableRealtimeSync', true),
  },
  
  // Security Configuration
  security: {
    certificatePinning: getConfigValue('certificatePinning', IS_PRODUCTION),
    encryptStorage: getConfigValue('encryptStorage', true),
    biometricTimeout: getConfigValue('biometricTimeout', 30000),
    tokenRefreshThreshold: getConfigValue('tokenRefreshThreshold', 300000), // 5 minutes
    maxLoginAttempts: getConfigValue('maxLoginAttempts', 3),
    lockoutDuration: getConfigValue('lockoutDuration', 900000), // 15 minutes
  },
  
  // Rate Limiting
  rateLimit: {
    maxRequests: getConfigValue('rateLimitMax', 100),
    windowMs: getConfigValue('rateLimitWindow', 900000), // 15 minutes
  },
  
  // Cache Configuration
  cache: {
    sizeLimit: getConfigValue('cacheSizeLimit', 50 * 1024 * 1024), // 50MB
    ttlDefault: getConfigValue('cacheTtlDefault', 300000), // 5 minutes
    offlineStorageLimit: getConfigValue('offlineStorageLimit', 100 * 1024 * 1024), // 100MB
  },
  
  // Sync Configuration
  sync: {
    maxRetries: getConfigValue('syncMaxRetries', 5),
    backoffMultiplier: getConfigValue('syncBackoffMultiplier', 2),
    initialBackoff: getConfigValue('syncInitialBackoff', 1000),
    maxBackoff: getConfigValue('syncMaxBackoff', 30000),
    batchSize: getConfigValue('syncBatchSize', 10),
  },
  
  // Notification Configuration
  notifications: {
    enablePush: getConfigValue('enablePushNotifications', true),
    enableLocal: getConfigValue('enableLocalNotifications', true),
    maxDisplayed: getConfigValue('maxNotificationsDisplayed', 10),
  },
  
  // Performance Configuration
  performance: {
    bundleSizeLimit: getConfigValue('bundleSizeLimit', 10 * 1024 * 1024), // 10MB
    memoryLimit: getConfigValue('memoryLimit', 200 * 1024 * 1024), // 200MB
    renderTimeLimit: getConfigValue('renderTimeLimit', 16.67), // 60fps
    enableProfiling: getConfigValue('enableProfiling', IS_DEVELOPMENT),
  },
  
  // Accessibility Configuration
  accessibility: {
    enableTesting: getConfigValue('enableAccessibilityTesting', IS_DEVELOPMENT),
    fontScale: getConfigValue('accessibilityFontScale', 1.0),
    minimumTouchTarget: getConfigValue('minimumTouchTarget', 44),
    enableVoiceOver: getConfigValue('enableVoiceOver', true),
  },
  
  // Deep Linking
  deepLink: {
    scheme: getConfigValue('deepLinkScheme', 'drouple'),
    universalLinkDomain: getConfigValue('universalLinkDomain', 'drouple.com'),
  },
  
  // Third-party Services
  services: {
    sentryDsn: getConfigValue('sentryDsn', ''),
    amplitudeApiKey: getConfigValue('amplitudeApiKey', ''),
    mixpanelToken: getConfigValue('mixpanelToken', ''),
  },
  
  // Legal & Compliance
  legal: {
    privacyPolicyUrl: getConfigValue('privacyPolicyUrl', 'https://drouple.com/privacy'),
    termsOfServiceUrl: getConfigValue('termsOfServiceUrl', 'https://drouple.com/terms'),
    supportEmail: getConfigValue('supportEmail', 'support@drouple.com'),
  },
  
  // Development Tools
  dev: {
    enableFlipper: getConfigValue('enableFlipper', false),
    enableReactDebugger: getConfigValue('enableReactDebugger', IS_DEVELOPMENT),
    enableReduxDevtools: getConfigValue('enableReduxDevtools', IS_DEVELOPMENT),
    mockSlowNetwork: getConfigValue('mockSlowNetwork', false),
    mockOfflineMode: getConfigValue('mockOfflineMode', false),
  },
} as const;

// Validation helper
export function validateConfig(): boolean {
  try {
    // Validate critical configuration
    if (!APP_CONFIG.api.baseUrl) {
      console.error('API base URL is required');
      return false;
    }
    
    if (APP_CONFIG.isProduction && APP_CONFIG.api.baseUrl.includes('localhost')) {
      console.error('Production build cannot use localhost API URL');
      return false;
    }
    
    if (APP_CONFIG.security.enforceHttps && !APP_CONFIG.api.baseUrl.startsWith('https://')) {
      console.error('HTTPS is enforced but API URL is not HTTPS');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Configuration validation failed:', error);
    return false;
  }
}

// Initialize configuration on app start
export function initializeConfig(): void {
  if (!validateConfig()) {
    throw new Error('Invalid application configuration');
  }
  
  if (IS_DEVELOPMENT) {
    console.log('App Configuration:', APP_CONFIG);
  }
}

export default APP_CONFIG;