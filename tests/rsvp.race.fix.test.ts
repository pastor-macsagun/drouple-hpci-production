import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { isDatabaseAvailable } from './utils/db-availability'

const prisma = new PrismaClient()
const dbAvailable = await isDatabaseAvailable()
if (!dbAvailable) {
  console.warn('[vitest] Skipping RSVP Race Condition Fix tests because the Postgres test database is unavailable.')
  await prisma.$disconnect().catch(() => undefined)
}
const describeIfDb = dbAvailable ? describe : describe.skip

describeIfDb('RSVP Race Condition Fix', () => {
  let testEvent: any
  let testUsers: any[] = []

  beforeAll(async () => {
    const testRunId = Date.now()
    
    // Create test event with limited capacity
    testEvent = await prisma.event.create({
      data: {
        id: `race_test_event_${testRunId}`,
        name: 'Race Test Event',
        description: 'Event for race condition testing',
        startDateTime: new Date(Date.now() + 86400000),
        endDateTime: new Date(Date.now() + 90000000),
        location: 'Test Location',
        capacity: 2, // Only 2 spots available
        scope: 'WHOLE_CHURCH',
        isActive: true,
      },
    })

    // Create test users
    for (let i = 1; i <= 4; i++) {
      const user = await prisma.user.create({
        data: {
          id: `race_test_user_${testRunId}_${i}`,
          email: `race_test_${testRunId}_${i}@test.com`,
          name: `Race Test User ${i}`,
          role: 'MEMBER',
          tenantId: 'church_hpci',
        },
      })
      testUsers.push(user)
    }
  }, 30000)

  afterAll(async () => {
    const testRunId = testEvent.id.split('_')[3]
    await prisma.eventRsvp.deleteMany({
      where: { eventId: testEvent.id }
    })
    await prisma.event.delete({
      where: { id: testEvent.id }
    })
    await prisma.user.deleteMany({
      where: { id: { startsWith: `race_test_user_${testRunId}_` } }
    })
    await prisma.$disconnect()
  }, 30000)

  it('should prevent overbooking with concurrent database operations', async () => {
    // Simulate the fixed transaction logic directly
    const rsvpPromises = testUsers.map(async (user) => {
      try {
        // This is the same logic as in the fixed rsvpToEvent action
        const rsvp = await prisma.$transaction(async (tx) => {
          // Count current attendees within transaction
          const currentAttendees = await tx.eventRsvp.count({
            where: {
              eventId: testEvent.id,
              status: 'GOING',
            },
          })

          // Determine RSVP status based on capacity
          const status = currentAttendees < testEvent.capacity 
            ? 'GOING' 
            : 'WAITLIST'

          // Create RSVP within same transaction
          return await tx.eventRsvp.create({
            data: {
              eventId: testEvent.id,
              userId: user.id,
              status,
            },
          })
        }, {
          isolationLevel: 'Serializable'
        })

        return { success: true, userId: user.id, rsvp }
      } catch (error: any) {
        // Handle unique constraint violations or other errors
        return { success: false, userId: user.id, error: error.message }
      }
    })

    // Execute all RSVPs concurrently
    const results = await Promise.all(rsvpPromises)

    // Count actual RSVPs in database
    const goingCount = await prisma.eventRsvp.count({
      where: {
        eventId: testEvent.id,
        status: 'GOING',
      },
    })

    const waitlistCount = await prisma.eventRsvp.count({
      where: {
        eventId: testEvent.id,
        status: 'WAITLIST',
      },
    })

    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)

    console.log(`Capacity: ${testEvent.capacity}, Going: ${goingCount}, Waitlisted: ${waitlistCount}`)
    console.log(`Successful: ${successful.length}, Failed: ${failed.length}`)

    // Critical assertion: no overbooking occurred
    expect(goingCount).toBeLessThanOrEqual(testEvent.capacity)
    expect(goingCount).toBeGreaterThan(0) // At least someone should succeed
    
    // All successful operations should be reflected in database
    expect(goingCount + waitlistCount).toEqual(successful.length)
  }, 10000)
})
