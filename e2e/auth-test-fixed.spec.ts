import { test, expect } from './fixtures/auth'

test.describe('Authentication - Fixed', () => {
  test('super admin can login and access dashboard', async ({ page, superAdminAuth }) => {
    // Navigate to super admin dashboard
    await page.goto('/super')
    
    // Should be able to access the super admin dashboard
    await expect(page).toHaveURL(/\/super/)
    
    // Check for super admin specific content
    await expect(page.getByText('Super Admin Dashboard')).toBeVisible({ timeout: 10000 })
  })

  test('church admin can login and access dashboard', async ({ page, churchAdminAuth }) => {
    // Navigate to admin dashboard
    await page.goto('/admin')
    
    // Should be able to access the admin dashboard
    await expect(page).toHaveURL(/\/admin/)
    
    // Check for admin specific content
    await expect(page.getByText('Admin Dashboard')).toBeVisible({ timeout: 10000 })
  })

  test('signin form works for manual login', async ({ page }) => {
    // Go to signin page
    await page.goto('/auth/signin')
    
    // Fill the form
    await page.fill('#email', 'superadmin@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    
    // Submit the form
    await page.click('button[type="submit"]')
    
    // Wait for redirect
    await page.waitForTimeout(3000)
    
    // Should be redirected away from signin page
    await expect(page).not.toHaveURL(/\/auth\/signin/)
    
    // Should be able to access protected content
    await page.goto('/super')
    await expect(page.getByText('Super Admin Dashboard')).toBeVisible()
  })
})