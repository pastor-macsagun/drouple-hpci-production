#!/usr/bin/env tsx
/**
 * Phase 1B: Create ALL 6 QA users via UI or database (NO SKIPPING ALLOWED)
 */

import { chromium } from 'playwright'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const BASE_URL = 'http://localhost:3000'
const TEST_PASSWORD = 'Hpci!Test2025'
const TIMESTAMP = `LOCALTEST-${Date.now()}`

const QA_USERS = [
  { email: `${TIMESTAMP}-qa.superadmin@hpci`, role: 'SUPER_ADMIN', church: null, password: 'Qa!Sup#2025', name: 'QA Super Admin' },
  { email: `${TIMESTAMP}-qa.admin.manila@hpci`, role: 'ADMIN', church: 'local_manila', password: 'Qa!AdmMnl#2025', name: 'QA Admin Manila' },
  { email: `${TIMESTAMP}-qa.admin.cebu@hpci`, role: 'ADMIN', church: 'local_cebu', password: 'Qa!AdmCbu#2025', name: 'QA Admin Cebu' },
  { email: `${TIMESTAMP}-qa.leader.manila@hpci`, role: 'LEADER', church: 'local_manila', password: 'Qa!LeadMnl#2025', name: 'QA Leader Manila' },
  { email: `${TIMESTAMP}-qa.member.manila@hpci`, role: 'MEMBER', church: 'local_manila', password: 'Qa!MemMnl#2025', name: 'QA Member Manila' },
  { email: `${TIMESTAMP}-qa.vip.manila@hpci`, role: 'VIP', church: 'local_manila', password: 'Qa!VipMnl#2025', name: 'QA VIP Manila' }
]

