/**
 * Sentry Configuration Check
 * Logs a warning if Sentry is not configured in production
 */

import { logger } from './logger'

export function checkSentryConfig(): void {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.SENTRY_DSN) {
      logger.warn('SENTRY_DSN not configured in production environment. Error tracking is disabled.')
    } else {
      logger.info('Sentry error tracking is configured')
    }
  }
}

// Check once on module load
if (typeof window === 'undefined') {
  // Server-side only
  checkSentryConfig()
}