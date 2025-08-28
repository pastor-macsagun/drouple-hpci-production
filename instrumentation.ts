/**
 * Next.js Instrumentation Hook for Sentry
 * 
 * This file initializes Sentry monitoring for server-side and edge runtime.
 * It's automatically loaded by Next.js 15 during server startup.
 * 
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */

import * as Sentry from '@sentry/nextjs';

export async function register() {
  // Only initialize Sentry in production or when explicitly enabled
  const shouldUseSentry = process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true';
  
  if (!shouldUseSentry) {
    return;
  }

  // Check if we're running in Edge Runtime
  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge Runtime Configuration
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      
      // Environment and release tracking
      environment: process.env.NODE_ENV || 'development',
      release: process.env.VERCEL_GIT_COMMIT_SHA || 'local-build',
      
      // Edge Runtime specific configuration
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 1.0,
      
      // Minimal integrations for Edge Runtime
      integrations: [],
      
      // Edge runtime specific filtering
      beforeSend(event, hint) {
        // Add edge runtime context
        event.tags = {
          ...event.tags,
          component: 'edge',
          runtime: 'edge',
        };
        
        // Filter out edge runtime specific noise
        const error = hint.originalException;
        if (error && typeof error === 'object' && 'message' in error) {
          const message = String(error.message);
          
          // Skip common edge runtime errors
          if (
            message.includes('Dynamic Code Evaluation') ||
            message.includes('eval is not supported') ||
            message.includes('Function constructor is disabled')
          ) {
            return null;
          }
        }
        
        return event;
      },
      
      // Ignore edge-specific errors
      ignoreErrors: [
        'Dynamic Code Evaluation',
        'eval is not supported',
        'Function constructor is disabled',
        'WebAssembly is not supported',
      ],
    });
  } else {
    // Node.js Server Runtime Configuration
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      
      // Environment and release tracking
      environment: process.env.NODE_ENV || 'development',
      release: process.env.VERCEL_GIT_COMMIT_SHA || 'local-build',
      
      // Performance Monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
      
      // Server-side configuration
      integrations: [
        // Server integrations are configured automatically by Sentry Next.js
        // Custom integrations can be added here as needed
      ],
      
      // Add context to all events
      beforeSend(event, hint) {
        // Add server context
        event.tags = {
          ...event.tags,
          component: 'server',
          runtime: 'nodejs',
          node_version: process.version,
        };
        
        // Add deployment info if available
        if (process.env.VERCEL_URL) {
          event.tags.deployment_url = process.env.VERCEL_URL;
        }
        
        // Add HPCI-ChMS specific context
        if (process.env.NODE_ENV === 'production') {
          event.tags.church_management_system = 'hpci-chms';
        }
        
        // Filter sensitive data
        if (event.request) {
          // Remove sensitive headers
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
            delete event.request.headers['x-api-key'];
          }
          
          // Remove sensitive query params
          if (event.request.query_string) {
            try {
              const url = new URL(`http://localhost?${event.request.query_string}`);
              const params = url.searchParams;
              params.delete('token');
              params.delete('api_key');
              params.delete('password');
              event.request.query_string = params.toString();
            } catch (e) {
              // If URL parsing fails, just clear the query string
              event.request.query_string = '';
            }
          }
        }
        
        return event;
      },
      
      // Custom transaction enrichment
      beforeSendTransaction(event) {
        // Add custom tags for better grouping
        if (event.contexts?.trace?.op === 'http.server') {
          event.tags = {
            ...event.tags,
            route: event.transaction || 'unknown',
            church_management: 'hpci-chms',
          };
        }
        
        return event;
      },
      
      // Ignore common noise
      ignoreErrors: [
        // Database connection timeouts (handle gracefully)
        'Connection terminated unexpectedly',
        'Connection lost: The server closed the connection',
        'Client has already been connected',
        
        // Network issues
        'ECONNRESET',
        'ENOTFOUND',
        'ETIMEDOUT',
        
        // NextAuth known issues
        'Unauthorized',
        'TokenExpiredError',
        'Invalid token',
        
        // Client-side navigation errors in SSR
        'Non-Error promise rejection captured',
        
        // Common development errors
        'ResizeObserver loop limit exceeded',
      ],
      
      // Debug mode for development
      debug: process.env.NODE_ENV === 'development',
      
      // Set user context automatically for HPCI-ChMS
      initialScope: {
        tags: {
          application: 'hpci-chms',
          version: process.env.npm_package_version || '0.1.0',
        },
      },
    });
  }
}

// Export utility functions for manual error reporting in server context
export const captureServerError = (error: Error, context?: {
  userId?: string;
  tenantId?: string;
  action?: string;
  resource?: string;
  extra?: Record<string, any>;
}) => {
  Sentry.withScope((scope) => {
    scope.setTag('error_source', 'server');
    
    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }
    
    if (context?.tenantId) {
      scope.setTag('tenant_id', context.tenantId);
    }
    
    if (context?.action) {
      scope.setTag('action', context.action);
    }
    
    if (context?.resource) {
      scope.setTag('resource', context.resource);
    }
    
    if (context?.extra) {
      Object.keys(context.extra).forEach(key => {
        scope.setExtra(key, context.extra![key]);
      });
    }
    
    scope.setLevel('error');
    Sentry.captureException(error);
  });
};

export const captureBusinessLogicError = (
  message: string,
  context: {
    userId?: string;
    tenantId?: string;
    action: string;
    resource?: string;
    extra?: Record<string, any>;
  }
) => {
  Sentry.withScope((scope) => {
    scope.setTag('error_type', 'business_logic');
    scope.setTag('action', context.action);
    scope.setTag('application', 'hpci-chms');
    
    if (context.resource) {
      scope.setTag('resource', context.resource);
    }
    
    if (context.userId) {
      scope.setUser({ id: context.userId });
    }
    
    if (context.tenantId) {
      scope.setTag('tenant_id', context.tenantId);
    }
    
    if (context.extra) {
      Object.keys(context.extra).forEach(key => {
        scope.setExtra(key, context.extra![key]);
      });
    }
    
    scope.setLevel('warning');
    Sentry.captureMessage(message);
  });
};

export const capturePerformanceIssue = (
  operation: string,
  duration: number,
  threshold: number,
  context?: Record<string, any>
) => {
  if (duration > threshold) {
    Sentry.withScope((scope) => {
      scope.setTag('performance_issue', 'slow_operation');
      scope.setTag('operation', operation);
      scope.setTag('application', 'hpci-chms');
      scope.setExtra('duration_ms', duration);
      scope.setExtra('threshold_ms', threshold);
      
      if (context) {
        Object.keys(context).forEach(key => {
          scope.setExtra(key, context[key]);
        });
      }
      
      scope.setLevel('warning');
      Sentry.captureMessage(`Slow operation detected: ${operation} took ${duration}ms`);
    });
  }
};

/**
 * Handle errors from nested React Server Components
 * This is required for Next.js 15 compatibility
 */
export const onRequestError = Sentry.captureRequestError;