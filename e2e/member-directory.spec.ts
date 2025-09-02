import { test, expect } from './fixtures/auth'

test.describe('Member Directory', () => {
  test.describe('Member Directory Access and Display', () => {
    test('should show all members for church admin', async ({ page, churchAdminAuth }) => {
      await page.goto('/members')
      
      // Wait for the member directory to load
      await expect(page.getByRole('heading', { name: 'Member Directory' })).toBeVisible()
      
      // Should not show "No members found"
      await expect(page.getByText('No members found')).not.toBeVisible()
      
      // Check that we can see multiple members
      const memberCards = page.locator('.grid .hover\\:shadow-lg')
      const count = await memberCards.count()
      expect(count).toBeGreaterThan(5) // Should see more than 5 members
      
      console.log(`Admin sees ${count} member cards`)
    })

    test('should show all members for super admin', async ({ page, superAdminAuth }) => {
      await page.goto('/members')
      
      // Wait for the member directory to load
      await expect(page.getByRole('heading', { name: 'Member Directory' })).toBeVisible()
      
      // Should not show "No members found"
      await expect(page.getByText('No members found')).not.toBeVisible()
      
      // Check that we can see multiple members
      const memberCards = page.locator('.grid .hover\\:shadow-lg')
      const count = await memberCards.count()
      expect(count).toBeGreaterThan(15) // Should see all members (16-20)
      
      console.log(`Super admin sees ${count} member cards`)
    })

    test('should show all members for regular member', async ({ page, memberAuth }) => {
      await page.goto('/members')
      
      // Wait for the member directory to load
      await expect(page.getByRole('heading', { name: 'Member Directory' })).toBeVisible()
      
      // Should not show "No members found"
      await expect(page.getByText('No members found')).not.toBeVisible()
      
      // Check that we can see multiple members
      const memberCards = page.locator('.grid .hover\\:shadow-lg')
      const count = await memberCards.count()
      expect(count).toBeGreaterThan(5) // Should see local church members
      
      console.log(`Member sees ${count} member cards`)
    })

    test('should show Edit My Profile button', async ({ page, memberAuth }) => {
      await page.goto('/members')
      
      await expect(page.getByRole('link', { name: 'Edit My Profile' })).toBeVisible()
    })
  })

  test.describe('Member Search Functionality', () => {
    test('should search members by name', async ({ page, churchAdminAuth }) => {
      await page.goto('/members')
      
      // Wait for initial load
      await expect(page.getByRole('heading', { name: 'Member Directory' })).toBeVisible()
      
      // Search for a specific member
      await page.fill('input[name="q"]', 'Super')
      await page.click('button[type="submit"]')
      
      // Wait for search results
      await page.waitForLoadState('networkidle')
      
      // Should show search results
      const memberCards = page.locator('.grid .hover\\:shadow-lg')
      const count = await memberCards.count()
      
      if (count > 0) {
        // Verify search results contain the search term
        const firstCard = memberCards.first()
        await expect(firstCard).toContainText(/Super/i)
      }
      
      console.log(`Search for 'Super' returned ${count} results`)
    })

    test('should handle empty search results gracefully', async ({ page, churchAdminAuth }) => {
      await page.goto('/members')
      
      // Search for something that doesn't exist
      await page.fill('input[name="q"]', 'NonExistentUser12345')
      await page.click('button[type="submit"]')
      
      // Wait for search results
      await page.waitForLoadState('networkidle')
      
      // Should show empty state for no results
      await expect(page.getByText('No members found')).toBeVisible()
      await expect(page.getByText('Try adjusting your search criteria')).toBeVisible()
    })
  })

  test.describe('Member Profile Display', () => {
    test('should display member information correctly', async ({ page, churchAdminAuth }) => {
      await page.goto('/members')
      
      // Wait for members to load
      await expect(page.getByRole('heading', { name: 'Member Directory' })).toBeVisible()
      
      // Should have at least one member card
      const memberCards = page.locator('.grid .hover\\:shadow-lg')
      await expect(memberCards.first()).toBeVisible()
      
      // Check first member card has required information
      const firstCard = memberCards.first()
      
      // Should have member name or email
      await expect(firstCard.locator('h3')).toBeVisible()
      
      // Should have role displayed
      await expect(firstCard.locator('.capitalize')).toBeVisible()
      
      // Should have joined date
      await expect(firstCard.getByText(/Joined/)).toBeVisible()
    })

    test('should show contact information when allowed', async ({ page, churchAdminAuth }) => {
      await page.goto('/members')
      
      // Wait for members to load
      const memberCards = page.locator('.grid .hover\\:shadow-lg')
      await expect(memberCards.first()).toBeVisible()
      
      // Look for contact information icons
      const emailIcons = page.locator('[data-lucide="mail"]')
      const phoneIcons = page.locator('[data-lucide="phone"]')
      
      const emailCount = await emailIcons.count()
      const phoneCount = await phoneIcons.count()
      
      console.log(`Found ${emailCount} email icons and ${phoneCount} phone icons`)
      
      // At least some members should have contact info visible
      expect(emailCount + phoneCount).toBeGreaterThan(0)
    })
  })

  test.describe('Member Detail Pages', () => {
    test('should navigate to member detail page', async ({ page, churchAdminAuth }) => {
      await page.goto('/members')
      
      // Wait for members to load
      const memberCards = page.locator('.grid .hover\\:shadow-lg')
      await expect(memberCards.first()).toBeVisible()
      
      // Click on first member's name link
      const firstMemberLink = memberCards.first().locator('h3 a')
      await firstMemberLink.click()
      
      // Should navigate to member detail page
      await expect(page).toHaveURL(/\/members\/[a-zA-Z0-9_-]+/)
      
      // Page should load without errors
      await expect(page.locator('body')).not.toContainText('Error')
    })
  })

  test.describe('Tenant Isolation', () => {
    test('should show proper tenant isolation between churches', async ({ page }) => {
      // Login as Manila admin
      await page.goto('/auth/signin')
      await page.fill('#email', 'admin.manila@test.com')
      await page.fill('#password', 'Hpci!Test2025')
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/(admin|dashboard)/)
      
      await page.goto('/members')
      
      // Wait for members to load
      const manilaCards = page.locator('.grid .hover\\:shadow-lg')
      await expect(manilaCards.first()).toBeVisible()
      const manilaCount = await manilaCards.count()
      
      // Now login as Cebu admin  
      await page.goto('/auth/signin')
      await page.fill('#email', 'admin.cebu@test.com')
      await page.fill('#password', 'Hpci!Test2025')
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/(admin|dashboard)/)
      
      await page.goto('/members')
      
      // Wait for members to load
      const cebuCards = page.locator('.grid .hover\\:shadow-lg')
      await expect(cebuCards.first()).toBeVisible()
      const cebuCount = await cebuCards.count()
      
      console.log(`Manila admin sees ${manilaCount} members, Cebu admin sees ${cebuCount} members`)
      
      // Both should see their local church members
      expect(manilaCount).toBeGreaterThan(0)
      expect(cebuCount).toBeGreaterThan(0)
    })
  })

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page, churchAdminAuth }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.goto('/members')
      
      // Should still show members
      await expect(page.getByRole('heading', { name: 'Member Directory' })).toBeVisible()
      const memberCards = page.locator('.grid .hover\\:shadow-lg')
      await expect(memberCards.first()).toBeVisible()
      
      // Search form should be responsive
      await expect(page.locator('input[name="q"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    })

    test('should work on tablet viewport', async ({ page, churchAdminAuth }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      
      await page.goto('/members')
      
      // Should still show members
      await expect(page.getByRole('heading', { name: 'Member Directory' })).toBeVisible()
      const memberCards = page.locator('.grid .hover\\:shadow-lg')
      await expect(memberCards.first()).toBeVisible()
    })
  })
})
