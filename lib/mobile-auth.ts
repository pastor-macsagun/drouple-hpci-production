/**
 * Mobile Authentication Helpers
 * Higher-level authentication utilities for mobile API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createTenantWhereClause } from '@/lib/rbac';
import type { 
  ApiResponse, 
  ErrorCodes, 
  MobileUser,
  UserRole,
  JWTPayload as MobileJWTPayload 
} from '@drouple/contracts';
import { 
  requireMobileUser, 
  requireMobileRole, 
  getCurrentMobileUser,
  hasMinRole 
} from './mobile-jwt';

/**
 * Create standardized mobile API response
 */
export function createMobileResponse<T>(
  data: T,
  status: number = 200,
  requestId?: string
): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    ...(requestId && { requestId }),
  };

  return NextResponse.json(response, { status });
}

/**
 * Create standardized mobile API error response
 */
export function createMobileErrorResponse(
  code: keyof typeof ErrorCodes,
  message: string,
  status: number = 400,
  details?: Record<string, unknown>,
  requestId?: string
): NextResponse {
  const response: ApiResponse<never> = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    timestamp: new Date().toISOString(),
    ...(requestId && { requestId }),
  };

  return NextResponse.json(response, { status });
}

/**
 * Mobile auth middleware - validates JWT and returns user
 */
export async function withMobileAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: MobileJWTPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const user = await requireMobileUser(request);
    return await handler(request, user);
  } catch (error) {
    return createMobileErrorResponse(
      'UNAUTHORIZED',
      error instanceof Error ? error.message : 'Authentication required',
      401
    );
  }
}

/**
 * Mobile role-based auth middleware
 */
export async function withMobileRole(
  request: NextRequest,
  minRole: UserRole,
  handler: (request: NextRequest, user: MobileJWTPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const user = await requireMobileRole(request, minRole);
    return await handler(request, user);
  } catch (error) {
    const status = error instanceof Error && error.message.includes('Authentication') ? 401 : 403;
    const code = status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN';
    
    return createMobileErrorResponse(
      code,
      error instanceof Error ? error.message : 'Access denied',
      status
    );
  }
}

/**
 * Get mobile user with database lookup
 */
export async function getMobileUserFromDB(userId: string): Promise<MobileUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      roles: true,
      tenantId: true,
      isActive: true,
      profileImage: true,
      createdAt: true,
      updatedAt: true,
      membership: {
        select: {
          church: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      },
      // Mobile preferences would be in a separate table or user_preferences JSON field
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: user.roles as UserRole[],
    tenantId: user.tenantId,
    churchId: user.membership?.church?.id || '',
    isActive: user.isActive,
    profileImage: user.profileImage,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    preferences: {
      notificationsEnabled: true, // Default values, would come from user preferences
      biometricEnabled: false,
      theme: 'system' as const,
      language: 'en',
    },
  };
}

/**
 * Validate tenant access for mobile user
 */
export function validateTenantAccess(
  user: MobileJWTPayload,
  resourceTenantId: string
): boolean {
  // Super admins can access any tenant
  if (user.roles.includes('SUPER_ADMIN')) {
    return true;
  }

  // Other users must match tenant
  return user.tenantId === resourceTenantId;
}

/**
 * Create tenant-aware where clause for mobile queries
 */
export function createMobileTenantWhere(user: MobileJWTPayload) {
  return createTenantWhereClause(user.tenantId, user.roles);
}

/**
 * Require tenant access (throws if user can't access tenant)
 */
export function requireTenantAccess(
  user: MobileJWTPayload,
  resourceTenantId: string
): void {
  if (!validateTenantAccess(user, resourceTenantId)) {
    throw new Error('Tenant access denied');
  }
}

/**
 * Get accessible church IDs for mobile user
 */
export function getAccessibleChurchIds(user: MobileJWTPayload): string[] {
  // Super admins can access all churches
  if (user.roles.includes('SUPER_ADMIN')) {
    return []; // Empty array means all churches (handled by query logic)
  }

  // Other users can only access their church
  return [user.churchId];
}

/**
 * Handle mobile API errors consistently
 */
export function handleMobileApiError(error: unknown): NextResponse {
  console.error('Mobile API Error:', error);

  if (error instanceof Error) {
    // Authentication/Authorization errors
    if (error.message.includes('Authentication') || error.message.includes('token')) {
      return createMobileErrorResponse('UNAUTHORIZED', error.message, 401);
    }
    
    if (error.message.includes('permissions') || error.message.includes('access')) {
      return createMobileErrorResponse('FORBIDDEN', error.message, 403);
    }
    
    if (error.message.includes('not found')) {
      return createMobileErrorResponse('NOT_FOUND', error.message, 404);
    }
    
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return createMobileErrorResponse('VALIDATION_ERROR', error.message, 400);
    }
  }

  // Generic server error
  return createMobileErrorResponse(
    'INTERNAL_ERROR',
    'An unexpected error occurred',
    500
  );
}