import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface MobileTokenClaims {
  sub: string; // user ID
  tenantId: string;
  roles: string[];
  iat: number;
  exp: number;
}

export interface TokenVerificationResult {
  success: boolean;
  user?: MobileTokenClaims;
  error?: string;
}

/**
 * Verify mobile JWT token from Authorization header
 */
export async function verifyMobileToken(request: NextRequest): Promise<TokenVerificationResult> {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Missing or invalid Authorization header',
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return {
        success: false,
        error: 'Missing access token',
      };
    }

    const jwtSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (!jwtSecret) {
      console.error('JWT secret not configured');
      return {
        success: false,
        error: 'Server configuration error',
      };
    }

    // Verify and decode the JWT
    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256'],
    }) as MobileTokenClaims;

    // Validate required claims
    if (!decoded.sub || !decoded.tenantId || !decoded.roles || !Array.isArray(decoded.roles)) {
      return {
        success: false,
        error: 'Invalid token claims',
      };
    }

    // Check if token is expired (jwt.verify already does this, but let's be explicit)
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return {
        success: false,
        error: 'Token expired',
      };
    }

    return {
      success: true,
      user: decoded,
    };

  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return {
        success: false,
        error: 'Invalid token',
      };
    }

    if (error instanceof jwt.TokenExpiredError) {
      return {
        success: false,
        error: 'Token expired',
      };
    }

    return {
      success: false,
      error: 'Token verification failed',
    };
  }
}

/**
 * Extract tenant ID from verified token
 */
export function getTenantFromToken(user: MobileTokenClaims): string {
  return user.tenantId;
}

/**
 * Check if user has required role
 */
export function hasRole(user: MobileTokenClaims, requiredRole: string): boolean {
  return user.roles.includes(requiredRole);
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(user: MobileTokenClaims, requiredRoles: string[]): boolean {
  return requiredRoles.some(role => user.roles.includes(role));
}