async function createUserViaDatabase(userInfo: any): Promise<boolean> {
  const prisma = new PrismaClient()
  
  try {
    const hashedPassword = await bcrypt.hash(userInfo.password, 12)
    
    const userData: any = {
      name: userInfo.name,
      email: userInfo.email,
      passwordHash: hashedPassword,
      role: userInfo.role,
      mustChangePassword: false,
      tenantId: 'church_hpci'
    }
    
    const user = await prisma.user.create({
      data: userData
    })
    
    // Create membership if church is specified
    if (userInfo.church) {
      await prisma.membership.create({
        data: {
          userId: user.id,
          localChurchId: userInfo.church,
          role: userInfo.role
        }
      })
      console.log(`✅ Created membership for ${userInfo.email} at ${userInfo.church}`)
    }
    
    console.log(`✅ Created user ${userInfo.email} via database`)
    return true
    
  } catch (error) {
    console.log(`❌ Failed to create user ${userInfo.email} via database: ${error}`)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

async function createUserViaUI(page: any, userInfo: any): Promise<boolean> {
  try {
    console.log(`🔧 Attempting to create ${userInfo.email} via UI...`)
    
    // Navigate to user management
    await page.goto(`${BASE_URL}/super/users`, { waitUntil: 'networkidle' })
    
    // Look for create user interface
    const createButton = page.locator('button:has-text("Add"), button:has-text("Create"), a:has-text("Add"), a:has-text("Create")')
    
    if (await createButton.count() === 0) {
      // Try members section if no super/users interface
      await page.goto(`${BASE_URL}/admin/members`)
      const membersCreateButton = page.locator('button:has-text("Add"), button:has-text("Create"), a:has-text("Add")')
      
      if (await membersCreateButton.count() > 0) {
        await membersCreateButton.first().click()
        await page.waitForSelector('form, input')
        
        // Fill member form
        await page.fill('input[name="name"]', userInfo.name)
        await page.fill('input[name="email"]', userInfo.email)
        
        // Set role if available
        const roleSelect = page.locator('select[name="role"]')
        if (await roleSelect.count() > 0) {
          await roleSelect.selectOption(userInfo.role)
        }
        
        // Submit form
        await page.click('button[type="submit"]')
        await page.waitForLoadState('networkidle')
        
        // Verify user appears in list
        await page.goto(`${BASE_URL}/admin/members`)
        const userExists = await page.locator(`text="${userInfo.email}"`).count() > 0
        
        if (userExists) {
          console.log(`✅ Created ${userInfo.email} via members UI`)
          return true
        }
      }
      
      throw new Error('No create user interface found')
    }
    
    await createButton.first().click()
    await page.waitForSelector('form, input')
    
    // Fill user creation form
    await page.fill('input[name="name"]', userInfo.name)
    await page.fill('input[name="email"]', userInfo.email)
    await page.fill('input[name="password"]', userInfo.password)
    
    // Select role
    const roleSelect = page.locator('select[name="role"]')
    if (await roleSelect.count() > 0) {
      await roleSelect.selectOption(userInfo.role)
    }
    
    // Select church if not super admin
    if (userInfo.church) {
      const churchSelect = page.locator('select[name="church"], select[name="localChurchId"]')
      if (await churchSelect.count() > 0) {
        await churchSelect.selectOption(userInfo.church)
      }
    }
    
    // Submit form
    await page.click('button[type="submit"]')
    await page.waitForLoadState('networkidle')
    
    // Verify user was created
    await page.goto(`${BASE_URL}/super/users`)
    const userExists = await page.locator(`text="${userInfo.email}"`).count() > 0
    
    if (!userExists) {
      // Check members list as well
      await page.goto(`${BASE_URL}/admin/members`)
      const userExistsInMembers = await page.locator(`text="${userInfo.email}"`).count() > 0
      if (userExistsInMembers) {
        console.log(`✅ Created ${userInfo.email} via UI (found in members)`)
        return true
      }
      throw new Error('User not found after creation')
    }
    
    console.log(`✅ Created ${userInfo.email} via UI`)
    return true
    
  } catch (error) {
    console.log(`⚠️  UI creation failed for ${userInfo.email}: ${error}`)
    return false
  }
}

async function validatePhase1B() {
  console.log('🚀 Phase 1B: Create ALL 6 QA Users (NO SKIPPING)')
  console.log(`📋 Users to create: ${QA_USERS.map(u => u.email).join(', ')}`)
  
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()
  
  const createdUsers: string[] = []
  const failedUsers: string[] = []
  let createdViaUI = 0
  let createdViaDB = 0
  
  try {
    // Login as super admin
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.fill('input#email', 'superadmin@test.com')
    await page.fill('input#password', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForLoadState('networkidle')
    
    await page.screenshot({ path: `./test-artifacts/${TIMESTAMP}-phase1b-01-super-logged-in.png`, fullPage: true })
    console.log('📸 Super admin login screenshot captured')
    
    // Create each QA user
    for (let i = 0; i < QA_USERS.length; i++) {
      const user = QA_USERS[i]
      console.log(`\n👤 Creating user ${i + 1}/${QA_USERS.length}: ${user.email}`)
      
      // Try UI creation first
      const uiSuccess = await createUserViaUI(page, user)
      
      if (uiSuccess) {
        createdUsers.push(user.email)
        createdViaUI++
      } else {
        // Fallback to database creation
        console.log(`🔄 Falling back to database creation for ${user.email}`)
        const dbSuccess = await createUserViaDatabase(user)
        
        if (dbSuccess) {
          createdUsers.push(user.email)
          createdViaDB++
        } else {
          failedUsers.push(user.email)
        }
      }
      
      // Take screenshot after each user creation attempt
      await page.screenshot({ 
        path: `./test-artifacts/${TIMESTAMP}-phase1b-02-user-${i + 1}-created.png`, 
        fullPage: true 
      })
      
      // Small delay between creations
      await page.waitForTimeout(1000)
    }
    
    // Final screenshot showing all users
    await page.goto(`${BASE_URL}/admin/members`)
    await page.screenshot({ path: `./test-artifacts/${TIMESTAMP}-phase1b-03-all-users-final.png`, fullPage: true })
    console.log('📸 Final users list screenshot captured')
    
    // Verify ALL users were created
    if (failedUsers.length > 0) {
      throw new Error(`Failed to create ${failedUsers.length} users: ${failedUsers.join(', ')}`)
    }
    
    if (createdUsers.length !== QA_USERS.length) {
      throw new Error(`Only created ${createdUsers.length}/${QA_USERS.length} users`)
    }
    
    console.log('\n✅ Phase 1B: PASS')
    console.log(`   - Created all ${QA_USERS.length} QA users`)
    console.log(`   - Via UI: ${createdViaUI}`)
    console.log(`   - Via Database: ${createdViaDB}`)
    console.log(`   - Users: ${createdUsers.map(u => u.split('@')[0]).join(', ')}`)
    
    return {
      status: 'PASS',
      details: `Created all ${QA_USERS.length} QA users (${createdViaUI} via UI, ${createdViaDB} via database)`,
      createdUsers,
      createdViaUI,
      createdViaDB,
      screenshots: [
        `${TIMESTAMP}-phase1b-01-super-logged-in.png`,
        `${TIMESTAMP}-phase1b-03-all-users-final.png`,
        ...QA_USERS.map((_, i) => `${TIMESTAMP}-phase1b-02-user-${i + 1}-created.png`)
      ]
    }
    
  } catch (error) {
    console.log(`\n❌ Phase 1B: FAIL - ${error}`)
    await page.screenshot({ path: `./test-artifacts/${TIMESTAMP}-phase1b-ERROR.png`, fullPage: true })
    
    return {
      status: 'FAIL',
      details: `Phase 1B failed: ${error}`,
      createdUsers,
      failedUsers,
      screenshots: [`${TIMESTAMP}-phase1b-ERROR.png`]
    }
  } finally {
    await context.close()
    await browser.close()
  }
}

// Run validation
if (require.main === module) {
  validatePhase1B()
    .then(result => {
      console.log('\nPhase 1B Final Result:', result)
      
      if (result.status === 'PASS') {
        console.log('\n🎉 ALL QA USERS CREATED SUCCESSFULLY')
        // Save created users for cleanup later
        const fs = require('fs')
        fs.writeFileSync('./qa-users-created.json', JSON.stringify({
          timestamp: TIMESTAMP,
          users: QA_USERS.map(u => u.email)
        }, null, 2))
        process.exit(0)
      } else {
        console.log('\n💥 FAILED TO CREATE ALL QA USERS')
        process.exit(1)
      }
    })
    .catch(error => {
      console.error('Phase 1B Error:', error)
      process.exit(1)
    })
}

export { validatePhase1B, QA_USERS, TIMESTAMP }