import { test, expect } from '@playwright/test'

test('detailed signin debug', async ({ page }) => {
  // Capture all console messages
  page.on('console', msg => {
    console.log(`Browser console [${msg.type()}]: ${msg.text()}`)
    if (msg.type() === 'error') {
      console.log(`  Error details: ${msg.location()}`)
    }
  })
  
  // Capture all network requests
  page.on('request', req => {
    console.log(`Request: ${req.method()} ${req.url()}`)
  })
  
  page.on('response', resp => {
    if (resp.status() >= 400) {
      console.log(`Error response: ${resp.status()} ${resp.url()}`)
    }
  })

  // Navigate to signin page
  await page.goto('http://localhost:3000/auth/signin')
  
  // Wait for page to fully load
  await page.waitForLoadState('networkidle')
  
  // Check if NextAuth is available in the browser
  const nextAuthAvailable = await page.evaluate(() => {
    return typeof window !== 'undefined' && window.next && window.next.router;
  })
  console.log(`NextAuth client available: ${nextAuthAvailable}`)
  
  // Check if signIn function exists
  const signInExists = await page.evaluate(() => {
    try {
      return typeof signIn !== 'undefined';
    } catch (e) {
      return false;
    }
  })
  console.log(`signIn function exists: ${signInExists}`)
  
  // Check for any React errors
  const reactErrors = await page.evaluate(() => {
    const errors = [];
    const originalError = console.error;
    console.error = (...args) => {
      errors.push(args.join(' '));
      originalError(...args);
    };
    return errors;
  })
  console.log(`React errors: ${JSON.stringify(reactErrors)}`)
  
  // Fill the form
  await page.fill('#email', 'superadmin@test.com')
  await page.fill('#password', 'Hpci!Test2025')
  
  // Add a small delay to ensure form state is updated
  await page.waitForTimeout(500)
  
  console.log('About to click submit button...')
  
  // Click submit and wait for response
  await page.click('button[type="submit"]')
  
  // Wait a bit longer to see what happens
  await page.waitForTimeout(10000)
  
  const finalUrl = page.url()
  console.log(`Final URL: ${finalUrl}`)
  
  // Check if there are any pending network requests
  const pendingRequests = await page.evaluate(() => {
    return document.readyState;
  })
  console.log(`Document ready state: ${pendingRequests}`)
})
