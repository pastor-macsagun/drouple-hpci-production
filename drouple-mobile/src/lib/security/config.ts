/**
 * Security Configuration
 * Default security settings and validation rules
 */

import type { SecurityConfig, PrivacySettings, ValidationRules } from './types';

/**
 * Default security configuration
 */
export const defaultSecurityConfig: SecurityConfig = {
  encryption: {
    algorithm: 'AES-256-GCM',
    keyDerivation: 'PBKDF2',
    iterations: 100000,
  },
  biometric: {
    enabled: true,
    fallbackToPassword: true,
    invalidationTimeout: 30, // 30 minutes
  },
  session: {
    timeout: 60, // 60 minutes
    maxConcurrentSessions: 3,
    lockOnBackground: true,
  },
  api: {
    certificatePinning: true,
    requestTimeout: 30000, // 30 seconds
    maxRetries: 3,
    rateLimit: {
      maxRequests: 100,
      timeWindow: 15, // 15 minutes
    },
  },
};

/**
 * Default privacy settings
 */
export const defaultPrivacySettings: PrivacySettings = {
  dataCollection: {
    analytics: false, // User must opt-in
    crashReporting: true, // Helps improve app stability
    performanceMetrics: true, // Helps optimize app performance
    userBehavior: false, // User must opt-in
  },
  dataRetention: {
    cacheExpiry: 7, // 7 days
    logRetention: 30, // 30 days
    offlineDataRetention: 14, // 14 days
  },
  permissions: {
    location: 'denied',
    camera: false,
    notifications: false,
    contacts: false,
  },
  sharing: {
    allowProfileVisibility: true,
    allowEventSharing: true,
    allowDirectoryListing: true,
  },
};

/**
 * Input validation rules
 */
export const validationRules: ValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 320, // RFC 5321 limit
  },
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxLength: 128,
  },
  phone: {
    pattern: /^[\d\s\-\(\)\+\.]{10,15}$/,
    required: false,
  },
  text: {
    maxLength: 1000,
    allowedCharacters: /^[a-zA-Z0-9\s\-\.,!?'"()&@#%]*$/,
    sanitize: true,
  },
};

/**
 * Security event severity mapping
 */
export const securityEventSeverity = {
  login: 'low',
  logout: 'low',
  failed_login: 'medium',
  biometric_auth: 'low',
  data_access: 'low',
  permission_denied: 'medium',
  session_timeout: 'low',
  rate_limit_exceeded: 'high',
  invalid_url_blocked: 'high',
  response_validation_failed: 'critical',
} as const;

/**
 * Trusted API domains for production
 */
export const trustedApiDomains = [
  'api.drouple.com',
  'staging-api.drouple.com',
  'dev-api.drouple.com',
];

/**
 * Critical API endpoints that require additional security
 */
export const criticalEndpoints = [
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
  '/auth/password/change',
  '/user/profile',
  '/user/delete',
  '/admin/',
  '/reports/',
  '/members/create',
  '/members/delete',
  '/services/create',
  '/services/delete',
];

/**
 * Content Security Policy for WebView components
 */
export const contentSecurityPolicy = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'connect-src': [
    "'self'",
    ...trustedApiDomains.map(domain => `https://${domain}`),
  ],
  'font-src': ["'self'"],
  'object-src': ["'none'"],
  'media-src': ["'self'"],
  'frame-src': ["'none'"],
};

/**
 * Security headers for API requests
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

/**
 * Data classification rules
 */
export const dataClassificationRules = {
  user_credentials: {
    type: 'restricted' as const,
    retention: 0, // Never store in plain text
    encryptionRequired: true,
    auditRequired: true,
  },
  user_profile: {
    type: 'confidential' as const,
    retention: 365,
    encryptionRequired: true,
    auditRequired: true,
  },
  session_data: {
    type: 'confidential' as const,
    retention: 30,
    encryptionRequired: true,
    auditRequired: false,
  },
  app_logs: {
    type: 'internal' as const,
    retention: 30,
    encryptionRequired: false,
    auditRequired: true,
  },
  analytics_data: {
    type: 'internal' as const,
    retention: 180,
    encryptionRequired: false,
    auditRequired: false,
  },
  cached_content: {
    type: 'public' as const,
    retention: 7,
    encryptionRequired: false,
    auditRequired: false,
  },
};

/**
 * Permission request contexts
 */
export const permissionContexts = {
  location: {
    checkin: {
      title: 'Location Access for Check-in',
      description:
        'We use your location to help you check in to services and events near you.',
      required: false,
      fallback: 'You can manually select your location when checking in.',
    },
    events: {
      title: 'Location Access for Events',
      description:
        'We use your location to show you events and services in your area.',
      required: false,
      fallback: 'You can browse all events without location access.',
    },
  },
  camera: {
    qr_scan: {
      title: 'Camera Access for QR Codes',
      description: 'We need camera access to scan QR codes for quick check-in.',
      required: true,
      fallback: 'You can enter check-in codes manually.',
    },
    profile_photo: {
      title: 'Camera Access for Photos',
      description:
        'We need camera access to take or update your profile photo.',
      required: false,
      fallback: 'You can skip adding a profile photo.',
    },
  },
  notifications: {
    reminders: {
      title: 'Notifications for Reminders',
      description:
        "We'll send you reminders about upcoming events and services.",
      required: false,
      fallback: 'You can check the app for updates manually.',
    },
    announcements: {
      title: 'Notifications for Announcements',
      description: "We'll notify you about important church announcements.",
      required: false,
      fallback: 'You can view announcements in the app.',
    },
  },
};

/**
 * Security best practices checklist
 */
export const securityChecklist = {
  authentication: [
    'Implement secure token storage',
    'Use biometric authentication when available',
    'Implement session timeout',
    'Handle token refresh gracefully',
  ],
  dataProtection: [
    'Encrypt sensitive data at rest',
    'Implement secure communication (HTTPS)',
    'Validate and sanitize all inputs',
    'Implement proper error handling',
  ],
  privacy: [
    'Request permissions with clear context',
    'Implement data retention policies',
    'Provide data export functionality',
    'Allow users to delete their data',
  ],
  monitoring: [
    'Log security events',
    'Monitor for suspicious activity',
    'Implement rate limiting',
    'Set up alerting for critical issues',
  ],
};
