import { test, expect } from '@playwright/test'

test.describe('Pathways Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.click('text=Sign In')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.click('button:has-text("Continue with Email")')
  })

  test('new believer auto-enrolls in ROOTS pathway', async ({ page }) => {
    await page.goto('/checkin')
    
    await page.check('input#newBeliever')
    await page.click('button:has-text("Check In")')
    
    await page.waitForLoadState('networkidle')
    
    await page.goto('/pathways')
    
    await expect(page.locator('text=ROOTS')).toBeVisible()
    await expect(page.locator('text=Foundation course for new believers')).toBeVisible()
    await expect(page.locator('text=ENROLLED')).toBeVisible()
  })

  test('member can view pathway progress', async ({ page }) => {
    await page.goto('/pathways')
    
    await expect(page.locator('h1:has-text("My Pathways")')).toBeVisible()
    
    const pathwayCard = page.locator('.card').first()
    await expect(pathwayCard.locator('text=Progress')).toBeVisible()
    await expect(pathwayCard.locator('[role="progressbar"]')).toBeVisible()
  })

  test('member can enroll in VINES pathway', async ({ page }) => {
    await page.goto('/pathways')
    
    const vinesSection = page.locator('text=Available Pathways').locator('..')
    await expect(vinesSection.locator('text=VINES')).toBeVisible()
    
    await vinesSection.locator('text=Enroll Now').click()
    
    await page.waitForLoadState('networkidle')
    
    await expect(page.locator('text=VINES')).toBeVisible()
    await expect(page.locator('text=ENROLLED')).toBeVisible()
  })

  test('admin can create and manage pathways', async ({ page }) => {
    await page.goto('/admin/pathways')
    
    await page.click('text=Create Pathway')
    
    await page.fill('input[placeholder="ROOTS"]', 'Test Pathway')
    await page.fill('textarea', 'Test description for pathway')
    await page.selectOption('select', 'VINES')
    
    await page.click('button:has-text("Create Pathway")')
    
    await page.waitForLoadState('networkidle')
    
    await expect(page.locator('text=Test Pathway')).toBeVisible()
    await expect(page.locator('text=Test description for pathway')).toBeVisible()
  })

  test('admin can add steps to pathway', async ({ page }) => {
    await page.goto('/admin/pathways')
    
    const pathwayCard = page.locator('.border').first()
    await pathwayCard.locator('text=Manage Steps').click()
    
    await page.click('button:has-text("Add Step")')
    
    await page.fill('input[placeholder="Step name"]', 'Test Step 1')
    await page.fill('textarea[placeholder="Step description"]', 'First test step')
    
    await page.locator('button').filter({ has: page.locator('svg') }).first().click()
    
    await page.waitForLoadState('networkidle')
    
    await expect(page.locator('text=Test Step 1')).toBeVisible()
    await expect(page.locator('text=First test step')).toBeVisible()
  })

  test('leader can mark steps as complete', async ({ page }) => {
    await page.goto('/admin/pathways')
    
    const pathwayCard = page.locator('.border').first()
    await pathwayCard.locator('text=View Enrollments').click()
    
    const enrollmentRow = page.locator('tr').filter({ hasText: 'test@example.com' })
    await enrollmentRow.locator('text=View Progress').click()
    
    const incompleteStep = page.locator('.flex').filter({ has: page.locator('svg.text-muted-foreground') }).first()
    await incompleteStep.locator('button:has-text("Mark Complete")').click()
    
    await page.fill('textarea[name="notes"]', 'Completed successfully')
    await page.click('button:has-text("Confirm")')
    
    await page.waitForLoadState('networkidle')
    
    await expect(incompleteStep.locator('svg.text-green-600')).toBeVisible()
  })

  test('pathway completion updates enrollment status', async ({ page }) => {
    await page.goto('/pathways')
    
    const pathwayCard = page.locator('.card').filter({ hasText: 'ROOTS' })
    const progressBar = pathwayCard.locator('[role="progressbar"]')
    
    const progressValue = await progressBar.getAttribute('aria-valuenow')
    expect(Number(progressValue)).toBeGreaterThanOrEqual(0)
    expect(Number(progressValue)).toBeLessThanOrEqual(100)
    
    if (progressValue === '100') {
      await expect(pathwayCard.locator('text=COMPLETED')).toBeVisible()
    }
  })
})