/**
 * Environment Configuration
 * Centralized configuration management for different environments
 */

export interface EnvironmentConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  isStaging: boolean;

  // API Configuration
  apiUrl: string;
  apiTimeout: number;
  apiRetries: number;

  // Feature Flags
  enableMockApis: boolean;
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
  enableBiometrics: boolean;
  enableNotifications: boolean;
  enableOfflineMode: boolean;
  enableCertificatePinning: boolean;
  enablePerformanceMonitoring: boolean;

  // Security Settings
  encryptStorage: boolean;
  biometricTimeout: number;

  // Rate Limiting
  rateLimitMax: number;
  rateLimitWindow: number; // minutes

  // Cache Settings
  cacheSizeLimit: number;
  cacheTTLDefault: number;
  offlineStorageLimit: number;

  // Build Information
  buildNumber: string;
  versionCode: string;
  appVariant: string;

  // Third-party Services
  sentryDsn?: string;
  amplitudeApiKey?: string;
  oneSignalAppId?: string;

  // URLs
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
  supportEmail: string;
  helpCenterUrl: string;
  feedbackUrl: string;

  // Content Delivery
  cdnBaseUrl: string;
  assetsBaseUrl: string;
  mediaBaseUrl: string;
}

class EnvironmentManager {
  private static instance: EnvironmentManager;
  private config: EnvironmentConfig;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  private loadConfiguration(): EnvironmentConfig {
    // Get app variant from environment
    const appVariant = process.env.APP_VARIANT || 'development';

    const isDevelopment = appVariant === 'development';
    const isStaging = appVariant === 'staging';
    const isProduction = appVariant === 'production';

    return {
      isDevelopment,
      isProduction,
      isStaging,

      // API Configuration
      apiUrl: this.getApiUrl(appVariant),
      apiTimeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000', 10),
      apiRetries: parseInt(process.env.EXPO_PUBLIC_API_RETRIES || '3', 10),

      // Feature Flags
      enableMockApis:
        process.env.EXPO_PUBLIC_ENABLE_MOCK_APIS === 'true' || isDevelopment,
      enableAnalytics:
        process.env.EXPO_PUBLIC_ENABLE_ANALYTICS !== 'false' && !isDevelopment,
      enableCrashReporting:
        process.env.EXPO_PUBLIC_ENABLE_CRASH_REPORTING !== 'false',
      enableBiometrics: process.env.EXPO_PUBLIC_ENABLE_BIOMETRICS !== 'false',
      enableNotifications:
        process.env.EXPO_PUBLIC_ENABLE_NOTIFICATIONS !== 'false',
      enableOfflineMode:
        process.env.EXPO_PUBLIC_ENABLE_OFFLINE_MODE !== 'false',
      enableCertificatePinning:
        process.env.EXPO_PUBLIC_CERTIFICATE_PINNING === 'true' && isProduction,
      enablePerformanceMonitoring:
        process.env.EXPO_PUBLIC_PERFORMANCE_MONITORING === 'true' ||
        isProduction,

      // Security Settings
      encryptStorage: process.env.EXPO_PUBLIC_ENCRYPT_STORAGE !== 'false',
      biometricTimeout: parseInt(
        process.env.EXPO_PUBLIC_BIOMETRIC_TIMEOUT || '30',
        10
      ),

      // Rate Limiting
      rateLimitMax: parseInt(
        process.env.EXPO_PUBLIC_RATE_LIMIT_MAX || '100',
        10
      ),
      rateLimitWindow: parseInt(
        process.env.EXPO_PUBLIC_RATE_LIMIT_WINDOW || '15',
        10
      ),

      // Cache Settings
      cacheSizeLimit: parseInt(process.env.CACHE_SIZE_LIMIT || '50000000', 10), // 50MB
      cacheTTLDefault: parseInt(process.env.CACHE_TTL_DEFAULT || '300000', 10), // 5 minutes
      offlineStorageLimit: parseInt(
        process.env.OFFLINE_STORAGE_LIMIT || '100000000',
        10
      ), // 100MB

      // Build Information
      buildNumber: process.env.EXPO_PUBLIC_BUILD_NUMBER || '1',
      versionCode: process.env.EXPO_PUBLIC_VERSION_CODE || '1',
      appVariant,

      // Third-party Services
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      amplitudeApiKey: this.getAmplitudeKey(appVariant),
      oneSignalAppId: process.env.ONE_SIGNAL_APP_ID,

      // URLs
      privacyPolicyUrl:
        process.env.PRIVACY_POLICY_URL || 'https://drouple.com/privacy',
      termsOfServiceUrl:
        process.env.TERMS_OF_SERVICE_URL || 'https://drouple.com/terms',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@drouple.com',
      helpCenterUrl: process.env.HELP_CENTER_URL || 'https://help.drouple.com',
      feedbackUrl: process.env.FEEDBACK_URL || 'https://feedback.drouple.com',

      // Content Delivery
      cdnBaseUrl: process.env.CDN_BASE_URL || 'https://cdn.drouple.com',
      assetsBaseUrl:
        process.env.ASSETS_BASE_URL || 'https://assets.drouple.com',
      mediaBaseUrl: process.env.MEDIA_BASE_URL || 'https://media.drouple.com',
    };
  }

