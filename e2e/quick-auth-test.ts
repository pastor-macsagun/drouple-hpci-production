#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client'

async function quickAuthTest() {
  console.log('🔍 Quick authentication test - checking database state')
  
  const prisma = new PrismaClient()
  
  try {
    // Check if superadmin user exists
    const superAdmin = await prisma.user.findFirst({
      where: { email: 'superadmin@test.com' }
    })
    
    if (superAdmin) {
      console.log('✅ Super admin user exists in database')
      console.log(`   ID: ${superAdmin.id}`)
      console.log(`   Email: ${superAdmin.email}`)
      console.log(`   Active: ${superAdmin.isActive}`)
    } else {
      console.log('❌ Super admin user NOT found in database')
      console.log('🔧 Database needs to be seeded')
      return false
    }
    
    // Check if churches exist
    const churchCount = await prisma.church.count()
    console.log(`📊 Churches in database: ${churchCount}`)
    
    if (churchCount === 0) {
      console.log('❌ No churches found - database needs seeding')
      return false
    }
    
    console.log('✅ Database appears to be properly seeded')
    return true
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

quickAuthTest().then(success => {
  if (!success) {
    console.log('💡 Run: npm run seed to set up test data')
    process.exit(1)
  }
})