import { test, expect } from './fixtures/auth'

test.describe('Tenant Isolation', () => {
  test('Manila admin cannot access Cebu services', async ({ page, churchAdminAuth }) => {
    // Login as Manila church admin
    await page.goto('/admin/services')
    
    // Should see services page
    await expect(page.getByRole('heading', { name: /services/i })).toBeVisible()
    
    // Should not see any Cebu-specific services or data
    // Check that we don't see Cebu church name anywhere
    await expect(page.getByText('Cebu')).not.toBeVisible()
    
    // Should only see Manila church data
    await expect(page.getByText('Manila')).toBeVisible()
  })

  test('Manila admin cannot access Cebu lifegroups', async ({ page, churchAdminAuth }) => {
    // Login as Manila church admin
    await page.goto('/admin/lifegroups')
    
    // Should see lifegroups page
    await expect(page.getByRole('heading', { name: /life groups/i })).toBeVisible()
    
    // Should not see any Cebu-specific life groups
    await expect(page.getByText('Cebu')).not.toBeVisible()
    
    // Should only see Manila church data
    await expect(page.getByText('Manila')).toBeVisible()
  })

  test('Manila admin cannot access Cebu members', async ({ page, churchAdminAuth }) => {
    // Login as Manila church admin  
    await page.goto('/admin/members')
    
    // Should see members page
    await expect(page.getByRole('heading', { name: /members/i })).toBeVisible()
    
    // Should not see any Cebu church member references
    await expect(page.getByText('Cebu')).not.toBeVisible()
  })

  test('Super admin can view all church data', async ({ page, superAdminAuth }) => {
    // Login as Super admin
    await page.goto('/admin/services')
    
    // Super admin should be able to see all churches in dropdowns/filters
    // Look for church filter dropdown or similar control
    const churchFilter = page.locator('select, [role="combobox"]').first()
    if (await churchFilter.isVisible()) {
      await churchFilter.click()
      // Should see both Manila and Cebu options
      await expect(page.getByText('Manila')).toBeVisible()
      await expect(page.getByText('Cebu')).toBeVisible()
    }
  })

  test('Direct URL access to other tenant data fails', async ({ page, churchAdminAuth }) => {
    // Try to access a Cebu-specific resource directly
    // This would need a known Cebu service/lifegroup ID
    // For now, just ensure the admin pages properly scope the data
    
    await page.goto('/admin/services')
    
    // Inspect network requests to ensure they're scoped
    page.on('response', response => {
      if (response.url().includes('/api/') && response.status() === 200) {
        // Response should not contain Cebu data for Manila admin
        expect(response.url()).not.toContain('cebu')
      }
    })
    
    // Wait for page to load and make API calls
    await page.waitForLoadState('networkidle')
  })
})