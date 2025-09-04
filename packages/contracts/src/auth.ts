/**
 * Authentication Types & Schemas for Mobile API
 * JWT-based authentication contracts
 */

import { z } from 'zod';

// User roles in hierarchy order (highest to lowest privilege)
export const UserRoleSchema = z.enum([
  'SUPER_ADMIN',
  'PASTOR', 
  'ADMIN',
  'LEADER',
  'VIP',
  'MEMBER'
]);

export type UserRole = z.infer<typeof UserRoleSchema>;

// Role hierarchy for permission checking
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 6,
  PASTOR: 5,
  ADMIN: 4,
  LEADER: 3,
  VIP: 2,
  MEMBER: 1,
} as const;

// User entity for mobile API
export const MobileUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  roles: z.array(UserRoleSchema),
  tenantId: z.string(),
  churchId: z.string(),
  isActive: z.boolean(),
  profileImage: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  
  // Mobile-specific fields
  preferences: z.object({
    notificationsEnabled: z.boolean(),
    biometricEnabled: z.boolean(),
    theme: z.enum(['light', 'dark', 'system']),
    language: z.string(),
  }).optional(),
});

export type MobileUser = z.infer<typeof MobileUserSchema>;

// JWT tokens
export const TokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.string(), // ISO string
  tokenType: z.literal('Bearer'),
});

export type Tokens = z.infer<typeof TokensSchema>;

// Login request/response
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  deviceInfo: z.object({
    deviceId: z.string(),
    deviceName: z.string(),
    platform: z.enum(['ios', 'android']),
    version: z.string(),
  }).optional(),
});

export const LoginResponseSchema = z.object({
  user: MobileUserSchema,
  tokens: TokensSchema,
  sessionId: z.string(),
  lastLoginAt: z.string(),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// Refresh token request/response
export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string(),
  deviceId: z.string().optional(),
});

export const RefreshTokenResponseSchema = z.object({
  tokens: TokensSchema,
  user: MobileUserSchema.optional(), // Include if user data changed
});

export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;

// JWT payload
export const JWTPayloadSchema = z.object({
  sub: z.string(), // user ID
  email: z.string().email(),
  roles: z.array(UserRoleSchema),
  tenantId: z.string(),
  churchId: z.string(),
  iat: z.number(),
  exp: z.number(),
  aud: z.literal('mobile'),
  iss: z.literal('drouple'),
});

export type JWTPayload = z.infer<typeof JWTPayloadSchema>;