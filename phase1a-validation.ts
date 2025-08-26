#!/usr/bin/env tsx
/**
 * Phase 1A: Super Admin Login and Landing Page Verification
 */

import { chromium } from 'playwright'

const BASE_URL = 'http://localhost:3000'
const TEST_PASSWORD = 'Hpci!Test2025'
const TIMESTAMP = `LOCALTEST-${Date.now()}`

async function validatePhase1A() {
  console.log('🚀 Phase 1A: Super Admin Login and Landing Page Verification')
  
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    // Navigate to signin page
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.waitForSelector('input#email')
    
    // Take screenshot of signin page
    await page.screenshot({ path: `./test-artifacts/${TIMESTAMP}-phase1a-01-signin-page.png`, fullPage: true })
    console.log('📸 Signin page screenshot captured')
    
    // Login as super admin
    await page.fill('input#email', 'superadmin@test.com')
    await page.fill('input#password', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForLoadState('networkidle')
    
    // Handle password change if required
    const currentUrlAfterLogin = page.url()
    if (currentUrlAfterLogin.includes('/change-password') || currentUrlAfterLogin.includes('/password-change')) {
      console.log('Password change required, handling...')
      
      // Fill new password form
      await page.fill('input[name="newPassword"], input[name="password"]', 'SuperAdmin!2025')
      await page.fill('input[name="confirmPassword"], input[name="confirmNewPassword"]', 'SuperAdmin!2025')
      await page.click('button[type="submit"]')
      await page.waitForLoadState('networkidle')
      
      await page.screenshot({ path: `./test-artifacts/${TIMESTAMP}-phase1a-02b-password-changed.png`, fullPage: true })
      console.log('📸 Password change screenshot captured')
    }
    
    // Take screenshot after login
    await page.screenshot({ path: `./test-artifacts/${TIMESTAMP}-phase1a-02-after-login.png`, fullPage: true })
    console.log('📸 After login screenshot captured')
    
    // Verify landing page
    const currentUrl = page.url()
    console.log(`Current URL after login: ${currentUrl}`)
    
    // Check if super admin landed on appropriate page
    const isOnSuperPage = currentUrl.includes('/super')
    const isOnDashboard = currentUrl.includes('/dashboard')
    
    if (!isOnSuperPage && !isOnDashboard) {
      throw new Error(`Super admin did not land on expected page. Current URL: ${currentUrl}`)
    }
    
    // Take final screenshot of landing page
    await page.screenshot({ path: `./test-artifacts/${TIMESTAMP}-phase1a-03-landing-page.png`, fullPage: true })
    console.log('📸 Landing page screenshot captured')
    
    // Verify super admin privileges by trying to access admin areas
    await page.goto(`${BASE_URL}/admin`)
    const canAccessAdmin = !page.url().includes('/signin')
    
    if (!canAccessAdmin) {
      throw new Error('Super admin cannot access admin areas')
    }
    
    console.log('✅ Phase 1A: PASS')
    console.log(`   - Super admin login successful`)
    console.log(`   - Landing page: ${currentUrl}`)
    console.log(`   - Admin access verified`)
    
    return {
      status: 'PASS',
      details: `Super admin login successful, landed on ${currentUrl}`,
      screenshots: [
        `${TIMESTAMP}-phase1a-01-signin-page.png`,
        `${TIMESTAMP}-phase1a-02-after-login.png`, 
        `${TIMESTAMP}-phase1a-03-landing-page.png`
      ]
    }
    
  } catch (error) {
    console.log(`❌ Phase 1A: FAIL - ${error}`)
    await page.screenshot({ path: `./test-artifacts/${TIMESTAMP}-phase1a-ERROR.png`, fullPage: true })
    
    return {
      status: 'FAIL',
      details: `Phase 1A failed: ${error}`,
      screenshots: [`${TIMESTAMP}-phase1a-ERROR.png`]
    }
  } finally {
    await context.close()
    await browser.close()
  }
}

// Run validation
if (require.main === module) {
  validatePhase1A()
    .then(result => {
      console.log('Phase 1A Result:', result)
      process.exit(result.status === 'PASS' ? 0 : 1)
    })
    .catch(error => {
      console.error('Phase 1A Error:', error)
      process.exit(1)
    })
}

export { validatePhase1A }