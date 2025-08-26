import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

export async function verifySeedData() {
  const results = {
    users: {
      superAdmin: false,
      pastors: [] as string[],
      admins: [] as string[],
      leaders: [] as string[],
      members: [] as string[],
    },
    churches: {
      main: false,
      localChurches: [] as string[],
    },
    features: {
      lifeGroups: 0,
      events: 0,
      services: 0,
      pathways: 0,
    },
    issues: [] as string[],
  }

  try {
    // Check users
    const users = await prisma.user.findMany({
      include: { memberships: true },
    })

    for (const user of users) {
      switch (user.role) {
        case UserRole.SUPER_ADMIN:
          results.users.superAdmin = true
          break
        case UserRole.PASTOR:
          results.users.pastors.push(user.email)
          break
        case UserRole.ADMIN:
          results.users.admins.push(user.email)
          break
        case UserRole.LEADER:
          results.users.leaders.push(user.email)
          break
        case UserRole.MEMBER:
          results.users.members.push(user.email)
          break
      }

      // Check tenant consistency
      if (user.role !== UserRole.SUPER_ADMIN && !user.tenantId) {
        results.issues.push(`User ${user.email} has no tenantId`)
      }
    }

    // Check churches
    const churches = await prisma.church.findMany()
    results.churches.main = churches.length > 0

    const localChurches = await prisma.localChurch.findMany()
    results.churches.localChurches = localChurches.map(lc => lc.name)

    // Check features
    results.features.lifeGroups = await prisma.lifeGroup.count()
    results.features.events = await prisma.event.count()
    results.features.services = await prisma.service.count()
    results.features.pathways = await prisma.pathway.count()

    // Check for deterministic IDs
    const expectedIds = [
      'user_superadmin',
      'user_admin_manila',
      'user_admin_cebu',
      'user_leader_manila',
      'user_leader_cebu',
    ]

    for (const id of expectedIds) {
      const user = await prisma.user.findUnique({ where: { id } })
      if (!user) {
        results.issues.push(`Missing deterministic user ID: ${id}`)
      }
    }

    return results
  } finally {
    await prisma.$disconnect()
  }
}

// Run if executed directly
if (require.main === module) {
  verifySeedData()
    .then(results => {
      console.log('🔍 Seed Data Verification Results:')
      console.log(JSON.stringify(results, null, 2))
      process.exit(results.issues.length > 0 ? 1 : 0)
    })
    .catch(error => {
      console.error('❌ Verification failed:', error)
      process.exit(1)
    })
}