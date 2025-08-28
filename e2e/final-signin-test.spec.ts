import { test, expect } from '@playwright/test'

test('signin form functionality test', async ({ page }) => {
  // Navigate to signin page on the correct port
  await page.goto('http://localhost:3002/auth/signin')
  
  // Wait for page to load completely
  await page.waitForLoadState('networkidle')
  
  // Verify all form elements are present
  await expect(page.locator('#email')).toBeVisible()
  await expect(page.locator('#password')).toBeVisible()
  await expect(page.locator('button[type="submit"]')).toBeVisible()
  
  // Fill in the form with test credentials
  await page.fill('#email', 'superadmin@test.com')
  await page.fill('#password', 'Hpci!Test2025')
  
  console.log('Form filled successfully')
  
  // Submit the form
  await page.click('button[type="submit"]')
  
  // Wait for form submission
  await page.waitForTimeout(5000)
  
  const currentUrl = page.url()
  console.log(`URL after form submission: ${currentUrl}`)
  
  // Check if we're no longer on the signin page (authentication succeeded)
  // or if we got an error message (authentication failed but form worked)
  const stillOnSignin = currentUrl.includes('/auth/signin')
  const hasErrorMessage = await page.locator('[role="alert"]').count() > 0
  
  if (stillOnSignin) {
    if (hasErrorMessage) {
      const errorText = await page.locator('[role="alert"]').textContent()
      console.log(`Authentication failed with error: ${errorText}`)
      console.log('✅ Form submission worked - got error response')
    } else {
      console.log('❌ Form did not submit - still on signin page with no error')
    }
  } else {
    console.log('✅ Form submission worked - redirected away from signin page')
  }
  
  // Take screenshot for verification
  await page.screenshot({ path: 'final-signin-test.png', fullPage: true })
})