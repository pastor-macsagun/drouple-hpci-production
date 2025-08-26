import { test, expect } from './fixtures/auth'

test.describe('Role-based access control', () => {
  test('super admin can access all areas', async ({ page, superAdminAuth }) => {
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: /admin dashboard/i })).toBeVisible()
    
    await page.goto('/admin/services')
    await expect(page.getByRole('heading', { name: /sunday services/i })).toBeVisible()
    
    await page.goto('/admin/pathways')
    await expect(page.getByRole('heading', { name: /pathways management/i })).toBeVisible()
  })

  test('church admin can manage their church', async ({ page, churchAdminAuth }) => {
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: /admin dashboard/i })).toBeVisible()
    
    await page.goto('/admin/services')
    await expect(page.getByRole('heading', { name: /sunday services/i })).toBeVisible()
    
    // Should see Manila church data
    await expect(page.getByText('HPCI Manila')).toBeVisible()
  })

  test('leader can access leader features', async ({ page, leaderAuth }) => {
    await page.goto('/lifegroups')
    await expect(page.getByRole('heading', { name: /my life groups/i })).toBeVisible()
    
    // Should see groups they lead
    await expect(page.getByText(/Youth Connect|Couples Fellowship/)).toBeVisible()
  })

  test('member has limited access', async ({ page, memberAuth }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible()
    
    await page.goto('/checkin')
    await expect(page.getByRole('heading', { name: /sunday service check-in/i })).toBeVisible()
    
    // Should not be able to access admin
    await page.goto('/admin')
    await expect(page).toHaveURL('/') // Redirected
  })
})

test.describe('Quick role switching', () => {
  test.skip('test multiple roles in same test', async ({ page }) => {
    // Skipping: Dynamic fixture switching not supported in same test
    // Use separate tests for different roles instead
  })
})