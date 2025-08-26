#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client'

const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
})

async function verifySeedData() {
  console.log('🔍 Verifying seed data...\n')
  
  // Verify test accounts
  const testAccounts = [
    { email: 'superadmin@test.com', role: 'SUPER_ADMIN' },
    { email: 'admin.manila@test.com', role: 'ADMIN' },
    { email: 'admin.cebu@test.com', role: 'ADMIN' },
    { email: 'leader.manila@test.com', role: 'LEADER' },
    { email: 'leader.cebu@test.com', role: 'LEADER' },
    { email: 'member1@test.com', role: 'MEMBER' },
    { email: 'member2@test.com', role: 'MEMBER' },
    { email: 'member3@test.com', role: 'MEMBER' },
    { email: 'member4@test.com', role: 'MEMBER' },
    { email: 'member5@test.com', role: 'MEMBER' },
    { email: 'member6@test.com', role: 'MEMBER' },
    { email: 'member7@test.com', role: 'MEMBER' },
    { email: 'member8@test.com', role: 'MEMBER' },
    { email: 'member9@test.com', role: 'MEMBER' },
    { email: 'member10@test.com', role: 'MEMBER' },
  ]
  
  console.log('📧 Test Accounts:')
  console.log('================')
  console.log('Default password for all test users: Hpci!Test2025\n')
  
  for (const account of testAccounts) {
    const user = await prisma.user.findUnique({
      where: { email: account.email },
      select: { id: true, email: true, role: true, name: true, passwordHash: true }
    })
    
    if (user) {
      console.log(`✅ ${account.email} (${user.role})`)
      if (user.role !== account.role) {
        console.log(`   ⚠️  Expected role: ${account.role}, found: ${user.role}`)
      }
      if (!user.passwordHash) {
        console.log(`   ⚠️  No password hash set!`)
      }
    } else {
      console.log(`❌ ${account.email} - NOT FOUND`)
    }
  }
  
  // Verify Local Churches
  console.log('\n🏛️  Local Churches:')
  console.log('==================')
  
  const expectedChurches = [
    { id: 'local_manila', name: 'HPCI Manila', churchId: 'church_hpci' },
    { id: 'local_cebu', name: 'HPCI Cebu', churchId: 'church_hpci' }
  ]
  
  for (const expected of expectedChurches) {
    const church = await prisma.localChurch.findUnique({
      where: { id: expected.id },
      select: { id: true, name: true, churchId: true }
    })
    
    if (church) {
      console.log(`✅ ${expected.name} (ID: ${church.id})`)
      if (church.churchId !== expected.churchId) {
        console.log(`   ⚠️  Expected churchId: ${expected.churchId}, found: ${church.churchId}`)
      }
    } else {
      console.log(`❌ ${expected.name} (ID: ${expected.id}) - NOT FOUND`)
    }
  }
  
  // Summary statistics
  console.log('\n📊 Database Statistics:')
  console.log('======================')
  
  const stats = await prisma.$transaction([
    prisma.user.count(),
    prisma.localChurch.count(),
    prisma.lifeGroup.count(),
    prisma.event.count(),
    prisma.service.count(),
    prisma.pathway.count(),
    prisma.pathwayStep.count(),
  ])
  
  console.log(`Users: ${stats[0]}`)
  console.log(`Local Churches: ${stats[1]}`)
  console.log(`Life Groups: ${stats[2]}`)
  console.log(`Events: ${stats[3]}`)
  console.log(`Services: ${stats[4]}`)
  console.log(`Pathways: ${stats[5]}`)
  console.log(`Pathway Steps: ${stats[6]}`)
  
  console.log('\n✨ Seed verification complete!')
}

verifySeedData()
  .catch((e) => {
    console.error('❌ Error verifying seed data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })