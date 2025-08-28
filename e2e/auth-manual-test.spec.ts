import { test, expect } from '@playwright/test'

test.describe('Manual Authentication Test', () => {
  test('can manually log in as super admin', async ({ page }) => {
    console.log('[MANUAL] Starting manual login test')
    
    // Go to signin page
    await page.goto('/auth/signin')
    console.log('[MANUAL] Went to signin page')
    
    // Fill credentials
    await page.fill('#email', 'superadmin@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    console.log('[MANUAL] Filled credentials')
    
    // Submit form
    await page.click('button[type="submit"]')
    console.log('[MANUAL] Clicked submit button')
    
    // Wait for some redirect with very basic timeout
    await page.waitForTimeout(5000)
    
    const currentUrl = page.url()
    console.log('[MANUAL] Current URL after 5s:', currentUrl)
    
    // Check if we're no longer on the signin page
    expect(currentUrl).not.toContain('/auth/signin')
    
    console.log('[MANUAL] Authentication test completed')
  })
})
