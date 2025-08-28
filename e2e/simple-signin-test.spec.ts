import { test, expect } from '@playwright/test'

test('simple signin page load test', async ({ page }) => {
  // Navigate to signin page
  await page.goto('http://localhost:3001/auth/signin')
  
  // Wait longer for the page to load
  await page.waitForLoadState('networkidle')
  
  // Take a screenshot
  await page.screenshot({ path: 'signin-load-test.png', fullPage: true })
  
  // Check if the page loaded successfully
  const title = await page.title()
  console.log(`Page title: ${title}`)
  
  // Try to find the signin form elements
  const emailInput = page.locator('#email')
  const passwordInput = page.locator('#password')
  const submitButton = page.locator('button[type="submit"]')
  
  // Wait a bit more to see if elements appear
  await page.waitForTimeout(3000)
  
  const emailVisible = await emailInput.isVisible().catch(() => false)
  const passwordVisible = await passwordInput.isVisible().catch(() => false)
  const buttonVisible = await submitButton.isVisible().catch(() => false)
  
  console.log(`Email input visible: ${emailVisible}`)
  console.log(`Password input visible: ${passwordVisible}`)
  console.log(`Submit button visible: ${buttonVisible}`)
  
  // Check for any error messages in the page
  const bodyText = await page.textContent('body')
  console.log(`Page content preview: ${bodyText?.substring(0, 200)}`)
  
  if (!emailVisible || !passwordVisible || !buttonVisible) {
    // Form elements not visible - check for errors
    const errorElements = await page.locator('[role="alert"], .error, .alert').count()
    console.log(`Error elements found: ${errorElements}`)
    
    if (errorElements > 0) {
      const errorText = await page.locator('[role="alert"], .error, .alert').first().textContent()
      console.log(`Error message: ${errorText}`)
    }
  }
})