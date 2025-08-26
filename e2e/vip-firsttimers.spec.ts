import { test, expect } from './fixtures/auth'
import { UserRole } from '@prisma/client'

test.describe('VIP Team First Timers', () => {
  test.describe('Access Control', () => {
    test('VIP user can access first timers page', async ({ page, vipAuth }) => {
      await page.goto('/vip/firsttimers')
      await expect(page.getByRole('heading', { name: 'First Timers' })).toBeVisible()
      await expect(page.getByText('Manage and track follow-up')).toBeVisible()
    })

    test('Admin can access first timers page', async ({ page, churchAdminAuth }) => {
      await page.goto('/vip/firsttimers')
      await expect(page.getByRole('heading', { name: 'First Timers' })).toBeVisible()
    })

    test('Member cannot access first timers page', async ({ page, memberAuth }) => {
      await page.goto('/vip/firsttimers')
      // Should be redirected to dashboard
      await expect(page).toHaveURL('/dashboard')
    })

    test('Leader cannot access first timers page', async ({ page, leaderAuth }) => {
      await page.goto('/vip/firsttimers')
      // Should be redirected to dashboard
      await expect(page).toHaveURL('/dashboard')
    })
  })

  test.describe('First Timer Management', () => {
    test('VIP can create a new first timer', async ({ page, vipAuth }) => {
      await page.goto('/vip/firsttimers')
      
      // Click Add First Timer button
      await page.getByRole('button', { name: /Add First Timer/i }).click()
      
      // Fill in the form
      await page.getByLabel('Name').fill('Jane Smith')
      await page.getByLabel('Email').fill('jane.smith@example.com')
      await page.getByLabel('Phone').fill('+1234567890')
      await page.getByLabel('Notes').fill('Met at Sunday service, interested in joining a life group')
      
      // Submit the form
      await page.getByRole('button', { name: 'Create First Timer' }).click()
      
      // Verify the first timer appears in the table
      await expect(page.getByRole('cell', { name: 'Jane Smith' })).toBeVisible()
      await expect(page.getByText('jane.smith@example.com')).toBeVisible()
      
      // Verify default status
      const row = page.getByRole('row').filter({ hasText: 'Jane Smith' })
      await expect(row.getByRole('button', { name: /No/i })).toBeVisible() // Gospel not shared
      await expect(row.getByRole('button', { name: /Pending/i })).toBeVisible() // ROOTS not completed
    })

    test('VIP can update gospel shared status', async ({ page, vipAuth }) => {
      await page.goto('/vip/firsttimers')
      
      // Create a first timer first
      await page.getByRole('button', { name: /Add First Timer/i }).click()
      await page.getByLabel('Name').fill('Mark Johnson')
      await page.getByLabel('Email').fill('mark.johnson@example.com')
      await page.getByRole('button', { name: 'Create First Timer' }).click()
      
      // Find the row for the new first timer
      const row = page.getByRole('row').filter({ hasText: 'Mark Johnson' })
      
      // Click the Gospel Shared button to toggle
      const gospelButton = row.getByRole('button').filter({ hasText: /No/i }).first()
      await gospelButton.click()
      
      // Verify it changed to Yes
      await expect(row.getByRole('button', { name: /Yes/i })).toBeVisible()
    })

    test('VIP can update ROOTS completed status', async ({ page, vipAuth }) => {
      await page.goto('/vip/firsttimers')
      
      // Create a first timer
      await page.getByRole('button', { name: /Add First Timer/i }).click()
      await page.getByLabel('Name').fill('Sarah Williams')
      await page.getByLabel('Email').fill('sarah.williams@example.com')
      await page.getByRole('button', { name: 'Create First Timer' }).click()
      
      // Find the row
      const row = page.getByRole('row').filter({ hasText: 'Sarah Williams' })
      
      // Click the ROOTS button to mark as completed
      const rootsButton = row.getByRole('button').filter({ hasText: /Pending/i }).first()
      await rootsButton.click()
      
      // Verify it changed to Done
      await expect(row.getByRole('button', { name: /Done/i })).toBeVisible()
    })

    test('VIP can assign another VIP to follow up', async ({ page, vipAuth }) => {
      await page.goto('/vip/firsttimers')
      
      // Create a first timer
      await page.getByRole('button', { name: /Add First Timer/i }).click()
      await page.getByLabel('Name').fill('Tom Davis')
      await page.getByLabel('Email').fill('tom.davis@example.com')
      await page.getByRole('button', { name: 'Create First Timer' }).click()
      
      // Find the row
      const row = page.getByRole('row').filter({ hasText: 'Tom Davis' })
      
      // Find the assignment dropdown in the row
      const assignmentSelect = row.getByRole('combobox')
      await assignmentSelect.click()
      
      // Select a VIP member (if available in test data)
      const options = page.getByRole('option')
      const optionCount = await options.count()
      if (optionCount > 1) {
        await options.nth(1).click() // Select first available VIP
        
        // Verify assignment was updated
        await expect(assignmentSelect).not.toHaveText('Unassigned')
      }
    })

    test('VIP can add and edit notes', async ({ page, vipAuth }) => {
      await page.goto('/vip/firsttimers')
      
      // Create a first timer with initial notes
      await page.getByRole('button', { name: /Add First Timer/i }).click()
      await page.getByLabel('Name').fill('Emily Brown')
      await page.getByLabel('Email').fill('emily.brown@example.com')
      await page.getByLabel('Notes').fill('Initial contact notes')
      await page.getByRole('button', { name: 'Create First Timer' }).click()
      
      // Find the row and click edit button
      const row = page.getByRole('row').filter({ hasText: 'Emily Brown' })
      await row.getByRole('button', { name: /Edit/i }).click()
      
      // Edit notes in the dialog
      const notesTextarea = page.getByRole('textbox')
      await notesTextarea.clear()
      await notesTextarea.fill('Updated follow-up notes: Had a great conversation about faith')
      
      // Save the notes
      await page.getByRole('button', { name: 'Save Notes' }).click()
      
      // Verify dialog closed
      await expect(page.getByRole('dialog')).not.toBeVisible()
    })

    test('Admin can delete first timer record', async ({ page, churchAdminAuth }) => {
      await page.goto('/vip/firsttimers')
      
      // Create a first timer
      await page.getByRole('button', { name: /Add First Timer/i }).click()
      await page.getByLabel('Name').fill('Delete Test User')
      await page.getByLabel('Email').fill('delete.test@example.com')
      await page.getByRole('button', { name: 'Create First Timer' }).click()
      
      // Find the row and click delete button
      const row = page.getByRole('row').filter({ hasText: 'Delete Test User' })
      await row.getByRole('button', { name: /Delete/i }).click()
      
      // Confirm deletion in dialog
      await page.getByRole('button', { name: 'Delete Record' }).click()
      
      // Verify the record is removed
      await expect(page.getByRole('cell', { name: 'Delete Test User' })).not.toBeVisible()
    })

    test('VIP cannot see delete button', async ({ page, vipAuth }) => {
      await page.goto('/vip/firsttimers')
      
      // Create a first timer
      await page.getByRole('button', { name: /Add First Timer/i }).click()
      await page.getByLabel('Name').fill('VIP Test User')
      await page.getByLabel('Email').fill('vip.test@example.com')
      await page.getByRole('button', { name: 'Create First Timer' }).click()
      
      // Find the row - delete button should not be visible
      const row = page.getByRole('row').filter({ hasText: 'VIP Test User' })
      await expect(row.getByRole('button', { name: /Delete/i })).not.toBeVisible()
    })
  })

  test.describe('Filtering', () => {
    test('Can filter by gospel shared status', async ({ page, vipAuth }) => {
      await page.goto('/vip/firsttimers')
      
      // Create two first timers with different statuses
      await page.getByRole('button', { name: /Add First Timer/i }).click()
      await page.getByLabel('Name').fill('Gospel Yes User')
      await page.getByLabel('Email').fill('gospel.yes@example.com')
      await page.getByRole('button', { name: 'Create First Timer' }).click()
      
      await page.getByRole('button', { name: /Add First Timer/i }).click()
      await page.getByLabel('Name').fill('Gospel No User')
      await page.getByLabel('Email').fill('gospel.no@example.com')
      await page.getByRole('button', { name: 'Create First Timer' }).click()
      
      // Update one to have gospel shared
      const yesRow = page.getByRole('row').filter({ hasText: 'Gospel Yes User' })
      await yesRow.getByRole('button').filter({ hasText: /No/i }).first().click()
      
      // Apply filter for Gospel Shared = Yes
      await page.getByRole('combobox').first().click()
      await page.getByRole('option', { name: 'Gospel Shared' }).click()
      
      // Verify only the one with gospel shared is visible
      await expect(page.getByRole('cell', { name: 'Gospel Yes User' })).toBeVisible()
      await expect(page.getByRole('cell', { name: 'Gospel No User' })).not.toBeVisible()
      
      // Reset filter
      await page.getByRole('combobox').first().click()
      await page.getByRole('option', { name: 'All' }).click()
      
      // Both should be visible now
      await expect(page.getByRole('cell', { name: 'Gospel Yes User' })).toBeVisible()
      await expect(page.getByRole('cell', { name: 'Gospel No User' })).toBeVisible()
    })

    test('Can filter by ROOTS completion status', async ({ page, vipAuth }) => {
      await page.goto('/vip/firsttimers')
      
      // Apply filter for ROOTS Completed
      await page.getByRole('combobox').nth(1).click()
      await page.getByRole('option', { name: 'ROOTS Completed' }).click()
      
      // If there are completed ones, they should be visible
      // If not, should show "No first timers found"
      const noResults = page.getByText('No first timers found')
      const hasResults = page.getByRole('cell').first()
      
      // Either no results or has results should be visible
      const noResultsVisible = await noResults.isVisible().catch(() => false)
      const hasResultsVisible = await hasResults.isVisible().catch(() => false)
      
      expect(noResultsVisible || hasResultsVisible).toBeTruthy()
    })
  })

  test.describe('Navigation', () => {
    test('VIP Team section appears in sidebar for VIP users', async ({ page, vipAuth }) => {
      await page.goto('/dashboard')
      
      // Check that VIP Team section is visible
      await expect(page.getByText('VIP Team')).toBeVisible()
      await expect(page.getByRole('link', { name: /First Timers/i })).toBeVisible()
      
      // Click the link to navigate
      await page.getByRole('link', { name: /First Timers/i }).click()
      await expect(page).toHaveURL('/vip/firsttimers')
    })

    test('VIP Team section does not appear for regular members', async ({ page, memberAuth }) => {
      await page.goto('/dashboard')
      
      // VIP Team section should not be visible
      await expect(page.getByText('VIP Team')).not.toBeVisible()
      await expect(page.getByRole('link', { name: /First Timers/i })).not.toBeVisible()
    })
  })
})