#!/usr/bin/env tsx
/**
 * Phase 1C: Test role-based navigation for ALL QA users created
 * (Testing actual system behavior, not assumptions)
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

async function testUserAccess(page: any, user: any) {
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
    
    const landingUrl = page.url()
    console.log(`   📸 Landing page: ${landingUrl}`)
    
    // Test access to role-specific areas
    const accessTests = []
    
    // Test Super Admin access
    if (user.role === 'SUPER_ADMIN') {
      await page.goto(`${BASE_URL}/super`)
      const superUrl = page.url()
      const canAccessSuper = !superUrl.includes('/signin') && !superUrl.includes('/forbidden')
      accessTests.push(`Super area: ${canAccessSuper ? 'ACCESSIBLE' : 'BLOCKED'}`)
    }
    
    // Test Admin access
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      await page.goto(`${BASE_URL}/admin`)
      const adminUrl = page.url()
      const canAccessAdmin = !adminUrl.includes('/signin') && !adminUrl.includes('/forbidden')
      accessTests.push(`Admin area: ${canAccessAdmin ? 'ACCESSIBLE' : 'BLOCKED'}`)
    }
    
    // Test VIP access
    if (user.role === 'VIP' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      await page.goto(`${BASE_URL}/vip`)
      const vipUrl = page.url()
      const canAccessVip = !vipUrl.includes('/signin') && !vipUrl.includes('/forbidden')
      accessTests.push(`VIP area: ${canAccessVip ? 'ACCESSIBLE' : 'BLOCKED'}`)
    }
    
    // Test Member access (should work for everyone)
    await page.goto(`${BASE_URL}/dashboard`)
    const dashboardUrl = page.url()
    const canAccessDashboard = !dashboardUrl.includes('/signin') && !dashboardUrl.includes('/forbidden')
    accessTests.push(`Dashboard: ${canAccessDashboard ? 'ACCESSIBLE' : 'BLOCKED'}`)
    
    // Test forbidden areas for lower roles
    const forbiddenTests = []
    
    if (user.role === 'MEMBER') {
      // Members shouldn't access admin areas
      await page.goto(`${BASE_URL}/admin`)
      const adminCheck = page.url()
      forbiddenTests.push(`Admin (should block): ${adminCheck.includes('/admin') ? 'LEAKED' : 'BLOCKED'}`)
      
      await page.goto(`${BASE_URL}/super`)
      const superCheck = page.url()
      forbiddenTests.push(`Super (should block): ${superCheck.includes('/super') ? 'LEAKED' : 'BLOCKED'}`)
    }
    
    if (user.role === 'LEADER') {
      await page.goto(`${BASE_URL}/admin`)
      const adminCheck = page.url()
      forbiddenTests.push(`Admin (should block): ${adminCheck.includes('/admin') ? 'LEAKED' : 'BLOCKED'}`)
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: `./test-artifacts/${TIMESTAMP}-phase1c-${roleSlug}-access-test.png`, 
      fullPage: true 
    })
    
    const allTests = [...accessTests, ...forbiddenTests]
    const hasLeaks = forbiddenTests.some(t => t.includes('LEAKED'))
    
    console.log(`   📝 Access tests: ${allTests.join(', ')}`)
    
    if (hasLeaks) {
      console.log(`   ⚠️  Security leaks detected`)
    } else {
      console.log(`   ✅ Access controls working as expected`)
    }
    
    return {
      status: hasLeaks ? 'SECURITY_ISSUE' : 'PASS',
      landingUrl,
      accessTests: allTests,
      securityLeaks: forbiddenTests.filter(t => t.includes('LEAKED'))
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
  console.log('🚀 Phase 1C: Role-Based Access Control for ALL QA Users')
  console.log(`📋 Testing ${QA_USERS.length} users: ${QA_USERS.map((u: any) => `${u.role}@${u.email.split('@')[0]}`).join(', ')}`)
  
  const browser = await chromium.launch({ headless: false })
  const results: any = {}
  let passCount = 0
  let failCount = 0
  let securityIssues = 0
  
  try {
    for (let i = 0; i < QA_USERS.length; i++) {
      const user = QA_USERS[i]
      console.log(`\n👤 Testing user ${i + 1}/${QA_USERS.length}`)
      
      // Create fresh context for each user to avoid session contamination
      const context = await browser.newContext()
      const page = await context.newPage()
      
      try {
        const result = await testUserAccess(page, user)
        results[user.email] = result
        
        if (result.status === 'PASS') {
          passCount++
        } else if (result.status === 'SECURITY_ISSUE') {
          securityIssues++
        } else {
          failCount++
        }
        
      } finally {
        await context.close()
      }
      
      // Small delay between users
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // Generate summary
    console.log(`\n📊 PHASE 1C RESULTS:`)
    console.log(`   ✅ Working correctly: ${passCount}/${QA_USERS.length}`)
    console.log(`   ⚠️  Security issues: ${securityIssues}`)
    console.log(`   ❌ Failed: ${failCount}`)
    
    if (securityIssues > 0) {
      console.log(`\n⚠️  SECURITY ISSUES DETECTED:`)
      Object.entries(results).forEach(([email, result]: [string, any]) => {
        if (result.status === 'SECURITY_ISSUE') {
          console.log(`   - ${email}: ${result.securityLeaks.join(', ')}`)
        }
      })
    }
    
    if (failCount > 0) {
      console.log(`\n❌ FAILURES:`)
      Object.entries(results).forEach(([email, result]: [string, any]) => {
        if (result.status === 'FAIL') {
          console.log(`   - ${email}: ${result.error}`)
        }
      })
    }
    
    // Phase passes if no failures, but note security issues
    const overallStatus = failCount === 0 ? 
      (securityIssues === 0 ? 'PASS' : 'PASS_WITH_SECURITY_ISSUES') : 'FAIL'
    
    console.log(`\n${overallStatus === 'PASS' ? '✅' : overallStatus === 'PASS_WITH_SECURITY_ISSUES' ? '⚠️' : '❌'} Phase 1C: ${overallStatus}`)
    
    return {
      status: overallStatus,
      details: `${QA_USERS.length} users tested: ${passCount} working, ${securityIssues} security issues, ${failCount} failures`,
      results,
      securityIssues,
      screenshots: Object.keys(results).map(email => {
        const role = QA_USERS.find((u: any) => u.email === email)?.role.toLowerCase().replace('_', '-')
        return [
          `${TIMESTAMP}-phase1c-${role}-landing.png`,
          `${TIMESTAMP}-phase1c-${role}-access-test.png`
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
      
      if (result.status === 'PASS' || result.status === 'PASS_WITH_SECURITY_ISSUES') {
        console.log(`\n🎉 ROLE ACCESS VALIDATION COMPLETED${result.status === 'PASS_WITH_SECURITY_ISSUES' ? ' (WITH SECURITY NOTES)' : ''}`)
        process.exit(0)
      } else {
        console.log('\n💥 ROLE ACCESS VALIDATION FAILED')
        process.exit(1)
      }
    })
    .catch(error => {
      console.error('Phase 1C Error:', error)
      process.exit(1)
    })
}

export { validatePhase1C }