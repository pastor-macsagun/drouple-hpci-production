/**
 * In-memory rate limiter with sliding window algorithm
 * Suitable for single-instance deployments
 * For production with multiple instances, use Redis-backed implementation
 */

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: Date
}

export interface RateLimiterOptions {
  requests: number
  window: '1m' | '5m' | '15m' | '1h' | '24h' | '1d'
  algorithm?: 'fixed-window' | 'sliding-window'
  onRateLimit?: (result: RateLimitResult) => void
}

interface RequestRecord {
  timestamps: number[]
  windowStart: number
}

export class InMemoryRateLimiter {
  private store = new Map<string, RequestRecord>()
  private cleanupInterval: NodeJS.Timeout | null = null
  private windowMs: number
  public onRateLimit?: (result: RateLimitResult) => void

  constructor(
    private requests: number,
    window: string,
    private algorithm: 'fixed-window' | 'sliding-window' = 'sliding-window',
    onRateLimit?: (result: RateLimitResult) => void
  ) {
    this.windowMs = this.parseWindow(window)
    this.onRateLimit = onRateLimit
    
    // Cleanup expired entries every minute in production
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000)
    }
  }

  private parseWindow(window: string): number {
    const units: Record<string, number> = {
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000
    }
    
    const match = window.match(/^(\d+)([mhd])$/)
    if (!match) throw new Error(`Invalid window format: ${window}`)
    
    const [, num, unit] = match
    return parseInt(num) * units[unit]
  }

  async check(key: string): Promise<RateLimitResult> {
    const now = Date.now()
    const windowStart = now - this.windowMs
    
    if (this.algorithm === 'fixed-window') {
      return this.checkFixedWindow(key, now)
    } else {
      return this.checkSlidingWindow(key, now, windowStart)
    }
  }

  private checkFixedWindow(key: string, now: number): RateLimitResult {
    let record = this.store.get(key)
    const windowStart = Math.floor(now / this.windowMs) * this.windowMs
    
    // Reset if new window
    if (!record || record.windowStart < windowStart) {
      record = { timestamps: [], windowStart }
      this.store.set(key, record)
    }
    
    const count = record.timestamps.length
    const remaining = Math.max(0, this.requests - count - 1)
    const reset = new Date(windowStart + this.windowMs)
    
    if (count < this.requests) {
      record.timestamps.push(now)
      return { success: true, limit: this.requests, remaining, reset }
    }
    
    return { success: false, limit: this.requests, remaining: 0, reset }
  }

  private checkSlidingWindow(key: string, now: number, windowStart: number): RateLimitResult {
    let record = this.store.get(key)
    
    if (!record) {
      record = { timestamps: [], windowStart: now }
      this.store.set(key, record)
    }
    
    // Remove timestamps outside the sliding window
    record.timestamps = record.timestamps.filter(ts => ts > windowStart)
    
    const count = record.timestamps.length
    const remaining = Math.max(0, this.requests - count - 1)
    const reset = new Date(
      record.timestamps.length > 0 
        ? record.timestamps[0] + this.windowMs 
        : now + this.windowMs
    )
    
    if (count < this.requests) {
      record.timestamps.push(now)
      return { success: true, limit: this.requests, remaining, reset }
    }
    
    return { success: false, limit: this.requests, remaining: 0, reset }
  }

  key(parts: (string | number)[]): string {
    return parts.join(':')
  }

  private cleanup(): void {
    const now = Date.now()
    const windowStart = now - this.windowMs
    
    for (const [key, record] of this.store.entries()) {
      // Remove records with no recent activity
      const hasRecentActivity = record.timestamps.some(ts => ts > windowStart)
      if (!hasRecentActivity) {
        this.store.delete(key)
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.store.clear()
  }
}

// Export RateLimiter as an alias for InMemoryRateLimiter (for backward compatibility)
export { InMemoryRateLimiter as RateLimiter }

// Factory function for creating rate limiters
export function rateLimiter(options: RateLimiterOptions): InMemoryRateLimiter {
  return new InMemoryRateLimiter(
    options.requests,
    options.window,
    options.algorithm,
    options.onRateLimit
  )
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  // Strict limit for registration/authentication
  auth: rateLimiter({
    requests: 3,
    window: '1h'
  }),
  
  // General API rate limiting
  api: rateLimiter({
    requests: 100,
    window: '15m'
  }),
  
  // Email sending rate limit
  email: rateLimiter({
    requests: 5,
    window: '1h'
  }),
  
  // Check-in rate limit
  checkin: rateLimiter({
    requests: 10,
    window: '5m'
  }),
  
  // Export/download rate limit
  export: rateLimiter({
    requests: 10,
    window: '1h'
  })
}

// Utility function for IP extraction from headers
export function getClientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0].trim() ||
         headers.get('x-real-ip') ||
         headers.get('cf-connecting-ip') ||
         'unknown'
}

// Server action wrapper with rate limiting
export async function withRateLimit<T extends any[], R>( // eslint-disable-line @typescript-eslint/no-explicit-any -- Generic type constraints
  limiter: InMemoryRateLimiter,
  keyFn: (...args: T) => string,
  action: (...args: T) => Promise<R>
): Promise<(...args: T) => Promise<R | { error: string }>> {
  return async (...args: T) => {
    const key = keyFn(...args)
    const result = await limiter.check(key)
    
    if (!result.success) {
      return {
        error: `Rate limit exceeded. Try again at ${result.reset.toLocaleTimeString()}`
      }
    }
    
    return action(...args)
  }
}