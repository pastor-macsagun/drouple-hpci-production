const { PrismaClient } = require('@prisma/client')

async function testAdminMembersFix() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Testing admin members page after fix...')
    
    // Simulate session user (admin manila)
    const session = {
      user: {
        id: 'user_admin_manila',
        email: 'admin.manila@test.com',
        role: 'ADMIN',
        tenantId: 'church_hpci'
      }
    }
    
    console.log('Session user:', session.user)
    
    // Test hasMinRole logic
    const roleHierarchy = {
      'SUPER_ADMIN': 100,
      'PASTOR': 80,
      'ADMIN': 60,
      'VIP': 50,
      'LEADER': 40,
      'MEMBER': 20,
    }
    
    const hasMinRole = (userRole, minRole) => {
      if (userRole === 'SUPER_ADMIN') {
        return true
      }
      return roleHierarchy[userRole] >= roleHierarchy[minRole]
    }
    
    const canAccess = hasMinRole(session.user.role, 'ADMIN')
    console.log('Can access admin members:', canAccess)
    
    // Test listMembers logic
    console.log('\n--- Testing listMembers logic ---')
    
    // 1. getAccessibleChurchIds logic
    let accessibleChurchIds = []
    if (session.user.role === 'SUPER_ADMIN') {
      const churches = await prisma.localChurch.findMany({ select: { id: true } })
      accessibleChurchIds = churches.map(c => c.id)
    } else if (session.user.tenantId) {
      accessibleChurchIds = [session.user.tenantId]
    }
    
    console.log('Accessible church IDs:', accessibleChurchIds)
    
    // 2. createTenantWhereClause logic
    const whereClause = accessibleChurchIds.length === 1 
      ? { tenantId: accessibleChurchIds[0] }
      : { tenantId: { in: accessibleChurchIds } }
    
    console.log('Members WHERE clause:', whereClause)
    
    // 3. Execute members query
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
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 21
    })
    
    console.log(`Found ${members.length} members`)
    
    // Test getLocalChurches logic (FIXED)
    console.log('\n--- Testing getLocalChurches logic (FIXED) ---')
    
    const churchesWhereClause = session.user.role === 'SUPER_ADMIN'
      ? {}
      : { churchId: session.user.tenantId || undefined } // FIXED: was { id: ... }

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
    
    // Simulate the MembersManager props
    console.log('\n--- MembersManager Props ---')
    const membersResult = {
      success: true,
      data: {
        items: members.slice(0, 20),
        nextCursor: members.length > 20 ? members[19].id : null,
        hasMore: members.length > 20
      }
    }
    
    const churchesResult = {
      success: true,
      data: churches
    }
    
    console.log('MembersManager initialMembers:', {
      count: membersResult.data.items.length,
      hasMore: membersResult.data.hasMore
    })
    
    console.log('MembersManager churches:', {
      count: churchesResult.data.length,
      names: churchesResult.data.map(c => c.name)
    })
    
    if (membersResult.data.items.length > 0 && churchesResult.data.length > 0) {
      console.log('\n✅ SUCCESS: Admin members page should now display members!')
    } else {
      console.log('\n❌ ISSUE: Still missing data')
      if (membersResult.data.items.length === 0) {
        console.log('   - No members found')
      }
      if (churchesResult.data.length === 0) {
        console.log('   - No churches found')
      }
    }
    
  } catch (error) {
    console.error('Test error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAdminMembersFix()
