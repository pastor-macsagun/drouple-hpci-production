/**
 * Refresh token rotation utilities for mobile authentication
 */

import { db } from '@/lib/db';
import { signRefreshToken, signAccessToken } from './jwt';
import type { Role } from '@drouple/contracts';
import { randomBytes } from 'crypto';

export interface TokenRotationResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

/**
 * Generate a unique rotation ID
 */
function generateRotationId(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create a new refresh token and store it in the database
 */
export async function createRefreshToken(userId: string): Promise<string> {
  const rotationId = generateRotationId();
  const jti = randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Store in database
  await db.mobileRefreshToken.create({
    data: {
      userId,
      jti,
      rotationId,
      expiresAt,
    },
  });

  // Generate JWT
  return await signRefreshToken({
    sub: userId,
    rotationId,
  });
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await db.mobileRefreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

/**
 * Revoke a specific refresh token by rotation ID
 */
export async function revokeToken(rotationId: string): Promise<void> {
  await db.mobileRefreshToken.updateMany({
    where: {
      rotationId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

/**
 * Check if a refresh token is valid (not revoked and not expired)
 */
export async function isTokenValid(rotationId: string): Promise<boolean> {
  const token = await db.mobileRefreshToken.findUnique({
    where: {
      rotationId,
    },
  });

  if (!token) {
    return false;
  }

  // Check if revoked
  if (token.revokedAt) {
    return false;
  }

  // Check if expired
  if (token.expiresAt < new Date()) {
    return false;
  }

  return true;
}

/**
 * Rotate a refresh token - revoke the old one and create a new pair
 */
export async function rotateRefreshToken(
  oldRotationId: string,
  userId: string
): Promise<TokenRotationResult> {
  try {
    // Verify token is still valid
    const isValid = await isTokenValid(oldRotationId);
    if (!isValid) {
      // Token is invalid or revoked - this might be suspicious
      // Revoke all tokens for this user as a security measure
      await revokeAllUserTokens(userId);
      return {
        success: false,
        error: 'Invalid or revoked refresh token',
      };
    }

    // Get user details for new access token
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: { believerStatus: 'ACTIVE' },
          include: {
            localChurch: true,
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Revoke the old token
    await revokeToken(oldRotationId);

    // Create new token pair
    const newRefreshToken = await createRefreshToken(userId);

    // Get primary church for access token
    const primaryMembership = user.memberships[0]; // Assume first active membership is primary
    const localChurchId = primaryMembership?.localChurch?.id;

    const newAccessToken = await signAccessToken({
      sub: userId,
      userId: userId,
      roles: [user.role] as Role[],
      tenantId: user.tenantId || '',
      localChurchId,
    });

    return {
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    console.error('Token rotation error:', error);
    return {
      success: false,
      error: 'Token rotation failed',
    };
  }
}

/**
 * Clean up expired tokens (should be run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await db.mobileRefreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { revokedAt: { not: null } },
      ],
    },
  });

  return result.count;
}