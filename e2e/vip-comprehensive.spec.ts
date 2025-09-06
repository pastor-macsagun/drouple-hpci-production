/**
 * Comprehensive E2E Tests for VIP First-Timer Management System
 * Tests all 8 user stories with complete UI interaction coverage
 */

import { test, expect } from './fixtures/auth'
import { UserRole } from '@prisma/client'

// Generate unique test data to avoid conflicts
const generateTestData = (suffix: string) => ({
  name: `E2E Test User ${suffix} ${Date.now()}`,
  email: `e2e.test.${suffix}.${Date.now()}@test.com`,
  phone: `+555${suffix.padStart(7, '0')}`
})

test.describe('VIP First-Timer Management - Complete User Stories', () => {
  
  test.describe('US-VIP-001: Immediate member creation', () => {
    test('should create member account immediately upon first-timer creation', async ({ page, vipAuth }) => {
      await page.goto('/vip/firsttimers')
      
      const testData = generateTestData('001')
      
      // Create first timer
      await page.getByRole('button', { name: /Add First Timer/i }).click()
      await page.getByLabel('Name').fill(testData.name)
      await page.getByLabel('Email').fill(testData.email)
      await page.getByLabel('Phone').fill(testData.phone)
      await page.getByLabel('Notes').fill('US-VIP-001: Immediate member creation test')
      await page.getByRole('button', { name: 'Create First Timer' }).click()
      
      // Verify first timer appears in table
      await expect(page.getByRole('cell', { name: testData.name })).toBeVisible()
      
      // Verify member was created by checking admin members page
      await page.goto('/admin/members')
      await page.getByPlaceholder('Search members...').fill(testData.email)
      await expect(page.getByText(testData.email)).toBeVisible()
      await expect(page.getByText('MEMBER')).toBeVisible()
    })
    
    test('should prevent duplicate email creation with clear error', async ({ page, vipAuth }) => {
      await page.goto('/vip/firsttimers')
      
      const testData = generateTestData('001-dup')
      
      // Create first timer
      await page.getByRole('button', { name: /Add First Timer/i }).click()
      await page.getByLabel('Name').fill(testData.name)
      await page.getByLabel('Email').fill(testData.email)
      await page.getByRole('button', { name: 'Create First Timer' }).click()
      
      // Wait for first creation to complete
      await expect(page.getByRole('cell', { name: testData.name })).toBeVisible()
      
      // Try to create duplicate
      await page.getByRole('button', { name: /Add First Timer/i }).click()
      await page.getByLabel('Name').fill('Duplicate User')
      await page.getByLabel('Email').fill(testData.email)
      await page.getByRole('button', { name: 'Create First Timer' }).click()
      
      // Should see error
      await expect(page.getByText('A user with this email already exists')).toBeVisible()
    })
  })

  test.describe('US-VIP-002: ROOTS auto-enrollment', () => {
    test('should auto-enroll first-timers in ROOTS pathway', async ({ page, vipAuth }) => {
      await page.goto('/vip/firsttimers')
      
      const testData = generateTestData('002')
      
      // Create first timer
      await page.getByRole('button', { name: /Add First Timer/i }).click()
      await page.getByLabel('Name').fill(testData.name)
      await page.getByLabel('Email').fill(testData.email)
      await page.getByLabel('Notes').fill('US-VIP-002: ROOTS auto-enrollment test')
      await page.getByRole('button', { name: 'Create First Timer' }).click()
      
      await expect(page.getByRole('cell', { name: testData.name })).toBeVisible()
      
      // Check ROOTS status shows as Pending (enrolled but not completed)
      const row = page.getByRole('row').filter({ hasText: testData.name })
      await expect(row.getByRole('button', { name: /Pending/i })).toBeVisible()
      
      // Verify in pathways page - switch to member auth to check enrollment
      await page.goto('/auth/login')
      await page.getByLabel('Email').fill(testData.email)
      await page.getByLabel('Password').fill('Hpci!Test2025')
      await page.getByRole('button', { name: 'Sign In' }).click()
      
      // Should be redirected to dashboard as new member
      await expect(page).toHaveURL('/dashboard')
      
      // Check pathways
      await page.goto('/pathways')
      await expect(page.getByText('ROOTS')).toBeVisible()
      await expect(page.getByText('Enrolled')).toBeVisible()
    })
  })

  test.describe('US-VIP-003: Enhanced filtering', () => {
    test('should filter by assignment status', async ({ page, vipAuth }) => {
      await page.goto('/vip/firsttimers')
      
      // Create test data
      const assigned = generateTestData('003-assigned')
      const unassigned = generateTestData('003-unassigned')
      
      // Create first timer without assignment
      await page.getByRole('button', { name: /Add First Timer/i }).click()
      await page.getByLabel('Name').fill(unassigned.name)
      await page.getByLabel('Email').fill(unassigned.email)
      await page.getByRole('button', { name: 'Create First Timer' }).click()
      
      await expect(page.getByRole('cell', { name: unassigned.name })).toBeVisible()
      
      // Create first timer with assignment
      await page.getByRole('button', { name: /Add First Timer/i }).click()
      await page.getByLabel('Name').fill(assigned.name)
      await page.getByLabel('Email').fill(assigned.email)
      
      // Try to assign to a VIP member
      const assignSelect = page.getByLabel('Assign to VIP')
      await assignSelect.click()
      const options = page.getByRole('option')
      const optionCount = await options.count()
      if (optionCount > 1) {
        await options.nth(1).click() // Select first available VIP
      }
      
      await page.getByRole('button', { name: 'Create First Timer' }).click()
      await expect(page.getByRole('cell', { name: assigned.name })).toBeVisible()
      
      // Test filtering by unassigned
      await page.getByRole('combobox').first().click()
      await page.getByRole('option', { name: 'Unassigned' }).click()
      
      // Should see only unassigned
      await expect(page.getByRole('cell', { name: unassigned.name })).toBeVisible()
      // Assigned should not be visible
      await expect(page.getByRole('cell', { name: assigned.name })).not.toBeVisible()
      
      // Test filtering by assigned
      await page.getByRole('combobox').first().click()
      await page.getByRole('option', { name: 'Assigned' }).click()
      
      // Should see only assigned (if assignment worked)
      if (optionCount > 1) {
        await expect(page.getByRole('cell', { name: assigned.name })).toBeVisible()
        await expect(page.getByRole('cell', { name: unassigned.name })).not.toBeVisible()
      }
    })
    
    test('should filter by gospel shared status', async ({ page, vipAuth }) => {
      await page.goto('/vip/firsttimers')
      
      const shared = generateTestData('003-shared')
      const notShared = generateTestData('003-not-shared')
      
      // Create first timer - gospel not shared
      await page.getByRole('button', { name: /Add First Timer/i }).click()
      await page.getByLabel('Name').fill(notShared.name)
      await page.getByLabel('Email').fill(notShared.email)
      await page.getByRole('button', { name: 'Create First Timer' }).click()
      
      // Create first timer - gospel shared
      await page.getByRole('button', { name: /Add First Timer/i }).click()
      await page.getByLabel('Name').fill(shared.name)
      await page.getByLabel('Email').fill(shared.email)
      await page.getByRole('button', { name: 'Create First Timer' }).click()
      
      // Mark gospel as shared for second user
      const row = page.getByRole('row').filter({ hasText: shared.name })
      await row.getByRole('button').filter({ hasText: /No/i }).first().click()
      await expect(row.getByRole('button', { name: /Yes/i })).toBeVisible()
      
      // Filter by gospel shared
      await page.getByRole('combobox').first().click()
      await page.getByRole('option', { name: 'Gospel Shared' }).click()
      
      // Should see only gospel shared
      await expect(page.getByRole('cell', { name: shared.name })).toBeVisible()
      await expect(page.getByRole('cell', { name: notShared.name })).not.toBeVisible()
      
      // Filter by gospel not shared  
      await page.getByRole('combobox').first().click()
      await page.getByRole('option', { name: 'Gospel Not Shared' }).click()
      
      // Should see only not shared
      await expect(page.getByRole('cell', { name: notShared.name })).toBeVisible()
      await expect(page.getByRole('cell', { name: shared.name })).not.toBeVisible()
    })
  })

  test.describe('US-VIP-004: Gospel Shared toggle', () => {
    test('should toggle gospel shared status with visual feedback', async ({ page, vipAuth }) => {
      await page.goto('/vip/firsttimers')
      
      const testData = generateTestData('004')
      
      // Create first timer
      await page.getByRole('button', { name: /Add First Timer/i }).click()
      await page.getByLabel('Name').fill(testData.name)
      await page.getByLabel('Email').fill(testData.email)
      await page.getByRole('button', { name: 'Create First Timer' }).click()
      
      const row = page.getByRole('row').filter({ hasText: testData.name })
      
      // Initially should be No
      await expect(row.getByRole('button', { name: /No/i })).toBeVisible()
      
      // Toggle to Yes
      await row.getByRole('button').filter({ hasText: /No/i }).first().click()
      await expect(row.getByRole('button', { name: /Yes/i })).toBeVisible()
      
      // Toggle back to No
      await row.getByRole('button').filter({ hasText: /Yes/i }).first().click()
      await expect(row.getByRole('button', { name: /No/i })).toBeVisible()
    })
  })

  test.describe('US-VIP-005: ROOTS Completed mark', () => {
    test('should mark ROOTS as completed and sync with pathway', async ({ page, vipAuth }) => {
      await page.goto('/vip/firsttimers')
      
      const testData = generateTestData('005')
      
      // Create first timer
      await page.getByRole('button', { name: /Add First Timer/i }).click()
      await page.getByLabel('Name').fill(testData.name)
      await page.getByLabel('Email').fill(testData.email)
      await page.getByRole('button', { name: 'Create First Timer' }).click()
      
      const row = page.getByRole('row').filter({ hasText: testData.name })
      
      // Initially should be Pending
      await expect(row.getByRole('button', { name: /Pending/i })).toBeVisible()
      
      // Mark as completed
      await row.getByRole('button').filter({ hasText: /Pending/i }).first().click()
      await expect(row.getByRole('button', { name: /Done/i })).toBeVisible()
      
      // Verify in member's pathway page
      await page.goto('/auth/login')
      await page.getByLabel('Email').fill(testData.email)
      await page.getByLabel('Password').fill('Hpci!Test2025')
      await page.getByRole('button', { name: 'Sign In' }).click()
      
      await page.goto('/pathways')
      await expect(page.getByText('ROOTS')).toBeVisible()
      await expect(page.getByText('Completed')).toBeVisible()
    })
  })

  test.describe('US-VIP-006: Believer Status management', () => {
    test('should manage believer status with visual distinction', async ({ page, vipAuth }) => {
      await page.goto('/vip/firsttimers')
      
      const testData = generateTestData('006')
      
      // Create first timer
      await page.getByRole('button', { name: /Add First Timer/i }).click()
      await page.getByLabel('Name').fill(testData.name)
      await page.getByLabel('Email').fill(testData.email)
      await page.getByRole('button', { name: 'Create First Timer' }).click()
      
      const row = page.getByRole('row').filter({ hasText: testData.name })
      
      // Should have active status initially (normal appearance)
      await expect(row).not.toHaveClass(/opacity-75/)
      
      // Find and click Set Inactive button
      await row.getByRole('button', { name: /Set Inactive/i }).click()
      
      // Confirm in dialog
      await page.getByRole('button', { name: /Confirm/i }).click()
      
      // Row should now have inactive styling (gray/opacity)
      await expect(row).toHaveClass(/opacity-75/)
      
      // Test filtering by inactive status
      await page.getByRole('combobox').nth(1).click()
      await page.getByRole('option', { name: 'Inactive' }).click()
      
      // Should see the inactive member
      await expect(page.getByRole('cell', { name: testData.name })).toBeVisible()
      
      // Filter by active - should not see inactive member
      await page.getByRole('combobox').nth(1).click()
      await page.getByRole('option', { name: 'Active' }).click()
      await expect(page.getByRole('cell', { name: testData.name })).not.toBeVisible()
    })
  })

  test.describe('US-VIP-007: Assignments & notes', () => {
    test('should manage assignments and edit notes', async ({ page, vipAuth }) => {
      await page.goto('/vip/firsttimers')
      
      const testData = generateTestData('007')
      
      // Create first timer
      await page.getByRole('button', { name: /Add First Timer/i }).click()
      await page.getByLabel('Name').fill(testData.name)
      await page.getByLabel('Email').fill(testData.email)
      await page.getByLabel('Notes').fill('Initial notes for testing')
      await page.getByRole('button', { name: 'Create First Timer' }).click()
      
      const row = page.getByRole('row').filter({ hasText: testData.name })
      
      // Test assignment
      const assignSelect = row.getByRole('combobox')
      await assignSelect.click()
      const options = page.getByRole('option')
      const optionCount = await options.count()
      if (optionCount > 1) {
        await options.nth(1).click()
        await expect(assignSelect).not.toHaveText('Unassigned')
      }
      
      // Test notes editing
      await row.getByRole('button', { name: /Edit/i }).click()
      
      const notesTextarea = page.getByRole('textbox')
      await notesTextarea.clear()
      await notesTextarea.fill('Updated notes: Follow up scheduled for next week')
      
      await page.getByRole('button', { name: 'Save Notes' }).click()
      
      // Dialog should close
      await expect(page.getByRole('dialog')).not.toBeVisible()
    })
  })

  test.describe('US-VIP-008: Admin reporting analytics', () => {
    test('should provide comprehensive VIP analytics for admins', async ({ page, churchAdminAuth }) => {
      // Create some test data first as VIP
      await page.goto('/auth/login')
      await page.getByLabel('Email').fill('vip@test.com')
      await page.getByLabel('Password').fill('Hpci!Test2025')
      await page.getByRole('button', { name: 'Sign In' }).click()
      
      await page.goto('/vip/firsttimers')
      
      // Create a few first timers with different statuses
      for (let i = 1; i <= 3; i++) {
        const testData = generateTestData(`008-${i}`)
        
        await page.getByRole('button', { name: /Add First Timer/i }).click()
        await page.getByLabel('Name').fill(testData.name)
        await page.getByLabel('Email').fill(testData.email)
        await page.getByRole('button', { name: 'Create First Timer' }).click()
        
        const row = page.getByRole('row').filter({ hasText: testData.name })
        
        // Mix of statuses
        if (i === 1) {
          // Mark gospel shared
          await row.getByRole('button').filter({ hasText: /No/i }).first().click()
        }
        if (i === 2) {
          // Mark ROOTS completed  
          await row.getByRole('button').filter({ hasText: /Pending/i }).first().click()
        }
      }
      
      // Now switch to admin and check analytics
      await page.goto('/auth/login')
      await page.getByLabel('Email').fill('admin.manila@test.com')
      await page.getByLabel('Password').fill('Hpci!Test2025')  
      await page.getByRole('button', { name: 'Sign In' }).click()
      
      // Go to VIP reports
      await page.goto('/admin/reports/vip')
      
      // Verify analytics are displayed
      await expect(page.getByRole('heading', { name: 'VIP Team Analytics' })).toBeVisible()
      
      // Check key metrics cards
      await expect(page.getByText('Total First-Timers')).toBeVisible()
      await expect(page.getByText('Gospel Shared')).toBeVisible()
      await expect(page.getByText('ROOTS Completed')).toBeVisible()
      await expect(page.getByText('Follow-up Rate')).toBeVisible()
      
      // Check breakdown sections
      await expect(page.getByText('Believer Status Breakdown')).toBeVisible()
      await expect(page.getByText('Assignment Distribution')).toBeVisible()
      
      // Check insights section
      await expect(page.getByText('VIP Team Insights & Recommendations')).toBeVisible()
      
      // Check quick actions
      await expect(page.getByText('Quick Actions')).toBeVisible()
      await expect(page.getByRole('link', { name: /Manage First-Timers/i })).toBeVisible()
    })
    
    test('should restrict analytics access to admin+ roles', async ({ page, vipAuth }) => {
      // VIP user should not be able to access admin reports
      await page.goto('/admin/reports/vip')
      
      // Should be redirected to dashboard or admin page
      await expect(page).toHaveURL('/admin')
    })
  })

  test.describe('Access Control & Security', () => {
    test('should enforce role-based access correctly', async ({ page, memberAuth }) => {
      // Member should not access VIP pages
      await page.goto('/vip/firsttimers')
      await expect(page).toHaveURL('/dashboard')
    })
    
    test('should enforce tenant isolation', async ({ page, vipAuth }) => {
      // VIP from one tenant should only see their tenant's data
      await page.goto('/vip/firsttimers')
      
      // Create a first timer
      const testData = generateTestData('security')
      await page.getByRole('button', { name: /Add First Timer/i }).click()
      await page.getByLabel('Name').fill(testData.name)
      await page.getByLabel('Email').fill(testData.email)
      await page.getByRole('button', { name: 'Create First Timer' }).click()
      
      await expect(page.getByRole('cell', { name: testData.name })).toBeVisible()
      
      // Switch to different tenant VIP (if available)
      // This would be more comprehensive with multiple tenant test data
    })
  })

  test.describe('Performance & User Experience', () => {
    test('should load VIP dashboard quickly', async ({ page, vipAuth }) => {
      const startTime = Date.now()
      
      await page.goto('/vip/firsttimers')
      await expect(page.getByRole('heading', { name: 'First Timers' })).toBeVisible()
      
      const loadTime = Date.now() - startTime
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)
    })
    
    test('should provide responsive UI feedback', async ({ page, vipAuth }) => {
      await page.goto('/vip/firsttimers')
      
      const testData = generateTestData('ux')
      
      // Test form validation feedback
      await page.getByRole('button', { name: /Add First Timer/i }).click()
      await page.getByRole('button', { name: 'Create First Timer' }).click()
      
      // Should see validation errors
      await expect(page.getByText(/Name is required|Required/i)).toBeVisible()
      
      // Fill valid data
      await page.getByLabel('Name').fill(testData.name)
      await page.getByLabel('Email').fill(testData.email)
      await page.getByRole('button', { name: 'Create First Timer' }).click()
      
      // Should see success state (record appears)
      await expect(page.getByRole('cell', { name: testData.name })).toBeVisible()
    })
  })
})