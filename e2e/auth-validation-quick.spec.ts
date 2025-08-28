import { test, expect } from './fixtures/auth'

test.describe('Authentication Validation - Quick Test', () => {
  test('super admin authentication works reliably', async ({ page, superAdminAuth }) => {
    console.log('[VALIDATION] Testing super admin authentication')
    
    // Should be authenticated and on correct page
    await expect(page).toHaveURL(/\/(super|admin)/, { timeout: 10000 })
    
    // Should be able to interact with page
    const body = page.locator('body')
    await expect(body).toBeVisible()
    
    console.log('[VALIDATION] Super admin auth validated successfully')
  })

  test('church admin authentication works reliably', async ({ page, churchAdminAuth }) => {
    console.log('[VALIDATION] Testing church admin authentication')
    
    // Should be authenticated and on correct page
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 })
    
    // Should be able to interact with page
    const body = page.locator('body')
    await expect(body).toBeVisible()
    
    console.log('[VALIDATION] Church admin auth validated successfully')
  })

  test('member authentication works reliably', async ({ page, memberAuth }) => {
    console.log('[VALIDATION] Testing member authentication')
    
    // Should be authenticated and on correct page
    await expect(page).toHaveURL(/\/(dashboard|member)/, { timeout: 10000 })
    
    // Should be able to interact with page
    const body = page.locator('body')
    await expect(body).toBeVisible()
    
    console.log('[VALIDATION] Member auth validated successfully')
  })
})