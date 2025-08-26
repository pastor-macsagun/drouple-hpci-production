import { describe, it, expect, beforeEach, vi } from 'vitest'
import { rateLimiter } from './rate-limit'

// Mock time for consistent testing
beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
})

describe('Rate Limiter', () => {
  describe('in-memory rate limiting', () => {
    it('should allow requests within limit', async () => {
      const limiter = rateLimiter({
        requests: 3,
        window: '1h'
      })

      const key = 'test-key'
      
      // First 3 requests should succeed
      expect(await limiter.check(key)).toEqual({ success: true, limit: 3, remaining: 2, reset: expect.any(Date) })
      expect(await limiter.check(key)).toEqual({ success: true, limit: 3, remaining: 1, reset: expect.any(Date) })
      expect(await limiter.check(key)).toEqual({ success: true, limit: 3, remaining: 0, reset: expect.any(Date) })
    })

    it('should block requests exceeding limit', async () => {
      const limiter = rateLimiter({
        requests: 2,
        window: '1h'
      })

      const key = 'test-key'
      
      // First 2 requests succeed
      await limiter.check(key)
      await limiter.check(key)
      
      // Third request should fail
      const result = await limiter.check(key)
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should reset after time window', async () => {
      const limiter = rateLimiter({
        requests: 1,
        window: '1h'
      })

      const key = 'test-key'
      
      // First request succeeds
      expect(await limiter.check(key)).toMatchObject({ success: true })
      
      // Second request fails
      expect(await limiter.check(key)).toMatchObject({ success: false })
      
      // Advance time by 1 hour
      vi.advanceTimersByTime(60 * 60 * 1000)
      
      // Request should succeed again
      expect(await limiter.check(key)).toMatchObject({ success: true })
    })

    it('should support different time windows', async () => {
      const minuteLimiter = rateLimiter({ requests: 5, window: '1m' })
      const hourLimiter = rateLimiter({ requests: 100, window: '1h' })
      const dayLimiter = rateLimiter({ requests: 1000, window: '1d' })

      expect(await minuteLimiter.check('key')).toMatchObject({ limit: 5 })
      expect(await hourLimiter.check('key')).toMatchObject({ limit: 100 })
      expect(await dayLimiter.check('key')).toMatchObject({ limit: 1000 })
    })

    it('should isolate different keys', async () => {
      const limiter = rateLimiter({
        requests: 1,
        window: '1h'
      })

      // Different keys should have separate limits
      expect(await limiter.check('key1')).toMatchObject({ success: true })
      expect(await limiter.check('key2')).toMatchObject({ success: true })
      
      // Each key exhausted independently
      expect(await limiter.check('key1')).toMatchObject({ success: false })
      expect(await limiter.check('key2')).toMatchObject({ success: false })
    })

    it('should handle compound keys', async () => {
      const limiter = rateLimiter({
        requests: 2,
        window: '1h'
      })

      const key = limiter.key(['user', '123', 'action', 'register'])
      
      expect(await limiter.check(key)).toMatchObject({ success: true })
      expect(await limiter.check(key)).toMatchObject({ success: true })
      expect(await limiter.check(key)).toMatchObject({ success: false })
    })

    it('should provide accurate reset times', async () => {
      const limiter = rateLimiter({
        requests: 1,
        window: '1h'
      })

      const result = await limiter.check('key')
      expect(result.reset).toBeInstanceOf(Date)
      expect(result.reset.getTime()).toBe(new Date('2024-01-01T01:00:00Z').getTime())
    })

    it('should clean up expired entries', async () => {
      const limiter = rateLimiter({
        requests: 1,
        window: '1m'
      })

      // Create entries for multiple keys
      await limiter.check('key1')
      await limiter.check('key2')
      await limiter.check('key3')

      // Advance time beyond window
      vi.advanceTimersByTime(2 * 60 * 1000)

      // Old entries should be cleaned up on next check
      const result = await limiter.check('key1')
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(0)
    })
  })

  describe('sliding window algorithm', () => {
    it('should use sliding window for accurate rate limiting', async () => {
      const limiter = rateLimiter({
        requests: 3,
        window: '1h',
        algorithm: 'sliding-window'
      })

      const key = 'test-key'
      
      // Make 3 requests at different times
      expect(await limiter.check(key)).toMatchObject({ success: true })
      
      vi.advanceTimersByTime(20 * 60 * 1000) // +20 minutes
      expect(await limiter.check(key)).toMatchObject({ success: true })
      
      vi.advanceTimersByTime(20 * 60 * 1000) // +20 minutes (40 total)
      expect(await limiter.check(key)).toMatchObject({ success: true })
      
      // Should fail - still within window of first request
      expect(await limiter.check(key)).toMatchObject({ success: false })
      
      // Advance past first request window
      vi.advanceTimersByTime(21 * 60 * 1000) // +21 minutes (61 total)
      
      // Should succeed - first request outside window
      expect(await limiter.check(key)).toMatchObject({ success: true })
    })
  })

  describe('rate limit middleware', () => {
    it('should create middleware with custom error handler', async () => {
      const errorHandler = vi.fn()
      const limiter = rateLimiter({
        requests: 1,
        window: '1h',
        onRateLimit: errorHandler
      })

      await limiter.check('key')
      const result = await limiter.check('key')
      
      if (!result.success && limiter.onRateLimit) {
        limiter.onRateLimit(result)
      }
      
      expect(errorHandler).toHaveBeenCalledWith(result)
    })
  })
})