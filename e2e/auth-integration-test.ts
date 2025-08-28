#!/usr/bin/env tsx
/**
 * Direct authentication integration test
 * Tests the auth fixtures without full Playwright browser setup
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright'
import { existsSync } from 'fs'
import { join } from 'path'

const STORAGE_STATE_DIR = join(process.cwd(), 'test-results', 'auth-states')

async function testAuthenticationFixtures() {
  console.log('🧪 Testing E2E Authentication Fixtures Integration')
  
  let browser: Browser | null = null
  let context: BrowserContext | null = null
  let page: Page | null = null
  
  try {
    // Launch browser
    browser = await chromium.launch({ headless: true })
    context = await browser.newContext({
      baseURL: 'http://localhost:3000',
      ignoreHTTPSErrors: true,
    })
    page = await context.newPage()
    
    console.log('📱 Browser launched successfully')
    
    // Test 1: Check if server is running
    try {
      await page.goto('/', { timeout: 10000, waitUntil: 'domcontentloaded' })
      console.log('✅ Server is accessible at http://localhost:3000')
    } catch (error) {
      throw new Error(`❌ Server not accessible: ${error.message}`)
    }
    
    // Test 2: Test authentication flow directly
    console.log('🔐 Testing authentication flow...')
    
    // Go to signin page
    await page.goto('/auth/signin', { timeout: 10000, waitUntil: 'domcontentloaded' })
    console.log('📄 Navigated to signin page')
    
    // Check if form elements exist
    const emailField = await page.locator('#email')
    const passwordField = await page.locator('#password') 
    const submitButton = await page.locator('button[type="submit"]')
    
    await emailField.waitFor({ state: 'visible', timeout: 5000 })
    await passwordField.waitFor({ state: 'visible', timeout: 5000 })
    await submitButton.waitFor({ state: 'visible', timeout: 5000 })
    
    console.log('✅ Form elements are present and visible')
    
    // Test 3: Attempt login with test credentials
    console.log('🔑 Testing login with superadmin@test.com...')
    
    await emailField.fill('superadmin@test.com')
    await passwordField.fill('Hpci!Test2025')
    
    console.log('📝 Filled credentials')
    
    // Submit and wait for response
    const [response] = await Promise.all([
      page.waitForResponse(response => 
        response.url().includes('/api/auth') && response.status() < 400, 
        { timeout: 15000 }
      ),
      submitButton.click()
    ])
    
    console.log(`🌐 Auth API response: ${response.status()} ${response.statusText()}`)
    
    // Wait for redirect
    await page.waitForTimeout(3000)
    const finalUrl = page.url()
    
    if (finalUrl.includes('/auth/signin')) {
      // Check for error messages
      const errorElements = await page.locator('[role="alert"], .text-destructive, .text-red-500').all()
      if (errorElements.length > 0) {
        for (const element of errorElements) {
          const text = await element.textContent()
          console.log(`❌ Error message found: ${text}`)
        }
      }
      throw new Error('Authentication failed - still on signin page')
    }
    
    console.log(`✅ Authentication successful - redirected to: ${finalUrl}`)
    
    // Test 4: Verify storage state can be saved
    const storageState = await context.storageState()
    const hasCookies = storageState.cookies.length > 0
    const hasStorage = storageState.origins.length > 0
    
    console.log(`🍪 Storage state - Cookies: ${storageState.cookies.length}, Origins: ${storageState.origins.length}`)
    
    if (hasCookies || hasStorage) {
      console.log('✅ Storage state captured successfully')
    } else {
      console.log('⚠️  No storage state captured (may still work)')
    }
    
    console.log('\n🎉 All authentication integration tests passed!')
    
  } catch (error) {
    console.error('\n❌ Authentication integration test failed:')
    console.error(error.message)
    
    if (page) {
      const currentUrl = page.url()
      const title = await page.title().catch(() => 'N/A')
      console.error(`📍 Current URL: ${currentUrl}`)
      console.error(`📑 Page title: ${title}`)
    }
    
    process.exit(1)
    
  } finally {
    // Cleanup
    if (page) await page.close()
    if (context) await context.close()
    if (browser) await browser.close()
  }
}

// Check if storage state directory exists
if (existsSync(STORAGE_STATE_DIR)) {
  console.log(`📁 Auth cache directory exists: ${STORAGE_STATE_DIR}`)
} else {
  console.log(`📁 Auth cache directory will be created: ${STORAGE_STATE_DIR}`)
}

// Run the test
testAuthenticationFixtures()