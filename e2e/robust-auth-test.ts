#!/usr/bin/env tsx
/**
 * Robust authentication test with proper NextAuth handling
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright'

async function robustAuthTest() {
  console.log('🧪 Robust Authentication Test with NextAuth')
  
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
    await page.goto('/auth/signin', { timeout: 10000, waitUntil: 'networkidle' })
    console.log('✅ Navigated to signin page')
    
    // Wait for form to be ready and visible
    await page.waitForSelector('#email', { state: 'visible', timeout: 10000 })
    await page.waitForSelector('#password', { state: 'visible', timeout: 5000 })
    await page.waitForSelector('button[type="submit"]:not(:disabled)', { timeout: 5000 })
    console.log('✅ Form elements are visible and ready')
    
    // Clear and fill credentials
    await page.fill('#email', '')
    await page.fill('#email', 'superadmin@test.com')
    await page.fill('#password', '')
    await page.fill('#password', 'Hpci!Test2025')
    console.log('✅ Filled credentials')
    
    // Set up listeners for network activity and navigation
    let navigationPromise = page.waitForNavigation({ timeout: 15000 }).catch(() => null)
    let responsePromise = page.waitForResponse(
      response => response.url().includes('/api/auth/callback/credentials'),
      { timeout: 10000 }
    ).catch(() => null)
    
    // Submit form
    await page.click('button[type="submit"]')
    console.log('✅ Submitted form')
    
    // Wait for either navigation or auth response
    const [navigation, response] = await Promise.all([navigationPromise, responsePromise])
    
    if (response) {
      console.log(`🌐 Auth response: ${response.status()}`)
      if (response.status() >= 400) {
        const body = await response.text().catch(() => 'Unknown error')
        throw new Error(`Auth failed with status ${response.status()}: ${body}`)
      }
    }
    
    // Wait a bit more for any additional redirects
    await page.waitForTimeout(3000)
    
    const finalUrl = page.url()
    console.log(`📍 Final URL: ${finalUrl}`)
    
    // Check if authentication was successful
    if (finalUrl.includes('/auth/signin')) {
      // Still on signin page - check for errors
      const errorSelectors = [
        '[role="alert"]',
        '.text-destructive',
        '.text-red-500',
        '[class*="error"]'
      ]
      
      for (const selector of errorSelectors) {
        const errorElement = page.locator(selector).first()
        if (await errorElement.isVisible({ timeout: 1000 })) {
          const errorText = await errorElement.textContent()
          throw new Error(`Authentication error: ${errorText}`)
        }
      }
      
      // No visible error but still on signin page
      console.log('⚠️  Still on signin page - checking for rate limiting')
      
      // Check if the submit button is disabled (might indicate rate limiting)
      const submitButton = page.locator('button[type="submit"]')
      const isDisabled = await submitButton.isDisabled()
      
      if (isDisabled) {
        throw new Error('Authentication blocked - submit button disabled (likely rate limited)')
      } else {
        throw new Error('Authentication failed - no redirect occurred but no visible error')
      }
    } else {
      console.log('✅ Successfully redirected away from signin page')
      
      // Verify we're on a valid authenticated page
      const validPaths = ['/super', '/admin', '/dashboard', '/vip', '/leader']
      const isValidPath = validPaths.some(path => finalUrl.includes(path))
      
      if (isValidPath) {
        console.log(`✅ Redirected to valid authenticated page: ${finalUrl}`)
      } else {
        console.log(`⚠️  Redirected to unexpected page: ${finalUrl}`)
      }
      
      // Try to capture storage state
      const storageState = await context.storageState()
      const cookieCount = storageState.cookies.length
      
      console.log(`🍪 Captured ${cookieCount} cookies`)
      
      // Check for auth-related cookies
      const authCookies = storageState.cookies.filter(cookie => 
        cookie.name.includes('auth') || cookie.name.includes('session')
      )
      
      if (authCookies.length > 0) {
        console.log(`✅ Found ${authCookies.length} auth-related cookies`)
        authCookies.forEach(cookie => {
          console.log(`   - ${cookie.name}: ${cookie.value.substring(0, 20)}...`)
        })
      }
      
      return true
    }
    
  } catch (error) {
    console.error('❌ Robust authentication test failed:', error.message)
    
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

robustAuthTest().then(success => {
  if (success) {
    console.log('\n🎉 Robust authentication test PASSED')
    console.log('   Authentication fixtures should work correctly now')
    process.exit(0)
  } else {
    console.log('\n❌ Robust authentication test FAILED')
    console.log('   E2E authentication fixtures may not work reliably')
    process.exit(1)
  }
})