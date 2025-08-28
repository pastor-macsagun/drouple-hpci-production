import { test, expect } from '@playwright/test'

test('debug signin form', async ({ page }) => {
  // Listen for console messages and network requests
  page.on('console', msg => {
    console.log(`Browser console: ${msg.type()} - ${msg.text()}`)
  })
  
  page.on('request', req => {
    if (req.url().includes('/api/auth/')) {
      console.log(`Auth request: ${req.method()} ${req.url()}`)
    }
  })
  
  page.on('response', resp => {
    if (resp.url().includes('/api/auth/')) {
      console.log(`Auth response: ${resp.status()} ${resp.url()}`)
    }
  })

  // Navigate to signin page
  await page.goto('http://localhost:3001/auth/signin')
  
  // Check if the page loads correctly
  await expect(page.locator('#email')).toBeVisible()
  await expect(page.locator('#password')).toBeVisible()
  await expect(page.locator('button[type="submit"]')).toBeVisible()
  
  // Fill the form
  await page.fill('#email', 'superadmin@test.com')
  await page.fill('#password', 'Hpci!Test2025')
  
  console.log('Form filled, submitting...')
  
  // Click submit and wait for any network activity
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForTimeout(5000) // Wait for any async activity
  ])
  
  // Check the current URL
  const currentUrl = page.url()
  console.log(`Current URL after submit: ${currentUrl}`)
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'signin-debug.png', fullPage: true })
})