import { test, expect } from './fixtures/auth'

test.describe('Navigation Consistency @nav', () => {
  test.describe('Member Navigation', () => {
    test('should display member navigation items', async ({ page, memberAuth }) => {
      await page.goto('/dashboard')
      
      // Check sidebar navigation
      await expect(page.getByRole('navigation')).toBeVisible()
      await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /check-in/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /life groups/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /events/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /pathways/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /messages/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /profile/i })).toBeVisible()
      
      // Should NOT see admin links
      await expect(page.getByRole('link', { name: /admin/i })).not.toBeVisible()
    })
    
    test('should navigate between member pages', async ({ page, memberAuth }) => {
      await page.goto('/dashboard')
      
      // Navigate to Check-In
      await page.getByRole('link', { name: /check-in/i }).click()
      await page.waitForURL('/checkin')
      await expect(page.getByRole('heading', { name: /check-in/i })).toBeVisible()
      
      // Navigate to LifeGroups
      await page.getByRole('link', { name: /life groups/i }).click()
      await page.waitForURL('/lifegroups')
      await expect(page.getByRole('heading', { name: /life groups/i })).toBeVisible()
      
      // Navigate to Events
      await page.getByRole('link', { name: /events/i }).click()
      await page.waitForURL('/events')
      await expect(page.getByRole('heading', { name: /events/i })).toBeVisible()
      
      // Navigate to Pathways
      await page.getByRole('link', { name: /pathways/i }).click()
      await page.waitForURL('/pathways')
      await expect(page.getByRole('heading', { name: /pathways/i })).toBeVisible()
      
      // Navigate back to Dashboard
      await page.getByRole('link', { name: /dashboard/i }).click()
      await page.waitForURL('/dashboard')
      await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    })
  })
  
  test.describe('Leader Navigation', () => {
    test('should display leader-specific navigation', async ({ page, leaderAuth }) => {
      await page.goto('/dashboard')
      
      // Should see all member links plus leader features
      await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /life groups/i })).toBeVisible()
      
      // Navigate to LifeGroups - should see management options
      await page.getByRole('link', { name: /life groups/i }).click()
      await expect(page.getByRole('button', { name: /manage/i })).toBeVisible()
    })
  })
  
  test.describe('Admin Navigation', () => {
    test('should display admin navigation', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin')
      
      // Check admin sidebar
      await expect(page.getByRole('navigation')).toBeVisible()
      await expect(page.getByRole('link', { name: /admin dashboard/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /services/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /life groups/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /events/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /pathways/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /members/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /announcements/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /reports/i })).toBeVisible()
    })
    
    test('should navigate between admin pages', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin')
      
      // Navigate to Services
      await page.getByRole('link', { name: /services/i }).click()
      await page.waitForURL('/admin/services')
      await expect(page.getByRole('heading', { name: /services/i })).toBeVisible()
      
      // Navigate to LifeGroups
      await page.getByRole('link', { name: /life groups/i }).click()
      await page.waitForURL('/admin/lifegroups')
      await expect(page.getByRole('heading', { name: /life groups/i })).toBeVisible()
      
      // Navigate to Members
      await page.getByRole('link', { name: /members/i }).click()
      await page.waitForURL('/admin/members')
      await expect(page.getByRole('heading', { name: /members/i })).toBeVisible()
    })
  })
  
  test.describe('Super Admin Navigation', () => {
    test('should display super admin navigation', async ({ page, superAdminAuth }) => {
      await page.goto('/super')
      
      // Check super admin specific navigation
      await expect(page.getByRole('navigation')).toBeVisible()
      await expect(page.getByRole('link', { name: /super dashboard/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /churches/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /global reports/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /system settings/i })).toBeVisible()
    })
    
    test('should access all church data', async ({ page, superAdminAuth }) => {
      await page.goto('/super')
      
      // Navigate to Churches
      await page.getByRole('link', { name: /churches/i }).click()
      await page.waitForURL('/super/churches')
      
      // Should see all churches
      await expect(page.getByText(/manila/i)).toBeVisible()
      await expect(page.getByText(/cebu/i)).toBeVisible()
    })
  })
  
  test.describe('Breadcrumb Navigation', () => {
    test('should display breadcrumbs', async ({ page, memberAuth }) => {
      await page.goto('/lifegroups')
      
      // Check breadcrumb trail
      await expect(page.getByRole('navigation', { name: /breadcrumb/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /home/i })).toBeVisible()
      await expect(page.getByText(/life groups/i)).toBeVisible()
    })
    
    test('should navigate via breadcrumbs', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/services')
      
      // Click home breadcrumb
      await page.getByRole('navigation', { name: /breadcrumb/i })
        .getByRole('link', { name: /home/i }).click()
      
      await page.waitForURL('/admin')
      expect(page.url()).toContain('/admin')
    })
  })
  
  test.describe('Mobile Navigation', () => {
    test('should toggle mobile menu', async ({ page, memberAuth }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/dashboard')
      
      // Menu should be hidden initially
      const sidebar = page.getByRole('navigation')
      await expect(sidebar).not.toBeVisible()
      
      // Click hamburger menu
      await page.getByRole('button', { name: /menu/i }).click()
      
      // Menu should be visible
      await expect(sidebar).toBeVisible()
      
      // Click outside to close
      await page.locator('body').click({ position: { x: 10, y: 10 } })
      await expect(sidebar).not.toBeVisible()
    })
    
    test('should navigate on mobile', async ({ page, memberAuth }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/dashboard')
      
      // Open menu
      await page.getByRole('button', { name: /menu/i }).click()
      
      // Navigate to events
      await page.getByRole('link', { name: /events/i }).click()
      await page.waitForURL('/events')
      
      // Menu should auto-close after navigation
      const sidebar = page.getByRole('navigation')
      await expect(sidebar).not.toBeVisible()
    })
  })
  
  test.describe('Link Validation', () => {
    test('should not have broken links', async ({ page, memberAuth }) => {
      await page.goto('/dashboard')
      
      // Collect all links
      const links = await page.getByRole('link').all()
      
      for (const link of links) {
        const href = await link.getAttribute('href')
        if (href && href.startsWith('/')) {
          // Test internal links
          const response = await page.request.get(href)
          expect(response.status()).toBeLessThan(400)
        }
      }
    })
    
    test('should handle 404 pages', async ({ page, memberAuth }) => {
      await page.goto('/non-existent-page')
      
      // Should show 404 page
      await expect(page.getByText(/404/)).toBeVisible()
      await expect(page.getByText(/page not found/i)).toBeVisible()
      
      // Should have link back to dashboard
      await expect(page.getByRole('link', { name: /go to dashboard/i })).toBeVisible()
    })
  })
  
  test.describe('Header Navigation', () => {
    test('should display user menu in header', async ({ page, memberAuth }) => {
      await page.goto('/dashboard')
      
      // Check header elements
      await expect(page.getByRole('banner')).toBeVisible()
      
      // User menu button
      const userMenuButton = page.getByRole('button', { name: /user menu/i })
      await expect(userMenuButton).toBeVisible()
      
      // Click to open menu
      await userMenuButton.click()
      
      // Check menu items
      await expect(page.getByRole('menuitem', { name: /profile/i })).toBeVisible()
      await expect(page.getByRole('menuitem', { name: /settings/i })).toBeVisible()
      await expect(page.getByRole('menuitem', { name: /sign out/i })).toBeVisible()
    })
    
    test('should display notifications icon', async ({ page, memberAuth }) => {
      await page.goto('/dashboard')
      
      const notificationButton = page.getByRole('button', { name: /notifications/i })
      await expect(notificationButton).toBeVisible()
      
      // Click to open notifications
      await notificationButton.click()
      
      // Should show notification panel
      await expect(page.getByRole('region', { name: /notifications/i })).toBeVisible()
    })
  })
  
  test.describe('Quick Actions', () => {
    test('should display quick action buttons for admin', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin')
      
      // Check for quick action buttons
      await expect(page.getByRole('button', { name: /create service/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /add member/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /new announcement/i })).toBeVisible()
    })
  })
  
  test.describe('Search Navigation', () => {
    test('should display global search', async ({ page, memberAuth }) => {
      await page.goto('/dashboard')
      
      // Check for search input
      const searchInput = page.getByPlaceholder(/search/i)
      await expect(searchInput).toBeVisible()
      
      // Type in search
      await searchInput.fill('test search')
      await searchInput.press('Enter')
      
      // Should navigate to search results
      await page.waitForURL(/\/search\?q=test\+search/)
      expect(page.url()).toContain('search?q=test+search')
    })
  })
  
  test.describe('Footer Navigation', () => {
    test('should display footer links', async ({ page }) => {
      await page.goto('/')
      
      // Scroll to footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      
      // Check footer links
      const footer = page.getByRole('contentinfo')
      await expect(footer).toBeVisible()
      
      await expect(footer.getByRole('link', { name: /about/i })).toBeVisible()
      await expect(footer.getByRole('link', { name: /contact/i })).toBeVisible()
      await expect(footer.getByRole('link', { name: /privacy/i })).toBeVisible()
      await expect(footer.getByRole('link', { name: /terms/i })).toBeVisible()
    })
  })
  
  test.describe('Tab Navigation', () => {
    test('should support keyboard navigation', async ({ page, memberAuth }) => {
      await page.goto('/dashboard')
      
      // Tab through navigation
      await page.keyboard.press('Tab')
      await expect(page.getByRole('link', { name: /dashboard/i })).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(page.getByRole('link', { name: /check-in/i })).toBeFocused()
      
      // Enter to navigate
      await page.keyboard.press('Enter')
      await page.waitForURL('/checkin')
      expect(page.url()).toContain('/checkin')
    })
  })
  
  test.describe('Back Navigation', () => {
    test('should handle browser back button', async ({ page, memberAuth }) => {
      await page.goto('/dashboard')
      await page.getByRole('link', { name: /events/i }).click()
      await page.waitForURL('/events')
      
      // Go back
      await page.goBack()
      await page.waitForURL('/dashboard')
      expect(page.url()).toContain('/dashboard')
      
      // Go forward
      await page.goForward()
      await page.waitForURL('/events')
      expect(page.url()).toContain('/events')
    })
  })
  
  test.describe('Deep Linking', () => {
    test('should support deep links', async ({ page, memberAuth }) => {
      // Direct link to specific life group
      await page.goto('/lifegroups/clxtest101')
      
      // Should load the specific page
      await expect(page.getByRole('heading')).toBeVisible()
      
      // Direct link to specific event
      await page.goto('/events/clxtest201')
      await expect(page.getByRole('heading')).toBeVisible()
    })
  })
})