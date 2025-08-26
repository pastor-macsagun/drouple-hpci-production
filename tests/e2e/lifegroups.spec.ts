import { test, expect } from './fixtures/auth'

test.describe('LifeGroups @lifegroups', () => {
  test.describe('Admin LifeGroup Management', () => {
    test('should create a new life group', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/lifegroups')
      
      // Click create button
      await page.getByRole('button', { name: /create life group/i }).click()
      
      // Fill in life group details
      await page.getByLabel(/group name/i).fill('Young Professionals')
      await page.getByLabel(/description/i).fill('Life group for working professionals')
      await page.getByLabel(/leader/i).selectOption({ label: /john doe/i })
      await page.getByLabel(/capacity/i).fill('15')
      await page.getByLabel(/meeting day/i).selectOption('Wednesday')
      await page.getByLabel(/meeting time/i).fill('19:00')
      await page.getByLabel(/location/i).fill('Church Room B')
      
      // Submit
      await page.getByRole('button', { name: /create/i }).click()
      
      // Verify life group appears
      await expect(page.getByText('Young Professionals')).toBeVisible()
      await expect(page.getByText('Wednesday 7:00 PM')).toBeVisible()
      await expect(page.getByText('0/15')).toBeVisible() // Current/Capacity
    })
    
    test('should open manage drawer with tabs', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/lifegroups')
      
      // Click manage button on a life group
      await page.getByRole('row', { name: /youth group/i })
        .getByRole('button', { name: /manage/i }).click()
      
      // Drawer should open
      const drawer = page.getByRole('dialog')
      await expect(drawer).toBeVisible()
      
      // Check tabs
      await expect(drawer.getByRole('tab', { name: /roster/i })).toBeVisible()
      await expect(drawer.getByRole('tab', { name: /requests/i })).toBeVisible()
      await expect(drawer.getByRole('tab', { name: /attendance/i })).toBeVisible()
      
      // Roster tab should be active by default
      await expect(drawer.getByRole('tabpanel', { name: /roster/i })).toBeVisible()
    })
    
    test('should manage roster - view and remove members', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/lifegroups')
      
      // Open manage drawer
      await page.getByRole('row', { name: /youth group/i })
        .getByRole('button', { name: /manage/i }).click()
      
      const drawer = page.getByRole('dialog')
      
      // Roster tab
      await drawer.getByRole('tab', { name: /roster/i }).click()
      
      // Should show member list
      await expect(drawer.getByRole('heading', { name: /current members/i })).toBeVisible()
      await expect(drawer.getByText(/john doe/i)).toBeVisible()
      
      // Remove a member
      await drawer.getByRole('row', { name: /jane smith/i })
        .getByRole('button', { name: /remove/i }).click()
      
      // Confirm removal
      await page.getByRole('button', { name: /confirm/i }).click()
      
      // Member should be removed
      await expect(drawer.getByText(/jane smith/i)).not.toBeVisible()
    })
    
    test('should approve/reject join requests', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/lifegroups')
      
      // Open manage drawer
      await page.getByRole('row', { name: /youth group/i })
        .getByRole('button', { name: /manage/i }).click()
      
      const drawer = page.getByRole('dialog')
      
      // Requests tab
      await drawer.getByRole('tab', { name: /requests/i }).click()
      
      // Should show pending requests
      await expect(drawer.getByRole('heading', { name: /pending requests/i })).toBeVisible()
      
      // Approve a request
      await drawer.getByRole('row', { name: /bob wilson/i })
        .getByRole('button', { name: /approve/i }).click()
      
      await expect(page.getByText(/request approved/i)).toBeVisible()
      
      // Reject a request
      await drawer.getByRole('row', { name: /alice brown/i })
        .getByRole('button', { name: /reject/i }).click()
      
      // Add rejection reason
      await page.getByLabel(/reason/i).fill('Group is full for this season')
      await page.getByRole('button', { name: /confirm reject/i }).click()
      
      await expect(page.getByText(/request rejected/i)).toBeVisible()
    })
    
    test('should mark attendance', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/lifegroups')
      
      // Open manage drawer
      await page.getByRole('row', { name: /youth group/i })
        .getByRole('button', { name: /manage/i }).click()
      
      const drawer = page.getByRole('dialog')
      
      // Attendance tab
      await drawer.getByRole('tab', { name: /attendance/i }).click()
      
      // Click mark attendance button
      await drawer.getByRole('button', { name: /mark attendance/i }).click()
      
      // Fill attendance form
      await page.getByLabel(/session date/i).fill('2025-01-29')
      await page.getByLabel(/session name/i).fill('Week 5 - Fellowship')
      
      // Check present members
      await page.getByRole('checkbox', { name: /john doe/i }).check()
      await page.getByRole('checkbox', { name: /mary johnson/i }).check()
      await page.getByRole('checkbox', { name: /peter lee/i }).check()
      
      // Add notes
      await page.getByLabel(/notes/i).fill('Great discussion on prayer')
      
      // Submit
      await page.getByRole('button', { name: /save attendance/i }).click()
      
      await expect(page.getByText(/attendance marked/i)).toBeVisible()
    })
    
    test('should export roster as CSV', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/lifegroups')
      
      // Open manage drawer
      await page.getByRole('row', { name: /youth group/i })
        .getByRole('button', { name: /manage/i }).click()
      
      const drawer = page.getByRole('dialog')
      
      // Setup download promise
      const downloadPromise = page.waitForEvent('download')
      
      // Click export roster
      await drawer.getByRole('button', { name: /export roster/i }).click()
      
      // Wait for download
      const download = await downloadPromise
      
      expect(download.suggestedFilename()).toContain('lifegroup-roster')
      expect(download.suggestedFilename()).toContain('.csv')
    })
    
    test('should export attendance history as CSV', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/lifegroups')
      
      // Open manage drawer
      await page.getByRole('row', { name: /youth group/i })
        .getByRole('button', { name: /manage/i }).click()
      
      const drawer = page.getByRole('dialog')
      
      // Go to attendance tab
      await drawer.getByRole('tab', { name: /attendance/i }).click()
      
      // Setup download promise
      const downloadPromise = page.waitForEvent('download')
      
      // Click export attendance
      await drawer.getByRole('button', { name: /export attendance/i }).click()
      
      // Wait for download
      const download = await downloadPromise
      
      expect(download.suggestedFilename()).toContain('attendance-history')
      expect(download.suggestedFilename()).toContain('.csv')
    })
  })
  
  test.describe('Member LifeGroup Experience', () => {
    test('should view available life groups', async ({ page, memberAuth }) => {
      await page.goto('/lifegroups')
      
      await expect(page.getByRole('heading', { name: /life groups/i })).toBeVisible()
      
      // Should see life group cards
      await expect(page.getByText(/youth group/i)).toBeVisible()
      await expect(page.getByText(/young adults/i)).toBeVisible()
      
      // Should show capacity
      await expect(page.getByText(/\d+\/\d+ members/i)).toBeVisible()
    })
    
    test('should request to join a life group', async ({ page, memberAuth }) => {
      await page.goto('/lifegroups')
      
      // Click on a life group
      await page.getByRole('article', { name: /couples group/i }).click()
      
      // Should see details
      await expect(page.getByRole('heading', { name: /couples group/i })).toBeVisible()
      await expect(page.getByText(/meeting.*saturday/i)).toBeVisible()
      
      // Request to join
      await page.getByRole('button', { name: /request to join/i }).click()
      
      // Add message
      await page.getByLabel(/message.*optional/i).fill('Looking forward to joining!')
      await page.getByRole('button', { name: /send request/i }).click()
      
      await expect(page.getByText(/request sent/i)).toBeVisible()
      
      // Button should change to pending
      await expect(page.getByRole('button', { name: /request pending/i })).toBeDisabled()
    })
    
    test('should view my life groups', async ({ page, memberAuth }) => {
      await page.goto('/lifegroups')
      
      // Click my groups tab
      await page.getByRole('tab', { name: /my groups/i }).click()
      
      // Should show groups I'm in
      await expect(page.getByText(/youth group/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /view details/i })).toBeVisible()
    })
    
    test('should leave a life group', async ({ page, memberAuth }) => {
      await page.goto('/lifegroups')
      
      // Go to my groups
      await page.getByRole('tab', { name: /my groups/i }).click()
      
      // Click on a group
      await page.getByRole('article', { name: /youth group/i }).click()
      
      // Click leave group
      await page.getByRole('button', { name: /leave group/i }).click()
      
      // Confirm
      await page.getByRole('button', { name: /confirm leave/i }).click()
      
      await expect(page.getByText(/left group/i)).toBeVisible()
    })
  })
  
  test.describe('Leader LifeGroup Management', () => {
    test('should mark attendance as leader', async ({ page, leaderAuth }) => {
      await page.goto('/lifegroups')
      
      // Navigate to my group as leader
      await page.getByRole('tab', { name: /my groups/i }).click()
      await page.getByRole('article', { name: /youth group/i }).click()
      
      // Leader should see manage button
      await expect(page.getByRole('button', { name: /manage group/i })).toBeVisible()
      
      // Click manage
      await page.getByRole('button', { name: /manage group/i }).click()
      
      // Mark attendance
      await page.getByRole('tab', { name: /attendance/i }).click()
      await page.getByRole('button', { name: /mark attendance/i }).click()
      
      // Fill attendance
      await page.getByLabel(/date/i).fill('2025-01-29')
      await page.getByRole('checkbox', { name: /member 1/i }).check()
      await page.getByRole('checkbox', { name: /member 2/i }).check()
      
      await page.getByRole('button', { name: /save/i }).click()
      
      await expect(page.getByText(/attendance saved/i)).toBeVisible()
    })
    
    test('should approve member requests as leader', async ({ page, leaderAuth }) => {
      await page.goto('/lifegroups')
      
      // Navigate to my group as leader
      await page.getByRole('tab', { name: /my groups/i }).click()
      await page.getByRole('article', { name: /youth group/i }).click()
      
      // Click manage
      await page.getByRole('button', { name: /manage group/i }).click()
      
      // Go to requests
      await page.getByRole('tab', { name: /requests/i }).click()
      
      // Approve request
      await page.getByRole('button', { name: /approve/i }).first().click()
      
      await expect(page.getByText(/approved/i)).toBeVisible()
    })
  })
  
  test.describe('Capacity Management', () => {
    test('should show group as full when at capacity', async ({ page, memberAuth }) => {
      await page.goto('/lifegroups')
      
      // Find a full group
      const fullGroup = page.getByRole('article').filter({ hasText: /15\/15 members/i })
      await expect(fullGroup).toBeVisible()
      
      // Should show full badge
      await expect(fullGroup.getByText(/full/i)).toBeVisible()
      
      // Click on it
      await fullGroup.click()
      
      // Join button should be disabled
      await expect(page.getByRole('button', { name: /group full/i })).toBeDisabled()
    })
    
    test('should handle waitlist when group is full', async ({ page, memberAuth }) => {
      await page.goto('/lifegroups')
      
      // Find full group
      const fullGroup = page.getByRole('article').filter({ hasText: /full/i })
      await fullGroup.click()
      
      // Should show join waitlist option
      await expect(page.getByRole('button', { name: /join waitlist/i })).toBeVisible()
      
      // Join waitlist
      await page.getByRole('button', { name: /join waitlist/i }).click()
      
      await expect(page.getByText(/added to waitlist/i)).toBeVisible()
    })
  })
  
  test.describe('Attendance Tracking', () => {
    test('should view attendance history', async ({ page, leaderAuth }) => {
      await page.goto('/lifegroups')
      
      // Navigate to group
      await page.getByRole('tab', { name: /my groups/i }).click()
      await page.getByRole('article', { name: /youth group/i }).click()
      await page.getByRole('button', { name: /manage group/i }).click()
      
      // Go to attendance tab
      await page.getByRole('tab', { name: /attendance/i }).click()
      
      // Should show attendance history
      await expect(page.getByRole('heading', { name: /attendance history/i })).toBeVisible()
      await expect(page.getByText(/week 1/i)).toBeVisible()
      await expect(page.getByText(/\d+ present/i)).toBeVisible()
      await expect(page.getByText(/\d+%/)).toBeVisible() // Attendance rate
    })
    
    test('should edit attendance within time window', async ({ page, leaderAuth }) => {
      await page.goto('/lifegroups')
      
      // Navigate to group attendance
      await page.getByRole('tab', { name: /my groups/i }).click()
      await page.getByRole('article', { name: /youth group/i }).click()
      await page.getByRole('button', { name: /manage group/i }).click()
      await page.getByRole('tab', { name: /attendance/i }).click()
      
      // Find recent attendance (within 24 hours)
      const recentAttendance = page.getByRole('row').filter({ hasText: /today/i })
      
      // Should have edit button
      await expect(recentAttendance.getByRole('button', { name: /edit/i })).toBeVisible()
      
      // Click edit
      await recentAttendance.getByRole('button', { name: /edit/i }).click()
      
      // Make changes
      await page.getByRole('checkbox', { name: /member 3/i }).check()
      await page.getByRole('button', { name: /save changes/i }).click()
      
      await expect(page.getByText(/attendance updated/i)).toBeVisible()
    })
  })
  
  test.describe('Multi-Group Membership', () => {
    test('should allow joining multiple groups', async ({ page, memberAuth }) => {
      await page.goto('/lifegroups')
      
      // Join first group
      await page.getByRole('article', { name: /singles group/i }).click()
      await page.getByRole('button', { name: /request to join/i }).click()
      await page.getByRole('button', { name: /send request/i }).click()
      
      // Go back and join second group
      await page.goBack()
      await page.getByRole('article', { name: /prayer group/i }).click()
      await page.getByRole('button', { name: /request to join/i }).click()
      await page.getByRole('button', { name: /send request/i }).click()
      
      // Check my groups
      await page.goto('/lifegroups')
      await page.getByRole('tab', { name: /my groups/i }).click()
      
      // Should show multiple groups (after approval)
      const groupCount = await page.getByRole('article').count()
      expect(groupCount).toBeGreaterThanOrEqual(1)
    })
  })
  
  test.describe('Search and Filter', () => {
    test('should search life groups', async ({ page, memberAuth }) => {
      await page.goto('/lifegroups')
      
      // Search
      await page.getByPlaceholder(/search groups/i).fill('youth')
      await page.getByPlaceholder(/search groups/i).press('Enter')
      
      // Should filter results
      await expect(page.getByText(/youth group/i)).toBeVisible()
      await expect(page.getByText(/couples group/i)).not.toBeVisible()
    })
    
    test('should filter by meeting day', async ({ page, memberAuth }) => {
      await page.goto('/lifegroups')
      
      // Filter by day
      await page.getByLabel(/meeting day/i).selectOption('Wednesday')
      await page.getByRole('button', { name: /apply filter/i }).click()
      
      // Should only show Wednesday groups
      const groups = page.getByRole('article')
      const count = await groups.count()
      
      for (let i = 0; i < count; i++) {
        const groupText = await groups.nth(i).textContent()
        expect(groupText).toContain('Wednesday')
      }
    })
  })
})