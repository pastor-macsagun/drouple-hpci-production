import { test, expect } from '@playwright/test'

test.describe('Role-Based Redirects Fix', () => {
  
  test('Super admin should redirect to /super after login', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.fill('#email', 'superadmin@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    await page.click('button[type="submit"]')
    
    // Wait for redirect to complete
    await page.waitForURL('**/super', { timeout: 10000 })
    
    expect(page.url()).toContain('/super')
  })
  
  test('Church admin should redirect to /admin after login', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.fill('#email', 'admin.manila@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    await page.click('button[type="submit"]')
    
    // Wait for redirect to complete
    await page.waitForURL('**/admin', { timeout: 10000 })
    
    expect(page.url()).toContain('/admin')
  })
  
  test('VIP should redirect to /vip after login', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.fill('#email', 'vip.manila@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    await page.click('button[type="submit"]')
    
    // Wait for redirect to complete
    await page.waitForURL('**/vip', { timeout: 10000 })
    
    expect(page.url()).toContain('/vip')
  })
  
  test('Leader should redirect to /leader after login', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.fill('#email', 'leader.manila@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    await page.click('button[type="submit"]')
    
    // Wait for redirect to complete
    await page.waitForURL('**/leader', { timeout: 10000 })
    
    expect(page.url()).toContain('/leader')
  })
  
  test('Member should redirect to /dashboard after login', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.fill('#email', 'member1@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    await page.click('button[type="submit"]')
    
    // Wait for redirect to complete
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    
    expect(page.url()).toContain('/dashboard')
  })
  
  test('Super admin can access all role pages', async ({ page }) => {
    // Login as super admin
    await page.goto('/auth/signin')
    await page.fill('#email', 'superadmin@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/super', { timeout: 10000 })
    
    // Test access to different role pages
    const rolePaths = ['/admin', '/vip', '/leader', '/dashboard']
    
    for (const path of rolePaths) {
      await page.goto(path)
      await page.waitForTimeout(1000)
      
      // Should not redirect to forbidden or signin
      expect(page.url()).not.toContain('/forbidden')
      expect(page.url()).not.toContain('/auth/signin')
      expect(page.url()).toContain(path)
    }
  })
  
  test('Regular admin cannot access super admin routes', async ({ page }) => {
    // Login as church admin
    await page.goto('/auth/signin')
    await page.fill('#email', 'admin.manila@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin', { timeout: 10000 })
    
    // Try to access super admin route
    await page.goto('/super')
    await page.waitForTimeout(2000)
    
    // Should be redirected to dashboard page (unauthorized access)
    expect(page.url()).toContain('/dashboard')
  })
  
  test('VIP cannot access admin routes', async ({ page }) => {
    // Login as VIP
    await page.goto('/auth/signin')
    await page.fill('#email', 'vip.manila@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/vip', { timeout: 10000 })
    
    // Try to access admin route
    await page.goto('/admin')
    await page.waitForTimeout(2000)
    
    // Should be redirected to dashboard page (unauthorized access)
    expect(page.url()).toContain('/dashboard')
  })
})