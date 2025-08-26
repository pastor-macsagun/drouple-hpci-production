import { test, expect } from '@playwright/test'

test.describe('Auth & Redirects @auth', () => {
  test.describe('Sign In Flow', () => {
    test('should display sign in page', async ({ page }) => {
      await page.goto('/signin')
      
      await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
      await expect(page.getByPlaceholder(/email/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /sign in with email/i })).toBeVisible()
    })
    
    test('should validate email format', async ({ page }) => {
      await page.goto('/signin')
      
      // Invalid email
      await page.getByPlaceholder(/email/i).fill('invalid-email')
      await page.getByRole('button', { name: /sign in with email/i }).click()
      
      await expect(page.getByText(/invalid email/i)).toBeVisible()
    })
    
    test('should show magic link sent message', async ({ page }) => {
      await page.goto('/signin')
      
      await page.getByPlaceholder(/email/i).fill('test@example.com')
      await page.getByRole('button', { name: /sign in with email/i }).click()
      
      await expect(page.getByText(/check your email/i)).toBeVisible()
    })
  })
  
  test.describe('Role-Based Redirects', () => {
    test('SUPER_ADMIN redirects to /super', async ({ page }) => {
      // Mock authentication as super admin
      await page.goto('/api/auth/signin')
      await page.getByPlaceholder(/email/i).fill('superadmin@test.com')
      await page.getByRole('button', { name: /sign in with email/i }).click()
      
      // Simulate magic link click
      await page.goto('/api/auth/callback/email?token=mock-super-admin-token')
      
      await page.waitForURL('/super')
      expect(page.url()).toContain('/super')
    })
    
    test('ADMIN/PASTOR redirects to /admin', async ({ page }) => {
      // Mock authentication as admin
      await page.goto('/api/auth/signin')
      await page.getByPlaceholder(/email/i).fill('admin.manila@test.com')
      await page.getByRole('button', { name: /sign in with email/i }).click()
      
      // Simulate magic link click
      await page.goto('/api/auth/callback/email?token=mock-admin-token')
      
      await page.waitForURL('/admin')
      expect(page.url()).toContain('/admin')
    })
    
    test('LEADER redirects to /dashboard with church param', async ({ page }) => {
      // Mock authentication as leader
      await page.goto('/api/auth/signin')
      await page.getByPlaceholder(/email/i).fill('leader.manila@test.com')
      await page.getByRole('button', { name: /sign in with email/i }).click()
      
      // Simulate magic link click
      await page.goto('/api/auth/callback/email?token=mock-leader-token')
      
      await page.waitForURL(/\/dashboard\?lc=/)
      expect(page.url()).toContain('/dashboard?lc=')
    })
    
    test('MEMBER redirects to /dashboard with church param', async ({ page }) => {
      // Mock authentication as member
      await page.goto('/api/auth/signin')
      await page.getByPlaceholder(/email/i).fill('member1@test.com')
      await page.getByRole('button', { name: /sign in with email/i }).click()
      
      // Simulate magic link click
      await page.goto('/api/auth/callback/email?token=mock-member-token')
      
      await page.waitForURL(/\/dashboard\?lc=/)
      expect(page.url()).toContain('/dashboard?lc=')
    })
  })
  
  test.describe('Protected Routes', () => {
    test('should redirect to signin when accessing protected route unauthenticated', async ({ page }) => {
      await page.goto('/dashboard')
      
      await page.waitForURL('/signin')
      expect(page.url()).toContain('/signin')
    })
    
    test('should redirect to signin from admin routes when unauthenticated', async ({ page }) => {
      await page.goto('/admin')
      
      await page.waitForURL('/signin')
      expect(page.url()).toContain('/signin')
    })
    
    test('should redirect to signin from super admin routes when unauthenticated', async ({ page }) => {
      await page.goto('/super')
      
      await page.waitForURL('/signin')
      expect(page.url()).toContain('/signin')
    })
  })
  
  test.describe('Rate Limiting', () => {
    test('should rate limit after 6 failed login attempts', async ({ page }) => {
      await page.goto('/signin')
      
      // Attempt login 6 times with wrong credentials
      for (let i = 0; i < 6; i++) {
        await page.getByPlaceholder(/email/i).fill(`attempt${i}@test.com`)
        await page.getByRole('button', { name: /sign in with email/i }).click()
        await page.waitForTimeout(100) // Small delay between attempts
      }
      
      // 7th attempt should be rate limited
      await page.getByPlaceholder(/email/i).fill('attempt7@test.com')
      await page.getByRole('button', { name: /sign in with email/i }).click()
      
      // Check for rate limit message or 429 status
      const response = await page.waitForResponse(resp => 
        resp.url().includes('/api/auth') && resp.status() === 429
      )
      
      expect(response.status()).toBe(429)
      
      // Check for Retry-After header
      const headers = response.headers()
      expect(headers['retry-after']).toBeDefined()
    })
  })
  
  test.describe('Sign Out', () => {
    test('should sign out and redirect to home', async ({ page, context }) => {
      // Set up authenticated session
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/dashboard')
      
      // Find and click sign out button
      await page.getByRole('button', { name: /sign out/i }).click()
      
      await page.waitForURL('/')
      expect(page.url()).toBe('http://localhost:3000/')
    })
  })
  
  test.describe('Session Management', () => {
    test('should maintain session across page refreshes', async ({ page, context }) => {
      // Set up authenticated session
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/dashboard')
      await expect(page.getByRole('heading')).toBeVisible()
      
      // Refresh page
      await page.reload()
      
      // Should still be on dashboard
      expect(page.url()).toContain('/dashboard')
      await expect(page.getByRole('heading')).toBeVisible()
    })
    
    test('should expire session after timeout', async ({ page, context }) => {
      // Set up expired session
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'expired-session-token',
        domain: 'localhost',
        path: '/',
        expires: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      }])
      
      await page.goto('/dashboard')
      
      // Should redirect to signin
      await page.waitForURL('/signin')
      expect(page.url()).toContain('/signin')
    })
  })
  
  test.describe('Church Selection', () => {
    test('should show church selection for multi-church members', async ({ page, context }) => {
      // Mock user with access to multiple churches
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-multi-church-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/dashboard')
      
      // Should see church selector
      await expect(page.getByRole('combobox', { name: /church/i })).toBeVisible()
      
      // Should have multiple options
      await page.getByRole('combobox', { name: /church/i }).click()
      await expect(page.getByRole('option', { name: /manila/i })).toBeVisible()
      await expect(page.getByRole('option', { name: /cebu/i })).toBeVisible()
    })
    
    test('should persist church selection', async ({ page, context }) => {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/dashboard?lc=clxtest002') // Manila
      
      // Navigate to another page
      await page.getByRole('link', { name: /life groups/i }).click()
      
      // URL should maintain church param
      expect(page.url()).toContain('lc=clxtest002')
    })
  })
  
  test.describe('Access Control', () => {
    test('MEMBER cannot access admin routes', async ({ page, context }) => {
      // Authenticate as member
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-member-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/admin')
      
      // Should redirect to dashboard or show forbidden
      await page.waitForURL('/dashboard')
      expect(page.url()).toContain('/dashboard')
    })
    
    test('LEADER cannot access admin routes', async ({ page, context }) => {
      // Authenticate as leader
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-leader-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/admin/services')
      
      // Should redirect to dashboard
      await page.waitForURL('/dashboard')
      expect(page.url()).toContain('/dashboard')
    })
    
    test('ADMIN cannot access super admin routes', async ({ page, context }) => {
      // Authenticate as admin
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-admin-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/super')
      
      // Should redirect to admin dashboard
      await page.waitForURL('/admin')
      expect(page.url()).toContain('/admin')
    })
  })
  
  test.describe('Password Reset Flow', () => {
    test('should show password reset option', async ({ page }) => {
      await page.goto('/signin')
      
      await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible()
    })
    
    test('should handle password reset request', async ({ page }) => {
      await page.goto('/signin')
      await page.getByRole('link', { name: /forgot password/i }).click()
      
      await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible()
      await page.getByPlaceholder(/email/i).fill('user@test.com')
      await page.getByRole('button', { name: /send reset link/i }).click()
      
      await expect(page.getByText(/reset link sent/i)).toBeVisible()
    })
  })
  
  test.describe('Two-Factor Authentication', () => {
    test.skip('should prompt for 2FA code when enabled', async ({ page }) => {
      // Skip if 2FA not implemented
      await page.goto('/signin')
      await page.getByPlaceholder(/email/i).fill('2fa-user@test.com')
      await page.getByRole('button', { name: /sign in with email/i }).click()
      
      // Should show 2FA input
      await expect(page.getByPlaceholder(/verification code/i)).toBeVisible()
    })
  })
  
  test.describe('OAuth Providers', () => {
    test.skip('should show OAuth sign in options', async ({ page }) => {
      // Skip if OAuth not configured
      await page.goto('/signin')
      
      await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /sign in with facebook/i })).toBeVisible()
    })
  })
  
  test.describe('Concurrent Sessions', () => {
    test('should handle multiple device sessions', async ({ browser }) => {
      // Create two browser contexts (simulating different devices)
      const context1 = await browser.newContext()
      const context2 = await browser.newContext()
      
      const page1 = await context1.newPage()
      const page2 = await context2.newPage()
      
      // Sign in on both devices
      await context1.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-device1',
        domain: 'localhost',
        path: '/',
      }])
      
      await context2.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-device2',
        domain: 'localhost',
        path: '/',
      }])
      
      // Both should access dashboard
      await page1.goto('/dashboard')
      await page2.goto('/dashboard')
      
      expect(page1.url()).toContain('/dashboard')
      expect(page2.url()).toContain('/dashboard')
      
      await context1.close()
      await context2.close()
    })
  })
})