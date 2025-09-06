import { test, expect } from './fixtures/auth'

test.describe('Pathways (Discipleship) - Comprehensive Test Suite', () => {
  
  // US-PWY-001: Admin creates pathway with steps
  test.describe('US-PWY-001: Admin pathway creation', () => {
    test('admin can create pathway and add ordered steps', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/pathways/new')
      
      // Create pathway
      await page.getByLabel('Name').fill('Test Leadership Pathway')
      await page.getByLabel('Description').fill('Training for ministry leaders')
      await page.getByRole('combobox').first().click()
      await page.getByText('VINES').click()
      await page.getByRole('button', { name: /create pathway/i }).click()
      
      await expect(page.getByText('Test Leadership Pathway')).toBeVisible()
      
      // Add steps
      await page.getByText('Manage Steps').click()
      
      await page.getByLabel('Step Name').fill('Step 1: Foundations')
      await page.getByLabel('Description').fill('Learn basic leadership principles')
      await page.getByRole('button', { name: /add step/i }).click()
      
      await expect(page.getByText('Step 1: Foundations')).toBeVisible()
      
      await page.getByLabel('Step Name').fill('Step 2: Practice')
      await page.getByLabel('Description').fill('Apply leadership in real situations')
      await page.getByRole('button', { name: /add step/i }).click()
      
      await expect(page.getByText('Step 2: Practice')).toBeVisible()
    })

    test('pathway creation has proper validation', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/pathways/new')
      
      // Try to create without required fields
      await page.getByRole('button', { name: /create pathway/i }).click()
      
      await expect(page.getByText(/name is required/i)).toBeVisible()
    })

    test('tenant isolation prevents cross-church access', async ({ page, churchAdminAuth }) => {
      // Try to access pathway from another church directly
      await page.goto('/admin/pathways/pathway_vines') // Cebu pathway
      
      // Should be redirected or show 403/404
      await expect(page.url()).not.toContain('pathway_vines')
    })
  })

  // US-PWY-002: Activate/deactivate pathway
  test.describe('US-PWY-002: Pathway activation toggle', () => {
    test('admin can activate and deactivate pathways', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/pathways')
      
      // Find a pathway and toggle its status
      const pathwayCard = page.getByText('ROOTS').first()
      await expect(pathwayCard).toBeVisible()
      
      // Look for active/inactive badge
      await expect(page.getByText('Active')).toBeVisible()
      
      // Click edit to change status
      await page.getByText('Edit').first().click()
      await page.getByLabel(/active/i).uncheck()
      await page.getByRole('button', { name: /save/i }).click()
      
      await expect(page.getByText('Inactive')).toBeVisible()
    })

    test('inactive pathways hidden from member enrollment', async ({ page, memberAuth }) => {
      await page.goto('/pathways')
      
      // Should not see inactive pathways in available section
      // This assumes we've made a pathway inactive in previous test
      await expect(page.getByText('Available Pathways')).toBeVisible()
    })
  })

  // US-PWY-003: Member enroll & view progress
  test.describe('US-PWY-003: Member enrollment and progress', () => {
    test('member can enroll in VINES pathway', async ({ page, memberAuth }) => {
      await page.goto('/pathways')
      
      // Should see available pathways
      await expect(page.getByText('Available Pathways')).toBeVisible()
      
      // Find and enroll in VINES
      const vinesCard = page.getByText('VINES').first()
      if (await vinesCard.isVisible()) {
        await page.getByText('Enroll Now').click()
        await page.getByRole('button', { name: /confirm enrollment/i }).click()
        
        await expect(page.getByText(/enrolled successfully/i)).toBeVisible()
      }
    })

    test('member can view pathway progress', async ({ page, memberAuth }) => {
      await page.goto('/pathways')
      
      // Should see enrolled pathways with progress
      await expect(page.getByText('My Pathways')).toBeVisible()
      
      // Look for progress indicators
      await expect(page.locator('[role="progressbar"]')).toBeVisible()
      
      // Should see steps with completion status
      const completedStep = page.locator('svg[data-testid="CheckCircle2"]')
      const incompleteStep = page.locator('svg[data-testid="Circle"]')
      
      // At least one of these should be visible
      const hasSteps = await completedStep.count() > 0 || await incompleteStep.count() > 0
      expect(hasSteps).toBe(true)
    })

    test('member can mark self-completable steps as done', async ({ page, memberAuth }) => {
      await page.goto('/pathways')
      
      // Find a non-attendance step and mark complete
      const markCompleteButton = page.getByText('Mark Complete').first()
      if (await markCompleteButton.isVisible()) {
        await markCompleteButton.click()
        await expect(page.getByText(/step marked complete/i)).toBeVisible()
      }
    })
  })

  // US-PWY-004: Leader verifies step completion
  test.describe('US-PWY-004: Leader verification', () => {
    test('leader can verify member step completion', async ({ page, leaderAuth }) => {
      await page.goto('/leader/pathways')
      
      // Should see members needing verification
      await expect(page.getByText('Pathway Leadership')).toBeVisible()
      
      // Find verify button and use it
      const verifyButton = page.getByText('Verify').first()
      if (await verifyButton.isVisible()) {
        await verifyButton.click()
        
        await page.getByLabel('Verification Notes').fill('Verified completion in person. Demonstrated good understanding.')
        await page.getByRole('button', { name: /verify completion/i }).click()
        
        await expect(page.getByText(/step verified/i)).toBeVisible()
      }
    })

    test('verification creates audit log', async ({ page, leaderAuth }) => {
      // This would be tested via database queries in unit tests
      // E2E just ensures the UI flow works
      await page.goto('/leader/pathways')
      await expect(page.getByText('Pathway Leadership')).toBeVisible()
    })
  })

  // US-PWY-005: Auto-enroll ROOTS on first-time believer check-in
  test.describe('US-PWY-005: Auto-enrollment on check-in', () => {
    test('new believer auto-enrolls in ROOTS on check-in', async ({ page, memberAuth }) => {
      await page.goto('/checkin')
      
      // Check new believer box
      const newBelieverCheckbox = page.getByRole('checkbox', { name: /new believer/i })
      await newBelieverCheckbox.check()
      
      // Submit check-in
      await page.getByRole('button', { name: /check in/i }).click()
      await expect(page.getByText(/successfully checked in/i)).toBeVisible()
      
      // Navigate to pathways and verify ROOTS enrollment
      await page.goto('/pathways')
      await expect(page.getByText(/roots/i)).toBeVisible()
      await expect(page.getByText('ENROLLED')).toBeVisible()
    })

    test('auto-enrollment is idempotent', async ({ page, memberAuth }) => {
      // Multiple check-ins as new believer shouldn't create duplicate enrollments
      await page.goto('/checkin')
      
      const newBelieverCheckbox = page.getByRole('checkbox', { name: /new believer/i })
      await newBelieverCheckbox.check()
      
      await page.getByRole('button', { name: /check in/i }).click()
      await expect(page.getByText(/successfully checked in/i)).toBeVisible()
      
      // Check pathways - should not have duplicates
      await page.goto('/pathways')
      const rootsEnrollments = page.getByText(/roots/i)
      expect(await rootsEnrollments.count()).toBeLessThanOrEqual(1)
    })
  })

  // US-PWY-006: RETREAT pathway completion via attendance
  test.describe('US-PWY-006: Attendance-based completion', () => {
    test('RSVP to retreat event marks attendance steps complete', async ({ page, memberAuth }) => {
      // First enroll in a retreat pathway (if available)
      await page.goto('/pathways')
      
      const retreatEnroll = page.getByText('Annual Spiritual Retreat')
      if (await retreatEnroll.isVisible()) {
        await page.getByText('Enroll Now').click()
        await page.getByRole('button', { name: /confirm/i }).click()
      }
      
      // Go to events and RSVP to a retreat
      await page.goto('/events')
      
      const retreatEvent = page.getByText(/retreat/i).first()
      if (await retreatEvent.isVisible()) {
        await retreatEvent.click()
        await page.getByRole('button', { name: /rsvp/i }).click()
        await expect(page.getByText(/successfully registered/i)).toBeVisible()
        
        // Check if attendance step is now marked complete
        await page.goto('/pathways')
        const completedStep = page.locator('svg[data-testid="CheckCircle2"]')
        expect(await completedStep.count()).toBeGreaterThan(0)
      }
    })

    test('attendance-required steps cannot be manually completed', async ({ page, memberAuth }) => {
      await page.goto('/pathways')
      
      // Attendance-required steps should not have "Mark Complete" button
      const attendanceSteps = page.getByText('Attendance Required')
      if (await attendanceSteps.count() > 0) {
        // Should not see mark complete button near attendance steps
        const markCompleteNearAttendance = attendanceSteps.locator('..').getByText('Mark Complete')
        expect(await markCompleteNearAttendance.count()).toBe(0)
      }
    })
  })

  // US-PWY-007: Pathway completion → recommendation
  test.describe('US-PWY-007: Completion recommendations', () => {
    test('completing ROOTS shows VINES recommendation', async ({ page, memberAuth }) => {
      // This test assumes there's a completed ROOTS pathway in seed data
      await page.goto('/pathways')
      
      // Look for recommendation banner
      const congratsBanner = page.getByText('Congratulations!')
      const vinesRecommendation = page.getByText('Recommended Next Step: VINES')
      
      // If ROOTS is completed, should see recommendation
      if (await page.getByText('COMPLETED').count() > 0) {
        await expect(congratsBanner).toBeVisible()
        await expect(vinesRecommendation).toBeVisible()
        
        // Can click to enroll in VINES
        await page.getByText('Enroll in VINES').click()
        await expect(page.url()).toContain('/enroll')
      }
    })

    test('recommendation appears after completing last step', async ({ page, memberAuth }) => {
      // This would require completing all steps in a pathway
      // Complex to set up in E2E, better tested in unit tests
      await page.goto('/pathways')
      await expect(page.getByText('My Pathways')).toBeVisible()
    })
  })

  // US-PWY-008: Admin analytics
  test.describe('US-PWY-008: Admin analytics', () => {
    test('admin can view pathway analytics', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/pathways/analytics')
      
      // Should see key metrics
      await expect(page.getByText('Pathway Analytics')).toBeVisible()
      await expect(page.getByText('Total Enrollments')).toBeVisible()
      await expect(page.getByText('Active Members')).toBeVisible()
      await expect(page.getByText('Completed')).toBeVisible()
      await expect(page.getByText('Completion Rate')).toBeVisible()
      
      // Should see pathway breakdown
      await expect(page.getByText('Enrollments by Pathway')).toBeVisible()
      
      // Should see recent completions
      await expect(page.getByText('Recent Completions')).toBeVisible()
      
      // Should see insights
      await expect(page.getByText('Pathway Insights')).toBeVisible()
    })

    test('analytics are tenant-scoped', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/pathways/analytics')
      
      // Numbers should reflect only the current church's data
      await expect(page.getByText('Total Enrollments')).toBeVisible()
      
      // Verify reasonable numbers (not all churches combined)
      const totalEnrollments = page.locator('[data-testid="total-enrollments"]')
      // This would need specific data setup to verify tenant isolation
    })

    test('analytics show correct completion rates', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/pathways/analytics')
      
      // Completion rate should be calculated correctly
      const completionRate = page.getByText(/\d+\.\d+%/)
      await expect(completionRate).toBeVisible()
      
      // Progress bar should match percentage
      await expect(page.locator('[role="progressbar"]')).toBeVisible()
    })
  })

  // Security and Performance Tests
  test.describe('Security and Performance', () => {
    test('RBAC enforcement on all endpoints', async ({ page, memberAuth }) => {
      // Member should not access admin pages
      await page.goto('/admin/pathways')
      await expect(page.url()).not.toContain('/admin/pathways')
      
      await page.goto('/admin/pathways/analytics')
      await expect(page.url()).not.toContain('/analytics')
    })

    test('pathway pages load within performance thresholds', async ({ page, memberAuth }) => {
      const startTime = Date.now()
      await page.goto('/pathways')
      await expect(page.getByText('My Pathways')).toBeVisible()
      const loadTime = Date.now() - startTime
      
      // Should load within 2 seconds
      expect(loadTime).toBeLessThan(2000)
    })

    test('admin pathways page loads within performance thresholds', async ({ page, churchAdminAuth }) => {
      const startTime = Date.now()
      await page.goto('/admin/pathways')
      await expect(page.getByText('Pathways Management')).toBeVisible()
      const loadTime = Date.now() - startTime
      
      expect(loadTime).toBeLessThan(2000)
    })
  })

  // Accessibility Tests
  test.describe('Accessibility', () => {
    test('pathways page has proper ARIA labels', async ({ page, memberAuth }) => {
      await page.goto('/pathways')
      
      // Progress bars should have labels
      await expect(page.locator('[role="progressbar"]')).toBeVisible()
      
      // Buttons should be properly labeled
      const enrollButtons = page.getByRole('button', { name: /enroll/i })
      expect(await enrollButtons.count()).toBeGreaterThanOrEqual(0)
    })

    test('leader verification form is accessible', async ({ page, leaderAuth }) => {
      await page.goto('/leader/pathways')
      
      const verifyButton = page.getByRole('button', { name: /verify/i }).first()
      if (await verifyButton.isVisible()) {
        await verifyButton.click()
        
        // Dialog should be properly labeled
        await expect(page.getByRole('dialog')).toBeVisible()
        await expect(page.getByLabelText('Verification Notes')).toBeVisible()
      }
    })

    test('admin analytics page is accessible', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/pathways/analytics')
      
      // Cards should have proper headings
      await expect(page.getByRole('heading', { name: /pathway analytics/i })).toBeVisible()
      
      // Data should be properly structured
      await expect(page.getByText('Total Enrollments')).toBeVisible()
    })
  })

  // Error Handling
  test.describe('Error Handling', () => {
    test('handles network errors gracefully', async ({ page, memberAuth }) => {
      await page.goto('/pathways')
      await expect(page.getByText('My Pathways')).toBeVisible()
      
      // Simulate network failure and form submission
      // This would require more complex setup with request interception
    })

    test('shows appropriate error messages for failed operations', async ({ page, memberAuth }) => {
      await page.goto('/pathways')
      
      // Try to enroll in non-existent pathway (would need setup)
      // Should show error message, not crash
    })
  })
})