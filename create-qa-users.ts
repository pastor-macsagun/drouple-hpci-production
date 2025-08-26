#!/usr/bin/env tsx
/**
 * Create ALL 6 QA users directly via database - NO SHORTCUTS
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const TIMESTAMP = `LOCALTEST-${Date.now()}`

const QA_USERS = [
  { email: `${TIMESTAMP}-qa.superadmin@hpci`, role: 'SUPER_ADMIN', church: null, password: 'Qa!Sup#2025', name: 'QA Super Admin' },
  { email: `${TIMESTAMP}-qa.admin.manila@hpci`, role: 'ADMIN', church: 'local_manila', password: 'Qa!AdmMnl#2025', name: 'QA Admin Manila' },
  { email: `${TIMESTAMP}-qa.admin.cebu@hpci`, role: 'ADMIN', church: 'local_cebu', password: 'Qa!AdmCbu#2025', name: 'QA Admin Cebu' },
  { email: `${TIMESTAMP}-qa.leader.manila@hpci`, role: 'LEADER', church: 'local_manila', password: 'Qa!LeadMnl#2025', name: 'QA Leader Manila' },
  { email: `${TIMESTAMP}-qa.member.manila@hpci`, role: 'MEMBER', church: 'local_manila', password: 'Qa!MemMnl#2025', name: 'QA Member Manila' },
  { email: `${TIMESTAMP}-qa.vip.manila@hpci`, role: 'VIP', church: 'local_manila', password: 'Qa!VipMnl#2025', name: 'QA VIP Manila' }
]

async function createAllQAUsers() {
  const prisma = new PrismaClient()
  console.log('🚀 Creating ALL 6 QA Users via Database')
  console.log(`📋 Test ID: ${TIMESTAMP}`)
  
  const created: string[] = []
  const failed: string[] = []
  
  try {
    for (let i = 0; i < QA_USERS.length; i++) {
      const userInfo = QA_USERS[i]
      console.log(`\n👤 Creating user ${i + 1}/${QA_USERS.length}: ${userInfo.email}`)
      
      try {
        // Hash password
        const hashedPassword = await bcrypt.hash(userInfo.password, 12)
        
        // Create user
        const user = await prisma.user.create({
          data: {
            name: userInfo.name,
            email: userInfo.email,
            passwordHash: hashedPassword,
            role: userInfo.role as any,
            mustChangePassword: false,
            tenantId: 'church_hpci'
          }
        })
        
        console.log(`   ✅ User created with ID: ${user.id}`)
        
        // Create membership if church is specified
        if (userInfo.church) {
          const membership = await prisma.membership.create({
            data: {
              userId: user.id,
              localChurchId: userInfo.church,
              role: userInfo.role as any
            }
          })
          console.log(`   ✅ Membership created for ${userInfo.church}`)
        }
        
        created.push(userInfo.email)
        console.log(`✅ Successfully created: ${userInfo.email}`)
        
      } catch (error) {
        failed.push(userInfo.email)
        console.log(`❌ Failed to create ${userInfo.email}: ${error}`)
      }
    }
    
    // Final verification
    console.log(`\n📊 RESULTS:`)
    console.log(`   ✅ Created: ${created.length}/${QA_USERS.length}`)
    console.log(`   ❌ Failed: ${failed.length}`)
    
    if (failed.length > 0) {
      console.log(`   Failed users: ${failed.join(', ')}`)
      throw new Error(`Failed to create ${failed.length} users`)
    }
    
    // Verify all users exist
    console.log('\n🔍 Verifying all users exist...')
    for (const userInfo of QA_USERS) {
      const user = await prisma.user.findUnique({
        where: { email: userInfo.email },
        include: { memberships: { include: { localChurch: true } } }
      })
      
      if (!user) {
        throw new Error(`User ${userInfo.email} not found after creation`)
      }
      
      console.log(`   ✅ ${userInfo.email}: role=${user.role}, memberships=${user.memberships.map(m => m.localChurch.name).join(', ') || 'none'}`)
    }
    
    // Save QA user info for Phase 1C and cleanup
    const fs = require('fs')
    fs.writeFileSync('./qa-users-created.json', JSON.stringify({
      timestamp: TIMESTAMP,
      users: QA_USERS,
      created: created
    }, null, 2))
    
    console.log('\n🎉 ALL QA USERS CREATED SUCCESSFULLY!')
    console.log(`📄 User info saved to qa-users-created.json`)
    return true
    
  } catch (error) {
    console.log(`\n💥 FAILED TO CREATE ALL QA USERS: ${error}`)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  createAllQAUsers()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('Error:', error)
      process.exit(1)
    })
}

export { createAllQAUsers, QA_USERS, TIMESTAMP }