  private getApiUrl(variant: string): string {
    switch (variant) {
      case 'development':
        return (
          process.env.EXPO_PUBLIC_API_URL_DEV || 'https://api-dev.drouple.com'
        );
      case 'staging':
        return (
          process.env.EXPO_PUBLIC_API_URL_STAGING ||
          'https://api-staging.drouple.com'
        );
      case 'production':
        return (
          process.env.EXPO_PUBLIC_API_URL_PROD || 'https://api.drouple.com'
        );
      default:
        return process.env.EXPO_PUBLIC_API_URL || 'https://api-dev.drouple.com';
    }
  }

  private getAmplitudeKey(variant: string): string | undefined {
    switch (variant) {
      case 'development':
        return process.env.AMPLITUDE_API_KEY_DEV;
      case 'staging':
        return process.env.AMPLITUDE_API_KEY_STAGING;
      case 'production':
        return process.env.AMPLITUDE_API_KEY_PROD;
      default:
        return process.env.AMPLITUDE_API_KEY;
    }
  }

  /**
   * Get current environment configuration
   */
  getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(feature: keyof EnvironmentConfig): boolean {
    const value = this.config[feature];
    return typeof value === 'boolean' ? value : false;
  }

  /**
   * Get API configuration
   */
  getApiConfig() {
    return {
      baseURL: this.config.apiUrl,
      timeout: this.config.apiTimeout,
      retries: this.config.apiRetries,
      enableCaching: this.config.enableOfflineMode,
      enableOffline: this.config.enableOfflineMode,
      enableCertificatePinning: this.config.enableCertificatePinning,
      enableAnalytics: this.config.enableAnalytics,
      rateLimitConfig: {
        maxRequests: this.config.rateLimitMax,
        windowMs: this.config.rateLimitWindow * 60 * 1000,
      },
    };
  }

  /**
   * Get security configuration
   */
  getSecurityConfig() {
    return {
      encryptStorage: this.config.encryptStorage,
      enableBiometrics: this.config.enableBiometrics,
      biometricTimeout: this.config.biometricTimeout,
      enableCertificatePinning: this.config.enableCertificatePinning,
    };
  }

  /**
   * Get analytics configuration
   */
  getAnalyticsConfig() {
    return {
      enabled: this.config.enableAnalytics,
      crashReporting: this.config.enableCrashReporting,
      sentryDsn: this.config.sentryDsn,
      amplitudeApiKey: this.config.amplitudeApiKey,
    };
  }

  /**
   * Get cache configuration
   */
  getCacheConfig() {
    return {
      sizeLimit: this.config.cacheSizeLimit,
      ttlDefault: this.config.cacheTTLDefault,
      offlineStorageLimit: this.config.offlineStorageLimit,
    };
  }

  /**
   * Check if app is in development mode
   */
  isDevelopment(): boolean {
    return this.config.isDevelopment;
  }

  /**
   * Check if app is in production mode
   */
  isProduction(): boolean {
    return this.config.isProduction;
  }

  /**
   * Check if app is in staging mode
   */
  isStaging(): boolean {
    return this.config.isStaging;
  }

  /**
   * Get build information
   */
  getBuildInfo() {
    return {
      buildNumber: this.config.buildNumber,
      versionCode: this.config.versionCode,
      appVariant: this.config.appVariant,
    };
  }

  /**
   * Log current configuration (for debugging)
   */
  logConfiguration(): void {
    if (this.config.isDevelopment) {
      console.log('Environment Configuration:', {
        variant: this.config.appVariant,
        apiUrl: this.config.apiUrl,
        enableMockApis: this.config.enableMockApis,
        enableAnalytics: this.config.enableAnalytics,
        enableCrashReporting: this.config.enableCrashReporting,
        buildNumber: this.config.buildNumber,
      });
    }
  }

  /**
   * Validate configuration
   */
  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required configurations
    if (!this.config.apiUrl) {
      errors.push('API URL is required');
    }

    if (!this.config.buildNumber) {
      errors.push('Build number is required');
    }

    // Production-specific validations
    if (this.config.isProduction) {
      if (!this.config.sentryDsn) {
        errors.push('Sentry DSN is required for production');
      }

      if (this.config.enableMockApis) {
        errors.push('Mock APIs should be disabled in production');
      }
    }

    // API URL validation
    try {
      new URL(this.config.apiUrl);
    } catch {
      errors.push('Invalid API URL format');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Override configuration (for testing)
   */
  overrideConfig(overrides: Partial<EnvironmentConfig>): void {
    if (this.config.isDevelopment) {
      this.config = { ...this.config, ...overrides };
    }
  }

  /**
   * Reset configuration to defaults
   */
  resetConfiguration(): void {
    if (this.config.isDevelopment) {
      this.config = this.loadConfiguration();
    }
  }
}

// Create and export singleton instance
export const environmentManager = EnvironmentManager.getInstance();

// Export convenience functions
export const config = environmentManager.getConfig();
export const isDevelopment = () => environmentManager.isDevelopment();
export const isProduction = () => environmentManager.isProduction();
export const isStaging = () => environmentManager.isStaging();
export const isFeatureEnabled = (feature: keyof EnvironmentConfig) =>
  environmentManager.isFeatureEnabled(feature);

// Initialize and validate configuration on app start
if (isDevelopment()) {
  const validation = environmentManager.validateConfiguration();
  if (!validation.valid) {
    console.warn('Configuration validation failed:', validation.errors);
  }
  environmentManager.logConfiguration();
}
