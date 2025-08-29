import { PrismaClient, UserRole, PathwayType, EventScope } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Default password for all seeded users: Hpci!Test2025
const DEFAULT_PASSWORD = 'Hpci!Test2025'

async function main() {
  console.log('🌱 Starting database seed...')
  
  // Clear existing data
  await prisma.$transaction([
    prisma.pathwayProgress.deleteMany(),
    prisma.pathwayEnrollment.deleteMany(),
    prisma.pathwayStep.deleteMany(),
    prisma.pathway.deleteMany(),
    prisma.eventRsvp.deleteMany(),
    prisma.event.deleteMany(),
    prisma.lifeGroupAttendance.deleteMany(),
    prisma.lifeGroupAttendanceSession.deleteMany(),
    prisma.lifeGroupMemberRequest.deleteMany(),
    prisma.lifeGroupMembership.deleteMany(),
    prisma.lifeGroup.deleteMany(),
    prisma.checkin.deleteMany(),
    prisma.service.deleteMany(),
    prisma.firstTimer.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.membership.deleteMany(),
    prisma.localChurch.deleteMany(),
    prisma.church.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.user.deleteMany(),
  ])
  console.log('✅ Cleared existing data')

  // Create main church
  const hpciChurch = await prisma.church.create({
    data: {
      id: 'church_hpci',
      name: 'HPCI',
      description: 'House of Prayer Christian International',
    },
  })

  // Create local churches
  const localChurch1 = await prisma.localChurch.create({
    data: {
      id: 'local_manila',
      name: 'HPCI Manila',
      address: '123 Main St',
      city: 'Manila',
      state: 'NCR',
      zipCode: '1000',
      country: 'Philippines',
      phone: '+63 2 1234 5678',
      email: 'manila@hpci.org',
      churchId: hpciChurch.id,
    },
  })

  const localChurch2 = await prisma.localChurch.create({
    data: {
      id: 'local_cebu',
      name: 'HPCI Cebu',
      address: '456 Beach Rd',
      city: 'Cebu City',
      state: 'Cebu',
      zipCode: '6000',
      country: 'Philippines',
      phone: '+63 32 9876 5432',
      email: 'cebu@hpci.org',
      churchId: hpciChurch.id,
    },
  })
  console.log('✅ Created churches')

  // Hash the default password
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12)
  console.log(`📝 Default password for all users: ${DEFAULT_PASSWORD}`)

  // Create users with deterministic IDs
  const superAdmin = await prisma.user.create({
    data: {
      id: 'user_superadmin',
      email: 'superadmin@test.com',
      name: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
      emailVerified: new Date(),
      tenantId: hpciChurch.id,
      passwordHash,
      mustChangePassword: false, // Seed accounts don't need password change
    },
  })

  const churchAdmin1 = await prisma.user.create({
    data: {
      id: 'user_admin_manila',
      email: 'admin.manila@test.com',
      name: 'Manila Admin',
      role: UserRole.ADMIN,
      emailVerified: new Date(),
      tenantId: hpciChurch.id,
      passwordHash,
      mustChangePassword: false, // Seed accounts don't need password change
    },
  })

  const churchAdmin2 = await prisma.user.create({
    data: {
      id: 'user_admin_cebu',
      email: 'admin.cebu@test.com',
      name: 'Cebu Admin',
      role: UserRole.ADMIN,
      emailVerified: new Date(),
      tenantId: hpciChurch.id,
      passwordHash,
      mustChangePassword: false, // Seed accounts don't need password change
    },
  })

  const vip1 = await prisma.user.create({
    data: {
      id: 'user_vip_manila',
      email: 'vip.manila@test.com',
      name: 'Manila VIP',
      role: UserRole.VIP,
      emailVerified: new Date(),
      tenantId: hpciChurch.id,
      passwordHash,
      mustChangePassword: false, // Seed accounts don't need password change
    },
  })

  const vip2 = await prisma.user.create({
    data: {
      id: 'user_vip_cebu',
      email: 'vip.cebu@test.com',
      name: 'Cebu VIP',
      role: UserRole.VIP,
      emailVerified: new Date(),
      tenantId: hpciChurch.id,
      passwordHash,
      mustChangePassword: false, // Seed accounts don't need password change
    },
  })

  const leader1 = await prisma.user.create({
    data: {
      id: 'user_leader_manila',
      email: 'leader.manila@test.com',
      name: 'Manila Leader',
      role: UserRole.LEADER,
      emailVerified: new Date(),
      tenantId: hpciChurch.id,
      passwordHash,
      mustChangePassword: false, // Seed accounts don't need password change
    },
  })

  const leader2 = await prisma.user.create({
    data: {
      id: 'user_leader_cebu',
      email: 'leader.cebu@test.com',
      name: 'Cebu Leader',
      role: UserRole.LEADER,
      emailVerified: new Date(),
      tenantId: hpciChurch.id,
      passwordHash,
      mustChangePassword: false, // Seed accounts don't need password change
    },
  })

  // Create more members for testing
  const members = []
  for (let i = 1; i <= 10; i++) {
    const church = i <= 5 ? localChurch1 : localChurch2
    const cityName = i <= 5 ? 'Manila' : 'Cebu'
    const member = await prisma.user.create({
      data: {
        id: `user_member_${i}`,
        email: `member${i}@test.com`,
        name: `${cityName} Member ${i}`,
        role: UserRole.MEMBER,
        emailVerified: new Date(),
        tenantId: hpciChurch.id,
        isNewBeliever: i === 1 || i === 6, // First member of each church is new believer
        passwordHash,
        mustChangePassword: false, // Seed accounts don't need password change
      },
    })
    members.push(member)
  }
  console.log('✅ Created users')

  // Create memberships
  await prisma.membership.create({
    data: {
      userId: churchAdmin1.id,
      localChurchId: localChurch1.id,
      role: UserRole.ADMIN,
      isNewBeliever: false,
    },
  })

  await prisma.membership.create({
    data: {
      userId: churchAdmin2.id,
      localChurchId: localChurch2.id,
      role: UserRole.ADMIN,
      isNewBeliever: false,
    },
  })

  await prisma.membership.create({
    data: {
      userId: vip1.id,
      localChurchId: localChurch1.id,
      role: UserRole.VIP,
      isNewBeliever: false,
    },
  })

  await prisma.membership.create({
    data: {
      userId: vip2.id,
      localChurchId: localChurch2.id,
      role: UserRole.VIP,
      isNewBeliever: false,
    },
  })

  await prisma.membership.create({
    data: {
      userId: leader1.id,
      localChurchId: localChurch1.id,
      role: UserRole.LEADER,
      isNewBeliever: false,
    },
  })

  await prisma.membership.create({
    data: {
      userId: leader2.id,
      localChurchId: localChurch2.id,
      role: UserRole.LEADER,
      isNewBeliever: false,
    },
  })

  // Create memberships for all members
  for (let i = 0; i < members.length; i++) {
    const church = i < 5 ? localChurch1 : localChurch2
    await prisma.membership.create({
      data: {
        userId: members[i].id,
        localChurchId: church.id,
        role: UserRole.MEMBER,
        isNewBeliever: i === 0 || i === 5, // First member of each church is new believer
      },
    })
  }
  console.log('✅ Created memberships')

  // Create LifeGroups
  const lifeGroup1 = await prisma.lifeGroup.create({
    data: {
      id: 'lg_manila_youth',
      name: 'Youth Connect',
      description: 'Life group for young adults (18-30)',
      capacity: 12,
      leaderId: leader1.id,
      localChurchId: localChurch1.id,
    },
  })

  const lifeGroup2 = await prisma.lifeGroup.create({
    data: {
      id: 'lg_manila_couples',
      name: 'Couples Fellowship',
      description: 'Life group for married couples',
      capacity: 10,
      leaderId: leader1.id,
      localChurchId: localChurch1.id,
    },
  })

  const lifeGroup3 = await prisma.lifeGroup.create({
    data: {
      id: 'lg_cebu_youth',
      name: 'Young Professionals',
      description: 'Life group for working professionals',
      capacity: 15,
      leaderId: leader2.id,
      localChurchId: localChurch2.id,
    },
  })

  const lifeGroup4 = await prisma.lifeGroup.create({
    data: {
      id: 'lg_cebu_bible',
      name: 'Bible Study Group',
      description: 'In-depth Bible study and discussion',
      capacity: 8,
      leaderId: leader2.id,
      localChurchId: localChurch2.id,
    },
  })

  // Add members to life groups
  await prisma.lifeGroupMembership.createMany({
    data: [
      { lifeGroupId: lifeGroup1.id, userId: members[0].id },
      { lifeGroupId: lifeGroup1.id, userId: members[1].id },
      { lifeGroupId: lifeGroup1.id, userId: members[2].id },
      { lifeGroupId: lifeGroup2.id, userId: members[3].id },
      { lifeGroupId: lifeGroup2.id, userId: members[4].id },
      { lifeGroupId: lifeGroup3.id, userId: members[5].id },
      { lifeGroupId: lifeGroup3.id, userId: members[6].id },
      { lifeGroupId: lifeGroup3.id, userId: members[7].id },
      { lifeGroupId: lifeGroup4.id, userId: members[8].id },
      { lifeGroupId: lifeGroup4.id, userId: members[9].id },
    ],
  })
  console.log('✅ Created life groups')

  // Create Events
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(now)
  nextWeek.setDate(nextWeek.getDate() + 7)

  const event1 = await prisma.event.create({
    data: {
      id: 'event_youth_camp',
      name: 'Youth Summer Camp',
      description: 'Annual youth summer camp with activities and worship',
      startDateTime: nextWeek,
      endDateTime: new Date(nextWeek.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days
      location: 'Camp Grounds, Tagaytay',
      capacity: 50,
      scope: EventScope.WHOLE_CHURCH,
      requiresPayment: true,
      feeAmount: 2500,
      visibleToRoles: [],
    },
  })

  const event2 = await prisma.event.create({
    data: {
      id: 'event_leaders_meeting',
      name: 'Leaders Meeting',
      description: 'Monthly leaders coordination meeting',
      startDateTime: tomorrow,
      endDateTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000), // 2 hours
      location: 'Main Hall, HPCI Manila',
      capacity: 20,
      scope: EventScope.LOCAL_CHURCH,
      localChurchId: localChurch1.id,
      visibleToRoles: [UserRole.LEADER, UserRole.ADMIN],
    },
  })

  // Add RSVPs
  await prisma.eventRsvp.createMany({
    data: [
      { eventId: event1.id, userId: members[0].id, hasPaid: true },
      { eventId: event1.id, userId: members[1].id, hasPaid: false },
      { eventId: event1.id, userId: members[5].id, hasPaid: true },
      { eventId: event2.id, userId: leader1.id },
      { eventId: event2.id, userId: churchAdmin1.id },
    ],
  })
  console.log('✅ Created events')

  // Create Service for today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const service1 = await prisma.service.create({
    data: {
      id: 'service_manila_today',
      date: today,
      localChurchId: localChurch1.id,
    },
  })

  const service2 = await prisma.service.create({
    data: {
      id: 'service_cebu_today',
      date: today,
      localChurchId: localChurch2.id,
    },
  })

  // Add check-ins
  await prisma.checkin.createMany({
    data: [
      { serviceId: service1.id, userId: members[0].id, isNewBeliever: true },
      { serviceId: service1.id, userId: members[1].id },
      { serviceId: service1.id, userId: members[2].id },
      { serviceId: service1.id, userId: leader1.id },
      { serviceId: service2.id, userId: members[5].id, isNewBeliever: true },
      { serviceId: service2.id, userId: members[6].id },
      { serviceId: service2.id, userId: leader2.id },
    ],
  })
  console.log('✅ Created services and check-ins')

  // Create Pathways
  const rootsPathway = await prisma.pathway.create({
    data: {
      id: 'pathway_roots',
      name: 'ROOTS - New Believer Foundation',
      description: 'Foundation course for new believers',
      type: PathwayType.ROOTS,
      tenantId: hpciChurch.id,
    },
  })

  const vinesPathway = await prisma.pathway.create({
    data: {
      id: 'pathway_vines',
      name: 'VINES - Growing in Faith',
      description: 'Discipleship pathway for spiritual growth',
      type: PathwayType.VINES,
      tenantId: hpciChurch.id,
    },
  })

  const retreatPathway = await prisma.pathway.create({
    data: {
      id: 'pathway_retreat',
      name: 'Annual Spiritual Retreat',
      description: 'Deep spiritual encounter retreat',
      type: PathwayType.RETREAT,
      tenantId: hpciChurch.id,
    },
  })

  // Create Steps for each pathway
  const rootsSteps = await Promise.all([
    prisma.pathwayStep.create({
      data: {
        id: 'step_roots_1',
        pathwayId: rootsPathway.id,
        name: 'Understanding Salvation',
        description: 'Learn about God\'s gift of salvation',
        orderIndex: 1,
      },
    }),
    prisma.pathwayStep.create({
      data: {
        id: 'step_roots_2',
        pathwayId: rootsPathway.id,
        name: 'Water Baptism',
        description: 'Public declaration of faith',
        orderIndex: 2,
      },
    }),
    prisma.pathwayStep.create({
      data: {
        id: 'step_roots_3',
        pathwayId: rootsPathway.id,
        name: 'Holy Spirit Baptism',
        description: 'Receiving the power of the Holy Spirit',
        orderIndex: 3,
      },
    }),
    prisma.pathwayStep.create({
      data: {
        id: 'step_roots_4',
        pathwayId: rootsPathway.id,
        name: 'Church Membership',
        description: 'Becoming part of the church family',
        orderIndex: 4,
      },
    }),
  ])

  const vinesSteps = await Promise.all([
    prisma.pathwayStep.create({
      data: {
        id: 'step_vines_1',
        pathwayId: vinesPathway.id,
        name: 'Spiritual Disciplines',
        description: 'Prayer, fasting, and meditation',
        orderIndex: 1,
      },
    }),
    prisma.pathwayStep.create({
      data: {
        id: 'step_vines_2',
        pathwayId: vinesPathway.id,
        name: 'Bible Study Methods',
        description: 'How to study the Word effectively',
        orderIndex: 2,
      },
    }),
    prisma.pathwayStep.create({
      data: {
        id: 'step_vines_3',
        pathwayId: vinesPathway.id,
        name: 'Discovering Your Gifts',
        description: 'Identify and develop spiritual gifts',
        orderIndex: 3,
      },
    }),
  ])

  const retreatSteps = await Promise.all([
    prisma.pathwayStep.create({
      data: {
        id: 'step_retreat_1',
        pathwayId: retreatPathway.id,
        name: 'Registration',
        description: 'Sign up for the retreat',
        orderIndex: 1,
      },
    }),
    prisma.pathwayStep.create({
      data: {
        id: 'step_retreat_2',
        pathwayId: retreatPathway.id,
        name: 'Attendance',
        description: 'Attend the retreat',
        orderIndex: 2,
      },
    }),
  ])

  // Auto-enroll new believers in ROOTS pathway
  const newBelievers = members.filter((m, i) => i === 0 || i === 5)
  for (const believer of newBelievers) {
    await prisma.pathwayEnrollment.create({
      data: {
        pathwayId: rootsPathway.id,
        userId: believer.id,
      },
    })
    
    // Add some progress
    await prisma.pathwayProgress.create({
      data: {
        stepId: rootsSteps[0].id,
        userId: believer.id,
        completedBy: leader1.id,
        notes: 'Completed salvation class',
      },
    })
  }

  // Enroll some members in VINES pathway
  await prisma.pathwayEnrollment.create({
    data: {
      pathwayId: vinesPathway.id,
      userId: members[2].id,
    },
  })

  await prisma.pathwayEnrollment.create({
    data: {
      pathwayId: vinesPathway.id,
      userId: members[7].id,
    },
  })
  console.log('✅ Created pathways and enrollments')

  // Create First Timers
  // Create some first timer members
  const firstTimer1 = await prisma.user.create({
    data: {
      id: 'user_firsttimer_1',
      email: 'firsttimer1@test.com',
      name: 'John First Timer',
      role: UserRole.MEMBER,
      emailVerified: new Date(),
      tenantId: hpciChurch.id,
      isNewBeliever: true,
      passwordHash,
      mustChangePassword: false, // Seed accounts don't need password change
    },
  })

  const firstTimer2 = await prisma.user.create({
    data: {
      id: 'user_firsttimer_2',
      email: 'firsttimer2@test.com',
      name: 'Jane First Timer',
      role: UserRole.MEMBER,
      emailVerified: new Date(),
      tenantId: hpciChurch.id,
      isNewBeliever: true,
      passwordHash,
      mustChangePassword: false, // Seed accounts don't need password change
    },
  })

  const firstTimer3 = await prisma.user.create({
    data: {
      id: 'user_firsttimer_3',
      email: 'firsttimer3@test.com',
      name: 'Bob First Timer',
      role: UserRole.MEMBER,
      emailVerified: new Date(),
      tenantId: hpciChurch.id,
      isNewBeliever: true,
      passwordHash,
      mustChangePassword: false, // Seed accounts don't need password change
    },
  })

  // Create FirstTimer records
  await prisma.firstTimer.create({
    data: {
      id: 'firsttimer_1',
      memberId: firstTimer1.id,
      gospelShared: true,
      rootsCompleted: false,
      assignedVipId: vip1.id,
      notes: 'Met at Sunday service. Very interested in learning more about faith.',
    },
  })

  await prisma.firstTimer.create({
    data: {
      id: 'firsttimer_2',
      memberId: firstTimer2.id,
      gospelShared: false,
      rootsCompleted: false,
      assignedVipId: vip1.id,
      notes: 'Friend invited her. Looking for community.',
    },
  })

  await prisma.firstTimer.create({
    data: {
      id: 'firsttimer_3',
      memberId: firstTimer3.id,
      gospelShared: true,
      rootsCompleted: true,
      assignedVipId: vip2.id,
      notes: 'Completed ROOTS pathway. Ready to join a life group.',
    },
  })

  // Auto-enroll first timers in ROOTS pathway
  await prisma.pathwayEnrollment.create({
    data: {
      pathwayId: rootsPathway.id,
      userId: firstTimer1.id,
    },
  })

  await prisma.pathwayEnrollment.create({
    data: {
      pathwayId: rootsPathway.id,
      userId: firstTimer2.id,
    },
  })

  await prisma.pathwayEnrollment.create({
    data: {
      pathwayId: rootsPathway.id,
      userId: firstTimer3.id,
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  })

  // Add membership for first timers
  await prisma.membership.create({
    data: {
      userId: firstTimer1.id,
      localChurchId: localChurch1.id,
      role: UserRole.MEMBER,
      isNewBeliever: true,
    },
  })

  await prisma.membership.create({
    data: {
      userId: firstTimer2.id,
      localChurchId: localChurch1.id,
      role: UserRole.MEMBER,
      isNewBeliever: true,
    },
  })

  await prisma.membership.create({
    data: {
      userId: firstTimer3.id,
      localChurchId: localChurch2.id,
      role: UserRole.MEMBER,
      isNewBeliever: true,
    },
  })

  console.log('✅ Created first timers')

  console.log('🎉 Database seeding completed successfully!')
  console.log('\n📋 Test Accounts:')
  console.log('Super Admin: superadmin@test.com')
  console.log('Church Admin (Manila): admin.manila@test.com')
  console.log('Church Admin (Cebu): admin.cebu@test.com')
  console.log('VIP (Manila): vip.manila@test.com')
  console.log('VIP (Cebu): vip.cebu@test.com')
  console.log('Leader (Manila): leader.manila@test.com')
  console.log('Leader (Cebu): leader.cebu@test.com')
  console.log('Members: member1@test.com - member10@test.com')
  console.log('First Timers: firsttimer1@test.com - firsttimer3@test.com')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })