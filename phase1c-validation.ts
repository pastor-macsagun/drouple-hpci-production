#!/usr/bin/env tsx
/**
 * Phase 1C: Test role-based navigation for ALL QA users created
 */

import { chromium } from 'playwright'
import fs from 'fs'

const BASE_URL = 'http://localhost:3000'

// Load created QA users
const qaUsersFile = './qa-users-created.json'
if (!fs.existsSync(qaUsersFile)) {
  console.error('❌ QA users file not found. Run create-qa-users.ts first.')
  process.exit(1)
}

const { timestamp: TIMESTAMP, users: QA_USERS } = JSON.parse(fs.readFileSync(qaUsersFile, 'utf8'))

// Expected landing pages by role
const EXPECTED_LANDINGS = {
  SUPER_ADMIN: ['/super', '/dashboard'],
  ADMIN: ['/admin'],
  LEADER: ['/leader', '/dashboard'],
  MEMBER: ['/dashboard'],
  VIP: ['/vip']
}

// Forbidden routes by role
const FORBIDDEN_ROUTES = {
  SUPER_ADMIN: [], // Super admin can access everything
  ADMIN: ['/super'],
  LEADER: ['/super', '/admin'],
  MEMBER: ['/super', '/admin', '/leader'],
  VIP: ['/super', '/admin', '/leader']
}

async function testUserNavigation(page: any, user: any) {
  console.log(`\n🔍 Testing ${user.email} (${user.role})`)
  
  try {
    // Login
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.waitForSelector('input#email')
    await page.fill('input#email', user.email)
    await page.fill('input#password', user.password)
    await page.click('button[type="submit"]')
    await page.waitForLoadState('networkidle')
    
    // Take screenshot of landing page
    const roleSlug = user.role.toLowerCase().replace('_', '-')
    await page.screenshot({ 
      path: `./test-artifacts/${TIMESTAMP}-phase1c-${roleSlug}-landing.png`, 
      fullPage: true 
    })
    console.log(`   📸 Landing page screenshot captured`)
    
    // Check landing page
    const currentUrl = page.url()
    const expectedPaths = EXPECTED_LANDINGS[user.role as keyof typeof EXPECTED_LANDINGS]
    const hasValidLanding = expectedPaths.some(path => currentUrl.includes(path))
    
    if (!hasValidLanding) {
      throw new Error(`Invalid landing page: got ${currentUrl}, expected one of ${expectedPaths.join(', ')}`)
    }
    
    console.log(`   ✅ Landing page: ${currentUrl} (valid)`)
    
    // Test forbidden routes
    const forbiddenRoutes = FORBIDDEN_ROUTES[user.role as keyof typeof FORBIDDEN_ROUTES]
    const forbiddenResults: string[] = []
    
    for (const forbiddenRoute of forbiddenRoutes) {
      await page.goto(`${BASE_URL}${forbiddenRoute}`)
      await page.waitForLoadState('networkidle')
      
      const forbiddenUrl = page.url()
      const canAccess = forbiddenUrl.includes(forbiddenRoute)
      
      if (canAccess) {
        forbiddenResults.push(`❌ Can access ${forbiddenRoute}`)
      } else {
        forbiddenResults.push(`✅ Blocked from ${forbiddenRoute}`)
      }
    }
    
    // Take screenshot after forbidden route tests
    await page.screenshot({ 
      path: `./test-artifacts/${TIMESTAMP}-phase1c-${roleSlug}-forbidden-test.png`, 
      fullPage: true 
    })
    
    if (forbiddenResults.some(r => r.includes('❌'))) {
      throw new Error(`RBAC violations: ${forbiddenResults.filter(r => r.includes('❌')).join(', ')}`)
    }
    
    console.log(`   ✅ RBAC enforced: ${forbiddenResults.join(', ')}`)
    
    return {
      status: 'PASS',
      landingUrl: currentUrl,
      forbiddenTests: forbiddenResults
    }
    
  } catch (error) {
    console.log(`   ❌ FAILED: ${error}`)
    
    // Take error screenshot
    const roleSlug = user.role.toLowerCase().replace('_', '-')
    await page.screenshot({ 
      path: `./test-artifacts/${TIMESTAMP}-phase1c-${roleSlug}-ERROR.png`, 
      fullPage: true 
    })
    
    return {
      status: 'FAIL',
      error: error.toString()
    }
  }
}

async function validatePhase1C() {
  console.log('🚀 Phase 1C: Role-Based Navigation for ALL QA Users')
  console.log(`📋 Testing ${QA_USERS.length} users: ${QA_USERS.map((u: any) => `${u.role}@${u.email.split('@')[0]}`).join(', ')}`)
  
  const browser = await chromium.launch({ headless: false })
  const results: any = {}
  let allPassed = true
  
  try {
    for (let i = 0; i < QA_USERS.length; i++) {
      const user = QA_USERS[i]
      console.log(`\n👤 Testing user ${i + 1}/${QA_USERS.length}`)
      
      // Create fresh context for each user to avoid session contamination
      const context = await browser.newContext()
      const page = await context.newPage()
      
      try {
        const result = await testUserNavigation(page, user)
        results[user.email] = result
        
        if (result.status === 'FAIL') {
          allPassed = false
        }
        
      } finally {
        await context.close()
      }
      
      // Small delay between users
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // Generate summary
    const passedCount = Object.values(results).filter((r: any) => r.status === 'PASS').length
    const failedCount = QA_USERS.length - passedCount
    
    console.log(`\n📊 PHASE 1C RESULTS:`)
    console.log(`   ✅ Passed: ${passedCount}/${QA_USERS.length}`)
    console.log(`   ❌ Failed: ${failedCount}`)
    
    if (!allPassed) {
      console.log(`\n❌ FAILURES:`)
      Object.entries(results).forEach(([email, result]: [string, any]) => {
        if (result.status === 'FAIL') {
          console.log(`   - ${email}: ${result.error}`)
        }
      })
      throw new Error(`${failedCount} navigation tests failed`)
    }
    
    console.log('\n✅ Phase 1C: PASS')
    console.log('   - All QA users have correct role-based navigation')
    console.log('   - All RBAC forbidden route access properly blocked')
    
    return {
      status: 'PASS',
      details: `All ${QA_USERS.length} role navigation tests passed`,
      results,
      screenshots: Object.keys(results).map(email => {
        const role = QA_USERS.find((u: any) => u.email === email)?.role.toLowerCase().replace('_', '-')
        return [
          `${TIMESTAMP}-phase1c-${role}-landing.png`,
          `${TIMESTAMP}-phase1c-${role}-forbidden-test.png`
        ]
      }).flat()
    }
    
  } catch (error) {
    console.log(`\n❌ Phase 1C: FAIL - ${error}`)
    
    return {
      status: 'FAIL',
      details: `Phase 1C failed: ${error}`,
      results
    }
  } finally {
    await browser.close()
  }
}

// Run validation
if (require.main === module) {
  validatePhase1C()
    .then(result => {
      console.log('\nPhase 1C Final Result:', result)
      
      if (result.status === 'PASS') {
        console.log('\n🎉 ALL ROLE NAVIGATION TESTS PASSED')
        process.exit(0)
      } else {
        console.log('\n💥 ROLE NAVIGATION TESTS FAILED')
        process.exit(1)
      }
    })
    .catch(error => {
      console.error('Phase 1C Error:', error)
      process.exit(1)
    })
}

export { validatePhase1C }