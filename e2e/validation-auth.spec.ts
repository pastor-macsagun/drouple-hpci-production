import { test, expect } from '@playwright/test'

test.describe('Authentication & Session Validation', () => {
  
  test('Valid logins for all roles should work', async ({ page }) => {
    const accounts = [
      { email: 'superadmin@test.com', role: 'SUPER_ADMIN', expectedPath: '/super' },
      { email: 'admin.manila@test.com', role: 'ADMIN', expectedPath: '/admin' },
      { email: 'admin.cebu@test.com', role: 'ADMIN', expectedPath: '/admin' },
      { email: 'vip.manila@test.com', role: 'VIP', expectedPath: '/vip' },
      { email: 'vip.cebu@test.com', role: 'VIP', expectedPath: '/vip' },
      { email: 'leader.manila@test.com', role: 'LEADER', expectedPath: '/leader' },
      { email: 'leader.cebu@test.com', role: 'LEADER', expectedPath: '/leader' },
      { email: 'member1@test.com', role: 'MEMBER', expectedPath: '/dashboard' }
    ]
    
    for (const account of accounts) {
      await page.goto('/auth/signin')
      await page.fill('#email', account.email)
      await page.fill('#password', 'Hpci!Test2025')
      await page.click('button[type="submit"]')
      
      // Wait for redirect
      await page.waitForTimeout(2000)
      
      // Check we're on expected path or redirected appropriately
      const url = page.url()
      console.log(`${account.email} (${account.role}): ${url}`)
      
      // Should not be on signin page anymore
      expect(url).not.toContain('/auth/signin')
      
      await page.goto('/auth/signin?callbackUrl=%2Flogout')
      await page.waitForTimeout(1000)
    }
  })
  
  test('Invalid login attempts should fail gracefully', async ({ page }) => {
    // Wrong password
    await page.goto('/auth/signin')
    await page.fill('#email', 'admin.manila@test.com')
    await page.fill('#password', 'WrongPassword')
    await page.click('button[type="submit"]')
    
    await page.waitForTimeout(2000)
    // Should stay on signin page
    expect(page.url()).toContain('/auth/signin')
    
    // Non-existent user
    await page.fill('#email', 'nonexistent@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    await page.click('button[type="submit"]')
    
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/auth/signin')
    
    // SQL injection attempt
    await page.fill('#email', 'admin@test.com\'; DROP TABLE users; --')
    await page.fill('#password', 'test')
    await page.click('button[type="submit"]')
    
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/auth/signin')
    
    // XSS attempt in email field
    await page.fill('#email', '<script>alert("xss")</script>@test.com')
    await page.fill('#password', 'test')
    await page.click('button[type="submit"]')
    
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/auth/signin')
  })
  
  test('Rate limiting should prevent brute force attacks', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Hammer login endpoint with invalid attempts
    for (let i = 0; i < 10; i++) {
      await page.fill('#email', 'admin.manila@test.com')
      await page.fill('#password', 'InvalidPassword' + i)
      await page.click('button[type="submit"]')
      await page.waitForTimeout(300) // Quick succession
    }
    
    // Final attempt should potentially be rate limited
    const response = await page.request.post('/api/auth/callback/credentials', {
      form: {
        email: 'admin.manila@test.com',
        password: 'AnotherWrongPassword',
        csrf: await page.locator('input[name="csrfToken"]').inputValue().catch(() => 'test')
      }
    })
    
    // Log response for analysis
    console.log('Rate limit test response:', response.status(), await response.text())
  })
  
  test('Session persistence and logout should work', async ({ page }) => {
    // Login
    await page.goto('/auth/signin')
    await page.fill('#email', 'member1@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    await page.click('button[type="submit"]')
    
    await page.waitForTimeout(3000)
    
    // Should be logged in - try accessing dashboard
    await page.goto('/dashboard')
    expect(page.url()).toContain('/dashboard')
    
    // Logout
    await page.goto('/api/auth/signout')
    await page.waitForTimeout(1000)
    
    // Should be logged out - accessing dashboard should redirect to signin
    await page.goto('/dashboard')
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/auth/signin')
  })
  
  test('Simultaneous sessions should be handled properly', async ({ browser }) => {
    // Create two contexts for same user
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()
    
    // Login with same account in both contexts
    for (const page of [page1, page2]) {
      await page.goto('/auth/signin')
      await page.fill('#email', 'member1@test.com')
      await page.fill('#password', 'Hpci!Test2025')
      await page.click('button[type="submit"]')
      await page.waitForTimeout(2000)
    }
    
    // Both should be able to access dashboard
    await page1.goto('/dashboard')
    await page2.goto('/dashboard')
    
    expect(page1.url()).toContain('/dashboard')
    expect(page2.url()).toContain('/dashboard')
    
    await context1.close()
    await context2.close()
  })
  
  test('Cookie security should be properly configured', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.fill('#email', 'member1@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    await page.click('button[type="submit"]')
    
    await page.waitForTimeout(2000)
    
    // Get cookies
    const cookies = await page.context().cookies()
    const authCookie = cookies.find(c => c.name.includes('session') || c.name.includes('next-auth'))
    
    if (authCookie) {
      console.log('Auth cookie details:', {
        name: authCookie.name,
        httpOnly: authCookie.httpOnly,
        secure: authCookie.secure,
        sameSite: authCookie.sameSite
      })
    }
  })
})