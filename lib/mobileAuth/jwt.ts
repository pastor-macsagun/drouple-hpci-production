/**
 * JWT utilities for mobile authentication
 * Uses HS512 with MOBILE_JWT_SECRET for signing tokens
 */

import { SignJWT, jwtVerify } from 'jose';
import type { Role } from '@drouple/contracts';

// JWT payload interfaces
export interface AccessTokenPayload {
  sub: string;
  userId: string;
  roles: Role[];
  tenantId: string;
  localChurchId?: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  sub: string;
  rotationId: string;
  iat: number;
  exp: number;
}

// Get JWT secret from environment
const getJwtSecret = (): Uint8Array => {
  const secret = process.env.MOBILE_JWT_SECRET;
  if (!secret) {
    throw new Error('MOBILE_JWT_SECRET environment variable is required');
  }
  return new TextEncoder().encode(secret);
};

/**
 * Sign an access token with 15-minute expiration
 */
export async function signAccessToken(payload: {
  sub: string;
  userId: string;
  roles: Role[];
  tenantId: string;
  localChurchId?: string;
}): Promise<string> {
  const secret = getJwtSecret();
  const now = Math.floor(Date.now() / 1000);
  
  return await new SignJWT({
    sub: payload.sub,
    userId: payload.userId,
    roles: payload.roles,
    tenantId: payload.tenantId,
    localChurchId: payload.localChurchId,
  })
    .setProtectedHeader({ alg: 'HS512' })
    .setIssuedAt(now)
    .setExpirationTime(now + 15 * 60) // 15 minutes
    .setIssuer('drouple-mobile')
    .setAudience('drouple-mobile-app')
    .sign(secret);
}

/**
 * Sign a refresh token with 7-day expiration
 */
export async function signRefreshToken(payload: {
  sub: string;
  rotationId: string;
}): Promise<string> {
  const secret = getJwtSecret();
  const now = Math.floor(Date.now() / 1000);
  
  return await new SignJWT({
    sub: payload.sub,
    rotationId: payload.rotationId,
  })
    .setProtectedHeader({ alg: 'HS512' })
    .setIssuedAt(now)
    .setExpirationTime(now + 7 * 24 * 60 * 60) // 7 days
    .setIssuer('drouple-mobile')
    .setAudience('drouple-mobile-app')
    .sign(secret);
}

/**
 * Verify and decode an access token
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const secret = getJwtSecret();
  
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'drouple-mobile',
      audience: 'drouple-mobile-app',
    });
    
    return payload as AccessTokenPayload;
  } catch (error) {
    throw new Error('Invalid access token');
  }
}

/**
 * Verify and decode a refresh token
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const secret = getJwtSecret();
  
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'drouple-mobile',
      audience: 'drouple-mobile-app',
    });
    
    return payload as RefreshTokenPayload;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}