const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_STAGING = process.env.APP_VARIANT === 'staging';
const IS_PROD = process.env.APP_VARIANT === 'production';

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return 'com.drouple.mobile.dev';
  }
  if (IS_STAGING) {
    return 'com.drouple.mobile.staging';
  }
  return 'com.drouple.mobile';
};

const getAppName = () => {
  if (IS_DEV) {
    return 'Drouple Mobile (Dev)';
  }
  if (IS_STAGING) {
    return 'Drouple Mobile (Staging)';
  }
  return 'Drouple Mobile';
};

const getApiUrl = () => {
  if (IS_DEV) {
    return process.env.EXPO_PUBLIC_API_URL_DEV || 'http://localhost:3000';
  }
  if (IS_STAGING) {
    return (
      process.env.EXPO_PUBLIC_API_URL_STAGING ||
      'https://drouple-hpci-staging.vercel.app'
    );
  }
  return process.env.EXPO_PUBLIC_API_URL_PROD || 'https://drouple-hpci-prod.vercel.app';
};

export default {
  expo: {
    name: getAppName(),
    slug: 'drouple-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    scheme: 'drouple',

    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#1e7ce8',
    },

    assetBundlePatterns: ['**/*'],

    ios: {
      supportsTablet: true,
      bundleIdentifier: getUniqueIdentifier(),
      buildNumber: process.env.IOS_BUILD_NUMBER || '1',
      infoPlist: {
        NSCameraUsageDescription:
          'This app uses the camera to scan QR codes for quick check-ins and event RSVPs.',
        NSMicrophoneUsageDescription:
          'This app may use the microphone for video recordings in events.',
        NSPhotoLibraryUsageDescription:
          'This app accesses your photo library to let you upload profile pictures and event photos.',
        NSLocationWhenInUseUsageDescription:
          'This app uses your location to help you find nearby church events and services.',
        CFBundleAllowMixedLocalizations: true,
        ITSAppUsesNonExemptEncryption: false,
      },
      associatedDomains: ['applinks:drouple.com', 'applinks:*.drouple.com'],
      config: {
        usesNonExemptEncryption: false,
      },
    },

    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#1e7ce8',
      },
      package: getUniqueIdentifier(),
      versionCode: parseInt(process.env.ANDROID_VERSION_CODE || '1', 10),
      permissions: [
        'CAMERA',
        'RECORD_AUDIO',
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'VIBRATE',
        'RECEIVE_BOOT_COMPLETED',
      ],
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: 'drouple.com',
            },
            {
              scheme: 'https',
              host: '*.drouple.com',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },

    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },

    plugins: [
      'expo-router',
      'expo-localization',
      [
        'expo-camera',
        {
          cameraPermission:
            'Allow $(PRODUCT_NAME) to access your camera to scan QR codes for quick check-ins.',
          microphonePermission:
            'Allow $(PRODUCT_NAME) to access your microphone for video recordings.',
          recordAudioAndroid: true,
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#1e7ce8',
          defaultChannel: 'default',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission:
            'The app accesses your photos to let you share them with your church community.',
          cameraPermission:
            'The app accesses your camera to let you take photos for your profile and events.',
        },
      ],
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Allow $(PRODUCT_NAME) to use your location to find nearby church events and services.',
        },
      ],
      [
        'expo-secure-store',
        {
          faceIDPermission:
            'Allow $(PRODUCT_NAME) to use Face ID to authenticate you securely.',
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
    },

    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: process.env.EXPO_PROJECT_ID || 'your-project-id',
      },
      // API Configuration
      apiUrl: getApiUrl(),
      apiTimeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000', 10),
      apiRetries: parseInt(process.env.EXPO_PUBLIC_API_RETRIES || '3', 10),
      enforceHttps: !IS_DEV,
      
      // Environment
      environment: process.env.APP_VARIANT || 'development',
      buildNumber: process.env.EXPO_PUBLIC_BUILD_NUMBER || '1',
      
      // Feature Flags  
      enableMockApis: process.env.EXPO_PUBLIC_ENABLE_MOCK_APIS === 'true',
      enableAnalytics: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
      enableCrashReporting: process.env.EXPO_PUBLIC_ENABLE_CRASH_REPORTING === 'true',
      enableBiometrics: process.env.EXPO_PUBLIC_ENABLE_BIOMETRICS === 'true',
      enableNotifications: process.env.EXPO_PUBLIC_ENABLE_NOTIFICATIONS === 'true',
      enablePerformanceMonitoring: process.env.EXPO_PUBLIC_PERFORMANCE_MONITORING === 'true',
      enableOfflineMode: process.env.FEATURE_OFFLINE_MODE === 'true',
      enableRealtimeSync: process.env.FEATURE_REALTIME_SYNC !== 'false',
      
      // Security Configuration
      certificatePinning: process.env.EXPO_PUBLIC_CERTIFICATE_PINNING === 'true',
      encryptStorage: process.env.EXPO_PUBLIC_ENCRYPT_STORAGE !== 'false',
      biometricTimeout: parseInt(process.env.EXPO_PUBLIC_BIOMETRIC_TIMEOUT || '30000', 10),
      
      // Rate Limiting
      rateLimitMax: parseInt(process.env.EXPO_PUBLIC_RATE_LIMIT_MAX || '100', 10),
      rateLimitWindow: parseInt(process.env.EXPO_PUBLIC_RATE_LIMIT_WINDOW || '15', 10) * 60 * 1000,
      
      // Cache Configuration
      cacheSizeLimit: parseInt(process.env.CACHE_SIZE_LIMIT || '50000000', 10),
      cacheTtlDefault: parseInt(process.env.CACHE_TTL_DEFAULT || '300000', 10),
      offlineStorageLimit: parseInt(process.env.OFFLINE_STORAGE_LIMIT || '100000000', 10),
      
      // Third-party Services
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      amplitudeApiKey: process.env.AMPLITUDE_API_KEY,
      mixpanelToken: process.env.MIXPANEL_TOKEN,
      oneSignalAppId: process.env.ONE_SIGNAL_APP_ID,
      
      // Deep Linking
      deepLinkScheme: process.env.DEEP_LINK_SCHEME || 'drouple',
      universalLinkDomain: process.env.UNIVERSAL_LINK_DOMAIN || 'drouple.com',
      
      // Legal & Support
      privacyPolicyUrl: process.env.PRIVACY_POLICY_URL || 'https://drouple.com/privacy',
      termsOfServiceUrl: process.env.TERMS_OF_SERVICE_URL || 'https://drouple.com/terms', 
      supportEmail: process.env.SUPPORT_EMAIL || 'support@drouple.com',
    },

    updates: {
      url: `https://u.expo.dev/${process.env.EXPO_PROJECT_ID || 'your-project-id'}`,
      enabled: false, // Disabled for development
      checkAutomatically: 'ON_LOAD',
      fallbackToCacheTimeout: 1000,
    },

    runtimeVersion: {
      policy: 'sdkVersion',
    },

    owner: process.env.EXPO_OWNER || 'drouple',
  },
};
