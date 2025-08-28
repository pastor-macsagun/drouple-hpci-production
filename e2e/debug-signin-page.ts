#!/usr/bin/env tsx
/**
 * Debug signin page to understand why form submission isn't working
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright'

async function debugSigninPage() {
  console.log('🔍 Debugging Signin Page')
  
  let browser: Browser | null = null
  let context: BrowserContext | null = null
  let page: Page | null = null
  
  try {
    browser = await chromium.launch({ headless: false, devtools: true }) // Open with devtools for debugging
    context = await browser.newContext({
      baseURL: 'http://localhost:3000',
      ignoreHTTPSErrors: true,
    })
    page = await context.newPage()
    
    // Listen to console logs and errors
    page.on('console', msg => console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`))
    page.on('pageerror', err => console.log(`[PAGE ERROR] ${err.message}`))
    
    // Navigate to signin page
    await page.goto('/auth/signin', { timeout: 10000, waitUntil: 'networkidle' })
    console.log('✅ Navigated to signin page')
    
    // Check the form structure
    const form = page.locator('form')
    const formExists = await form.count()
    console.log(`📝 Forms found: ${formExists}`)
    
    if (formExists === 0) {
      throw new Error('No form found on signin page')
    }
    
    // Check form action and method
    const formAction = await form.getAttribute('action')
    const formMethod = await form.getAttribute('method')
    console.log(`📋 Form action: ${formAction || 'none'}`)
    console.log(`📋 Form method: ${formMethod || 'GET'}`)
    
    // Check form elements
    const emailField = page.locator('#email')
    const passwordField = page.locator('#password')
    const submitButton = page.locator('button[type=\"submit\"]')
    
    const emailExists = await emailField.count()
    const passwordExists = await passwordField.count()
    const submitExists = await submitButton.count()
    
    console.log(`📧 Email field exists: ${emailExists > 0}`)
    console.log(`🔐 Password field exists: ${passwordExists > 0}`)
    console.log(`🔘 Submit button exists: ${submitExists > 0}`)
    
    if (emailExists && passwordExists && submitExists) {
      console.log('✅ All form elements present')
    } else {
      throw new Error('Missing required form elements')
    }
    
    // Check button state
    const buttonText = await submitButton.textContent()
    const buttonDisabled = await submitButton.isDisabled()
    console.log(`🔘 Submit button text: "${buttonText}"`)
    console.log(`🔘 Submit button disabled: ${buttonDisabled}`)
    
    // Fill the form and check what happens
    await emailField.fill('superadmin@test.com')
    await passwordField.fill('Hpci!Test2025')
    console.log('✅ Filled form fields')
    
    // Check button state after filling
    const buttonDisabledAfterFill = await submitButton.isDisabled()
    console.log(`🔘 Submit button disabled after fill: ${buttonDisabledAfterFill}`)
    
    // Listen for network requests
    const requests: string[] = []
    page.on('request', request => {
      const url = request.url()
      const method = request.method()
      requests.push(`${method} ${url}`)
      console.log(`[REQUEST] ${method} ${url}`)
    })
    
    page.on('response', response => {
      const url = response.url()
      const status = response.status()
      console.log(`[RESPONSE] ${status} ${url}`)
    })
    
    // Submit the form
    console.log('🚀 Submitting form...')
    await submitButton.click()
    
    // Wait a bit to see what requests are made
    await page.waitForTimeout(5000)
    
    console.log(`📊 Network requests made: ${requests.length}`)
    requests.forEach(req => console.log(`   ${req}`))
    
    const finalUrl = page.url()
    console.log(`📍 Final URL: ${finalUrl}`)
    
    // Keep browser open for manual inspection
    console.log('🔍 Browser kept open for manual inspection...')
    console.log('   Press Ctrl+C to close')
    
    // Wait indefinitely for manual inspection
    await new Promise(() => {}) // Never resolves - allows manual inspection
    
  } catch (error) {
    console.error('❌ Debug session failed:', error.message)
    return false
    
  } finally {
    // Cleanup will only happen if interrupted
    if (page) await page.close()
    if (context) await context.close()  
    if (browser) await browser.close()
  }
}

// Run with timeout to prevent hanging indefinitely
setTimeout(() => {
  console.log('⏰ Debug session timeout - closing...')
  process.exit(0)
}, 60000) // 60 second timeout

debugSigninPage()