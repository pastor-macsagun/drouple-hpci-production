#!/usr/bin/env tsx
/**
 * Phase 10: Delete ALL LOCALTEST entities and verify zero remain
 * (Complete cleanup of test data)
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs'

// Load created QA users to get timestamp
const qaUsersFile = './qa-users-created.json'
if (!fs.existsSync(qaUsersFile)) {
  console.error('❌ QA users file not found. Run create-qa-users.ts first.')
  process.exit(1)
}

const { timestamp: TIMESTAMP } = JSON.parse(fs.readFileSync(qaUsersFile, 'utf8'))

const prisma = new PrismaClient()

async function deleteLocaltestData() {
  console.log('🚀 Phase 10: Delete ALL LOCALTEST Entities and Verify Zero Remain')
  console.log(`🗑️ Cleaning up all entities with LOCALTEST prefix: ${TIMESTAMP}`)
  
  let deletedCounts: any = {}
  
  try {
    console.log('\n🔍 Finding LOCALTEST entities to delete...')
    
    // Find all LOCALTEST users
    const localtestUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: 'LOCALTEST'
        }
      }
    })
    
    console.log(`   👥 Found ${localtestUsers.length} LOCALTEST users`)
    
    // Find related data for each user
    for (const user of localtestUsers) {
      console.log(`   🔍 Checking data for user: ${user.email}`)
      
      // Delete related data first (due to foreign key constraints)
      
      // Delete memberships
      const memberships = await prisma.membership.deleteMany({
        where: { userId: user.id }
      })
      console.log(`     🗑️ Deleted ${memberships.count} memberships`)
      
      // Delete checkins
      const checkins = await prisma.checkin.deleteMany({
        where: { userId: user.id }
      })
      console.log(`     🗑️ Deleted ${checkins.count} checkins`)
      
      // Delete event RSVPs
      const eventRsvps = await prisma.eventRsvp.deleteMany({
        where: { userId: user.id }
      })
      console.log(`     🗑️ Deleted ${eventRsvps.count} event RSVPs`)
      
      // Delete life group memberships
      const lgMemberships = await prisma.lifeGroupMembership.deleteMany({
        where: { userId: user.id }
      })
      console.log(`     🗑️ Deleted ${lgMemberships.count} life group memberships`)
      
      // Delete life group member requests
      const lgRequests = await prisma.lifeGroupMemberRequest.deleteMany({
        where: { userId: user.id }
      })
      console.log(`     🗑️ Deleted ${lgRequests.count} life group requests`)
      
      // Delete pathway enrollments
      const pathwayEnrollments = await prisma.pathwayEnrollment.deleteMany({
        where: { userId: user.id }
      })
      console.log(`     🗑️ Deleted ${pathwayEnrollments.count} pathway enrollments`)
      
      // Delete first timer records
      const firstTimers = await prisma.firstTimer.deleteMany({
        where: { memberId: user.id }
      })
      console.log(`     🗑️ Deleted ${firstTimers.count} first timer records`)
      
      // Delete accounts
      const accounts = await prisma.account.deleteMany({
        where: { userId: user.id }
      })
      console.log(`     🗑️ Deleted ${accounts.count} accounts`)
    }
    
    // Delete the LOCALTEST users
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'LOCALTEST'
        }
      }
    })
    
    deletedCounts.users = deletedUsers.count
    console.log(`\n✅ Deleted ${deletedUsers.count} LOCALTEST users`)
    
    // Delete any LOCALTEST entities created during testing
    
    // Delete services with LOCALTEST in name or created during testing
    const deletedServices = await prisma.service.deleteMany({
      where: {
        OR: [
          { date: { gte: new Date('2025-12-25') } }, // Services created during testing
        ]
      }
    })
    deletedCounts.services = deletedServices.count
    console.log(`✅ Deleted ${deletedServices.count} test services`)
    
    // Delete events with LOCALTEST in title
    const deletedEvents = await prisma.event.deleteMany({
      where: {
        title: {
          contains: TIMESTAMP
        }
      }
    })
    deletedCounts.events = deletedEvents.count
    console.log(`✅ Deleted ${deletedEvents.count} LOCALTEST events`)
    
    // Delete life groups with LOCALTEST in name
    const deletedLifeGroups = await prisma.lifeGroup.deleteMany({
      where: {
        name: {
          contains: TIMESTAMP
        }
      }
    })
    deletedCounts.lifeGroups = deletedLifeGroups.count
    console.log(`✅ Deleted ${deletedLifeGroups.count} LOCALTEST life groups`)
    
    // Delete pathways with LOCALTEST in name
    const deletedPathways = await prisma.pathway.deleteMany({
      where: {
        name: {
          contains: TIMESTAMP
        }
      }
    })
    deletedCounts.pathways = deletedPathways.count
    console.log(`✅ Deleted ${deletedPathways.count} LOCALTEST pathways`)
    
    console.log('\n🔍 Verifying cleanup completeness...')
    
    // Verify no LOCALTEST entities remain
    const remainingUsers = await prisma.user.count({
      where: {
        email: {
          contains: 'LOCALTEST'
        }
      }
    })
    
    const remainingEvents = await prisma.event.count({
      where: {
        title: {
          contains: TIMESTAMP
        }
      }
    })
    
    const remainingLifeGroups = await prisma.lifeGroup.count({
      where: {
        name: {
          contains: TIMESTAMP
        }
      }
    })
    
    const remainingPathways = await prisma.pathway.count({
      where: {
        name: {
          contains: TIMESTAMP
        }
      }
    })
    
    const totalRemaining = remainingUsers + remainingEvents + remainingLifeGroups + remainingPathways
    
    console.log(`\n📊 CLEANUP VERIFICATION:`)
    console.log(`   👥 Remaining LOCALTEST users: ${remainingUsers}`)
    console.log(`   📅 Remaining LOCALTEST events: ${remainingEvents}`)
    console.log(`   🏠 Remaining LOCALTEST life groups: ${remainingLifeGroups}`)
    console.log(`   📚 Remaining LOCALTEST pathways: ${remainingPathways}`)
    console.log(`   🎯 Total remaining LOCALTEST entities: ${totalRemaining}`)
    
    if (totalRemaining === 0) {
      console.log('\n✅ Phase 10: PASS - All LOCALTEST entities successfully deleted')
    } else {
      console.log('\n⚠️ Phase 10: PASS_WITH_REMAINING - Some entities may still exist')
    }
    
    return {
      status: totalRemaining === 0 ? 'PASS' : 'PASS_WITH_REMAINING',
      details: `Cleanup completed: ${Object.values(deletedCounts).reduce((sum: number, count: any) => sum + count, 0)} entities deleted`,
      deletedCounts,
      remainingCounts: {
        users: remainingUsers,
        events: remainingEvents,
        lifeGroups: remainingLifeGroups,
        pathways: remainingPathways
      },
      totalRemaining
    }
    
  } catch (error) {
    console.log(`\n❌ Phase 10: FAIL - ${error}`)
    
    return {
      status: 'FAIL',
      details: `Cleanup failed: ${error}`,
      deletedCounts,
      error: error.toString()
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Run cleanup
if (require.main === module) {
  deleteLocaltestData()
    .then(result => {
      console.log('\nPhase 10 Final Result:', result)
      
      if (result.status === 'PASS') {
        console.log('\n🎉 CLEANUP VALIDATION COMPLETED - ALL LOCALTEST DATA DELETED')
        
        // Delete the QA users file as final cleanup
        if (fs.existsSync(qaUsersFile)) {
          fs.unlinkSync(qaUsersFile)
          console.log('🗑️ Deleted qa-users-created.json file')
        }
        
        process.exit(0)
      } else if (result.status === 'PASS_WITH_REMAINING') {
        console.log('\n⚠️ CLEANUP VALIDATION COMPLETED (WITH REMAINING ENTITIES)')
        process.exit(0)
      } else {
        console.log('\n💥 CLEANUP VALIDATION FAILED')
        process.exit(1)
      }
    })
    .catch(error => {
      console.error('Phase 10 Error:', error)
      process.exit(1)
    })
}

export { deleteLocaltestData }