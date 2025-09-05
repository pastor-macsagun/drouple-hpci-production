import Constants from 'expo-constants';

export const ENV = {
  API_BASE: process.env.EXPO_PUBLIC_API_BASE || Constants.expoConfig?.extra?.apiBase || 'http://localhost:3000',
  BUILD_ENV: (process.env.EXPO_PUBLIC_BUILD_ENV || 'dev') as 'dev' | 'beta' | 'prod',
  IS_DEV: process.env.EXPO_PUBLIC_BUILD_ENV === 'dev' || __DEV__,
  IS_BETA: process.env.EXPO_PUBLIC_BUILD_ENV === 'beta',
  IS_PROD: process.env.EXPO_PUBLIC_BUILD_ENV === 'prod',
} as const;

// Validation
if (!ENV.API_BASE) {
  throw new Error('EXPO_PUBLIC_API_BASE is required');
}

// Log environment info in dev
if (ENV.IS_DEV) {
  console.log('🌍 Environment Config:', {
    API_BASE: ENV.API_BASE,
    BUILD_ENV: ENV.BUILD_ENV,
    IS_DEV: ENV.IS_DEV,
  });
}