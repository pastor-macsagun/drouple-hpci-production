import { test, expect } from './fixtures/auth'
import { format } from 'date-fns'

test.describe('Admin Services', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/services')
  })

  test('admin can view services page @admin-services', async ({ page, churchAdminAuth }) => {
    await expect(page.getByRole('heading', { name: 'Admin Services' })).toBeVisible()
  })

  test('admin can create a service @admin-services', async ({ page, churchAdminAuth }) => {
    await page.getByRole('button', { name: 'Create Service' }).click()
    
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Create Service' })).toBeVisible()
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = format(tomorrow, 'yyyy-MM-dd')
    
    await page.getByLabel('Date').fill(dateStr)
    await page.getByLabel('Time').fill('10:00')
    
    await page.getByRole('button', { name: 'Create' }).click()
    
    await expect(page.getByText('Service created successfully')).toBeVisible()
    await expect(page.getByRole('dialog')).not.toBeVisible()
    
    await expect(page.getByRole('cell', { name: format(tomorrow, 'PPP') })).toBeVisible()
  })

  test('admin can view service details @admin-services', async ({ page, churchAdminAuth }) => {
    const existingServices = await page.getByRole('row').count()
    
    if (existingServices > 1) {
      await page.getByRole('button', { name: 'View' }).first().click()
      
      await expect(page.getByRole('heading', { name: 'Service Details' })).toBeVisible()
      await expect(page.getByText('Total Attendance')).toBeVisible()
      await expect(page.getByText('Recent Check-ins')).toBeVisible()
      
      await page.getByRole('button', { name: 'Close' }).click()
      await expect(page.getByRole('heading', { name: 'Service Details' })).not.toBeVisible()
    } else {
      await page.getByRole('button', { name: 'Create Service' }).click()
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateStr = format(tomorrow, 'yyyy-MM-dd')
      
      await page.getByLabel('Date').fill(dateStr)
      await page.getByLabel('Time').fill('10:00')
      await page.getByRole('button', { name: 'Create' }).click()
      
      await page.waitForTimeout(1000)
      
      await page.getByRole('button', { name: 'View' }).first().click()
      await expect(page.getByRole('heading', { name: 'Service Details' })).toBeVisible()
    }
  })

  test('admin can export attendance CSV @admin-services', async ({ page, churchAdminAuth }) => {
    const existingServices = await page.getByRole('row').count()
    
    if (existingServices > 1) {
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: 'Export CSV' }).first().click()
      
      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('.csv')
      
      await expect(page.getByText('Attendance exported successfully')).toBeVisible()
    } else {
      await page.getByRole('button', { name: 'Create Service' }).click()
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateStr = format(tomorrow, 'yyyy-MM-dd')
      
      await page.getByLabel('Date').fill(dateStr)
      await page.getByLabel('Time').fill('10:00')
      await page.getByRole('button', { name: 'Create' }).click()
      
      await page.waitForTimeout(1000)
      
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: 'Export CSV' }).first().click()
      
      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('.csv')
    }
  })

  test('admin can delete a service @admin-services', async ({ page, churchAdminAuth }) => {
    await page.getByRole('button', { name: 'Create Service' }).click()
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 2)
    const dateStr = format(tomorrow, 'yyyy-MM-dd')
    
    await page.getByLabel('Date').fill(dateStr)
    await page.getByLabel('Time').fill('14:00')
    await page.getByRole('button', { name: 'Create' }).click()
    
    await expect(page.getByText('Service created successfully')).toBeVisible()
    await page.waitForTimeout(1000)
    
    await page.getByRole('cell', { name: format(tomorrow, 'PPP') }).first().waitFor()
    const row = page.getByRole('row').filter({ hasText: format(tomorrow, 'PPP') })
    await row.getByRole('button', { name: 'Delete' }).click()
    
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('Are you sure you want to delete this service?')).toBeVisible()
    
    await page.getByRole('button', { name: 'Delete' }).last().click()
    
    await expect(page.getByText('Service deleted successfully')).toBeVisible()
    await expect(page.getByRole('cell', { name: format(tomorrow, 'PPP') })).not.toBeVisible()
  })

  test('shows empty state when no services @admin-services', async ({ page, churchAdminAuth }) => {
    const existingServices = await page.getByRole('row').count()
    
    if (existingServices <= 1) {
      await expect(page.getByText('No services yet')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Create Service' })).toBeVisible()
    }
  })

  test('validates required fields when creating service @admin-services', async ({ page, churchAdminAuth }) => {
    await page.getByRole('button', { name: 'Create Service' }).click()
    
    await page.getByRole('button', { name: 'Create' }).last().click()
    
    await expect(page.getByRole('dialog')).toBeVisible()
    
    await page.getByLabel('Time').fill('10:00')
    await page.getByRole('button', { name: 'Create' }).last().click()
    
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('prevents duplicate services for same date @admin-services', async ({ page, churchAdminAuth }) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 3)
    const dateStr = format(tomorrow, 'yyyy-MM-dd')
    
    await page.getByRole('button', { name: 'Create Service' }).click()
    await page.getByLabel('Date').fill(dateStr)
    await page.getByLabel('Time').fill('10:00')
    await page.getByRole('button', { name: 'Create' }).last().click()
    
    const firstResult = await Promise.race([
      page.waitForSelector('text=Service created successfully', { timeout: 5000 }).then(() => 'created'),
      page.waitForSelector('text=Service already exists for this date', { timeout: 5000 }).then(() => 'exists')
    ])
    
    if (firstResult === 'created') {
      await page.waitForTimeout(1000)
      
      await page.getByRole('button', { name: 'Create Service' }).click()
      await page.getByLabel('Date').fill(dateStr)
      await page.getByLabel('Time').fill('14:00')
      await page.getByRole('button', { name: 'Create' }).last().click()
      
      await expect(page.getByText('Service already exists for this date')).toBeVisible()
    } else {
      expect(firstResult).toBe('exists')
    }
  })
})