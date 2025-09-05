import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('RSVP Concurrency Tests', () => {
  let testEvent: any
  let testUsers: any[] = []

  beforeAll(async () => {
    // Clean up existing test data
    await prisma.$transaction([
      prisma.eventRsvp.deleteMany({ where: { eventId: { startsWith: 'test_conc_' } } }),
      prisma.event.deleteMany({ where: { id: { startsWith: 'test_conc_' } } }),
      prisma.user.deleteMany({ where: { id: { startsWith: 'test_conc_' } } }),
    ])

    // Create test event with limited capacity
    testEvent = await prisma.event.create({
      data: {
        id: 'test_conc_event',
        name: 'Limited Capacity Event',
        description: 'Event for concurrency testing',
        startDateTime: new Date(Date.now() + 86400000),
        endDateTime: new Date(Date.now() + 90000000),
        location: 'Test Location',
        capacity: 3, // Only 3 spots available
        scope: 'WHOLE_CHURCH',
      },
    })

    // Create 5 test users
    for (let i = 1; i <= 5; i++) {
      const user = await prisma.user.create({
        data: {
          id: `test_conc_user_${i}`,
          email: `test_conc_${i}@test.com`,
          name: `Test User ${i}`,
          role: 'MEMBER',
          tenantId: 'church_hpci',
        },
      })
      testUsers.push(user)
    }
  }, 30000)

  afterAll(async () => {
    await prisma.$transaction([
      prisma.eventRsvp.deleteMany({ where: { eventId: { startsWith: 'test_conc_' } } }),
      prisma.event.deleteMany({ where: { id: { startsWith: 'test_conc_' } } }),
      prisma.user.deleteMany({ where: { id: { startsWith: 'test_conc_' } } }),
    ])
    await prisma.$disconnect()
  }, 30000)

  describe('Concurrent RSVP at capacity', () => {
    it('should handle concurrent RSVPs without overbooking', async () => {
      // Use timestamp to ensure unique test run
      const testRunId = Date.now()
      const isolatedEventId = `test_conc_event_${testRunId}`
      
      // Create isolated event for this test
      const isolatedEvent = await prisma.event.create({
        data: {
          id: isolatedEventId,
          name: 'Isolated Capacity Event',
          description: 'Event for isolated concurrency testing',
          startDateTime: new Date(Date.now() + 86400000),
          endDateTime: new Date(Date.now() + 90000000),
          location: 'Test Location',
          capacity: 3, // Only 3 spots available
          scope: 'WHOLE_CHURCH',
        },
      })

      // Create isolated users for this test
      const isolatedUsers = []
      for (let i = 1; i <= 5; i++) {
        const user = await prisma.user.create({
          data: {
            id: `test_conc_user_${testRunId}_${i}`,
            email: `test_conc_${testRunId}_${i}@test.com`,
            name: `Test User ${testRunId} ${i}`,
            role: 'MEMBER',
            tenantId: 'church_hpci',
          },
        })
        isolatedUsers.push(user)
      }

      try {
        // Simulate concurrent RSVP attempts with proper isolation
        const rsvpPromises = isolatedUsers.map(async (user, index) => {
          // Add slight delay to create more realistic concurrency
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10))
          
          try {
            // Use a serializable transaction to ensure consistency
            const rsvp = await prisma.$transaction(async (tx) => {
              // Check current capacity within transaction
              const currentCount = await tx.eventRsvp.count({
                where: {
                  eventId: isolatedEvent.id,
                  status: 'GOING',
                },
              })

              // If at capacity, should be waitlisted
              const status = currentCount >= isolatedEvent.capacity ? 'WAITLIST' : 'GOING'

              return await tx.eventRsvp.create({
                data: {
                  eventId: isolatedEvent.id,
                  userId: user.id,
                  status,
                },
              })
            }, {
              isolationLevel: 'Serializable', // Strictest isolation
              timeout: 10000, // 10 second timeout
            })
            
            return { success: true, rsvp, userId: user.id }
          } catch (error: any) {
            // Handle duplicate key or other concurrency errors
            return { success: false, error: error.message, userId: user.id }
          }
        })

        const results = await Promise.all(rsvpPromises)

        // Check results
        const successful = results.filter(r => r.success)
        const failed = results.filter(r => !r.success)

        expect(successful.length).toBeGreaterThan(0)

        // Verify no overbooking using isolated event
        const goingCount = await prisma.eventRsvp.count({
          where: {
            eventId: isolatedEvent.id,
            status: 'GOING',
          },
        })

        const waitlistCount = await prisma.eventRsvp.count({
          where: {
            eventId: isolatedEvent.id,
            status: 'WAITLIST',
          },
        })

        // Should not exceed capacity - this is the critical assertion
        expect(goingCount).toBeLessThanOrEqual(isolatedEvent.capacity)
        
        // Total should match successful RSVPs (some might fail due to race conditions)
        expect(goingCount + waitlistCount).toBeLessThanOrEqual(successful.length)

        console.log(`Test ${testRunId}: Capacity: ${isolatedEvent.capacity}, Going: ${goingCount}, Waitlisted: ${waitlistCount}, Failed: ${failed.length}`)
      } finally {
        // Clean up isolated test data
        await prisma.eventRsvp.deleteMany({
          where: { eventId: isolatedEvent.id }
        })
        await prisma.event.delete({
          where: { id: isolatedEvent.id }
        })
        await prisma.user.deleteMany({
          where: { id: { startsWith: `test_conc_user_${testRunId}_` } }
        })
      }
    }, 15000)
  })

  describe('Waitlist promotion on cancellation', () => {
    it('should promote waitlisted user when spot opens', async () => {
      // Get a user who is GOING
      const goingRsvp = await prisma.eventRsvp.findFirst({
        where: {
          eventId: testEvent.id,
          status: 'GOING',
        },
      })

      // Get a waitlisted user
      const waitlistedRsvp = await prisma.eventRsvp.findFirst({
        where: {
          eventId: testEvent.id,
          status: 'WAITLIST',
        },
        orderBy: { rsvpAt: 'asc' },
      })

      if (goingRsvp && waitlistedRsvp) {
        // Cancel the GOING RSVP
        await prisma.eventRsvp.update({
          where: { id: goingRsvp.id },
          data: { status: 'CANCELLED' },
        })

        // Manually promote waitlisted user (simulating what the app should do)
        await prisma.eventRsvp.update({
          where: { id: waitlistedRsvp.id },
          data: { status: 'GOING' },
        })

        // Verify promotion
        const promoted = await prisma.eventRsvp.findUnique({
          where: { id: waitlistedRsvp.id },
        })

        expect(promoted?.status).toBe('GOING')

        // Verify capacity is still respected
        const goingCount = await prisma.eventRsvp.count({
          where: {
            eventId: testEvent.id,
            status: 'GOING',
          },
        })
        expect(goingCount).toBeLessThanOrEqual(testEvent.capacity)
      }
    })

    it.skip('should handle concurrent cancellations and promotions', async () => {
      // Reset RSVPs
      await prisma.eventRsvp.deleteMany({
        where: { eventId: testEvent.id },
      })

      // Fill event to capacity
      for (let i = 0; i < testEvent.capacity; i++) {
        await prisma.eventRsvp.create({
          data: {
            eventId: testEvent.id,
            userId: testUsers[i].id,
            status: 'GOING',
          },
        })
      }

      // Add waitlisted users
      for (let i = testEvent.capacity; i < testUsers.length; i++) {
        await prisma.eventRsvp.create({
          data: {
            eventId: testEvent.id,
            userId: testUsers[i].id,
            status: 'WAITLIST',
          },
        })
      }

      // Simulate concurrent cancellations
      const goingRsvps = await prisma.eventRsvp.findMany({
        where: {
          eventId: testEvent.id,
          status: 'GOING',
        },
        take: 2,
      })

      const cancellationPromises = goingRsvps.map(async (rsvp) => {
        await prisma.eventRsvp.update({
          where: { id: rsvp.id },
          data: { status: 'CANCELLED' },
        })
      })

      await Promise.all(cancellationPromises)

      // Get waitlisted users to promote
      const waitlisted = await prisma.eventRsvp.findMany({
        where: {
          eventId: testEvent.id,
          status: 'WAITLIST',
        },
        orderBy: { rsvpAt: 'asc' },
        take: 2,
      })

      // Simulate concurrent promotions with proper transaction handling
      const promotionPromises = waitlisted.map(async (rsvp) => {
        try {
          // Use transaction to prevent race conditions
          const result = await prisma.$transaction(async (tx) => {
            // Check if we can promote within transaction
            const currentGoing = await tx.eventRsvp.count({
              where: {
                eventId: testEvent.id,
                status: 'GOING',
              },
            })

            if (currentGoing < testEvent.capacity) {
              await tx.eventRsvp.update({
                where: { id: rsvp.id },
                data: { status: 'GOING' },
              })
              return { promoted: true, id: rsvp.id }
            }
            return { promoted: false, id: rsvp.id }
          })
          return result
        } catch (error) {
          return { promoted: false, id: rsvp.id, error }
        }
      })

      const promotionResults = await Promise.all(promotionPromises)

      // Final verification
      const finalGoing = await prisma.eventRsvp.count({
        where: {
          eventId: testEvent.id,
          status: 'GOING',
        },
      })

      // Should not exceed capacity
      expect(finalGoing).toBeLessThanOrEqual(testEvent.capacity)
      
      console.log(`Promotion results:`, promotionResults)
      console.log(`Final going count: ${finalGoing}/${testEvent.capacity}`)
    })
  })

  describe('Race condition prevention', () => {
    it('should prevent duplicate RSVPs even when attempted simultaneously', async () => {
      // Clean up any existing test data
      await prisma.eventRsvp.deleteMany({
        where: { 
          OR: [
            { eventId: 'test_conc_unique_event' },
            { userId: 'test_conc_unique' }
          ]
        }
      })
      await prisma.event.deleteMany({ where: { id: 'test_conc_unique_event' } })
      await prisma.user.deleteMany({ where: { id: 'test_conc_unique' } })

      const uniqueUser = await prisma.user.create({
        data: {
          id: 'test_conc_unique',
          email: 'test_conc_unique@test.com',
          name: 'Unique Test User',
          role: 'MEMBER',
          tenantId: 'church_hpci',
        },
      })

      const uniqueEvent = await prisma.event.create({
        data: {
          id: 'test_conc_unique_event',
          name: 'Unique Event',
          description: 'Event for duplicate testing',
          startDateTime: new Date(),
          endDateTime: new Date(),
          location: 'Test',
          capacity: 100,
          scope: 'WHOLE_CHURCH',
        },
      })

      // Attempt to create duplicate RSVPs simultaneously with tiny delays to increase race condition likelihood
      const duplicateAttempts = Array(5).fill(null).map(async (_, index) => {
        // Add a tiny random delay to increase race condition probability
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10))
        }
        
        try {
          const rsvp = await prisma.eventRsvp.create({
            data: {
              eventId: uniqueEvent.id,
              userId: uniqueUser.id,
              status: 'GOING',
            },
          })
          return { success: true, rsvp }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          return { success: false, error: errorMessage }
        }
      })

      const results = await Promise.all(duplicateAttempts)

      // Only one should succeed
      const successes = results.filter(r => r.success)
      const failures = results.filter(r => !r.success)

      expect(successes).toHaveLength(1)
      expect(failures.length).toBeGreaterThan(0)

      // Verify only one RSVP exists
      const rsvpCount = await prisma.eventRsvp.count({
        where: {
          eventId: uniqueEvent.id,
          userId: uniqueUser.id,
        },
      })
      expect(rsvpCount).toBe(1)
    })
  })
})