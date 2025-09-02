const { PrismaClient } = require('@prisma/client')

async function testChurchFix() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Testing church fix...')
    
    // Test the current broken query
    console.log('\n1. Current broken query (using id filter):')
    const brokenResults = await prisma.localChurch.findMany({
      where: { id: 'church_hpci' },
      select: { id: true, name: true, churchId: true }
    })
    console.log('Results:', brokenResults)
    
    // Test the fixed query
    console.log('\n2. Fixed query (using churchId filter):')
    const fixedResults = await prisma.localChurch.findMany({
      where: { churchId: 'church_hpci' },
      select: { id: true, name: true, churchId: true }
    })
    console.log('Results:', fixedResults)
    
  } catch (error) {
    console.error('Test error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testChurchFix()
