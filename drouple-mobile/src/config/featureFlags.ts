/**
 * Feature Flags Configuration
 * Controls which features are enabled/disabled in the app
 */

export interface FeatureFlags {
  // Authentication features
  biometricAuth: boolean;
  socialLogin: boolean;

  // Core features
  checkinSystem: boolean;
  qrCodeScanning: boolean;
  offlineMode: boolean;

  // Events features
  eventRsvp: boolean;
  eventWaitlist: boolean;
  eventCalendarSync: boolean;

  // Pathways features
  discipleshipPathways: boolean;
  progressTracking: boolean;
  milestoneNotifications: boolean;

  // Life Groups features
  lifeGroups: boolean;
  groupMessaging: boolean;
  attendanceTracking: boolean;

  // Directory features
  memberDirectory: boolean;
  memberContact: boolean;
  profileImages: boolean;

  // Notification features
  pushNotifications: boolean;
  realTimeUpdates: boolean;
  customNotificationSounds: boolean;

  // Reports features (Admin+)
  reportsAndAnalytics: boolean;
  exportFeatures: boolean;
  realTimeDashboard: boolean;

  // Advanced features
  darkMode: boolean;
  accessibility: boolean;
  multiLanguage: boolean;

  // Experimental features
  voiceCommands: boolean;
  arFeatures: boolean;
  wearableIntegration: boolean;

  // Debug features
  debugMode: boolean;
  performanceMetrics: boolean;
  errorReporting: boolean;
}

// Feature flags configuration
export const featureFlags: FeatureFlags = {
  // Authentication features
  biometricAuth: true,
  socialLogin: false, // TODO: Enable after social auth implementation

  // Core features
  checkinSystem: true,
  qrCodeScanning: true,
  offlineMode: true,

  // Events features
  eventRsvp: true,
  eventWaitlist: true,
  eventCalendarSync: false, // TODO: Enable after calendar integration

  // Pathways features
  discipleshipPathways: true,
  progressTracking: true,
  milestoneNotifications: true,

  // Life Groups features
  lifeGroups: true,
  groupMessaging: false, // TODO: Enable in Phase 2
  attendanceTracking: true,

  // Directory features
  memberDirectory: true,
  memberContact: true,
  profileImages: true,

  // Notification features
  pushNotifications: true,
  realTimeUpdates: true,
  customNotificationSounds: false, // TODO: Enable after sound assets

  // Reports features (Admin+)
  reportsAndAnalytics: true,
  exportFeatures: true,
  realTimeDashboard: true,

  // Advanced features
  darkMode: false, // TODO: Enable after theme implementation
  accessibility: true,
  multiLanguage: false, // TODO: Enable in Phase 3

  // Experimental features
  voiceCommands: false, // Future feature
  arFeatures: false, // Future feature
  wearableIntegration: false, // Future feature

  // Debug features
  debugMode: __DEV__,
  performanceMetrics: __DEV__,
  errorReporting: true,
};

// Helper functions
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return featureFlags[feature];
};

export const getEnabledFeatures = (): Array<keyof FeatureFlags> => {
  return Object.entries(featureFlags)
    .filter(([, enabled]) => enabled)
    .map(([feature]) => feature as keyof FeatureFlags);
};

export const getDisabledFeatures = (): Array<keyof FeatureFlags> => {
  return Object.entries(featureFlags)
    .filter(([, enabled]) => !enabled)
    .map(([feature]) => feature as keyof FeatureFlags);
};

// Environment-specific overrides
export const getFeatureFlagsForEnvironment = (
  env: 'development' | 'staging' | 'production'
): Partial<FeatureFlags> => {
  switch (env) {
    case 'development':
      return {
        debugMode: true,
        performanceMetrics: true,
        errorReporting: true,
      };
    case 'staging':
      return {
        debugMode: false,
        performanceMetrics: true,
        errorReporting: true,
      };
    case 'production':
      return {
        debugMode: false,
        performanceMetrics: false,
        errorReporting: true,
      };
    default:
      return {};
  }
};

export default featureFlags;
