#!/usr/bin/env tsx
/**
 * Check database isolation data to understand why both admins see identical data
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkIsolationData() {
  console.log('🔍 Checking Database Isolation Data')
  
  try {
    // Check all users and their tenants
    const users = await prisma.user.findMany({
      include: {
        memberships: {
          include: {
            localChurch: true
          }
        }
      },
      orderBy: { email: 'asc' }
    })
    
    console.log(`\n👥 USERS (${users.length} total):`)
    users.forEach(user => {
      const memberships = user.memberships.map(m => m.localChurch.name).join(', ') || 'none'
      console.log(`   ${user.email} | role: ${user.role} | tenant: ${user.tenantId} | memberships: ${memberships}`)
    })
    
    // Check QA admin users specifically
    const qaAdmins = users.filter(u => u.email.includes('LOCALTEST') && u.role === 'ADMIN')
    console.log(`\n🛡️ QA ADMIN USERS (${qaAdmins.length}):`)
    qaAdmins.forEach(admin => {
      const memberships = admin.memberships.map(m => `${m.localChurch.name} (${m.localChurch.id})`).join(', ') || 'none'
      console.log(`   ${admin.email} | tenant: ${admin.tenantId} | memberships: ${memberships}`)
    })
    
    // Check all churches
    const churches = await prisma.localChurch.findMany({
      include: {
        _count: {
          select: {
            memberships: true,
            services: true,
            lifeGroups: true,
            events: true
          }
        }
      }
    })
    
    console.log(`\n⛪ LOCAL CHURCHES (${churches.length} total):`)
    churches.forEach(church => {
      console.log(`   ${church.name} (${church.id})`)
      console.log(`     Members: ${church._count.memberships} | Services: ${church._count.services} | LifeGroups: ${church._count.lifeGroups} | Events: ${church._count.events}`)
    })
    
    // Check pathways (these might be tenant-wide, not church-specific)
    const pathways = await prisma.pathway.findMany({
      include: {
        _count: {
          select: {
            steps: true
          }
        }
      }
    })
    
    console.log(`\n📚 PATHWAYS (${pathways.length} total):`)
    pathways.forEach(pathway => {
      console.log(`   ${pathway.name} | tenant: ${pathway.tenantId} | steps: ${pathway._count.steps}`)
    })
    
    // Check services per church
    const services = await prisma.service.findMany({
      include: {
        localChurch: true,
        _count: {
          select: {
            checkins: true
          }
        }
      }
    })
    
    console.log(`\n⛪ SERVICES (${services.length} total):`)
    services.forEach(service => {
      console.log(`   ${service.date.toISOString().split('T')[0]} | ${service.localChurch.name} | checkins: ${service._count.checkins}`)
    })
    
    // Check life groups per church
    const lifeGroups = await prisma.lifeGroup.findMany({
      include: {
        localChurch: true,
        _count: {
          select: {
            memberships: true
          }
        }
      }
    })
    
    console.log(`\n🏠 LIFE GROUPS (${lifeGroups.length} total):`)
    lifeGroups.forEach(lg => {
      console.log(`   ${lg.name} | ${lg.localChurch.name} | members: ${lg._count.memberships}`)
    })
    
    // Check events per church
    const events = await prisma.event.findMany({
      include: {
        localChurch: true,
        _count: {
          select: {
            rsvps: true
          }
        }
      }
    })
    
    console.log(`\n📅 EVENTS (${events.length} total):`)
    events.forEach(event => {
      console.log(`   ${event.title} | ${event.localChurch.name} | RSVPs: ${event._count.rsvps}`)
    })
    
  } catch (error) {
    console.error('❌ Error checking isolation data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run check
if (require.main === module) {
  checkIsolationData()
    .catch(error => {
      console.error('Error:', error)
      process.exit(1)
    })
}

export { checkIsolationData }