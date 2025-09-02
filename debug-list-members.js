const { PrismaClient, UserRole } = require('@prisma/client')

async function debugListMembers() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Testing listMembers function...')
    
    // Simulate an admin user session
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin.manila@test.com' }
    })
    
    if (!adminUser) {
      console.log('Admin user not found!')
      return
    }
    
    console.log('Admin user found:', {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      tenantId: adminUser.tenantId
    })
    
    // Test the getAccessibleChurchIds function logic
    console.log('\nTesting accessible church IDs...')
    const churches = await prisma.localChurch.findMany({
      select: { id: true, name: true }
    })
    console.log('Available churches:', churches)
    
    // Simulate the RBAC logic for admin user
    let accessibleChurchIds = []
    if (adminUser.role === 'SUPER_ADMIN') {
      accessibleChurchIds = churches.map(c => c.id)
    } else if (adminUser.tenantId) {
      accessibleChurchIds = [adminUser.tenantId]
    }
    
    console.log('Accessible church IDs for admin:', accessibleChurchIds)
    
    // Create the WHERE clause
    const fieldName = 'tenantId'
    let whereClause = {}
    
    if (accessibleChurchIds.length === 0) {
      whereClause = { [fieldName]: { in: [] } } // This will return zero results
    } else if (accessibleChurchIds.length === 1) {
      whereClause = { [fieldName]: accessibleChurchIds[0] }
    } else {
      whereClause = { [fieldName]: { in: accessibleChurchIds } }
    }
    
    console.log('WHERE clause:', JSON.stringify(whereClause, null, 2))
    
    // Test the query
    console.log('\nTesting user query...')
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        memberStatus: true,
        joinedAt: true,
        createdAt: true,
        memberships: {
          select: {
            localChurch: {
              select: {
                id: true,
                name: true
              }
            }
          },
          take: 1
        }
      },
      take: 10
    })
    
    console.log(`Found ${users.length} users:`)
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}, Tenant: ${user.tenantId}`)
    })
    
    // Check if the issue is with church IDs
    console.log('\nChecking church ID mappings...')
    const allUsers = await prisma.user.findMany({
      select: { id: true, name: true, email: true, tenantId: true, role: true },
      take: 10
    })
    
    console.log('All users with their tenantIds:')
    allUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}, TenantId: ${user.tenantId}`)
    })
    
  } catch (error) {
    console.error('Debug error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugListMembers()
