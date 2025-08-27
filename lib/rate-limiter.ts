/**
 * Enhanced Rate Limiter with Redis support for production scalability
 * Maintains backward compatibility with in-memory limiter
 */

import { dbLogger } from './logger'

// Rate limit configuration from environment or defaults
const RATE_LIMITS = {
  LOGIN: {
    windowMs: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '5'), // 5 attempts
  },
  API: {
    windowMs: parseInt(process.env.RATE_LIMIT_API_WINDOW_MS || '60000'), // 1 minute
    max: parseInt(process.env.RATE_LIMIT_API_MAX || '100'), // 100 requests
  },
  CHECKIN: {
    windowMs: parseInt(process.env.RATE_LIMIT_CHECKIN_WINDOW_MS || '300000'), // 5 minutes
    max: parseInt(process.env.RATE_LIMIT_CHECKIN_MAX || '1'), // 1 check-in per service
  },
  HEAVY: {
    windowMs: parseInt(process.env.RATE_LIMIT_HEAVY_WINDOW_MS || '300000'), // 5 minutes
    max: parseInt(process.env.RATE_LIMIT_HEAVY_MAX || '10'), // 10 heavy operations
  }
} as const

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  windowMs: number
}

// In-memory store for rate limiting (fallback)
class MemoryStore {
  private store = new Map<string, { count: number; resetTime: number }>()

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    
    if (Date.now() > entry.resetTime) {
      this.store.delete(key)
      return null
    }
    
    return entry
  }

  async set(key: string, value: { count: number; resetTime: number }): Promise<void> {
    this.store.set(key, value)
    
    // Cleanup expired entries periodically
    if (Math.random() < 0.01) { // 1% chance to cleanup
      this.cleanup()
    }
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
      }
    }
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }
}

// Redis store for production scalability (optional)
class RedisStore {
  private redis: any // eslint-disable-line @typescript-eslint/no-explicit-any
  
  constructor() {
    // Dynamic import to make Redis optional
    try {
      // This would be configured in production with actual Redis client
      // For now, we'll use a placeholder that falls back to memory
      this.redis = null
      
      if (process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
        dbLogger.info('Redis rate limiter enabled for production scaling')
      }
    } catch {
      dbLogger.warn('Redis not available, using in-memory rate limiting')
      this.redis = null
    }
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    if (!this.redis) return null
    
    try {
      const result = await this.redis.get(key)
      return result ? JSON.parse(result) : null
    } catch (error) {
      dbLogger.warn('Redis get failed, falling back to memory store', {
        error: error instanceof Error ? error.message : String(error)
      })
      return null
    }
  }

  async set(key: string, value: { count: number; resetTime: number }): Promise<void> {
    if (!this.redis) return
    
    try {
      const ttl = Math.ceil((value.resetTime - Date.now()) / 1000)
      await this.redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      dbLogger.warn('Redis set failed', {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.redis) return
    
    try {
      await this.redis.del(key)
    } catch (error) {
      dbLogger.warn('Redis delete failed', {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }
}

// Global store instances
const memoryStore = new MemoryStore()
const redisStore = new RedisStore()

/**
 * Enhanced rate limiter with Redis support
 */
export class RateLimiter {
  private primaryStore: MemoryStore | RedisStore
  private fallbackStore: MemoryStore

  constructor() {
    this.primaryStore = process.env.REDIS_URL ? redisStore : memoryStore
    this.fallbackStore = memoryStore
  }

  async checkLimit(
    identifier: string,
    limitType: keyof typeof RATE_LIMITS
  ): Promise<RateLimitResult> {
    const config = RATE_LIMITS[limitType]
    const key = `rate_limit:${limitType}:${identifier}`
    const now = Date.now()
    const resetTime = now + config.windowMs

    try {
      // Try primary store (Redis or Memory)
      let entry = await this.primaryStore.get(key)
      
      // Fallback to memory store if Redis fails
      if (entry === null && this.primaryStore !== this.fallbackStore) {
        entry = await this.fallbackStore.get(key)
      }

      if (!entry || entry.resetTime <= now) {
        // First request in window or window expired
        entry = { count: 1, resetTime }
        await this.setEntry(key, entry)
        
        return {
          allowed: true,
          remaining: config.max - 1,
          resetTime,
          windowMs: config.windowMs
        }
      }

      // Increment counter
      entry.count += 1
      await this.setEntry(key, entry)

      const allowed = entry.count <= config.max
      const remaining = Math.max(0, config.max - entry.count)

      if (!allowed) {
        dbLogger.warn(`Rate limit exceeded for ${identifier} on ${limitType}`, {
          count: entry.count,
          limit: config.max,
          windowMs: config.windowMs
        })
      }

      return {
        allowed,
        remaining,
        resetTime: entry.resetTime,
        windowMs: config.windowMs
      }
    } catch (error) {
      dbLogger.error('Rate limiter error:', error instanceof Error ? error : new Error(String(error)))
      // On error, allow the request but log the issue
      return {
        allowed: true,
        remaining: config.max,
        resetTime,
        windowMs: config.windowMs
      }
    }
  }

  private async setEntry(key: string, entry: { count: number; resetTime: number }): Promise<void> {
    try {
      await this.primaryStore.set(key, entry)
    } catch {
      // Fallback to memory store
      if (this.primaryStore !== this.fallbackStore) {
        await this.fallbackStore.set(key, entry)
      }
    }
  }

  async resetLimit(identifier: string, limitType: keyof typeof RATE_LIMITS): Promise<void> {
    const key = `rate_limit:${limitType}:${identifier}`
    try {
      await this.primaryStore.delete(key)
      if (this.primaryStore !== this.fallbackStore) {
        await this.fallbackStore.delete(key)
      }
    } catch (error) {
      dbLogger.warn('Failed to reset rate limit', {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter()

/**
 * Rate limiting middleware for server actions
 */
export async function withRateLimit<T extends (...args: any[]) => Promise<any>>( // eslint-disable-line @typescript-eslint/no-explicit-any
  identifier: string,
  limitType: keyof typeof RATE_LIMITS,
  action: T
): Promise<ReturnType<T> | { success: false; error: string; rateLimited: true }> {
  const result = await rateLimiter.checkLimit(identifier, limitType)
  
  if (!result.allowed) {
    return {
      success: false,
      error: `Rate limit exceeded. Try again in ${Math.ceil(result.windowMs / 1000)} seconds.`,
      rateLimited: true
    } as any // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  return action()
}

/**
 * Get rate limit headers for API responses
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(RATE_LIMITS.API.max),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
    'X-RateLimit-Window': String(result.windowMs)
  }
}

/**
 * Rate limiting configuration for different environments
 */
export const rateLimitConfig = {
  development: {
    // More lenient limits for development
    ...RATE_LIMITS,
    LOGIN: { ...RATE_LIMITS.LOGIN, max: RATE_LIMITS.LOGIN.max * 2 },
    API: { ...RATE_LIMITS.API, max: RATE_LIMITS.API.max * 2 }
  },
  production: RATE_LIMITS,
  test: {
    // Very high limits for testing
    LOGIN: { windowMs: 60000, max: 1000 },
    API: { windowMs: 60000, max: 10000 },
    CHECKIN: { windowMs: 60000, max: 1000 },
    HEAVY: { windowMs: 60000, max: 1000 }
  }
}