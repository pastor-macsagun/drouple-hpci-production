import { test, expect } from '@playwright/test'

test.describe('JWT Session Error Handling', () => {
  test('redirects to login when no cookies present', async ({ page }) => {
    // Visit root with no session
    await page.goto('/')
    
    // Should redirect to signin
    await expect(page).toHaveURL(/auth\/signin/)
  })

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Fill in valid test credentials
    await page.getByLabel(/email/i).fill('member1@test.com')
    await page.getByLabel(/password/i).fill('Hpci!Test2025')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should redirect to dashboard after login
    await expect(page).toHaveURL(/dashboard/)
    await expect(page.getByRole('heading')).toBeVisible()
  })

  test('handles invalid JWT tokens gracefully', async ({ page }) => {
    // Set invalid session cookie (simulates JWT decode error)
    await page.context().addCookies([{
      name: 'authjs.session-token',
      value: 'invalid.jwt.token.that.cannot.be.decoded',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    }])
    
    // Try to visit protected route
    await page.goto('/')
    
    // Should handle JWT error and redirect to signin (not crash)
    await expect(page).toHaveURL(/auth\/signin/)
    
    // Page should load successfully without errors
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })
})