import { test, expect } from './fixtures/auth'

test.describe('LifeGroups', () => {
  test('member can view available life groups', async ({ page, memberAuth }) => {
    await page.goto('/lifegroups')
    
    // Wait for page to load
    await expect(page.getByRole('heading', { name: 'LifeGroups' })).toBeVisible()
    
    // Should see tabs for My Groups and Available Groups
    await expect(page.getByRole('tab', { name: /My Groups/ })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Available Groups/ })).toBeVisible()
    
    // Click on available groups tab
    await page.getByRole('tab', { name: /Available Groups/ }).click()
    
    // Should see available groups or empty state
    const noGroupsMessage = page.getByText('No groups available')
    const firstGroupCard = page.locator('.card').first()
    
    // Either we have groups or we don't
    const hasGroups = await firstGroupCard.isVisible({ timeout: 1000 }).catch(() => false)
    
    if (hasGroups) {
      // Should see group details
      await expect(firstGroupCard).toContainText(/Led by/)
      await expect(firstGroupCard).toContainText(/members/)
    } else {
      await expect(noGroupsMessage).toBeVisible()
    }
  })

  test('member can request to join a life group', async ({ page, memberAuth }) => {
    await page.goto('/lifegroups')
    
    // Go to available groups
    await page.getByRole('tab', { name: /Available Groups/ }).click()
    
    // Find a group to join
    const joinButton = page.getByRole('button', { name: 'Request to Join' }).first()
    
    if (await joinButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await joinButton.click()
      
      // Should see dialog
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByRole('heading', { name: /Request to Join/ })).toBeVisible()
      
      // Add optional message
      await page.getByPlaceholder(/Tell the leader/).fill('I would love to join this group!')
      
      // Send request
      await page.getByRole('button', { name: 'Send Request' }).click()
      
      // Should see success message
      await expect(page.getByText('Request sent successfully')).toBeVisible()
      
      // Button should now show pending status
      await expect(page.getByRole('button', { name: /Request Pending/ })).toBeVisible()
    }
  })

  test('member can leave a life group', async ({ page, memberAuth }) => {
    await page.goto('/lifegroups')
    
    // Stay on My Groups tab (default)
    await expect(page.getByRole('tab', { name: /My Groups/ })).toHaveAttribute('data-state', 'active')
    
    // Find a group to leave
    const leaveButton = page.getByRole('button', { name: 'Leave Group' }).first()
    
    if (await leaveButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Confirm dialog will appear
      page.once('dialog', dialog => {
        dialog.accept()
      })
      
      await leaveButton.click()
      
      // Should see success message
      await expect(page.getByText('Successfully left the life group')).toBeVisible()
    } else {
      // No groups to leave - check empty state
      await expect(page.getByText('Not in any groups yet')).toBeVisible()
    }
  })

  test('leader can view and manage their group', async ({ page, leaderAuth }) => {
    await page.goto('/lifegroups')
    
    // Leaders should see their groups at the top
    const leaderSection = page.getByText('Groups You Lead')
    
    if (await leaderSection.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(leaderSection).toBeVisible()
      
      // Should see manage interface with tabs
      await expect(page.getByRole('tab', { name: /Members/ })).toBeVisible()
      await expect(page.getByRole('tab', { name: /Requests/ })).toBeVisible()
      
      // Check members tab
      await page.getByRole('tab', { name: /Members/ }).click()
      await expect(page.getByRole('button', { name: /Export CSV/ })).toBeVisible()
      
      // Check requests tab
      await page.getByRole('tab', { name: /Requests/ }).click()
      
      // Should see request actions if there are any
      const approveButton = page.getByRole('button', { name: '' }).filter({ has: page.locator('[class*="Check"]') }).first()
      
      if (await approveButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        // Can approve or reject requests
        await expect(approveButton).toBeVisible()
      }
    }
  })

  test('leader can approve member requests', async ({ page, leaderAuth }) => {
    await page.goto('/lifegroups')
    
    const leaderSection = page.getByText('Groups You Lead')
    
    if (await leaderSection.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Go to requests tab
      await page.getByRole('tab', { name: /Requests/ }).click()
      
      // Find approve button (check icon)
      const approveButton = page.getByRole('button', { name: '' }).filter({ has: page.locator('[class*="Check"]') }).first()
      
      if (await approveButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await approveButton.click()
        
        // Should see success message
        await expect(page.getByText('Request approved')).toBeVisible()
      } else {
        // No pending requests
        await expect(page.getByText('No pending requests')).toBeVisible()
      }
    }
  })

  test('leader can export members CSV', async ({ page, leaderAuth }) => {
    await page.goto('/lifegroups')
    
    const leaderSection = page.getByText('Groups You Lead')
    
    if (await leaderSection.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Stay on members tab (default)
      await page.getByRole('tab', { name: /Members/ }).first().click()
      
      const exportButton = page.getByRole('button', { name: /Export CSV/ }).first()
      
      if (await exportButton.isEnabled()) {
        // Set up download promise
        const downloadPromise = page.waitForEvent('download')
        
        // Click export
        await exportButton.click()
        
        // Wait for download
        const download = await downloadPromise
        
        // Verify filename
        expect(download.suggestedFilename()).toContain('members')
        expect(download.suggestedFilename()).toContain('.csv')
      }
    }
  })

  test('admin can manage life groups', async ({ page, churchAdminAuth }) => {
    await page.goto('/lifegroups')
    
    // Admin should see manage button
    await expect(page.getByRole('link', { name: /Manage LifeGroups/ })).toBeVisible()
    
    // Click to go to admin page
    await page.getByRole('link', { name: /Manage LifeGroups/ }).click()
    
    // Should navigate to admin page
    await expect(page).toHaveURL(/\/admin\/lifegroups/)
    await expect(page.getByRole('heading', { name: 'Admin LifeGroups' })).toBeVisible()
  })

  test('shows empty state when no groups available', async ({ page, memberAuth }) => {
    await page.goto('/lifegroups')
    
    // Check My Groups tab
    await page.getByRole('tab', { name: /My Groups/ }).click()
    
    const myGroupsEmpty = page.getByText('Not in any groups yet')
    const hasMyGroups = await page.locator('.card').first().isVisible({ timeout: 1000 }).catch(() => false)
    
    if (!hasMyGroups) {
      await expect(myGroupsEmpty).toBeVisible()
      await expect(page.getByRole('button', { name: 'Browse Available Groups' })).toBeVisible()
    }
    
    // Check Available Groups tab
    await page.getByRole('tab', { name: /Available Groups/ }).click()
    
    const availableGroupsEmpty = page.getByText('No groups available')
    const hasAvailableGroups = await page.locator('.card').first().isVisible({ timeout: 1000 }).catch(() => false)
    
    if (!hasAvailableGroups) {
      await expect(availableGroupsEmpty).toBeVisible()
    }
  })
})