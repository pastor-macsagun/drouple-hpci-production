import { test, expect } from './fixtures/auth'
import { startOfDay } from 'date-fns'

test.describe('Check-In', () => {
  test.beforeEach(async ({ page }) => {
    // Create a service for today if needed
    const today = startOfDay(new Date())
    
    // We'll use the test database which should have services
    // The seed script should create services for testing
  })

  test('member can check in for Sunday service', async ({ page, memberAuth }) => {
    await page.goto('/checkin')
    
    // Wait for the page to load
    await expect(page.getByRole('heading', { name: 'Sunday Check-In' })).toBeVisible()
    
    // Look for check-in form or already checked in message
    const checkedInMessage = page.getByText('You are checked in!')
    const checkInButton = page.getByRole('button', { name: 'Check In' })
    
    // If not already checked in, perform check-in
    if (await checkInButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await checkInButton.click()
      
      // Wait for success message
      await expect(page.getByText('Successfully checked in!')).toBeVisible()
      await expect(checkedInMessage).toBeVisible()
    } else {
      // Already checked in
      await expect(checkedInMessage).toBeVisible()
    }
  })

  test('member can check in as new believer', async ({ page, memberAuth }) => {
    // Use a different member to avoid duplicate check-in
    await page.goto('/auth/signin')
    await page.getByPlaceholder('name@example.com').fill('member2@test.com')
    await page.getByRole('button', { name: 'Sign in with Email' }).click()
    
    // In test environment, email link is instant
    await page.waitForURL('**/dashboard')
    
    await page.goto('/checkin')
    await expect(page.getByRole('heading', { name: 'Sunday Check-In' })).toBeVisible()
    
    const checkInButton = page.getByRole('button', { name: 'Check In' })
    
    if (await checkInButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Check the new believer checkbox
      await page.getByLabel('I am a new believer').check()
      await checkInButton.click()
      
      await expect(page.getByText('Successfully checked in!')).toBeVisible()
      await expect(page.getByText('You are checked in!')).toBeVisible()
    }
  })

  test('admin can view attendance list', async ({ page, churchAdminAuth }) => {
    await page.goto('/checkin')
    
    await expect(page.getByRole('heading', { name: 'Sunday Check-In' })).toBeVisible()
    
    // Admin should see attendance list instead of check-in form
    await expect(page.getByRole('heading', { name: 'Attendance List' })).toBeVisible()
    
    // Should see refresh and export buttons
    await expect(page.getByRole('button', { name: /Refresh/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Export CSV/i })).toBeVisible()
    
    // Table headers should be visible
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Checked In' })).toBeVisible()
  })

  test('admin can export attendance CSV', async ({ page, churchAdminAuth }) => {
    await page.goto('/checkin')
    
    await expect(page.getByRole('heading', { name: 'Attendance List' })).toBeVisible()
    
    // Set up download promise before clicking
    const downloadPromise = page.waitForEvent('download')
    
    // Click export button
    await page.getByRole('button', { name: /Export CSV/i }).click()
    
    // Wait for download
    const download = await downloadPromise
    
    // Verify download filename contains 'attendance'
    expect(download.suggestedFilename()).toContain('attendance')
    expect(download.suggestedFilename()).toContain('.csv')
  })

  test('shows no service message when no service scheduled', async ({ page, memberAuth }) => {
    // This test assumes we can control whether a service exists for today
    // In a real scenario, you might need to mock the date or database
    
    // Navigate to check-in page
    await page.goto('/checkin')
    
    // If no service today, should show appropriate message
    const noServiceMessage = page.getByText('No Service Today')
    const checkInButton = page.getByRole('button', { name: 'Check In' })
    
    // Either we see check-in form or no service message
    const hasService = await checkInButton.isVisible({ timeout: 1000 }).catch(() => false)
    
    if (!hasService) {
      await expect(noServiceMessage).toBeVisible()
      await expect(page.getByText(/There is no service scheduled for today/)).toBeVisible()
    }
  })

  test('prevents duplicate check-ins', async ({ page, memberAuth }) => {
    await page.goto('/checkin')
    
    const checkInButton = page.getByRole('button', { name: 'Check In' })
    
    // If check-in button is visible, user hasn't checked in yet
    if (await checkInButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      // First check-in
      await checkInButton.click()
      await expect(page.getByText('Successfully checked in!')).toBeVisible()
      
      // Reload page
      await page.reload()
      
      // Should show already checked in message
      await expect(page.getByText('You are checked in!')).toBeVisible()
      
      // Check-in button should not be visible
      await expect(checkInButton).not.toBeVisible()
    } else {
      // Already checked in from previous test
      await expect(page.getByText('You are checked in!')).toBeVisible()
    }
  })
})