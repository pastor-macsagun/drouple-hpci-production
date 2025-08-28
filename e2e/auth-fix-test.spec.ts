import { test, expect } from './fixtures/auth-fixed'

test.describe('Fixed Authentication Test', () => {
  test('super admin authentication works', async ({ page, superAdminAuth }) => {
    console.log('[TEST] Starting super admin authentication test')
    
    // Should be on super admin page after authentication
    await expect(page).toHaveURL(/\/super/)
    
    // Should see super admin content  
    const heading = page.getByRole('heading', { name: /super admin|administration/i }).first()
    await expect(heading).toBeVisible({ timeout: 10000 })
    
    console.log('[TEST] Super admin authentication test passed')
  })

  test('church admin authentication works', async ({ page, churchAdminAuth }) => {
    console.log('[TEST] Starting church admin authentication test')
    
    // Should be on admin page after authentication
    await expect(page).toHaveURL(/\/admin/)
    
    // Should see admin content
    const heading = page.getByRole('heading', { name: /admin dashboard|dashboard|admin/i }).first()
    await expect(heading).toBeVisible({ timeout: 10000 })
    
    console.log('[TEST] Church admin authentication test passed')
  })

  test('member authentication works', async ({ page, memberAuth }) => {
    console.log('[TEST] Starting member authentication test')
    
    // Should be on dashboard page after authentication
    await expect(page).toHaveURL(/\/dashboard/)
    
    // Should see member dashboard content
    const welcomeText = page.getByText(/welcome|dashboard/i).first()
    await expect(welcomeText).toBeVisible({ timeout: 10000 })
    
    console.log('[TEST] Member authentication test passed')
  })
})
