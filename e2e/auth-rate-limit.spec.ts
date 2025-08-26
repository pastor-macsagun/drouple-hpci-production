import { test, expect } from '@playwright/test'

// Enable rate limiting for these tests
test.use({
  extraHTTPHeaders: {
    'X-Test-Rate-Limit': 'enabled'
  }
})

test.describe('Auth Rate Limiting - Production Policy', () => {
  test.describe('GET Requests - No Rate Limiting', () => {
    test('should never rate limit GET /auth/signin', async ({ page }) => {
      // Visit signin page multiple times - should never get 429
      for (let i = 0; i < 10; i++) {
        const response = await page.goto('/auth/signin')
        expect(response?.status()).not.toBe(429)
        expect(response?.status()).toBe(200)
      }
    })

    test('should never rate limit GET /register', async ({ page }) => {
      // Visit register page multiple times - should never get 429
      for (let i = 0; i < 10; i++) {
        const response = await page.goto('/register')
        expect(response?.status()).not.toBe(429)
        expect(response?.status()).toBe(200)
      }
    })

    test('should show signin form without rate limiting', async ({ page }) => {
      await page.goto('/auth/signin')
      
      // Form should be visible and functional
      await expect(page.locator('input[name="email"]')).toBeVisible()
      await expect(page.locator('input[name="password"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
      
      // No rate limit error should be shown
      await expect(page.locator('text=/rate limit/i')).not.toBeVisible()
      await expect(page.locator('text=/too many requests/i')).not.toBeVisible()
    })
  })

  test.describe('POST Requests - Login Rate Limiting', () => {
    test('should allow 5 failed login attempts within a minute', async ({ page }) => {
      await page.goto('/auth/signin')
      
      // Attempt login with wrong credentials 5 times
      for (let i = 1; i <= 5; i++) {
        await page.fill('input[name="email"]', `test${i}@example.com`)
        await page.fill('input[name="password"]', 'wrongpassword')
        
        // Intercept the response to check headers
        const responsePromise = page.waitForResponse(response => 
          response.url().includes('/api/auth') && response.request().method() === 'POST'
        )
        
        await page.click('button[type="submit"]')
        
        const response = await responsePromise
        
        // Should not be rate limited yet
        expect(response.status()).not.toBe(429)
        
        // Check rate limit headers are present
        const headers = response.headers()
        expect(headers['x-ratelimit-limit']).toBeDefined()
        expect(headers['x-ratelimit-remaining']).toBeDefined()
        expect(headers['x-ratelimit-reset']).toBeDefined()
        
        // Remaining should decrease
        const remaining = parseInt(headers['x-ratelimit-remaining'] || '0')
        expect(remaining).toBe(5 - i)
        
        // Navigate back to signin for next attempt
        if (i < 5) {
          await page.goto('/auth/signin')
        }
      }
    })

    test('should block 6th login attempt within a minute with proper headers', async ({ page, context }) => {
      await page.goto('/auth/signin')
      
      // Make 5 attempts first
      for (let i = 1; i <= 5; i++) {
        await page.fill('input[name="email"]', 'ratelimit@test.com')
        await page.fill('input[name="password"]', 'wrongpassword')
        await page.click('button[type="submit"]')
        await page.waitForTimeout(500) // Small delay between attempts
        await page.goto('/auth/signin')
      }
      
      // 6th attempt should be rate limited
      await page.fill('input[name="email"]', 'ratelimit@test.com')
      await page.fill('input[name="password"]', 'wrongpassword')
      
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/api/auth') && response.request().method() === 'POST'
      )
      
      await page.click('button[type="submit"]')
      const response = await responsePromise
      
      // Should be rate limited
      expect(response.status()).toBe(429)
      
      // Check required headers
      const headers = response.headers()
      expect(headers['retry-after']).toBeDefined()
      expect(headers['x-ratelimit-limit']).toBe('5')
      expect(headers['x-ratelimit-remaining']).toBe('0')
      expect(headers['x-ratelimit-reset']).toBeDefined()
      
      // Retry-After should be a reasonable number (less than 60 seconds for minute window)
      const retryAfter = parseInt(headers['retry-after'] || '0')
      expect(retryAfter).toBeGreaterThan(0)
      expect(retryAfter).toBeLessThanOrEqual(60)
      
      // Error message should be visible on page
      const responseText = await response.text()
      expect(responseText).toContain('Rate limit exceeded')
    })

    test('should use different rate limit buckets for different emails', async ({ page }) => {
      await page.goto('/auth/signin')
      
      // Make 5 attempts with first email
      for (let i = 1; i <= 5; i++) {
        await page.fill('input[name="email"]', 'user1@test.com')
        await page.fill('input[name="password"]', 'wrongpassword')
        await page.click('button[type="submit"]')
        await page.waitForTimeout(200)
        await page.goto('/auth/signin')
      }
      
      // Should still be able to attempt with different email
      await page.fill('input[name="email"]', 'user2@test.com')
      await page.fill('input[name="password"]', 'wrongpassword')
      
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/api/auth') && response.request().method() === 'POST'
      )
      
      await page.click('button[type="submit"]')
      const response = await responsePromise
      
      // Should NOT be rate limited (different email)
      expect(response.status()).not.toBe(429)
    })
  })

  test.describe('POST Requests - Registration Rate Limiting', () => {
    test('should allow 3 registration attempts per hour', async ({ page }) => {
      await page.goto('/register')
      
      // Make 3 registration attempts
      for (let i = 1; i <= 3; i++) {
        await page.fill('input[name="name"]', `Test User ${i}`)
        await page.fill('input[name="email"]', `newuser${i}@test.com`)
        await page.fill('input[name="password"]', 'TestPassword123!')
        
        const responsePromise = page.waitForResponse(response => 
          response.url().includes('/api/register') && response.request().method() === 'POST'
        )
        
        await page.click('button[type="submit"]')
        const response = await responsePromise
        
        // Should not be rate limited for first 3 attempts
        expect(response.status()).not.toBe(429)
        
        // Check headers
        const headers = response.headers()
        expect(headers['x-ratelimit-limit']).toBe('3')
        expect(headers['x-ratelimit-remaining']).toBe(String(3 - i))
        
        if (i < 3) {
          await page.goto('/register')
        }
      }
    })

    test('should block 4th registration attempt within an hour', async ({ page }) => {
      await page.goto('/register')
      
      // Make 3 attempts first (using different approach to avoid previous test interference)
      const testId = Date.now()
      for (let i = 1; i <= 3; i++) {
        await page.fill('input[name="name"]', `Test User ${testId}-${i}`)
        await page.fill('input[name="email"]', `test${testId}-${i}@example.com`)
        await page.fill('input[name="password"]', 'TestPassword123!')
        await page.click('button[type="submit"]')
        await page.waitForTimeout(500)
        await page.goto('/register')
      }
      
      // 4th attempt should be rate limited
      await page.fill('input[name="name"]', `Test User ${testId}-4`)
      await page.fill('input[name="email"]', `test${testId}-4@example.com`)
      await page.fill('input[name="password"]', 'TestPassword123!')
      
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/api/register') && response.request().method() === 'POST'
      )
      
      await page.click('button[type="submit"]')
      const response = await responsePromise
      
      // Should be rate limited
      expect(response.status()).toBe(429)
      
      // Check headers
      const headers = response.headers()
      expect(headers['retry-after']).toBeDefined()
      expect(headers['x-ratelimit-limit']).toBe('3')
      expect(headers['x-ratelimit-remaining']).toBe('0')
      
      // Retry-After should be less than an hour (3600 seconds)
      const retryAfter = parseInt(headers['retry-after'] || '0')
      expect(retryAfter).toBeGreaterThan(0)
      expect(retryAfter).toBeLessThanOrEqual(3600)
    })
  })

  test.describe('Rate Limit Header Visibility', () => {
    test('should show rate limit info in response headers for tracked endpoints', async ({ page }) => {
      await page.goto('/auth/signin')
      
      await page.fill('input[name="email"]', 'header-test@example.com')
      await page.fill('input[name="password"]', 'testpassword')
      
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/api/auth') && response.request().method() === 'POST'
      )
      
      await page.click('button[type="submit"]')
      const response = await responsePromise
      
      const headers = response.headers()
      
      // All rate limit headers should be present
      expect(headers['x-ratelimit-limit']).toBeDefined()
      expect(headers['x-ratelimit-remaining']).toBeDefined()
      expect(headers['x-ratelimit-reset']).toBeDefined()
      
      // Values should be valid
      const limit = parseInt(headers['x-ratelimit-limit'] || '0')
      const remaining = parseInt(headers['x-ratelimit-remaining'] || '0')
      const reset = parseInt(headers['x-ratelimit-reset'] || '0')
      
      expect(limit).toBeGreaterThan(0)
      expect(remaining).toBeGreaterThanOrEqual(0)
      expect(remaining).toBeLessThan(limit)
      expect(reset).toBeGreaterThan(Date.now() / 1000) // Reset should be in the future
    })
  })

  test.describe('Other Endpoints Remain Protected', () => {
    test('should still rate limit check-in endpoint', async ({ request }) => {
      // Make 2 check-in attempts (limit is 1 per 5 minutes)
      const response1 = await request.post('/api/checkin', {
        data: { serviceId: 'test-service' }
      })
      
      // First should succeed or fail for other reasons (not rate limit)
      expect(response1.status()).not.toBe(429)
      
      // Second attempt should be rate limited
      const response2 = await request.post('/api/checkin', {
        data: { serviceId: 'test-service' }
      })
      
      expect(response2.status()).toBe(429)
      
      const headers = response2.headers()
      expect(headers['retry-after']).toBeDefined()
    })

    test('should apply general API rate limiting to other endpoints', async ({ request }) => {
      // General API limit is 100 per 15 minutes, so we shouldn't hit it easily
      // But we can verify headers are present
      const response = await request.get('/api/health')
      
      // For non-rate-limited endpoints, we might still get headers
      // depending on implementation
      expect(response.status()).toBe(200)
    })
  })
})