/**
 * Token verification utilities for mobile authentication
 */

import { verifyAccessToken, verifyRefreshToken } from './jwt';
import type { AccessTokenPayload, RefreshTokenPayload } from './jwt';

export interface TokenVerificationResult<T> {
  success: true;
  payload: T;
}

export interface TokenVerificationError {
  success: false;
  error: string;
}

export type VerificationResult<T> = TokenVerificationResult<T> | TokenVerificationError;

/**
 * Verify an access token and return payload or error
 */
export async function verifyAccessTokenSafe(
  token: string
): Promise<VerificationResult<AccessTokenPayload>> {
  try {
    const payload = await verifyAccessToken(token);
    return { success: true, payload };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token verification failed',
    };
  }
}

/**
 * Verify a refresh token and return payload or error
 */
export async function verifyRefreshTokenSafe(
  token: string
): Promise<VerificationResult<RefreshTokenPayload>> {
  try {
    const payload = await verifyRefreshToken(token);
    return { success: true, payload };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token verification failed',
    };
  }
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Verify authorization header and extract access token payload
 */
export async function verifyAuthHeader(
  authHeader: string | null
): Promise<VerificationResult<AccessTokenPayload>> {
  const token = extractBearerToken(authHeader);
  
  if (!token) {
    return { success: false, error: 'Missing or invalid Authorization header' };
  }
  
  return await verifyAccessTokenSafe(token);
}