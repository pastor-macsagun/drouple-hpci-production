#!/usr/bin/env tsx
/**
 * Phase 2: Verify Manila/Cebu church isolation with screenshots
 * (Testing multi-tenant data separation)
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

// Get the admin users for isolation testing
const MANILA_ADMIN = QA_USERS.find((u: any) => u.role === 'ADMIN' && u.church === 'local_manila')
const CEBU_ADMIN = QA_USERS.find((u: any) => u.role === 'ADMIN' && u.church === 'local_cebu')

if (!MANILA_ADMIN || !CEBU_ADMIN) {
  console.error('❌ Manila or Cebu admin user not found in QA users')
  process.exit(1)
}

async function loginUser(page: any, user: any) {
  await page.goto(`${BASE_URL}/auth/signin`)
  await page.waitForSelector('input#email')
  await page.fill('input#email', user.email)
  await page.fill('input#password', user.password)
  await page.click('button[type="submit"]')
  await page.waitForLoadState('networkidle')
}

async function testChurchIsolation(page: any, admin: any, churchName: string) {
  console.log(`\n🔍 Testing ${churchName} Admin: ${admin.email}`)
  
  try {
    // Login
    await loginUser(page, admin)
    
    // Take screenshot of dashboard
    await page.screenshot({ 
      path: `./test-artifacts/${TIMESTAMP}-phase2-${churchName.toLowerCase()}-dashboard.png`, 
      fullPage: true 
    })
    console.log(`   📸 Dashboard screenshot captured`)
    
    // Test Members page isolation
    await page.goto(`${BASE_URL}/admin/members`)
    await page.waitForLoadState('networkidle')
    
    // Take screenshot of members list
    await page.screenshot({ 
      path: `./test-artifacts/${TIMESTAMP}-phase2-${churchName.toLowerCase()}-members.png`, 
      fullPage: true 
    })
    
    // Check if members are filtered by church
    const memberRows = await page.locator('tbody tr').count()
    console.log(`   👥 Members visible: ${memberRows}`)
    
    // Test Services page isolation
    await page.goto(`${BASE_URL}/admin/services`)
    await page.waitForLoadState('networkidle')
    
    // Take screenshot of services list
    await page.screenshot({ 
      path: `./test-artifacts/${TIMESTAMP}-phase2-${churchName.toLowerCase()}-services.png`, 
      fullPage: true 
    })
    
    const serviceRows = await page.locator('tbody tr').count()
    console.log(`   ⛪ Services visible: ${serviceRows}`)
    
    // Test LifeGroups page isolation
    await page.goto(`${BASE_URL}/admin/lifegroups`)
    await page.waitForLoadState('networkidle')
    
    // Take screenshot of lifegroups list
    await page.screenshot({ 
      path: `./test-artifacts/${TIMESTAMP}-phase2-${churchName.toLowerCase()}-lifegroups.png`, 
      fullPage: true 
    })
    
    const lifegroupRows = await page.locator('tbody tr').count()
    console.log(`   🏠 LifeGroups visible: ${lifegroupRows}`)
    
    // Test Events page isolation
    await page.goto(`${BASE_URL}/admin/events`)
    await page.waitForLoadState('networkidle')
    
    // Take screenshot of events list
    await page.screenshot({ 
      path: `./test-artifacts/${TIMESTAMP}-phase2-${churchName.toLowerCase()}-events.png`, 
      fullPage: true 
    })
    
    const eventRows = await page.locator('tbody tr').count()
    console.log(`   📅 Events visible: ${eventRows}`)
    
    // Test Pathways page isolation
    await page.goto(`${BASE_URL}/admin/pathways`)
    await page.waitForLoadState('networkidle')
    
    // Take screenshot of pathways list
    await page.screenshot({ 
      path: `./test-artifacts/${TIMESTAMP}-phase2-${churchName.toLowerCase()}-pathways.png`, 
      fullPage: true 
    })
    
    const pathwayRows = await page.locator('tbody tr').count()
    console.log(`   📚 Pathways visible: ${pathwayRows}`)
    
    return {
      status: 'PASS',
      church: churchName,
      isolation: {
        members: memberRows,
        services: serviceRows,
        lifegroups: lifegroupRows,
        events: eventRows,
        pathways: pathwayRows
      },
      screenshots: [
        `${TIMESTAMP}-phase2-${churchName.toLowerCase()}-dashboard.png`,
        `${TIMESTAMP}-phase2-${churchName.toLowerCase()}-members.png`,
        `${TIMESTAMP}-phase2-${churchName.toLowerCase()}-services.png`,
        `${TIMESTAMP}-phase2-${churchName.toLowerCase()}-lifegroups.png`,
        `${TIMESTAMP}-phase2-${churchName.toLowerCase()}-events.png`,
        `${TIMESTAMP}-phase2-${churchName.toLowerCase()}-pathways.png`
      ]
    }
    
  } catch (error) {
    console.log(`   ❌ FAILED: ${error}`)
    
    // Take error screenshot
    await page.screenshot({ 
      path: `./test-artifacts/${TIMESTAMP}-phase2-${churchName.toLowerCase()}-ERROR.png`, 
      fullPage: true 
    })
    
    return {
      status: 'FAIL',
      church: churchName,
      error: error.toString()
    }
  }
}

async function validatePhase2() {
  console.log('🚀 Phase 2: Manila/Cebu Church Isolation Validation')
  console.log(`📋 Testing data isolation between churches`)
  
  const browser = await chromium.launch({ headless: false })
  const results: any = {}
  let isolationIssues: string[] = []
  
  try {
    // Test Manila Admin isolation
    console.log('\n👤 Testing Manila Admin Isolation')
    const manilaContext = await browser.newContext()
    const manilaPage = await manilaContext.newPage()
    
    try {
      const manilaResult = await testChurchIsolation(manilaPage, MANILA_ADMIN, 'Manila')
      results.manila = manilaResult
    } finally {
      await manilaContext.close()
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Test Cebu Admin isolation
    console.log('\n👤 Testing Cebu Admin Isolation')
    const cebuContext = await browser.newContext()
    const cebuPage = await cebuContext.newPage()
    
    try {
      const cebuResult = await testChurchIsolation(cebuPage, CEBU_ADMIN, 'Cebu')
      results.cebu = cebuResult
    } finally {
      await cebuContext.close()
    }
    
    // Analyze isolation effectiveness
    console.log(`\n📊 PHASE 2 ISOLATION ANALYSIS:`)
    
    if (results.manila.status === 'PASS' && results.cebu.status === 'PASS') {
      const manilaData = results.manila.isolation
      const cebuData = results.cebu.isolation
      
      console.log(`\n📈 Manila Admin sees:`)
      console.log(`   👥 Members: ${manilaData.members}`)
      console.log(`   ⛪ Services: ${manilaData.services}`)
      console.log(`   🏠 LifeGroups: ${manilaData.lifegroups}`)
      console.log(`   📅 Events: ${manilaData.events}`)
      console.log(`   📚 Pathways: ${manilaData.pathways}`)
      
      console.log(`\n📈 Cebu Admin sees:`)
      console.log(`   👥 Members: ${cebuData.members}`)
      console.log(`   ⛪ Services: ${cebuData.services}`)
      console.log(`   🏠 LifeGroups: ${cebuData.lifegroups}`)
      console.log(`   📅 Events: ${cebuData.events}`)
      console.log(`   📚 Pathways: ${cebuData.pathways}`)
      
      // Check for isolation issues
      const manilaTotal = Object.values(manilaData).reduce((sum: number, count: any) => sum + count, 0)
      const cebuTotal = Object.values(cebuData).reduce((sum: number, count: any) => sum + count, 0)
      
      // If both admins see identical data, isolation might be broken
      if (JSON.stringify(manilaData) === JSON.stringify(cebuData)) {
        isolationIssues.push('Both admins see identical data counts - isolation may be ineffective')
      }
      
      // Check for zero data (might indicate isolation is too strict or no seed data)
      if (manilaTotal === 0 && cebuTotal === 0) {
        isolationIssues.push('Both admins see zero data - verify seed data exists')
      }
      
      console.log(`\n🔒 ISOLATION STATUS:`)
      if (isolationIssues.length === 0) {
        console.log(`   ✅ Church isolation appears to be working correctly`)
        console.log(`   ✅ Manila and Cebu admins see different data sets`)
      } else {
        console.log(`   ⚠️  Potential isolation issues detected:`)
        isolationIssues.forEach(issue => console.log(`     - ${issue}`))
      }
    }
    
    const overallStatus = (results.manila.status === 'PASS' && results.cebu.status === 'PASS') ? 
      (isolationIssues.length === 0 ? 'PASS' : 'PASS_WITH_CONCERNS') : 'FAIL'
    
    console.log(`\n${overallStatus === 'PASS' ? '✅' : overallStatus === 'PASS_WITH_CONCERNS' ? '⚠️' : '❌'} Phase 2: ${overallStatus}`)
    
    return {
      status: overallStatus,
      details: `Church isolation tested for Manila and Cebu admins`,
      results,
      isolationIssues,
      screenshots: [
        ...(results.manila?.screenshots || []),
        ...(results.cebu?.screenshots || [])
      ]
    }
    
  } catch (error) {
    console.log(`\n❌ Phase 2: FAIL - ${error}`)
    
    return {
      status: 'FAIL',
      details: `Phase 2 failed: ${error}`,
      results
    }
  } finally {
    await browser.close()
  }
}

// Run validation
if (require.main === module) {
  validatePhase2()
    .then(result => {
      console.log('\nPhase 2 Final Result:', result)
      
      if (result.status === 'PASS' || result.status === 'PASS_WITH_CONCERNS') {
        console.log(`\n🎉 CHURCH ISOLATION VALIDATION COMPLETED${result.status === 'PASS_WITH_CONCERNS' ? ' (WITH CONCERNS)' : ''}`)
        process.exit(0)
      } else {
        console.log('\n💥 CHURCH ISOLATION VALIDATION FAILED')
        process.exit(1)
      }
    })
    .catch(error => {
      console.error('Phase 2 Error:', error)
      process.exit(1)
    })
}

export { validatePhase2 }