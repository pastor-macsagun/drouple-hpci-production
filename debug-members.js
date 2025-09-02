const { PrismaClient } = require('@prisma/client')

async function debugMembers() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Testing database connection...')
    
    // Test basic user count
    const userCount = await prisma.user.count()
    console.log('Total users in database:', userCount)
    
    // Get a few users
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        memberStatus: true
      }
    })
    
    console.log('Sample users:')
    users.forEach(user => {
      console.log(`  ${user.name} (${user.email}) - Role: ${user.role}, Tenant: ${user.tenantId}, Status: ${user.memberStatus}`)
    })
    
    // Test admin users specifically
    const adminUsers = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true
      }
    })
    
    console.log('Admin users:')
    adminUsers.forEach(user => {
      console.log(`  ${user.name} (${user.email}) - Role: ${user.role}, Tenant: ${user.tenantId}`)
    })
    
    // Test local churches
    const churches = await prisma.localChurch.findMany({
      select: {
        id: true,
        name: true
      }
    })
    
    console.log('Local churches:')
    churches.forEach(church => {
      console.log(`  ${church.name} (ID: ${church.id})`)
    })
    
  } catch (error) {
    console.error('Database error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugMembers()
