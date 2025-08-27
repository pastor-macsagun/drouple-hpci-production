import { test, expect } from './fixtures/auth'

test.describe('Tenant Isolation Fix Verification', () => {
  test('Manila admin can only see Manila users', async ({ page, churchAdminAuth }) => {
    // Login as Manila admin
    await page.goto('/admin/members')
    
    // Wait for member list to load
    await expect(page.locator('[data-testid="member-list"]')).toBeVisible({ timeout: 10000 })
    
    // Count visible members
    const memberRows = page.locator('[data-testid="member-row"]')
    const memberCount = await memberRows.count()
    
    // Should see only Manila users (around 10-12), not all 20 users from both churches
    expect(memberCount).toBeLessThanOrEqual(15)
    expect(memberCount).toBeGreaterThan(5)
    
    // Verify all visible users have Manila church name or are local to Manila
    const memberElements = await memberRows.all()
    for (const memberRow of memberElements) {
      const memberText = await memberRow.textContent()
      
      // Should not contain Cebu users (member11-member20 are Cebu users in test data)
      expect(memberText).not.toMatch(/member1[1-9]@test\.com/)
      expect(memberText).not.toMatch(/member20@test\.com/)
    }
    
    console.log(`Manila admin sees ${memberCount} members (should be ~10, not 20)`)
  })

  test('Super admin can see all users', async ({ page, superAdminAuth }) => {
    await page.goto('/admin/members')
    
    // Wait for member list to load
    await expect(page.locator('[data-testid="member-list"]')).toBeVisible({ timeout: 10000 })
    
    // Count all visible members
    const memberRows = page.locator('[data-testid="member-row"]')
    const memberCount = await memberRows.count()
    
    // Super admin should see more users (close to 20 total test users)
    expect(memberCount).toBeGreaterThan(15)
    
    console.log(`Super admin sees ${memberCount} members (should be ~20)`)
  })
})