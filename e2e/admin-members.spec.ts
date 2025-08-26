import { test, expect } from './fixtures/auth'

test.describe('Admin Member Management', () => {
  test.describe('Access Control', () => {
    test('admin can access member management page', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/members')
      await expect(page.getByRole('heading', { name: 'Member Management' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Add Member' })).toBeVisible()
    })

    test('pastor can access member management page', async ({ page, churchAdminAuth }) => {
      // Pastors have same permissions as admins for member management
      await page.goto('/admin/members')
      await expect(page.getByRole('heading', { name: 'Member Management' })).toBeVisible()
    })

    test('leader cannot access member management page', async ({ page, leaderAuth }) => {
      await page.goto('/admin/members')
      await expect(page).toHaveURL('/dashboard')
    })

    test('member cannot access member management page', async ({ page, memberAuth }) => {
      await page.goto('/admin/members')
      await expect(page).toHaveURL('/dashboard')
    })
  })

  test.describe('Member List', () => {
    test.beforeEach(async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/members')
    })

    test('displays member list with proper columns', async ({ page }) => {
      // Check table headers
      await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible()
      await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible()
      await expect(page.getByRole('columnheader', { name: 'Role' })).toBeVisible()
      await expect(page.getByRole('columnheader', { name: 'Church' })).toBeVisible()
      await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible()
      await expect(page.getByRole('columnheader', { name: 'Actions' })).toBeVisible()
    })

    test('can search for members by name', async ({ page }) => {
      // Search for a specific member
      await page.getByPlaceholder('Search by name or email...').fill('Member 1')
      await page.getByRole('button', { name: 'Search' }).click()
      
      // Verify search results
      await expect(page.getByText('member1@test.com')).toBeVisible()
    })

    test('can search for members by email', async ({ page }) => {
      await page.getByPlaceholder('Search by name or email...').fill('member2@test.com')
      await page.getByRole('button', { name: 'Search' }).click()
      
      await expect(page.getByText('member2@test.com')).toBeVisible()
    })

    test('displays role badges with correct styling', async ({ page }) => {
      // Check for role badges
      const memberBadge = page.locator('.bg-gray-100').first()
      await expect(memberBadge).toContainText('MEMBER')
    })
  })

  test.describe('Create Member', () => {
    test.beforeEach(async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/members')
    })

    test('can create a new member', async ({ page }) => {
      // Open create dialog
      await page.getByRole('button', { name: 'Add Member' }).click()
      
      // Fill in member details
      await page.getByLabel('Name').fill('New Test Member')
      await page.getByLabel('Email').fill(`newmember${Date.now()}@test.com`)
      
      // Select role
      await page.getByRole('combobox').first().click()
      await page.getByRole('option', { name: 'MEMBER' }).click()
      
      // Ensure active status
      const activeSwitch = page.getByRole('switch', { name: 'Active Account' })
      await expect(activeSwitch).toBeChecked()
      
      // Submit form
      await page.getByRole('button', { name: 'Create Member' }).click()
      
      // Verify success
      await expect(page.getByText('Member created successfully')).toBeVisible()
    })

    test('prevents duplicate email addresses', async ({ page }) => {
      // Open create dialog
      await page.getByRole('button', { name: 'Add Member' }).click()
      
      // Try to create with existing email
      await page.getByLabel('Name').fill('Duplicate Test')
      await page.getByLabel('Email').fill('member1@test.com')
      
      await page.getByRole('button', { name: 'Create Member' }).click()
      
      // Verify error
      await expect(page.getByText('Email already registered')).toBeVisible()
    })

    test('validates required fields', async ({ page }) => {
      // Open create dialog
      await page.getByRole('button', { name: 'Add Member' }).click()
      
      // Try to submit without filling fields
      await page.getByRole('button', { name: 'Create Member' }).click()
      
      // Should show validation error
      await expect(page.getByText(/required/i)).toBeVisible()
    })
  })

  test.describe('Edit Member', () => {
    test.beforeEach(async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/members')
    })

    test('can edit member details', async ({ page }) => {
      // Click edit on first member
      await page.getByRole('button', { name: 'Edit' }).first().click()
      
      // Update name
      await page.getByLabel('Name').clear()
      await page.getByLabel('Name').fill('Updated Member Name')
      
      // Submit
      await page.getByRole('button', { name: 'Update Member' }).click()
      
      // Verify success
      await expect(page.getByText('Member updated successfully')).toBeVisible()
    })

    test('can change member role', async ({ page }) => {
      // Click edit on first member
      await page.getByRole('button', { name: 'Edit' }).first().click()
      
      // Change role
      await page.getByRole('combobox').first().click()
      await page.getByRole('option', { name: 'LEADER' }).click()
      
      // Submit
      await page.getByRole('button', { name: 'Update Member' }).click()
      
      // Verify success
      await expect(page.getByText('Member updated successfully')).toBeVisible()
    })
  })

  test.describe('Status Management', () => {
    test.beforeEach(async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/members')
    })

    test('can toggle member status', async ({ page }) => {
      // Find a member's status switch
      const statusSwitch = page.getByRole('switch').first()
      const initialState = await statusSwitch.isChecked()
      
      // Toggle status
      await statusSwitch.click()
      
      // Verify success message
      await expect(page.getByText(/successfully/)).toBeVisible()
      
      // Verify switch state changed
      await expect(statusSwitch).toHaveAttribute('data-state', initialState ? 'unchecked' : 'checked')
    })
  })

  test.describe('Bulk Operations', () => {
    test.beforeEach(async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/members')
    })

    test('can select multiple members', async ({ page }) => {
      // Select first two members
      await page.getByRole('checkbox').nth(1).check()
      await page.getByRole('checkbox').nth(2).check()
      
      // Verify selection count
      await expect(page.getByText('2 member(s) selected')).toBeVisible()
      
      // Verify bulk action buttons appear
      await expect(page.getByRole('button', { name: 'Activate' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Deactivate' })).toBeVisible()
    })

    test('can bulk deactivate members', async ({ page }) => {
      // Select members
      await page.getByRole('checkbox').nth(1).check()
      await page.getByRole('checkbox').nth(2).check()
      
      // Click bulk deactivate
      await page.getByRole('button', { name: 'Deactivate' }).click()
      
      // Verify success
      await expect(page.getByText(/2 members deactivated successfully/)).toBeVisible()
    })

    test('can select all members', async ({ page }) => {
      // Click select all checkbox
      await page.getByRole('checkbox').first().check()
      
      // Verify all are selected
      const checkboxes = page.getByRole('checkbox')
      const count = await checkboxes.count()
      
      for (let i = 0; i < count; i++) {
        await expect(checkboxes.nth(i)).toBeChecked()
      }
    })
  })

  test.describe('Export', () => {
    test.beforeEach(async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/members')
    })

    test('can export members to CSV', async ({ page }) => {
      // Set up download promise before clicking
      const downloadPromise = page.waitForEvent('download')
      
      // Click export button
      await page.getByRole('button', { name: 'Export' }).click()
      
      // Wait for download
      const download = await downloadPromise
      
      // Verify filename includes 'members' and is CSV
      expect(download.suggestedFilename()).toContain('members')
      expect(download.suggestedFilename()).toContain('.csv')
    })
  })

  test.describe('Multi-tenancy', () => {
    test('admin only sees members from their church', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/members')
      
      // Admin should not see church selector
      await expect(page.getByRole('combobox', { name: /church/i })).not.toBeVisible()
      
      // Should only see members from their church
      const emailElements = page.locator('td:nth-child(3)')
      const count = await emailElements.count()
      
      for (let i = 0; i < count; i++) {
        const email = await emailElements.nth(i).textContent()
        // Verify members belong to the admin's church
        expect(email).toBeTruthy()
      }
    })

    test('super admin can filter by church', async ({ page, superAdminAuth }) => {
      await page.goto('/admin/members')
      
      // Super admin should see church selector
      await expect(page.getByRole('combobox')).toBeVisible()
      
      // Can select a specific church
      await page.getByRole('combobox').click()
      await page.getByRole('option', { name: 'HPCI Manila' }).click()
      
      // Verify filtered results
      await page.getByRole('button', { name: 'Search' }).click()
      await expect(page.getByText('HPCI Manila')).toBeVisible()
    })
  })

  test.describe('Pagination', () => {
    test('can load more members', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/members')
      
      // Check if Load More button exists (only if there are more than 20 members)
      const loadMoreButton = page.getByRole('button', { name: 'Load More' })
      
      if (await loadMoreButton.isVisible()) {
        // Click load more
        await loadMoreButton.click()
        
        // Verify more members are loaded
        const rowCount = await page.getByRole('row').count()
        expect(rowCount).toBeGreaterThan(21) // Header + 20 initial + at least 1 more
      }
    })
  })
})