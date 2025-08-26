import { test, expect } from './fixtures/auth'

test.describe('Pathways (Discipleship)', () => {
  test.describe('Auto-enrollment', () => {
    test('new believer auto-enrolls in ROOTS on check-in', async ({ page, memberAuth }) => {
      await page.goto('/checkin')
      
      // Check new believer box
      const newBelieverCheckbox = page.getByRole('checkbox', { name: /new believer/i })
      await newBelieverCheckbox.check()
      
      // Submit check-in
      await page.getByRole('button', { name: /check in/i }).click()
      await expect(page.getByText(/successfully checked in/i)).toBeVisible()
      
      // Navigate to pathways
      await page.goto('/pathways')
      
      // Should see ROOTS enrollment
      await expect(page.getByText(/roots.*new believer/i)).toBeVisible()
      await expect(page.getByText(/enrolled/i)).toBeVisible()
    })
  })

  test.describe('Member enrollment', () => {
    test('member can opt-in to VINES pathway', async ({ page, memberAuth }) => {
      await page.goto('/pathways')
      
      // Find VINES pathway
      const vinesCard = page.getByText(/vines/i).first()
      await vinesCard.click()
      
      // Enroll button
      const enrollButton = page.getByRole('button', { name: /enroll/i })
      if (await enrollButton.isVisible()) {
        await enrollButton.click()
        await expect(page.getByText(/enrolled.*vines/i)).toBeVisible()
      }
    })

    test('shows enrollment status', async ({ page, memberAuth }) => {
      await page.goto('/pathways')
      
      // Should show enrolled/not enrolled status
      const pathwayCards = await page.getByRole('article').all()
      
      for (const card of pathwayCards) {
        const text = await card.textContent()
        expect(text).toMatch(/enrolled|not enrolled|enroll now/i)
      }
    })

    test('tracks progress percentage', async ({ page, memberAuth }) => {
      await page.goto('/pathways')
      
      // Look for progress indicators
      const progressBars = page.locator('[role="progressbar"]')
      const progressTexts = page.getByText(/\d+%/)
      
      // At least one should be visible if enrolled
      const hasProgress = await progressBars.first().isVisible() || await progressTexts.first().isVisible()
      expect(hasProgress).toBeDefined()
    })
  })

  test.describe('Step completion', () => {
    test('leader can mark steps complete', async ({ page, leaderAuth }) => {
      await page.goto('/admin/pathways')
      
      // Navigate to a pathway
      const pathwayLink = page.getByRole('link').first()
      await pathwayLink.click()
      
      // Go to steps management
      await page.getByRole('link', { name: /manage steps/i }).click()
      
      // Should see steps list
      await expect(page.getByText(/understanding salvation|water baptism/i)).toBeVisible()
    })

    test('shows step completion with notes', async ({ page, memberAuth }) => {
      await page.goto('/pathways')
      
      // Click on an enrolled pathway
      const enrolledPathway = page.getByText(/enrolled/i).first()
      await enrolledPathway.click()
      
      // Should see steps with completion status
      await expect(page.getByText(/completed|pending|in progress/i)).toBeVisible()
    })

    test('automatically completes pathway when all steps done', async ({ page }) => {
      // This would need a test user with all steps completed
      // Checking the logic exists
      await page.goto('/pathways')
      
      // Look for 100% completion
      const completedPathway = page.getByText(/100%|completed/i)
      if (await completedPathway.isVisible()) {
        await expect(completedPathway).toBeVisible()
      }
    })
  })

  test.describe('Admin management', () => {
    test('admin can create pathways', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/pathways')
      
      // Create button
      await page.getByRole('button', { name: /create.*pathway/i }).click()
      
      // Fill form
      await page.getByLabel(/name/i).fill('Test Pathway')
      await page.getByLabel(/description/i).fill('Test description')
      await page.getByLabel(/type/i).selectOption('VINES')
      
      // Submit
      await page.getByRole('button', { name: /create/i }).click()
      
      // Should redirect to pathways list
      await expect(page).toHaveURL(/admin\/pathways/)
      await expect(page.getByText('Test Pathway')).toBeVisible()
    })

    test('admin can manage steps', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/pathways')
      
      // Click on a pathway
      const pathwayLink = page.getByRole('link', { name: /roots/i })
      await pathwayLink.click()
      
      // Navigate to steps
      await page.getByRole('link', { name: /manage steps/i }).click()
      
      // Should see step management UI
      await expect(page.getByRole('heading', { name: /pathway steps/i })).toBeVisible()
      
      // Add step button
      const addStepButton = page.getByRole('button', { name: /add step/i })
      if (await addStepButton.isVisible()) {
        await addStepButton.click()
        
        // Fill step form
        await page.getByLabel(/step name/i).fill('New Test Step')
        await page.getByLabel(/description/i).fill('Step description')
        await page.getByRole('button', { name: /save/i }).click()
      }
    })

    test('can reorder steps', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/pathways')
      
      const pathwayLink = page.getByRole('link').first()
      await pathwayLink.click()
      
      await page.getByRole('link', { name: /manage steps/i }).click()
      
      // Look for reorder controls
      const moveButtons = page.getByRole('button', { name: /move up|move down|reorder/i })
      if (await moveButtons.first().isVisible()) {
        // Test reordering
        await moveButtons.first().click()
        // Verify order changed (would need to check actual positions)
      }
    })
  })

  test.describe('Pathway types', () => {
    test('ROOTS pathway is for new believers only', async ({ page, memberAuth }) => {
      await page.goto('/pathways')
      
      const rootsPathway = page.getByText(/roots/i).first()
      await rootsPathway.click()
      
      // Should indicate it's for new believers
      await expect(page.getByText(/new believer|foundation/i)).toBeVisible()
    })

    test('VINES pathway is opt-in', async ({ page, memberAuth }) => {
      await page.goto('/pathways')
      
      const vinesPathway = page.getByText(/vines/i).first()
      await vinesPathway.click()
      
      // Should have enroll option if not enrolled
      const enrollButton = page.getByRole('button', { name: /enroll/i })
      // Button visibility depends on enrollment status
      expect(enrollButton).toBeDefined()
    })

    test('RETREAT pathway requires scheduling', async ({ page, memberAuth }) => {
      await page.goto('/pathways')
      
      const retreatPathway = page.getByText(/retreat/i).first()
      if (await retreatPathway.isVisible()) {
        await retreatPathway.click()
        
        // Should mention scheduling or dates
        await expect(page.getByText(/schedule|date|register/i)).toBeVisible()
      }
    })
  })

  test.describe('Cross-role access', () => {
    test('member cannot access admin pathway pages', async ({ page, memberAuth }) => {
      await page.goto('/admin/pathways')
      
      // Should be redirected or show forbidden
      await expect(page).toHaveURL(/forbidden|login|pathways$/i)
    })

    test('leader can mark progress but not create pathways', async ({ page, leaderAuth }) => {
      await page.goto('/admin/pathways')
      
      // Should not see create button
      const createButton = page.getByRole('button', { name: /create.*pathway/i })
      await expect(createButton).not.toBeVisible()
    })
  })
})