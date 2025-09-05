/// <reference types="expo/types" />

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_BASE: string;
    EXPO_PUBLIC_BUILD_ENV: 'dev' | 'beta' | 'prod';
  }
}