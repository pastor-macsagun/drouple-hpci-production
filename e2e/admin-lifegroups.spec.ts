import { test, expect } from './fixtures/auth'
import { format } from 'date-fns'

test.describe('Admin LifeGroups', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/lifegroups')
  })

  test('admin can view lifegroups page @admin-lifegroups', async ({ page, churchAdminAuth }) => {
    await expect(page.getByRole('heading', { name: 'Admin LifeGroups' })).toBeVisible()
  })

  test('admin can create a life group @admin-lifegroups', async ({ page, churchAdminAuth }) => {
    await page.getByRole('button', { name: 'Create LifeGroup' }).click()
    
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Create LifeGroup' })).toBeVisible()
    
    const timestamp = Date.now()
    const groupName = `Test Group ${timestamp}`
    
    await page.getByLabel('Name').fill(groupName)
    
    await page.getByLabel('Leader').click()
    await page.getByRole('option').first().click()
    
    await page.getByLabel('Schedule').fill('Every Wednesday 7PM')
    await page.getByLabel('Capacity').fill('15')
    await page.getByLabel('Description').fill('Test group for automation')
    
    await page.getByRole('button', { name: 'Create' }).last().click()
    
    await expect(page.getByText('Life group created successfully')).toBeVisible()
    await expect(page.getByRole('dialog')).not.toBeVisible()
    
    await expect(page.getByRole('cell', { name: groupName })).toBeVisible()
  })

  test('admin can manage life group roster @admin-lifegroups', async ({ page, churchAdminAuth }) => {
    const existingGroups = await page.getByRole('row').count()
    
    if (existingGroups > 1) {
      await page.getByRole('button', { name: 'Manage' }).first().click()
      
      await expect(page.getByRole('heading', { name: 'Manage LifeGroup' })).toBeVisible()
      await expect(page.getByRole('tab', { name: 'Roster' })).toBeVisible()
      await expect(page.getByRole('tab', { name: 'Join Requests' })).toBeVisible()
      await expect(page.getByRole('tab', { name: 'Attendance' })).toBeVisible()
      
      await page.getByRole('tab', { name: 'Roster' }).click()
      
      const memberCount = await page.getByRole('button', { name: 'Remove' }).count()
      if (memberCount > 0) {
        await expect(page.getByRole('button', { name: 'Remove' }).first()).toBeVisible()
      } else {
        await expect(page.getByText('No members yet')).toBeVisible()
      }
      
      await page.getByRole('button', { name: 'Close' }).click()
      await expect(page.getByRole('heading', { name: 'Manage LifeGroup' })).not.toBeVisible()
    } else {
      await page.getByRole('button', { name: 'Create LifeGroup' }).click()
      const timestamp = Date.now()
      const groupName = `Test Group ${timestamp}`
      
      await page.getByLabel('Name').fill(groupName)
      await page.getByLabel('Leader').click()
      await page.getByRole('option').first().click()
      await page.getByLabel('Capacity').fill('10')
      await page.getByRole('button', { name: 'Create' }).last().click()
      
      await page.waitForTimeout(1000)
      
      await page.getByRole('button', { name: 'Manage' }).first().click()
      await expect(page.getByRole('heading', { name: 'Manage LifeGroup' })).toBeVisible()
    }
  })

  test('admin can handle join requests @admin-lifegroups', async ({ page, churchAdminAuth }) => {
    const existingGroups = await page.getByRole('row').count()
    
    if (existingGroups > 1) {
      await page.getByRole('button', { name: 'Manage' }).first().click()
      await page.getByRole('tab', { name: 'Join Requests' }).click()
      
      const requestCount = await page.getByRole('button', { name: 'Approve' }).count()
      if (requestCount > 0) {
        await page.getByRole('button', { name: 'Approve' }).first().click()
        await expect(page.getByText('Request approved')).toBeVisible()
      } else {
        await expect(page.getByText('No pending requests')).toBeVisible()
      }
      
      await page.getByRole('button', { name: 'Close' }).click()
    }
  })

  test('admin can start attendance session @admin-lifegroups', async ({ page, churchAdminAuth }) => {
    const existingGroups = await page.getByRole('row').count()
    
    if (existingGroups > 1) {
      await page.getByRole('button', { name: 'Manage' }).first().click()
      await page.getByRole('tab', { name: 'Attendance' }).click()
      
      const today = format(new Date(), 'yyyy-MM-dd')
      await page.getByLabel('Session Date').fill(today)
      await page.getByRole('button', { name: 'Start Session' }).click()
      
      await expect(page.getByText('Attendance session started')).toBeVisible()
      await expect(page.getByText('Mark members present')).toBeVisible()
      
      const memberCheckboxes = await page.getByRole('checkbox').count()
      if (memberCheckboxes > 0) {
        await page.getByRole('checkbox').first().check()
        await page.waitForTimeout(500)
      }
      
      await page.getByRole('button', { name: 'End Session' }).click()
      await expect(page.getByRole('button', { name: 'Start Session' })).toBeVisible()
      
      await page.getByRole('button', { name: 'Close' }).click()
    }
  })

  test('admin can export roster CSV @admin-lifegroups', async ({ page, churchAdminAuth }) => {
    const existingGroups = await page.getByRole('row').count()
    
    if (existingGroups > 1) {
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: 'Export Roster CSV' }).first().click()
      
      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('.csv')
      
      await expect(page.getByText('Roster exported successfully')).toBeVisible()
    } else {
      await page.getByRole('button', { name: 'Create LifeGroup' }).click()
      const timestamp = Date.now()
      const groupName = `Test Group ${timestamp}`
      
      await page.getByLabel('Name').fill(groupName)
      await page.getByLabel('Leader').click()
      await page.getByRole('option').first().click()
      await page.getByLabel('Capacity').fill('10')
      await page.getByRole('button', { name: 'Create' }).last().click()
      
      await page.waitForTimeout(1000)
      
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: 'Export Roster CSV' }).first().click()
      
      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('.csv')
    }
  })

  test('admin can delete a life group @admin-lifegroups', async ({ page, churchAdminAuth }) => {
    await page.getByRole('button', { name: 'Create LifeGroup' }).click()
    const timestamp = Date.now()
    const groupName = `Delete Test ${timestamp}`
    
    await page.getByLabel('Name').fill(groupName)
    await page.getByLabel('Leader').click()
    await page.getByRole('option').first().click()
    await page.getByLabel('Capacity').fill('5')
    await page.getByRole('button', { name: 'Create' }).last().click()
    
    await expect(page.getByText('Life group created successfully')).toBeVisible()
    await page.waitForTimeout(1000)
    
    await page.getByRole('cell', { name: groupName }).first().waitFor()
    const row = page.getByRole('row').filter({ hasText: groupName })
    await row.getByRole('button', { name: 'Delete' }).click()
    
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('Are you sure you want to delete this life group?')).toBeVisible()
    
    await page.getByRole('button', { name: 'Delete' }).last().click()
    
    await expect(page.getByText('Life group deleted successfully')).toBeVisible()
    await expect(page.getByRole('cell', { name: groupName })).not.toBeVisible()
  })

  test('shows empty state when no life groups @admin-lifegroups', async ({ page, churchAdminAuth }) => {
    const existingGroups = await page.getByRole('row').count()
    
    if (existingGroups <= 1) {
      await expect(page.getByText('No life groups yet')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Create LifeGroup' })).toBeVisible()
    }
  })

  test('validates required fields when creating life group @admin-lifegroups', async ({ page, churchAdminAuth }) => {
    await page.getByRole('button', { name: 'Create LifeGroup' }).click()
    
    await page.getByRole('button', { name: 'Create' }).last().click()
    
    await expect(page.getByRole('dialog')).toBeVisible()
    
    await page.getByLabel('Name').fill('Test Group')
    await page.getByRole('button', { name: 'Create' }).last().click()
    
    await expect(page.getByRole('dialog')).toBeVisible()
    
    await page.getByLabel('Leader').click()
    await page.getByRole('option').first().click()
    await page.getByRole('button', { name: 'Create' }).last().click()
    
    await expect(page.getByText('Life group created successfully')).toBeVisible()
  })

  test('admin can export attendance CSV @admin-lifegroups', async ({ page, churchAdminAuth }) => {
    const existingGroups = await page.getByRole('row').count()
    
    if (existingGroups > 1) {
      await page.getByRole('button', { name: 'Manage' }).first().click()
      await page.getByRole('tab', { name: 'Attendance' }).click()
      
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: 'Export Attendance CSV' }).click()
      
      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('.csv')
      
      await expect(page.getByText('Attendance exported successfully')).toBeVisible()
      
      await page.getByRole('button', { name: 'Close' }).click()
    }
  })
})