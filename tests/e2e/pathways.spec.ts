import { test, expect } from './fixtures/auth'

test.describe('Pathways @pathways', () => {
  test.describe('Admin Pathway Management', () => {
    test('should create a new pathway', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/pathways')
      
      // Click create pathway button
      await page.getByRole('button', { name: /create pathway/i }).click()
      
      // Fill pathway details
      await page.getByLabel(/pathway name/i).fill('Leadership Development')
      await page.getByLabel(/description/i).fill('Training program for future leaders')
      await page.getByLabel(/type/i).selectOption('VINES')
      await page.getByLabel(/order/i).fill('4')
      await page.getByRole('checkbox', { name: /required/i }).uncheck()
      await page.getByRole('checkbox', { name: /auto-enroll/i }).uncheck()
      
      // Submit
      await page.getByRole('button', { name: /create pathway/i }).click()
      
      // Verify pathway appears
      await expect(page.getByText('Leadership Development')).toBeVisible()
      await expect(page.getByText('VINES')).toBeVisible()
    })
    
    test('should add steps to pathway', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/pathways')
      
      // Click on a pathway to manage
      await page.getByRole('row', { name: /roots/i }).click()
      
      // Modal should open
      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()
      
      // Click add step
      await modal.getByRole('button', { name: /add step/i }).click()
      
      // Fill step details
      await page.getByLabel(/step name/i).fill('Church History')
      await page.getByLabel(/description/i).fill('Understanding our church heritage')
      await page.getByLabel(/order/i).fill('4')
      await page.getByLabel(/materials/i).fill('https://church.org/history.pdf')
      await page.getByRole('checkbox', { name: /required/i }).check()
      
      // Save step
      await page.getByRole('button', { name: /save step/i }).click()
      
      // Step should appear
      await expect(modal.getByText('Church History')).toBeVisible()
    })
    
    test('should reorder pathway steps', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/pathways')
      
      // Open pathway
      await page.getByRole('row', { name: /roots/i }).click()
      
      const modal = page.getByRole('dialog')
      
      // Find step to move
      const step = modal.getByRole('row', { name: /salvation/i })
      
      // Click move down button
      await step.getByRole('button', { name: /move down/i }).click()
      
      // Order should change
      await expect(modal.getByRole('row').nth(2)).toContainText('Salvation')
    })
    
    test('should delete a step', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/pathways')
      
      // Create test pathway with step
      await page.getByRole('button', { name: /create pathway/i }).click()
      await page.getByLabel(/pathway name/i).fill('Test Pathway')
      await page.getByLabel(/type/i).selectOption('VINES')
      await page.getByRole('button', { name: /create pathway/i }).click()
      
      // Open it
      await page.getByRole('row', { name: /test pathway/i }).click()
      
      const modal = page.getByRole('dialog')
      
      // Add a step
      await modal.getByRole('button', { name: /add step/i }).click()
      await page.getByLabel(/step name/i).fill('Test Step')
      await page.getByRole('button', { name: /save step/i }).click()
      
      // Delete the step
      await modal.getByRole('row', { name: /test step/i })
        .getByRole('button', { name: /delete/i }).click()
      
      // Confirm deletion
      await page.getByRole('button', { name: /confirm delete/i }).click()
      
      // Step should be removed
      await expect(modal.getByText('Test Step')).not.toBeVisible()
    })
  })
  
  test.describe('New Believer Auto-Enrollment', () => {
    test('should auto-enroll new believer in ROOTS pathway', async ({ page, memberAuth }) => {
      await page.goto('/checkin')
      
      // Select a service
      await page.getByRole('button', { name: /sunday service/i }).click()
      
      // Check new believer checkbox
      await page.getByRole('checkbox', { name: /new believer/i }).check()
      
      // Check in
      await page.getByRole('button', { name: /check in/i }).click()
      
      await expect(page.getByText(/welcome to the family/i)).toBeVisible()
      
      // Navigate to pathways
      await page.goto('/pathways')
      
      // Should show ROOTS enrollment
      await expect(page.getByText(/roots.*enrolled/i)).toBeVisible()
      await expect(page.getByText(/new believer foundations/i)).toBeVisible()
    })
  })
  
  test.describe('Member Pathway Experience', () => {
    test('should view available pathways', async ({ page, memberAuth }) => {
      await page.goto('/pathways')
      
      await expect(page.getByRole('heading', { name: /pathways/i })).toBeVisible()
      
      // Should see pathways
      await expect(page.getByText(/roots/i)).toBeVisible()
      await expect(page.getByText(/vines/i)).toBeVisible()
      await expect(page.getByText(/retreat/i)).toBeVisible()
    })
    
    test('should enroll in optional pathway', async ({ page, memberAuth }) => {
      await page.goto('/pathways')
      
      // Click on VINES pathway
      await page.getByRole('article', { name: /vines/i }).click()
      
      // Should see pathway details
      await expect(page.getByRole('heading', { name: /vines/i })).toBeVisible()
      await expect(page.getByText(/growing in faith/i)).toBeVisible()
      
      // Enroll
      await page.getByRole('button', { name: /enroll/i }).click()
      
      // Confirm enrollment
      await page.getByRole('button', { name: /confirm enrollment/i }).click()
      
      await expect(page.getByText(/enrolled successfully/i)).toBeVisible()
      
      // Should show progress
      await expect(page.getByText(/0% complete/i)).toBeVisible()
    })
    
    test('should view pathway progress', async ({ page, memberAuth }) => {
      await page.goto('/pathways')
      
      // Click my pathways tab
      await page.getByRole('tab', { name: /my pathways/i }).click()
      
      // Should show enrolled pathways
      await expect(page.getByText(/roots/i)).toBeVisible()
      await expect(page.getByText(/33% complete/i)).toBeVisible() // Example progress
      
      // Click to view details
      await page.getByRole('article', { name: /roots/i }).click()
      
      // Should show steps
      await expect(page.getByText(/salvation/i)).toBeVisible()
      await expect(page.getByText(/water baptism/i)).toBeVisible()
      await expect(page.getByText(/bible basics/i)).toBeVisible()
      
      // Should show completion status
      await expect(page.getByRole('checkbox', { name: /salvation.*completed/i })).toBeChecked()
    })
    
    test('should view step materials', async ({ page, memberAuth }) => {
      await page.goto('/pathways')
      
      // Navigate to enrolled pathway
      await page.getByRole('tab', { name: /my pathways/i }).click()
      await page.getByRole('article', { name: /roots/i }).click()
      
      // Click on a step
      await page.getByRole('row', { name: /bible basics/i }).click()
      
      // Should show step details
      const stepModal = page.getByRole('dialog')
      await expect(stepModal).toBeVisible()
      await expect(stepModal.getByRole('heading', { name: /bible basics/i })).toBeVisible()
      await expect(stepModal.getByText(/how to read the bible/i)).toBeVisible()
      
      // Should have materials link
      await expect(stepModal.getByRole('link', { name: /view materials/i })).toBeVisible()
    })
  })
  
  test.describe('Leader Progress Tracking', () => {
    test('should mark step as complete for member', async ({ page, leaderAuth }) => {
      await page.goto('/admin/pathways')
      
      // Click progress tracking
      await page.getByRole('button', { name: /track progress/i }).click()
      
      // Search for member
      await page.getByPlaceholder(/search member/i).fill('John Doe')
      await page.getByRole('button', { name: /search/i }).click()
      
      // Select member
      await page.getByRole('row', { name: /john doe/i }).click()
      
      // Should show member's pathways
      await expect(page.getByText(/roots.*enrolled/i)).toBeVisible()
      
      // Click to manage progress
      await page.getByRole('button', { name: /manage progress/i }).click()
      
      // Mark step complete
      await page.getByRole('row', { name: /water baptism/i })
        .getByRole('button', { name: /mark complete/i }).click()
      
      // Add notes
      await page.getByLabel(/completion notes/i).fill('Baptized on Sunday service')
      await page.getByRole('button', { name: /save/i }).click()
      
      await expect(page.getByText(/step marked complete/i)).toBeVisible()
    })
    
    test('should view member progress report', async ({ page, leaderAuth }) => {
      await page.goto('/admin/pathways')
      
      // Click reports
      await page.getByRole('button', { name: /progress reports/i }).click()
      
      // Should show summary
      await expect(page.getByText(/pathway completion rates/i)).toBeVisible()
      await expect(page.getByText(/roots.*85%/i)).toBeVisible() // Example rate
      await expect(page.getByText(/vines.*60%/i)).toBeVisible()
      
      // View detailed report
      await page.getByRole('button', { name: /detailed report/i }).click()
      
      // Should show member list with progress
      await expect(page.getByRole('table')).toBeVisible()
      await expect(page.getByRole('columnheader', { name: /member/i })).toBeVisible()
      await expect(page.getByRole('columnheader', { name: /pathway/i })).toBeVisible()
      await expect(page.getByRole('columnheader', { name: /progress/i })).toBeVisible()
    })
  })
  
  test.describe('Pathway Completion', () => {
    test('should auto-complete pathway when all steps done', async ({ page, leaderAuth }) => {
      await page.goto('/admin/pathways')
      
      // Track progress for a member
      await page.getByRole('button', { name: /track progress/i }).click()
      await page.getByPlaceholder(/search member/i).fill('Jane Smith')
      await page.getByRole('button', { name: /search/i }).click()
      await page.getByRole('row', { name: /jane smith/i }).click()
      await page.getByRole('button', { name: /manage progress/i }).click()
      
      // Mark final step complete
      await page.getByRole('row', { name: /prayer life/i })
        .getByRole('button', { name: /mark complete/i }).click()
      await page.getByRole('button', { name: /save/i }).click()
      
      // Should show pathway completed
      await expect(page.getByText(/pathway completed/i)).toBeVisible()
      await expect(page.getByText(/100% complete/i)).toBeVisible()
      
      // Should generate certificate
      await expect(page.getByRole('button', { name: /download certificate/i })).toBeVisible()
    })
    
    test('should download completion certificate', async ({ page, memberAuth }) => {
      await page.goto('/pathways')
      
      // Go to completed pathways
      await page.getByRole('tab', { name: /completed/i }).click()
      
      // Find completed pathway
      await page.getByRole('article', { name: /roots.*completed/i }).click()
      
      // Setup download promise
      const downloadPromise = page.waitForEvent('download')
      
      // Download certificate
      await page.getByRole('button', { name: /download certificate/i }).click()
      
      // Wait for download
      const download = await downloadPromise
      
      expect(download.suggestedFilename()).toContain('certificate')
      expect(download.suggestedFilename()).toContain('.pdf')
    })
  })
  
  test.describe('RETREAT Pathway', () => {
    test('should register for retreat', async ({ page, memberAuth }) => {
      await page.goto('/pathways')
      
      // Click on retreat pathway
      await page.getByRole('article', { name: /spiritual retreat/i }).click()
      
      // Should show retreat details
      await expect(page.getByText(/march 20-22, 2025/i)).toBeVisible()
      await expect(page.getByText(/retreat center/i)).toBeVisible()
      
      // Register
      await page.getByRole('button', { name: /register for retreat/i }).click()
      
      // Fill registration form
      await page.getByLabel(/dietary restrictions/i).fill('Vegetarian')
      await page.getByLabel(/emergency contact/i).fill('Jane Doe - 09171234567')
      
      await page.getByRole('button', { name: /complete registration/i }).click()
      
      await expect(page.getByText(/registered for retreat/i)).toBeVisible()
    })
    
    test('should mark retreat attendance', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/pathways')
      
      // Open retreat pathway
      await page.getByRole('row', { name: /spiritual retreat/i }).click()
      
      const modal = page.getByRole('dialog')
      
      // Go to attendance tab
      await modal.getByRole('tab', { name: /attendance/i }).click()
      
      // Mark attendance
      await modal.getByRole('checkbox', { name: /john doe/i }).check()
      await modal.getByRole('checkbox', { name: /jane smith/i }).check()
      
      await modal.getByRole('button', { name: /save attendance/i }).click()
      
      // Should auto-complete pathway for attendees
      await expect(page.getByText(/2 pathways completed/i)).toBeVisible()
    })
  })
  
  test.describe('Pathway Analytics', () => {
    test('should view pathway statistics', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/pathways')
      
      // Click analytics
      await page.getByRole('button', { name: /analytics/i }).click()
      
      // Should show stats
      await expect(page.getByText(/total enrolled/i)).toBeVisible()
      await expect(page.getByText(/completion rate/i)).toBeVisible()
      await expect(page.getByText(/average time to complete/i)).toBeVisible()
      
      // Should show chart
      await expect(page.getByRole('img', { name: /progress chart/i })).toBeVisible()
    })
    
    test('should identify bottleneck steps', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/pathways')
      
      // Click analytics
      await page.getByRole('button', { name: /analytics/i }).click()
      
      // Go to bottlenecks tab
      await page.getByRole('tab', { name: /bottlenecks/i }).click()
      
      // Should show problematic steps
      await expect(page.getByText(/steps with lowest completion/i)).toBeVisible()
      await expect(page.getByRole('table')).toBeVisible()
      
      // Should show step name and completion rate
      await expect(page.getByText(/water baptism.*45%/i)).toBeVisible() // Example
    })
  })
  
  test.describe('Prerequisites', () => {
    test('should enforce pathway prerequisites', async ({ page, memberAuth }) => {
      await page.goto('/pathways')
      
      // Try to enroll in advanced pathway
      await page.getByRole('article', { name: /leadership development/i }).click()
      
      // Should show prerequisite message
      await expect(page.getByText(/prerequisite.*roots/i)).toBeVisible()
      
      // Enroll button should be disabled
      await expect(page.getByRole('button', { name: /complete prerequisites first/i })).toBeDisabled()
    })
    
    test('should allow enrollment after completing prerequisites', async ({ page, memberAuth }) => {
      await page.goto('/pathways')
      
      // Assuming ROOTS is completed
      await page.getByRole('tab', { name: /completed/i }).click()
      await expect(page.getByText(/roots.*completed/i)).toBeVisible()
      
      // Go back to available
      await page.getByRole('tab', { name: /available/i }).click()
      
      // Now can enroll in next level
      await page.getByRole('article', { name: /vines/i }).click()
      await expect(page.getByRole('button', { name: /enroll/i })).toBeEnabled()
    })
  })
  
  test.describe('Pathway Search and Filter', () => {
    test('should search pathways', async ({ page, memberAuth }) => {
      await page.goto('/pathways')
      
      // Search
      await page.getByPlaceholder(/search pathways/i).fill('roots')
      await page.getByPlaceholder(/search pathways/i).press('Enter')
      
      // Should filter results
      await expect(page.getByText(/roots/i)).toBeVisible()
      await expect(page.getByText(/vines/i)).not.toBeVisible()
    })
    
    test('should filter by pathway type', async ({ page, memberAuth }) => {
      await page.goto('/pathways')
      
      // Filter by type
      await page.getByLabel(/pathway type/i).selectOption('RETREAT')
      await page.getByRole('button', { name: /apply filter/i }).click()
      
      // Should only show retreats
      await expect(page.getByText(/spiritual retreat/i)).toBeVisible()
      await expect(page.getByText(/roots/i)).not.toBeVisible()
    })
  })
})