const { PrismaClient } = require('@prisma/client')

async function debugAuthContext() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Testing auth context for admin members page...')
    
    // Check if we can get the admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin.manila@test.com' },
      include: {
        memberships: {
          include: {
            localChurch: true,
          },
        },
      },
    })
    
    if (!adminUser) {
      console.log('ERROR: Admin user not found!')
      return
    }
    
    console.log('Admin user context:', {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      tenantId: adminUser.tenantId,
      memberships: adminUser.memberships.map(m => ({
        localChurchId: m.localChurchId,
        churchName: m.localChurch.name
      }))
    })
    
    // Test if there are any issues with the user's permissions
    const hasMinRole = (userRole, minRole) => {
      const roleHierarchy = {
        'SUPER_ADMIN': 100,
        'PASTOR': 80,
        'ADMIN': 60,
        'VIP': 50,
        'LEADER': 40,
        'MEMBER': 20,
      }
      
      if (userRole === 'SUPER_ADMIN') {
        return true
      }
      
      return roleHierarchy[userRole] >= roleHierarchy[minRole]
    }
    
    const canAccessAdminMembers = hasMinRole(adminUser.role, 'ADMIN')
    console.log('Can access admin members:', canAccessAdminMembers)
    
    // Simulate the createTenantWhereClause logic
    let accessibleChurchIds = []
    if (adminUser.role === 'SUPER_ADMIN') {
      const churches = await prisma.localChurch.findMany({ select: { id: true } })
      accessibleChurchIds = churches.map(c => c.id)
    } else if (adminUser.tenantId) {
      accessibleChurchIds = [adminUser.tenantId]
    }
    
    console.log('Accessible church IDs:', accessibleChurchIds)
    
    // Test the exact query that listMembers would run
    const whereClause = accessibleChurchIds.length === 1 
      ? { tenantId: accessibleChurchIds[0] }
      : { tenantId: { in: accessibleChurchIds } }
    
    console.log('WHERE clause:', whereClause)
    
    const members = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        memberStatus: true,
        mustChangePassword: true,
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
          take: 1 // Optimize: only need one membership for display
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 21
    })
    
    console.log(`Found ${members.length} members for the admin panel`)
    
    if (members.length === 0) {
      console.log('WARNING: No members found! This might be why the page is empty.')
    } else {
      console.log('Sample members:')
      members.slice(0, 5).forEach(member => {
        console.log(`  - ${member.name} (${member.email}) - ${member.role} - Status: ${member.memberStatus}`)
      })
    }
    
    // Test churches query too
    const churchesWhereClause = adminUser.role === 'SUPER_ADMIN'
      ? {}
      : { id: adminUser.tenantId || undefined }

    const churches = await prisma.localChurch.findMany({
      where: churchesWhereClause,
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    console.log(`Found ${churches.length} churches:`)
    churches.forEach(church => {
      console.log(`  - ${church.name} (${church.id})`)
    })
    
  } catch (error) {
    console.error('Debug error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugAuthContext()
