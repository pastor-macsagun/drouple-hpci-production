/**
 * Mobile API Request Context Utilities
 * Helpers for accessing authenticated user context in API routes
 */

import { NextRequest } from 'next/server';
import type { Role } from '@drouple/contracts';

export interface MobileRequestContext {
  userId: string;
  roles: Role[];
  tenantId: string;
  localChurchId?: string;
}

/**
 * Extract mobile context from request headers
 * Used by API routes to get authenticated user context
 */
export function getMobileContext(request: NextRequest): MobileRequestContext | null {
  const contextHeader = request.headers.get('x-mobile-context');
  if (!contextHeader) {
    return null;
  }

  try {
    return JSON.parse(contextHeader) as MobileRequestContext;
  } catch {
    return null;
  }
}

/**
 * Require mobile context or throw error
 * Use this in API routes that require authentication
 */
export function requireMobileContext(request: NextRequest): MobileRequestContext {
  const context = getMobileContext(request);
  if (!context) {
    throw new Error('Authentication required');
  }
  return context;
}

/**
 * Helper to check if user has required role
 */
export function hasRole(context: MobileRequestContext, requiredRole: Role): boolean {
  const roleHierarchy: Record<Role, number> = {
    'SUPER_ADMIN': 6,
    'PASTOR': 5,
    'ADMIN': 4,
    'LEADER': 3,
    'VIP': 2,
    'MEMBER': 1,
  };

  const userMaxRole = Math.max(...context.roles.map(role => roleHierarchy[role] || 0));
  const requiredLevel = roleHierarchy[requiredRole] || 0;
  
  return userMaxRole >= requiredLevel;
}

/**
 * Require specific role or throw error
 */
export function requireRole(context: MobileRequestContext, requiredRole: Role): void {
  if (!hasRole(context, requiredRole)) {
    throw new Error(`Insufficient permissions. ${requiredRole} role required.`);
  }
}

/**
 * Validate tenant access for multi-tenant operations
 */
export function validateTenantAccess(context: MobileRequestContext, resourceTenantId: string): boolean {
  return context.tenantId === resourceTenantId;
}

/**
 * Require tenant access or throw error
 */
export function requireTenantAccess(context: MobileRequestContext, resourceTenantId: string): void {
  if (!validateTenantAccess(context, resourceTenantId)) {
    throw new Error('Access denied: insufficient tenant permissions');
  }
}

/**
 * Check if user has access to specific local church
 */
export function hasChurchAccess(context: MobileRequestContext, targetChurchId: string): boolean {
  // Super admin and pastor have access to all churches in their tenant
  if (hasRole(context, 'PASTOR')) {
    return true;
  }
  
  // Other roles only have access to their assigned local church
  return context.localChurchId === targetChurchId;
}

/**
 * Require church access or throw error
 */
export function requireChurchAccess(context: MobileRequestContext, targetChurchId: string): void {
  if (!hasChurchAccess(context, targetChurchId)) {
    throw new Error('Access denied: insufficient church permissions');
  }
}