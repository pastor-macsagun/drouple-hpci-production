/**
 * Sentry Integration for HPCI-ChMS
 * 
 * This module provides utility functions to integrate Sentry monitoring
 * with HPCI-ChMS specific patterns like multi-tenancy, RBAC, and user context.
 */

import * as Sentry from '@sentry/nextjs';
import type { UserRole } from '@prisma/client';
import type { Session } from 'next-auth';

export type HPCIUser = {
  id: string;
  email?: string;
  name?: string;
  role: UserRole;
  tenantId?: string;
};

export type ActionContext = {
  action: string;
  resource?: string;
  userId?: string;
  tenantId?: string;
  userRole?: UserRole;
  extra?: Record<string, unknown>;
};

/**
 * Set user context for all subsequent Sentry events
 */
export function setSentryUser(user: HPCIUser | Session['user'] | null) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email || undefined,
    username: user.name || undefined,
  });

  // Set additional context as tags
  Sentry.setTag('user_role', user.role);
  if (user.tenantId) {
    Sentry.setTag('tenant_id', user.tenantId);
  }
}

/**
 * Capture errors with HPCI-ChMS context
 */
export function captureHPCIError(
  error: Error,
  context?: ActionContext
) {
  Sentry.withScope((scope) => {
    // Set application context
    scope.setTag('application', 'hpci-chms');
    scope.setTag('error_type', 'application_error');
    
    if (context) {
      // Set action context
      if (context.action) {
        scope.setTag('action', context.action);
      }
      
      if (context.resource) {
        scope.setTag('resource', context.resource);
      }
      
      if (context.userRole) {
        scope.setTag('user_role', context.userRole);
      }
      
      if (context.tenantId) {
        scope.setTag('tenant_id', context.tenantId);
      }
      
      if (context.userId) {
        scope.setUser({ id: context.userId });
      }
      
      // Add extra context
      if (context.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
    }
    
    scope.setLevel('error');
    Sentry.captureException(error);
  });
}

/**
 * Capture business logic warnings/events
 */
export function captureHPCIEvent(
  message: string,
  level: 'info' | 'warning' | 'error',
  context?: ActionContext
) {
  Sentry.withScope((scope) => {
    scope.setTag('application', 'hpci-chms');
    scope.setTag('event_type', 'business_event');
    
    if (context) {
      if (context.action) {
        scope.setTag('action', context.action);
      }
      
      if (context.resource) {
        scope.setTag('resource', context.resource);
      }
      
      if (context.userRole) {
        scope.setTag('user_role', context.userRole);
      }
      
      if (context.tenantId) {
        scope.setTag('tenant_id', context.tenantId);
      }
      
      if (context.userId) {
        scope.setUser({ id: context.userId });
      }
      
      if (context.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
    }
    
    scope.setLevel(level);
    Sentry.captureMessage(message);
  });
}

/**
 * Capture authentication events
 */
export function captureAuthEvent(
  event: 'login_success' | 'login_failure' | 'logout' | 'rate_limit',
  context: {
    email?: string;
    userId?: string;
    tenantId?: string;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }
) {
  Sentry.withScope((scope) => {
    scope.setTag('application', 'hpci-chms');
    scope.setTag('event_type', 'authentication');
    scope.setTag('auth_event', event);
    
    if (context.email) {
      scope.setTag('user_email', context.email);
    }
    
    if (context.userId) {
      scope.setUser({ id: context.userId });
    }
    
    if (context.tenantId) {
      scope.setTag('tenant_id', context.tenantId);
    }
    
    if (context.ipAddress) {
      scope.setExtra('ip_address', context.ipAddress);
    }
    
    if (context.userAgent) {
      scope.setExtra('user_agent', context.userAgent);
    }
    
    if (context.reason) {
      scope.setExtra('failure_reason', context.reason);
    }
    
    scope.setLevel(event === 'login_failure' || event === 'rate_limit' ? 'warning' : 'info');
    Sentry.captureMessage(`Authentication event: ${event}`);
  });
}

/**
 * Capture database operation performance issues
 */
export function captureDBPerformance(
  operation: string,
  duration: number,
  context?: {
    query?: string;
    table?: string;
    tenantId?: string;
    userId?: string;
    recordCount?: number;
  }
) {
  // Only capture if operation is slow (> 1 second)
  if (duration > 1000) {
    Sentry.withScope((scope) => {
      scope.setTag('application', 'hpci-chms');
      scope.setTag('performance_issue', 'slow_database_operation');
      scope.setTag('db_operation', operation);
      
      scope.setExtra('duration_ms', duration);
      scope.setExtra('threshold_ms', 1000);
      
      if (context) {
        if (context.table) {
          scope.setTag('db_table', context.table);
        }
        
        if (context.tenantId) {
          scope.setTag('tenant_id', context.tenantId);
        }
        
        if (context.userId) {
          scope.setUser({ id: context.userId });
        }
        
        if (context.recordCount) {
          scope.setExtra('record_count', context.recordCount);
        }
        
        if (context.query) {
          // Only include first 500 chars of query for privacy
          scope.setExtra('db_query_preview', context.query.substring(0, 500));
        }
      }
      
      scope.setLevel('warning');
      Sentry.captureMessage(`Slow database operation: ${operation} took ${duration}ms`);
    });
  }
}

/**
 * Capture multi-tenant isolation violations
 */
export function captureTenantViolation(
  message: string,
  context: {
    userId: string;
    userTenantId: string;
    attemptedTenantId: string;
    resource: string;
    action: string;
  }
) {
  Sentry.withScope((scope) => {
    scope.setTag('application', 'hpci-chms');
    scope.setTag('security_issue', 'tenant_isolation_violation');
    scope.setTag('violation_type', 'cross_tenant_access');
    
    scope.setUser({ id: context.userId });
    scope.setTag('user_tenant', context.userTenantId);
    scope.setTag('attempted_tenant', context.attemptedTenantId);
    scope.setTag('resource', context.resource);
    scope.setTag('action', context.action);
    
    scope.setLevel('error');
    Sentry.captureMessage(`Tenant isolation violation: ${message}`);
  });
}

/**
 * Capture RBAC authorization failures
 */
export function captureRBACViolation(
  message: string,
  context: {
    userId: string;
    userRole: UserRole;
    requiredRole: UserRole;
    resource: string;
    action: string;
    tenantId?: string;
  }
) {
  Sentry.withScope((scope) => {
    scope.setTag('application', 'hpci-chms');
    scope.setTag('security_issue', 'rbac_violation');
    scope.setTag('violation_type', 'insufficient_permissions');
    
    scope.setUser({ id: context.userId });
    scope.setTag('user_role', context.userRole);
    scope.setTag('required_role', context.requiredRole);
    scope.setTag('resource', context.resource);
    scope.setTag('action', context.action);
    
    if (context.tenantId) {
      scope.setTag('tenant_id', context.tenantId);
    }
    
    scope.setLevel('warning');
    Sentry.captureMessage(`RBAC violation: ${message}`);
  });
}

/**
 * Capture API rate limiting events
 */
export function captureRateLimit(
  endpoint: string,
  context: {
    userId?: string;
    ipAddress: string;
    limit: number;
    window: number;
    attempts: number;
  }
) {
  Sentry.withScope((scope) => {
    scope.setTag('application', 'hpci-chms');
    scope.setTag('rate_limit', 'exceeded');
    scope.setTag('endpoint', endpoint);
    
    scope.setExtra('ip_address', context.ipAddress);
    scope.setExtra('rate_limit', context.limit);
    scope.setExtra('time_window', context.window);
    scope.setExtra('attempts', context.attempts);
    
    if (context.userId) {
      scope.setUser({ id: context.userId });
    }
    
    scope.setLevel('warning');
    Sentry.captureMessage(`Rate limit exceeded for endpoint: ${endpoint}`);
  });
}

/**
 * Initialize Sentry context for a request with HPCI-ChMS patterns
 */
export function initRequestContext(
  user?: HPCIUser | null,
  requestInfo?: {
    method: string;
    url: string;
    userAgent?: string;
    ipAddress?: string;
  }
) {
  // Set user context if provided
  if (user) {
    setSentryUser(user);
  }
  
  // Set request context
  if (requestInfo) {
    Sentry.setTag('http_method', requestInfo.method);
    Sentry.setExtra('request_url', requestInfo.url);
    
    if (requestInfo.userAgent) {
      Sentry.setExtra('user_agent', requestInfo.userAgent);
    }
    
    if (requestInfo.ipAddress) {
      Sentry.setExtra('ip_address', requestInfo.ipAddress);
    }
  }
  
  // Always set application context
  Sentry.setTag('application', 'hpci-chms');
}

/**
 * Clear all Sentry context (useful for cleanup between requests in development)
 */
export function clearSentryContext() {
  Sentry.setUser(null);
  Sentry.setContext('hpci-chms', null);
}