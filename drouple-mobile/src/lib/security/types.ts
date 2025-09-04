/**
 * Security Types & Interfaces
 * Comprehensive type definitions for security and privacy management
 */

export interface SecurityConfig {
  encryption: {
    algorithm: 'AES-256-GCM' | 'AES-128-GCM';
    keyDerivation: 'PBKDF2' | 'Argon2';
    iterations: number;
  };
  biometric: {
    enabled: boolean;
    fallbackToPassword: boolean;
    invalidationTimeout: number; // minutes
  };
  session: {
    timeout: number; // minutes
    maxConcurrentSessions: number;
    lockOnBackground: boolean;
  };
  api: {
    certificatePinning: boolean;
    requestTimeout: number; // milliseconds
    maxRetries: number;
    rateLimit: {
      maxRequests: number;
      timeWindow: number; // minutes
    };
  };
}

export interface PrivacySettings {
  dataCollection: {
    analytics: boolean;
    crashReporting: boolean;
    performanceMetrics: boolean;
    userBehavior: boolean;
  };
  dataRetention: {
    cacheExpiry: number; // days
    logRetention: number; // days
    offlineDataRetention: number; // days
  };
  permissions: {
    location: 'always' | 'whenInUse' | 'denied';
    camera: boolean;
    notifications: boolean;
    contacts: boolean;
  };
  sharing: {
    allowProfileVisibility: boolean;
    allowEventSharing: boolean;
    allowDirectoryListing: boolean;
  };
}

export interface ValidationRules {
  email: {
    required: boolean;
    pattern: RegExp;
    maxLength: number;
  };
  password: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxLength: number;
  };
  phone: {
    pattern: RegExp;
    required: boolean;
  };
  text: {
    maxLength: number;
    allowedCharacters: RegExp;
    sanitize: boolean;
  };
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometryType?: 'FaceID' | 'TouchID' | 'Fingerprint' | 'None';
}

export interface SecureStorageItem {
  key: string;
  value: string;
  encrypted: boolean;
  expiresAt?: Date;
}

export interface ApiSecurityHeaders {
  'Content-Type': string;
  Accept: string;
  Authorization: string;
  'X-Request-ID': string;
  'X-Client-Version': string;
  'X-Platform': string;
  'User-Agent': string;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: Date;
  event:
    | 'login'
    | 'logout'
    | 'failed_login'
    | 'biometric_auth'
    | 'data_access'
    | 'permission_denied'
    | 'session_timeout';
  userId?: string;
  deviceId: string;
  ipAddress?: string;
  userAgent: string;
  details: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface DataClassification {
  type: 'public' | 'internal' | 'confidential' | 'restricted';
  retention: number; // days
  encryptionRequired: boolean;
  auditRequired: boolean;
}

export interface PermissionRequest {
  permission: 'camera' | 'location' | 'notifications' | 'contacts';
  purpose: string;
  required: boolean;
  fallback?: string;
}
