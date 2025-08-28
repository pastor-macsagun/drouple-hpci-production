#!/usr/bin/env tsx
/**
 * Simple authentication test without waiting for auth API
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright'

async function simpleAuthTest() {
  console.log('🧪 Simple Authentication Test')
  
  let browser: Browser | null = null
  let context: BrowserContext | null = null
  let page: Page | null = null
  
  try {
    browser = await chromium.launch({ headless: true })
    context = await browser.newContext({
      baseURL: 'http://localhost:3000',
      ignoreHTTPSErrors: true,
    })
    page = await context.newPage()
    
    // Navigate to signin page
    await page.goto('/auth/signin', { timeout: 10000, waitUntil: 'domcontentloaded' })
    console.log('✅ Navigated to signin page')
    
    // Fill credentials
    await page.fill('#email', 'superadmin@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    console.log('✅ Filled credentials')
    
    // Submit form
    await page.click('button[type="submit"]')
    console.log('✅ Clicked submit button')
    
    // Wait for any navigation/redirect (but don't expect specific auth API)
    await page.waitForTimeout(5000)
    
    const finalUrl = page.url()
    console.log(`📍 Final URL: ${finalUrl}`)
    
    // Check if we're no longer on signin page
    if (finalUrl.includes('/auth/signin')) {
      // Check for error messages
      const errorAlert = await page.locator('[role="alert"]').first()
      if (await errorAlert.isVisible()) {
        const errorText = await errorAlert.textContent()
        console.log(`❌ Error message: ${errorText}`)
        throw new Error(`Authentication failed: ${errorText}`)
      } else {
        console.log('⚠️  Still on signin page but no error visible')
        throw new Error('Authentication did not redirect (possible rate limiting or server issue)')
      }
    } else {
      console.log('✅ Successfully redirected away from signin page')
      
      // Try to capture storage state
      const storageState = await context.storageState()
      const hasCookies = storageState.cookies.length > 0
      
      console.log(`🍪 Captured ${storageState.cookies.length} cookies`)
      
      if (hasCookies) {
        console.log('✅ Authentication storage state captured')
      }
      
      return true
    }
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message)
    
    if (page) {
      const url = page.url()
      const title = await page.title().catch(() => 'N/A')
      console.error(`Current URL: ${url}`)
      console.error(`Page title: ${title}`)
    }
    
    return false
    
  } finally {
    if (page) await page.close()
    if (context) await context.close()
    if (browser) await browser.close()
  }
}

simpleAuthTest().then(success => {
  if (success) {
    console.log('\n🎉 Simple authentication test PASSED')
    process.exit(0)
  } else {
    console.log('\n❌ Simple authentication test FAILED')
    process.exit(1)
  }
})