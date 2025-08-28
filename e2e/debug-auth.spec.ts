import { test, expect } from '@playwright/test'

test.describe('Debug Authentication', () => {
  test('debug member login step by step', async ({ page }) => {
    console.log('[DEBUG] Starting debug test')
    
    // Navigate to signin page
    console.log('[DEBUG] Navigating to signin')
    await page.goto('/auth/signin')
    await page.waitForLoadState('domcontentloaded')
    
    console.log('[DEBUG] Current URL after goto:', page.url())
    
    // Take screenshot
    await page.screenshot({ path: 'debug-signin-page.png' })
    
    // Check if form elements exist
    const emailField = page.locator('#email')
    const passwordField = page.locator('#password') 
    const submitButton = page.locator('button[type="submit"]')
    
    console.log('[DEBUG] Email field visible:', await emailField.isVisible())
    console.log('[DEBUG] Password field visible:', await passwordField.isVisible())
    console.log('[DEBUG] Submit button visible:', await submitButton.isVisible())
    
    // Fill the form
    console.log('[DEBUG] Filling form')
    await emailField.fill('member1@test.com')
    await passwordField.fill('Hpci!Test2025')
    
    // Take screenshot before submit
    await page.screenshot({ path: 'debug-before-submit.png' })
    
    // Check if there are any errors already
    const errorText = await page.locator('[role="alert"], .text-destructive').textContent()
    console.log('[DEBUG] Any error messages before submit:', errorText)
    
    // Submit and monitor what happens
    console.log('[DEBUG] Submitting form')
    
    // Wait for any potential navigation
    const responsePromise = page.waitForResponse(response => {
      console.log('[DEBUG] Response:', response.url(), response.status())
      return response.url().includes('/auth/') || response.url().includes('/api/')
    }, { timeout: 5000 }).catch(() => null)
    
    await submitButton.click()
    
    await responsePromise
    
    // Wait a moment for any changes
    await page.waitForTimeout(3000)
    
    console.log('[DEBUG] URL after submit:', page.url())
    
    // Take screenshot after submit
    await page.screenshot({ path: 'debug-after-submit.png' })
    
    // Check for error messages
    const errorAfterSubmit = await page.locator('[role="alert"], .text-destructive').textContent()
    console.log('[DEBUG] Any error messages after submit:', errorAfterSubmit)
    
    // Check if button is still loading
    const buttonText = await submitButton.textContent()
    console.log('[DEBUG] Button text after submit:', buttonText)
  })
})
