import { test, expect } from '@playwright/test'
import { prisma } from '@/lib/prisma'

test.describe('Sunday Service Check-in Flow', () => {
  test.beforeEach(async ({ page }) => {
    await prisma.checkin.deleteMany()
    await prisma.service.deleteMany()
    
    const localChurch = await prisma.localChurch.findFirst()
    if (localChurch) {
      await prisma.service.create({
        data: {
          date: new Date(),
          localChurchId: localChurch.id,
        },
      })
    }
  })

  test('member can check in to Sunday service', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'member@test.com')
    await page.click('button[type="submit"]')
    
    await page.waitForURL('/auth/verify')
    
    await page.goto('/checkin')
    
    await expect(page.locator('h1')).toContainText('Sunday Service Check-In')
    
    await page.click('button:has-text("Check In")')
    
    await expect(page.locator('.bg-green-50')).toContainText('Already Checked In')
  })

  test('admin can view live attendance count', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'admin@test.com')
    await page.click('button[type="submit"]')
    
    await page.waitForURL('/auth/verify')
    
    await page.goto('/admin/services')
    
    await expect(page.locator('h1')).toContainText('Service Management')
    
    const activeService = page.locator('span:has-text("Active")').first()
    if (await activeService.isVisible()) {
      await activeService.click()
      
      await expect(page.locator('h3:has-text("Total Check-ins")')).toBeVisible()
      
      const initialCount = await page.locator('p.text-3xl').first().textContent()
      
      await page.waitForTimeout(6000)
      
      const updatedCount = await page.locator('p.text-3xl').first().textContent()
      expect(parseInt(updatedCount || '0')).toBeGreaterThanOrEqual(parseInt(initialCount || '0'))
    }
  })

  test('prevents duplicate check-ins for same service', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'member@test.com')
    await page.click('button[type="submit"]')
    
    await page.waitForURL('/auth/verify')
    
    await page.goto('/checkin')
    await page.click('button:has-text("Check In")')
    
    await expect(page.locator('.bg-green-50')).toContainText('Already Checked In')
    
    await page.reload()
    
    await expect(page.locator('.bg-green-50')).toContainText('Already Checked In')
  })

  test('admin can export attendance as CSV', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'admin@test.com')
    await page.click('button[type="submit"]')
    
    await page.waitForURL('/auth/verify')
    
    await page.goto('/admin/services')
    
    const firstService = page.locator('li').first()
    await firstService.click()
    
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Export CSV")')
    const download = await downloadPromise
    
    expect(download.suggestedFilename()).toContain('attendance')
    expect(download.suggestedFilename()).toContain('.csv')
  })
})