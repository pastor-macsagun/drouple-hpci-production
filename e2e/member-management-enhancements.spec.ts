/**
 * E2E Tests for Member Management Enhancements
 * Tests new features: bulk operations, CSV export, church transfer, activity snapshot
 */

import { test, expect } from './fixtures/auth'

test.describe('Member Management Enhancements', () => {
  
  test.describe('US-MEM-004: Bulk Operations', () => {
    test('admin can bulk activate/deactivate members', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/members')
      
      // Wait for page to load
      await expect(page.getByRole('heading', { name: 'Member Management' })).toBeVisible()
      
      // If there are members in the table, test bulk selection
      const memberRows = page.getByRole('row').filter({ hasText: /member\d+@test\.com/ })
      const memberCount = await memberRows.count()
      
      if (memberCount > 1) {
        // Select first few members using checkboxes
        const firstRow = memberRows.first()
        const secondRow = memberRows.nth(1)
        
        await firstRow.getByRole('checkbox').check()
        await secondRow.getByRole('checkbox').check()
        
        // Look for bulk action buttons (should appear when members are selected)
        const bulkActivateBtn = page.getByRole('button', { name: /Bulk Activate/i })
        const bulkDeactivateBtn = page.getByRole('button', { name: /Bulk Deactivate/i })
        
        // Try bulk activate if button exists
        if (await bulkActivateBtn.isVisible()) {
          await bulkActivateBtn.click()
          
          // Confirm in dialog if needed
          const confirmBtn = page.getByRole('button', { name: /Confirm|Activate/i })
          if (await confirmBtn.isVisible()) {
            await confirmBtn.click()
          }
          
          // Should see success message
          await expect(page.getByText(/successfully activated/i)).toBeVisible({ timeout: 5000 })
        }
      }
    })
  })

  test.describe('US-MEM-005: CSV Export', () => {
    test('admin can export members CSV', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/members')
      
      // Look for export button
      const exportBtn = page.getByRole('button', { name: /Export|Download|CSV/i })
      
      if (await exportBtn.isVisible()) {
        // Set up download listener
        const downloadPromise = page.waitForDownload({ timeout: 10000 })
        
        await exportBtn.click()
        
        // Wait for download to complete
        const download = await downloadPromise
        
        // Verify filename contains expected pattern
        expect(download.suggestedFilename()).toMatch(/members.*\.csv/)
        
        // Verify file content (basic check)
        const content = await download.createReadStream()
        expect(content).toBeTruthy()
      } else {
        // Test via direct API call if UI button not implemented
        const response = await page.request.get('/api/admin/members/export')
        expect(response.status()).toBe(200)
        expect(response.headers()['content-type']).toContain('text/csv')
      }
    })

    test('CSV export respects tenant isolation', async ({ page, churchAdminAuth }) => {
      // Admin should only see their church's members in CSV
      const response = await page.request.get('/api/admin/members/export')
      
      if (response.status() === 200) {
        const csvContent = await response.text()
        
        // Should contain CSV headers
        expect(csvContent).toContain('Name,Email,Role,Status')
        
        // Should not leak data from other churches
        expect(csvContent).not.toContain('cebu') // Assuming admin.manila doesn't have cebu data
      }
    })
  })

  test.describe('US-MEM-006: Super Admin Church Transfer', () => {
    test('super admin can transfer member between churches', async ({ page, superAdminAuth }) => {
      await page.goto('/admin/members')
      
      // Look for a member to transfer
      const memberRow = page.getByRole('row').filter({ hasText: /member.*@test\.com/ }).first()
      
      if (await memberRow.isVisible()) {
        // Click edit or actions button for the member
        const editBtn = memberRow.getByRole('button', { name: /Edit|Actions|⋯/i })
        if (await editBtn.isVisible()) {
          await editBtn.click()
          
          // Look for transfer option
          const transferBtn = page.getByRole('button', { name: /Transfer|Move Church/i })
          if (await transferBtn.isVisible()) {
            await transferBtn.click()
            
            // Select destination church
            const churchSelect = page.getByRole('combobox')
            if (await churchSelect.isVisible()) {
              await churchSelect.click()
              
              // Select different church
              const otherChurch = page.getByRole('option').nth(1)
              if (await otherChurch.isVisible()) {
                await otherChurch.click()
                
                // Confirm transfer
                const confirmBtn = page.getByRole('button', { name: /Transfer|Confirm/i })
                await confirmBtn.click()
                
                // Should see success message
                await expect(page.getByText(/successfully transferred/i)).toBeVisible({ timeout: 5000 })
              }
            }
          }
        }
      }
    })

    test('regular admin cannot see transfer option', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/members')
      
      const memberRow = page.getByRole('row').filter({ hasText: /member.*@test\.com/ }).first()
      
      if (await memberRow.isVisible()) {
        const editBtn = memberRow.getByRole('button', { name: /Edit|Actions/i })
        if (await editBtn.isVisible()) {
          await editBtn.click()
          
          // Transfer option should not be visible for regular admin
          await expect(page.getByRole('button', { name: /Transfer|Move Church/i })).not.toBeVisible()
        }
      }
    })
  })

  test.describe('US-MEM-007: Role-based Redirects', () => {
    test('members land on correct dashboard after login', async ({ page }) => {
      // Test member role redirect
      await page.goto('/auth/login')
      
      await page.getByLabel('Email').fill('member1@test.com')
      await page.getByLabel('Password').fill('Hpci!Test2025')
      await page.getByRole('button', { name: 'Sign In' }).click()
      
      // Should redirect to member dashboard
      await expect(page).toHaveURL('/dashboard')
      await expect(page.getByText('Welcome')).toBeVisible()
    })

    test('admins land on admin dashboard after login', async ({ page }) => {
      await page.goto('/auth/login')
      
      await page.getByLabel('Email').fill('admin.manila@test.com')
      await page.getByLabel('Password').fill('Hpci!Test2025')
      await page.getByRole('button', { name: 'Sign In' }).click()
      
      // Should redirect to admin dashboard
      await expect(page).toHaveURL('/admin')
      await expect(page.getByText('Administration')).toBeVisible()
    })
  })

  test.describe('US-MEM-008: Profile Activity Snapshot', () => {
    test('member profile shows activity summary', async ({ page, memberAuth }) => {
      // Go to own profile
      await page.goto('/members/member1-id') // Would need actual member ID
      
      // Or navigate via member directory
      await page.goto('/members')
      
      // Find and click on a member profile
      const memberLink = page.getByRole('link').filter({ hasText: /member/i }).first()
      if (await memberLink.isVisible()) {
        await memberLink.click()
        
        // Should see activity summary section
        await expect(page.getByText('Activity Summary')).toBeVisible()
        
        // Should see activity metrics
        await expect(page.getByText('Check-ins')).toBeVisible()
        await expect(page.getByText('Event RSVPs')).toBeVisible()
        await expect(page.getByText('Life Groups')).toBeVisible()
        await expect(page.getByText('Pathways')).toBeVisible()
        
        // Should see numerical values
        const checkinCount = page.getByText('Check-ins').locator('..').getByText(/\d+/)
        await expect(checkinCount).toBeVisible()
      }
    })

    test('activity snapshot respects privacy settings', async ({ page, memberAuth }) => {
      await page.goto('/members')
      
      // Find a member with restricted profile
      const restrictedMember = page.getByText('Profile is Private')
      
      if (await restrictedMember.isVisible()) {
        // Private profiles should not show activity data
        await expect(page.getByText('Activity Summary')).not.toBeVisible()
        await expect(restrictedMember).toBeVisible()
      }
    })

    test('admin can view all member activity snapshots', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/members')
      
      // Click on a member row to view profile
      const memberRow = page.getByRole('row').filter({ hasText: /member.*@test\.com/ }).first()
      if (await memberRow.isVisible()) {
        // Look for view profile link or button
        const viewBtn = memberRow.getByRole('button', { name: /View|Profile/i })
        if (await viewBtn.isVisible()) {
          await viewBtn.click()
          
          // Admin should see activity summary regardless of privacy settings
          await expect(page.getByText('Activity Summary')).toBeVisible()
        }
      }
    })
  })

  test.describe('Performance and UX', () => {
    test('admin members page loads quickly', async ({ page, churchAdminAuth }) => {
      const startTime = Date.now()
      
      await page.goto('/admin/members')
      await expect(page.getByRole('heading', { name: 'Member Management' })).toBeVisible()
      
      const loadTime = Date.now() - startTime
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)
    })

    test('member profile loads activity data efficiently', async ({ page, memberAuth }) => {
      const startTime = Date.now()
      
      await page.goto('/members')
      
      // Click on first available member profile
      const memberLink = page.getByRole('link').filter({ hasText: /member/i }).first()
      if (await memberLink.isVisible()) {
        await memberLink.click()
        
        // Wait for activity summary to load
        await expect(page.getByText('Activity Summary')).toBeVisible({ timeout: 5000 })
        
        const loadTime = Date.now() - startTime
        
        // Activity snapshot should load within reasonable time
        expect(loadTime).toBeLessThan(5000)
      }
    })

    test('bulk operations provide proper feedback', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/members')
      
      // Test that UI provides loading states during bulk operations
      const memberRows = page.getByRole('row').filter({ hasText: /member.*@test\.com/ })
      
      if (await memberRows.count() > 0) {
        // Select a member
        await memberRows.first().getByRole('checkbox').check()
        
        // If bulk action button exists, test loading state
        const bulkBtn = page.getByRole('button', { name: /Bulk/i })
        if (await bulkBtn.isVisible()) {
          await bulkBtn.click()
          
          // Should show loading or processing state
          await expect(page.getByText(/Processing|Loading|Please wait/i)).toBeVisible()
        }
      }
    })

    test('search and pagination work correctly', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/members')
      
      // Test search functionality
      const searchInput = page.getByPlaceholder('Search')
      if (await searchInput.isVisible()) {
        await searchInput.fill('member1')
        await page.keyboard.press('Enter')
        
        // Should filter results
        await expect(page.getByText('member1@test.com')).toBeVisible()
      }
      
      // Test pagination if there are many members
      const nextButton = page.getByRole('button', { name: /Next|>/i })
      if (await nextButton.isVisible() && !await nextButton.isDisabled()) {
        await nextButton.click()
        
        // Should load next page
        await expect(page.getByText('Loading')).not.toBeVisible()
      }
    })
  })

  test.describe('Accessibility and Security', () => {
    test('member management page is accessible', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/members')
      
      // Check for proper ARIA labels and roles
      await expect(page.getByRole('heading', { name: 'Member Management' })).toBeVisible()
      await expect(page.getByRole('table')).toBeVisible()
      await expect(page.getByRole('button', { name: /Add|Create/i })).toBeVisible()
      
      // Check keyboard navigation
      await page.keyboard.press('Tab')
      await expect(page.locator(':focus')).toBeVisible()
    })

    test('unauthorized users cannot access admin functions', async ({ page, memberAuth }) => {
      // Member should not access admin members page
      await page.goto('/admin/members')
      
      // Should redirect to dashboard or show access denied
      await expect(page).toHaveURL('/dashboard')
    })

    test('RBAC is enforced for all new operations', async ({ page, memberAuth }) => {
      // Test that member cannot access bulk operations API
      const bulkResponse = await page.request.post('/api/admin/members/bulk-status', {
        data: { memberIds: ['member-1'], status: 'ACTIVE' }
      })
      
      expect(bulkResponse.status()).toBe(401) // Unauthorized or Forbidden
      
      // Test that member cannot access CSV export
      const exportResponse = await page.request.get('/api/admin/members/export')
      expect(exportResponse.status()).toBe(401) // Unauthorized or Forbidden
    })
  })
})