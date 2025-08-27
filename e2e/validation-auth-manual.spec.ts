import { test, expect } from '@playwright/test'

test.describe('Authentication Manual Tests', () => {
  test('Login flow should work step by step', async ({ page }) => {
    // Test the SUPER_ADMIN login specifically
    await page.goto('/auth/signin')
    
    // Wait for page to load
    await page.waitForSelector('#email')
    
    // Fill in credentials
    await page.fill('#email', 'superadmin@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    
    // Click submit and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"]')
    ])
    
    console.log('After login, URL is:', page.url())
    
    // Should be redirected to /super or at least not on signin
    expect(page.url()).not.toContain('/auth/signin')
  })
  
  test('Check all role redirects manually', async ({ page }) => {
    const testAccounts = [
      { email: 'superadmin@test.com', expectedPathContains: 'super' },
      { email: 'admin.manila@test.com', expectedPathContains: 'admin' },
      { email: 'vip.manila@test.com', expectedPathContains: 'vip' },
      { email: 'leader.manila@test.com', expectedPathContains: 'leader' },
      { email: 'member1@test.com', expectedPathContains: 'dashboard' }
    ]
    
    for (const account of testAccounts) {
      console.log(`Testing ${account.email}`)
      
      // Go to signin
      await page.goto('/auth/signin')
      await page.waitForSelector('#email')
      
      // Login
      await page.fill('#email', account.email)
      await page.fill('#password', 'Hpci!Test2025')
      
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }),
        page.click('button[type="submit"]')
      ])
      
      const finalUrl = page.url()
      console.log(`${account.email} final URL: ${finalUrl}`)
      
      // Logout for next test
      await page.goto('/api/auth/signout')
      await page.waitForNavigation()
    }
  })
  
  test('Test security headers on main page', async ({ page }) => {
    const response = await page.goto('/')
    const headers = response.headers()
    
    console.log('Security Headers Analysis:')
    console.log('X-Frame-Options:', headers['x-frame-options'])
    console.log('X-Content-Type-Options:', headers['x-content-type-options'])
    console.log('Referrer-Policy:', headers['referrer-policy'])
    console.log('Permissions-Policy:', headers['permissions-policy'])
    console.log('Content-Security-Policy:', headers['content-security-policy'])
    console.log('X-Powered-By:', headers['x-powered-by'])
    
    // Verify key security headers are present
    expect(headers['x-frame-options']).toBeTruthy()
    expect(headers['x-content-type-options']).toBeTruthy()
    expect(headers['content-security-policy']).toBeTruthy()
  })
  
  test('Invalid login should show error', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.waitForSelector('#email')
    
    await page.fill('#email', 'admin.manila@test.com')
    await page.fill('#password', 'WRONG_PASSWORD')
    await page.click('button[type="submit"]')
    
    // Wait for error message
    await page.waitForTimeout(3000)
    
    // Should still be on signin page
    expect(page.url()).toContain('/auth/signin')
    
    // Should show error message
    const errorMessage = await page.locator('[role="alert"]').textContent()
    console.log('Error message:', errorMessage)
    expect(errorMessage).toContain('Invalid email or password')
  })
  
  test('Rate limiting test', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Make multiple rapid requests
    for (let i = 0; i < 5; i++) {
      await page.fill('#email', 'admin.manila@test.com')
      await page.fill('#password', `wrong${i}`)
      await page.click('button[type="submit"]')
      await page.waitForTimeout(500)
    }
    
    // Check if rate limiting kicks in
    const errorMessage = await page.locator('[role="alert"]').textContent()
    console.log('Rate limit error:', errorMessage)
  })
})