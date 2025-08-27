/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Monitoring and Error Tracking Setup
 * Comprehensive monitoring with Sentry integration for production error tracking
 */

import { logger } from './logger'

// Import Sentry helpers
let sentryHelpers: any = null;
if (typeof window === 'undefined') {
  // Server-side
  try {
    sentryHelpers = require('../sentry.server.config'); // eslint-disable-line @typescript-eslint/no-require-imports
  } catch (error) {
    logger.warn('Sentry server config not available', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} else {
  // Client-side - Sentry should be available via next.config.js configuration
  sentryHelpers = (window as any).Sentry;
}

// Enhanced Sentry configuration
export const sentryConfig = {
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: process.env.NODE_ENV === 'development',
  integrations: [],
  beforeSend: (event: any, hint: any) => {
    // Filter out sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies
    }
    if (event.user?.email) {
      event.user.email = '[REDACTED]'
    }
    
    // Log to our logger as well
    logger.error('Sentry Event', { eventId: event.event_id, error: hint.originalException })
    
    return event
  }
}

/**
 * Enhanced error tracking with business context
 */
export class ErrorTracker {
  /**
   * Track authentication errors with user context
   */
  static captureAuthError(error: Error, context: {
    userId?: string;
    email?: string;
    attemptedAction: string;
  }) {
    if (sentryHelpers?.captureUserError) {
      sentryHelpers.captureUserError(error, {
        id: context.userId,
        email: context.email ? '[REDACTED]' : undefined,
      }, {
        auth_action: context.attemptedAction,
        error_type: 'authentication',
      });
    }
    
    logger.error('Authentication Error', {
      error: error.message,
      userId: context.userId,
      action: context.attemptedAction,
    });
  }

  /**
   * Track business logic errors
   */
  static captureBusinessError(message: string, context: {
    userId?: string;
    tenantId?: string;
    action: string;
    resource?: string;
    severity?: 'low' | 'medium' | 'high';
    extra?: Record<string, any>;
  }) {
    if (sentryHelpers?.captureBusinessLogicError) {
      sentryHelpers.captureBusinessLogicError(message, context);
    }
    
    logger.error('Business Logic Error', {
      message,
      ...context,
    });
  }

  /**
   * Track database errors with query context
   */
  static captureDatabaseError(error: Error, context: {
    operation: string;
    table?: string;
    userId?: string;
    tenantId?: string;
  }) {
    if (sentryHelpers?.captureUserError) {
      sentryHelpers.captureUserError(error, 
        context.userId ? { id: context.userId } : undefined,
        {
          db_operation: context.operation,
          db_table: context.table,
          tenant_id: context.tenantId,
          error_type: 'database',
        }
      );
    }
    
    logger.error('Database Error', {
      error: error.message,
      ...context,
    });
  }

  /**
   * Track API errors with request context
   */
  static captureAPIError(error: Error, context: {
    method: string;
    url: string;
    statusCode?: number;
    userId?: string;
    requestId?: string;
  }) {
    if (sentryHelpers?.captureUserError) {
      sentryHelpers.captureUserError(error,
        context.userId ? { id: context.userId } : undefined,
        {
          http_method: context.method,
          http_url: context.url,
          http_status: context.statusCode,
          request_id: context.requestId,
          error_type: 'api',
        }
      );
    }
    
    logger.error('API Error', {
      error: error.message,
      ...context,
    });
  }
}

/**
 * Custom error boundary for React components
 */
export class ErrorBoundary {
  static logError(error: Error, errorInfo?: any) {
    logger.error('React Error Boundary', { error, errorInfo })
    
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: errorInfo
        }
      })
    }
  }
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private static marks = new Map<string, number>()

  static start(label: string): void {
    this.marks.set(label, performance.now())
  }

  static end(label: string): number {
    const start = this.marks.get(label)
    if (!start) {
      logger.warn(`Performance mark '${label}' not found`)
      return 0
    }

    const duration = performance.now() - start
    this.marks.delete(label)

    // Log slow operations
    if (duration > 1000) {
      logger.warn(`Slow operation detected: ${label}`, { duration })
    }

    // Send to monitoring service
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.addBreadcrumb({
        category: 'performance',
        message: label,
        level: duration > 1000 ? 'warning' : 'info',
        data: { duration }
      })
    }

    return duration
  }

  static async measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label)
    try {
      const result = await fn()
      return result
    } finally {
      this.end(label)
    }
  }
}

/**
 * Custom metrics tracking
 */
export class Metrics {
  private static counters = new Map<string, number>()
  private static gauges = new Map<string, number>()

  static increment(metric: string, value = 1): void {
    const current = this.counters.get(metric) || 0
    this.counters.set(metric, current + value)
    
    // Send to monitoring service periodically
    this.flush(metric, 'counter', current + value)
  }

  static gauge(metric: string, value: number): void {
    this.gauges.set(metric, value)
    this.flush(metric, 'gauge', value)
  }

  private static flush(metric: string, type: string, value: number): void {
    if (process.env.NODE_ENV === 'production') {
      // Send to monitoring service
      logger.debug('Metric recorded', { metric, type, value })
    }
  }

  static getCounter(metric: string): number {
    return this.counters.get(metric) || 0
  }

  static getGauge(metric: string): number {
    return this.gauges.get(metric) || 0
  }

  static reset(): void {
    this.counters.clear()
    this.gauges.clear()
  }
}

/**
 * Health check endpoint data
 */
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  uptime: number
  timestamp: string
  services: {
    database: boolean
    cache: boolean
    email: boolean
  }
  metrics?: {
    requestsPerMinute: number
    averageResponseTime: number
    errorRate: number
  }
}

export async function performHealthCheck(): Promise<HealthCheckResult> {
  // Check database
  let databaseHealthy = false
  try {
    const { prisma } = await import('@/lib/prisma')
    await prisma.$queryRaw`SELECT 1`
    databaseHealthy = true
  } catch (error) {
    logger.error('Database health check failed', { error })
  }

  // Check cache
  let cacheHealthy = false
  try {
    const { userCache } = await import('./cache')
    userCache.set('health-check', true)
    cacheHealthy = userCache.get('health-check') === true
    userCache.delete('health-check')
  } catch (error) {
    logger.error('Cache health check failed', { error })
  }

  // Check email service
  let emailHealthy = false
  try {
    // Mock check - in production, would verify SMTP connection
    emailHealthy = !!process.env.RESEND_API_KEY
  } catch (error) {
    logger.error('Email health check failed', { error })
  }

  const allHealthy = databaseHealthy && cacheHealthy && emailHealthy
  const status = allHealthy ? 'healthy' : databaseHealthy ? 'degraded' : 'unhealthy'

  return {
    status,
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: databaseHealthy,
      cache: cacheHealthy,
      email: emailHealthy
    },
    metrics: {
      requestsPerMinute: Metrics.getCounter('requests') / (process.uptime() / 60),
      averageResponseTime: Metrics.getGauge('responseTime'),
      errorRate: Metrics.getCounter('errors') / Math.max(1, Metrics.getCounter('requests'))
    }
  }
}