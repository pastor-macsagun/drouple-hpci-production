/**
 * API Contract Types
 * TODO: Update interfaces after backend API specification is finalized
 * These should match the Drouple web platform API responses
 */

import type { User, AuthTokens, UserRole } from '@/types/auth';

// Base API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

// Authentication API contracts
export interface LoginRequest {
  email: string;
  password: string;
  // TODO: Add device info for mobile tracking
  deviceInfo?: {
    deviceId: string;
    deviceName: string;
    platform: 'ios' | 'android' | 'web';
    version: string;
  };
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: string; // ISO string, converted to timestamp
  // TODO: Add session info
  sessionId?: string;
  lastLoginAt?: string;
}

// NextAuth.js uses sessions instead of refresh tokens
export interface SessionRequest {
  // No parameters needed - session is handled via cookies
  deviceId?: string;
}

export interface SessionResponse {
  user: User;
  expires: string;
  // NextAuth.js session data
  accessToken?: string;
  sessionId?: string;
}

// Legacy refresh token interfaces (for compatibility)
export interface RefreshTokenRequest {
  refreshToken: string;
  deviceId?: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user?: User;
}

// User profile API contracts
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  // TODO: Add mobile preferences
  preferences?: {
    biometricEnabled?: boolean;
    notificationsEnabled?: boolean;
    darkMode?: boolean;
    language?: string;
  };
}

export interface UpdateProfileResponse {
  user: User;
  // TODO: Add update metadata
  updatedFields?: string[];
  updatedAt: string;
}

// Role checking API contracts
export interface RoleCheckRequest {
  userId: string;
  // TODO: Add context for role-based checks
  context?: {
    churchId?: string;
    resource?: string;
    action?: string;
  };
}

export interface RoleCheckResponse {
  roles: UserRole[];
  permissions: string[];
  // TODO: Add role metadata
  hierarchy: number;
  canAccess: boolean;
  restrictions?: string[];
}

// Biometric API contracts (if backend validation needed)
export interface BiometricSetupRequest {
  userId: string;
  enabled: boolean;
  // TODO: Add biometric type and device info
  biometricType: string;
  deviceId: string;
}

export interface BiometricSetupResponse {
  success: boolean;
  // TODO: Add setup metadata
  setupAt: string;
  backupRequired?: boolean;
}

// Session management API contracts
export interface LogoutRequest {
  refreshToken: string;
  // TODO: Add device info for specific logout
  deviceId?: string;
  logoutAllDevices?: boolean;
}

export interface LogoutResponse {
  success: boolean;
  // TODO: Add logout metadata
  loggedOutAt: string;
  devicesLoggedOut?: number;
}

// Password reset API contracts (future)
export interface ForgotPasswordRequest {
  email: string;
  // TODO: Add mobile-specific reset flow
  resetType?: 'email' | 'sms';
  returnUrl?: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  // TODO: Add reset metadata
  resetToken?: string;
  expiresAt?: string;
}

export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
  // TODO: Add password strength validation
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  // TODO: Add new session info
  requiresLogin?: boolean;
}

// Error response format
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  // TODO: Add error tracking
  traceId?: string;
  retryAfter?: number;
}

// Pagination for list endpoints (future use)
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Generic list query parameters
export interface ListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  // TODO: Add filtering
  filters?: Record<string, unknown>;
}

// Note: These are type-only exports, not value exports
// Use named exports above for actual types
