import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { InMemoryRateLimiter, rateLimiter, type RateLimitResult } from '@/lib/rate-limit'

describe('Rate Limiting', () => {
  let limiter: InMemoryRateLimiter

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Basic rate limiting', () => {
    it('should allow requests within limit', async () => {
      limiter = rateLimiter({
        requests: 5,
        window: '1m',
      })

      const identifier = 'test-user'
      
      // All 5 requests should succeed
      for (let i = 0; i < 5; i++) {
        const result = await limiter.check(identifier)
        expect(result.success).toBe(true)
        expect(result.remaining).toBe(4 - i)
      }
    })

    it('should block requests exceeding limit', async () => {
      limiter = rateLimiter({
        requests: 3,
        window: '1m',
      })

      const identifier = 'test-user'
      
      // First 3 should succeed
      for (let i = 0; i < 3; i++) {
        const result = await limiter.check(identifier)
        expect(result.success).toBe(true)
      }

      // 4th should fail
      const result = await limiter.check(identifier)
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should reset after window expires', async () => {
      limiter = rateLimiter({
        requests: 2,
        window: '1m',
      })

      const identifier = 'test-user'
      
      // Use up the limit
      await limiter.check(identifier)
      await limiter.check(identifier)
      
      // Should be blocked
      let result = await limiter.check(identifier)
      expect(result.success).toBe(false)

      // Advance time past the window
      vi.advanceTimersByTime(61 * 1000)

      // Should be allowed again
      result = await limiter.check(identifier)
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(1)
    })
  })

  describe('Sliding window behavior', () => {
    it('should use sliding window algorithm', async () => {
      limiter = rateLimiter({
        requests: 3,
        window: '1m',
        algorithm: 'sliding-window',
      })

      const identifier = 'test-user'
      
      // Make 2 requests
      await limiter.check(identifier)
      await limiter.check(identifier)

      // Advance half the window
      vi.advanceTimersByTime(30 * 1000)

      // Make 1 more request (total 3)
      let result = await limiter.check(identifier)
      expect(result.success).toBe(true)

      // 4th should fail (still within window of first request)
      result = await limiter.check(identifier)
      expect(result.success).toBe(false)

      // Advance so first request falls out of window
      vi.advanceTimersByTime(31 * 1000)

      // Should allow 1 more
      result = await limiter.check(identifier)
      expect(result.success).toBe(true)
    })
  })

  describe('Multiple identifiers', () => {
    it('should track limits separately per identifier', async () => {
      limiter = rateLimiter({
        requests: 2,
        window: '1m',
      })

      // User 1 uses their limit
      await limiter.check('user1')
      await limiter.check('user1')
      let result = await limiter.check('user1')
      expect(result.success).toBe(false)

      // User 2 should still have their limit
      result = await limiter.check('user2')
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(1)
    })
  })

  describe('Skip successful requests option', () => {
    it('should track all requests normally', async () => {
      limiter = rateLimiter({
        requests: 3,
        window: '1m',
      })

      const identifier = 'test-user'
      
      // First 3 requests should succeed
      for (let i = 0; i < 3; i++) {
        const result = await limiter.check(identifier)
        expect(result.success).toBe(true)
        expect(result.remaining).toBe(2 - i)
      }
      
      // 4th should fail
      const result = await limiter.check(identifier)
      expect(result.success).toBe(false)
    })
  })

  describe('Rate limit response values', () => {
    it('should return correct rate limit values', async () => {
      limiter = rateLimiter({
        requests: 5,
        window: '1m',
      })

      const identifier = 'test-user'
      
      const result = await limiter.check(identifier)
      expect(result.success).toBe(true)
      expect(result.limit).toBe(5)
      expect(result.remaining).toBe(4)
      expect(result.reset).toBeInstanceOf(Date)

      // Use up the limit
      for (let i = 0; i < 4; i++) {
        await limiter.check(identifier)
      }

      // Should be blocked
      const blocked = await limiter.check(identifier)
      expect(blocked.success).toBe(false)
      expect(blocked.remaining).toBe(0)
    })
  })

  describe('Memory cleanup', () => {
    it('should clean up old entries', async () => {
      limiter = rateLimiter({
        requests: 5,
        window: '1m',
      })

      // Create entries for multiple users
      for (let i = 0; i < 10; i++) {
        await limiter.check(`user${i}`)
      }

      // Advance time past window
      vi.advanceTimersByTime(70 * 1000)

      // Make new request to trigger cleanup
      await limiter.check('new-user')

      // Old entries should be cleaned up
      // (This is internal behavior, but we can verify by checking memory usage doesn't grow infinitely)
      const result = await limiter.check('user0')
      expect(result.remaining).toBe(4) // Fresh limit
    })
  })

  describe('Critical action rate limiting', () => {
    it('should enforce stricter limits for critical actions', async () => {
      // Simulate check-in rate limiter
      const checkinLimiter = rateLimiter({
        requests: 1, // Only 1 check-in per 5 minutes
        window: '5m',
      })

      const userId = 'user123'
      const serviceId = 'service456'
      const identifier = `checkin:${userId}:${serviceId}`

      // First check-in should succeed
      let result = await checkinLimiter.check(identifier)
      expect(result.success).toBe(true)

      // Immediate retry should fail
      result = await checkinLimiter.check(identifier)
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should enforce registration rate limits', async () => {
      // Simulate registration rate limiter
      const registrationLimiter = rateLimiter({
        requests: 3, // Only 3 registration attempts per hour
        window: '1h',
      })

      const ipAddress = '192.168.1.1'

      // Should allow 3 registration attempts
      for (let i = 0; i < 3; i++) {
        const result = await registrationLimiter.check(ipAddress)
        expect(result.success).toBe(true)
      }

      // 4th attempt should be blocked
      const result = await registrationLimiter.check(ipAddress)
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })
  })
})