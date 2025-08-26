import { test, expect } from '@playwright/test'

test.describe('Rate Limiting', () => {
  test.describe('Registration Rate Limiting', () => {
    test('should enforce rate limits on registration attempts', async ({ page }) => {
      // Skip in CI as rate limiting is disabled in test mode
      if (process.env.CI) {
        test.skip()
      }

      await page.goto('/register')

      // Attempt registration 3 times (should succeed or show duplicate error)
      for (let i = 1; i <= 3; i++) {
        await page.fill('input[name="email"]', `test${i}@example.com`)
        await page.fill('input[name="name"]', `Test User ${i}`)
        await page.selectOption('select[name="localChurchId"]', { index: 1 })
        await page.click('button[type="submit"]')
        
        // Wait for redirect or error
        await page.waitForURL(/\/(register|dashboard)/)
      }

      // Fourth attempt should be rate limited
      await page.goto('/register')
      await page.fill('input[name="email"]', 'test4@example.com')
      await page.fill('input[name="name"]', 'Test User 4')
      await page.selectOption('select[name="localChurchId"]', { index: 1 })
      await page.click('button[type="submit"]')

      // Should see rate limit error
      const url = page.url()
      expect(url).toContain('error=rate_limit')
    })
  })

  test.describe('Check-in Rate Limiting', () => {
    test('should prevent rapid check-in attempts', async ({ page }) => {
      // Skip in CI as rate limiting is disabled in test mode
      if (process.env.CI) {
        test.skip()
      }

      // Login as a member
      await page.goto('/auth/signin')
      await page.fill('input[name="email"]', 'member1@test.com')
      await page.click('button[type="submit"]')
      
      // Navigate to check-in
      await page.goto('/checkin')
      
      // Get first service
      const serviceCard = page.locator('.service-card').first()
      
      // Attempt rapid check-ins (more than 10 in 5 minutes)
      for (let i = 0; i < 11; i++) {
        await serviceCard.locator('button:has-text("Check In")').click()
        
        // After first successful check-in, subsequent attempts should show duplicate error
        // After 10 attempts, should show rate limit error
        if (i === 0) {
          await expect(page.locator('text=successfully checked in')).toBeVisible()
        } else if (i < 10) {
          await expect(page.locator('text=already checked in')).toBeVisible()
        } else {
          await expect(page.locator('text=Too many check-in attempts')).toBeVisible()
        }
        
        // Small delay to prevent browser throttling
        await page.waitForTimeout(100)
      }
    })
  })

  test.describe('API Rate Limiting', () => {
    test('should return 429 when API rate limit exceeded', async ({ request }) => {
      // Skip in CI as rate limiting is disabled in test mode
      if (process.env.CI) {
        test.skip()
      }

      // Make rapid API requests
      const requests = []
      for (let i = 0; i < 101; i++) {
        requests.push(request.get('/api/health'))
      }

      const responses = await Promise.all(requests)
      
      // First 100 should succeed (or most of them)
      const successCount = responses.filter(r => r.status() === 200).length
      expect(successCount).toBeGreaterThan(90)
      
      // Some should be rate limited
      const rateLimitedCount = responses.filter(r => r.status() === 429).length
      expect(rateLimitedCount).toBeGreaterThan(0)
      
      // Check rate limit headers on 429 response
      const rateLimitedResponse = responses.find(r => r.status() === 429)
      if (rateLimitedResponse) {
        const headers = rateLimitedResponse.headers()
        expect(headers['x-ratelimit-limit']).toBeDefined()
        expect(headers['x-ratelimit-remaining']).toBe('0')
        expect(headers['x-ratelimit-reset']).toBeDefined()
        expect(headers['retry-after']).toBeDefined()
      }
    })
  })
})