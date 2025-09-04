/**
 * Authentication Types
 * Based on Drouple web platform RBAC system
 */

// User roles in hierarchy order (highest to lowest privilege)
export type UserRole =
  | 'SUPER_ADMIN' // System-wide access
  | 'PASTOR' // Church leadership
  | 'ADMIN' // Church administrator
  | 'LEADER' // Ministry leader
  | 'VIP' // First-timer team
  | 'MEMBER'; // Regular member

// User entity
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[]; // Multiple roles possible
  tenantId: string; // Multi-tenant isolation
  churchId: string;
  isActive: boolean;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;

  // Mobile-specific preferences
  preferences?: {
    biometricEnabled: boolean;
    notificationsEnabled: boolean;
    darkMode: boolean;
    language: string;
  };
}

// JWT tokens
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
  tokenType: 'Bearer';
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Login request (API contract)
export interface LoginRequest {
  email: string;
  password: string;
  deviceInfo?: {
    deviceId: string;
    deviceName: string;
    platform: 'ios' | 'android' | 'web';
    version: string;
  };
}

// Auth state for store
export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Mobile-specific auth states
  biometricSupported: boolean;
  biometricEnabled: boolean;
  hasCompletedOnboarding: boolean;
}

// Biometric authentication
export interface BiometricConfig {
  isSupported: boolean;
  isEnrolled: boolean;
  availableTypes: BiometricType[];
}

export enum BiometricType {
  FACE_ID = 'FACE_ID',
  TOUCH_ID = 'TOUCH_ID',
  FINGERPRINT = 'FINGERPRINT',
  IRIS = 'IRIS',
}

// Auth errors
export const AuthErrorCode = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  REFRESH_FAILED: 'REFRESH_FAILED',
  BIOMETRIC_NOT_AVAILABLE: 'BIOMETRIC_NOT_AVAILABLE',
  BIOMETRIC_FAILED: 'BIOMETRIC_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type AuthErrorCode = (typeof AuthErrorCode)[keyof typeof AuthErrorCode];

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

// Role hierarchy for permission checking
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 6,
  PASTOR: 5,
  ADMIN: 4,
  LEADER: 3,
  VIP: 2,
  MEMBER: 1,
} as const;

// Role permissions helper
export interface RolePermissions {
  canManageUsers: boolean;
  canViewReports: boolean;
  canManageEvents: boolean;
  canManageGroups: boolean;
  canViewDirectory: boolean;
  canAccessAdmin: boolean;
}

// Note: These are type-only exports, not value exports
// Use named exports above for actual types and constants
