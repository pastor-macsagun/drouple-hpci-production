/**
 * Monitoring and Error Tracking Setup
 * Basic monitoring with console logging for development and Vercel monitoring for production
 */

import { logger } from './logger'
import { ErrorInfo } from 'react'

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
    extra?: Record<string, unknown>;
  }) {
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
  static logError(error: Error, errorInfo?: ErrorInfo) {
    logger.error('React Error Boundary', { error, errorInfo })
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