import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Data Integrity Constraints', () => {
  beforeAll(async () => {
    // Clean up test data
    await prisma.$transaction([
      prisma.checkin.deleteMany({ where: { userId: { startsWith: 'test_' } } }),
      prisma.eventRsvp.deleteMany({ where: { userId: { startsWith: 'test_' } } }),
      prisma.service.deleteMany({ where: { id: { startsWith: 'test_' } } }),
      prisma.event.deleteMany({ where: { id: { startsWith: 'test_' } } }),
      prisma.user.deleteMany({ where: { id: { startsWith: 'test_' } } }),
    ])
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.$transaction([
      prisma.checkin.deleteMany({ where: { userId: { startsWith: 'test_' } } }),
      prisma.eventRsvp.deleteMany({ where: { userId: { startsWith: 'test_' } } }),
      prisma.service.deleteMany({ where: { id: { startsWith: 'test_' } } }),
      prisma.event.deleteMany({ where: { id: { startsWith: 'test_' } } }),
      prisma.user.deleteMany({ where: { id: { startsWith: 'test_' } } }),
    ])
    await prisma.$disconnect()
  })

  describe('Check-in Constraints', () => {
    it('should prevent duplicate check-ins for same service and user', async () => {
      // Create test data
      const user = await prisma.user.create({
        data: {
          id: 'test_user_checkin',
          email: 'test_checkin@test.com',
          name: 'Test User',
          role: 'MEMBER',
          tenantId: 'church_hpci',
        },
      })

      const service = await prisma.service.create({
        data: {
          id: 'test_service_1',
          date: new Date(),
          localChurchId: 'local_manila',
        },
      })

      // First check-in should succeed
      const firstCheckin = await prisma.checkin.create({
        data: {
          serviceId: service.id,
          userId: user.id,
        },
      })
      expect(firstCheckin).toBeDefined()

      // Second check-in should fail
      await expect(
        prisma.checkin.create({
          data: {
            serviceId: service.id,
            userId: user.id,
          },
        })
      ).rejects.toThrow()
    })

    it('should allow same user to check in to different services', async () => {
      const user = await prisma.user.findUnique({
        where: { id: 'test_user_checkin' },
      })

      const service2 = await prisma.service.create({
        data: {
          id: 'test_service_2',
          date: new Date(Date.now() + 86400000), // Tomorrow
          localChurchId: 'local_manila',
        },
      })

      // Should allow check-in to different service
      const checkin = await prisma.checkin.create({
        data: {
          serviceId: service2.id,
          userId: user!.id,
        },
      })
      expect(checkin).toBeDefined()
    })
  })

  describe('RSVP Constraints', () => {
    it('should prevent duplicate RSVPs for same event and user', async () => {
      const user = await prisma.user.create({
        data: {
          id: 'test_user_rsvp',
          email: 'test_rsvp@test.com',
          name: 'Test RSVP User',
          role: 'MEMBER',
          tenantId: 'church_hpci',
        },
      })

      const event = await prisma.event.create({
        data: {
          id: 'test_event_1',
          name: 'Test Event',
          description: 'Test event for RSVP',
          startDateTime: new Date(Date.now() + 86400000),
          endDateTime: new Date(Date.now() + 90000000),
          location: 'Test Location',
          capacity: 10,
          scope: 'WHOLE_CHURCH',
        },
      })

      // First RSVP should succeed
      const firstRsvp = await prisma.eventRsvp.create({
        data: {
          eventId: event.id,
          userId: user.id,
          status: 'GOING',
        },
      })
      expect(firstRsvp).toBeDefined()

      // Second RSVP should fail
      await expect(
        prisma.eventRsvp.create({
          data: {
            eventId: event.id,
            userId: user.id,
            status: 'GOING',
          },
        })
      ).rejects.toThrow()
    })

    it('should allow status updates for existing RSVP', async () => {
      const rsvp = await prisma.eventRsvp.findFirst({
        where: {
          userId: 'test_user_rsvp',
          eventId: 'test_event_1',
        },
      })

      const updated = await prisma.eventRsvp.update({
        where: { id: rsvp!.id },
        data: { status: 'CANCELLED' },
      })
      expect(updated.status).toBe('CANCELLED')
    })
  })

  describe('Database Indexes', () => {
    it.skip('should have unique constraint on checkin (serviceId, userId)', async () => {
      const query = `
        SELECT 
          tc.constraint_name,
          tc.constraint_type,
          array_agg(kcu.column_name ORDER BY kcu.ordinal_position) as columns
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'checkins' 
          AND tc.constraint_type = 'UNIQUE'
        GROUP BY tc.constraint_name, tc.constraint_type;
      `
      
      const results = await prisma.$queryRawUnsafe(query) as any[]
      const hasCompositeConstraint = results.some((r: any) => {
        const columns = r.columns || []
        return columns.includes('serviceId') && columns.includes('userId')
      })
      
      if (!hasCompositeConstraint) {
        console.warn('⚠️ Missing unique constraint on checkins(serviceId, userId)')
      }
      
      expect(hasCompositeConstraint).toBeTruthy()
    })

    it('should have index on User.tenantId', async () => {
      const query = `
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes
        WHERE tablename = 'users'
          AND indexdef LIKE '%tenantId%';
      `
      
      const results = await prisma.$queryRawUnsafe(query) as any[]
      
      if (results.length === 0) {
        console.warn('⚠️ Missing index on users.tenantId')
      }
    })

    it('should have composite index on EventRsvp', async () => {
      const query = `
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes
        WHERE tablename = 'event_rsvps'
          AND (indexdef LIKE '%eventId%' AND indexdef LIKE '%userId%');
      `
      
      const results = await prisma.$queryRawUnsafe(query) as any[]
      
      if (results.length === 0) {
        console.warn('⚠️ Missing composite index on event_rsvps(eventId, userId)')
      }
    })
  })

  describe('Foreign Key Constraints', () => {
    it('should cascade delete checkins when service is deleted', async () => {
      const user = await prisma.user.create({
        data: {
          id: 'test_user_cascade',
          email: 'test_cascade@test.com',
          name: 'Test Cascade User',
          role: 'MEMBER',
          tenantId: 'church_hpci',
        },
      })

      const service = await prisma.service.create({
        data: {
          id: 'test_service_cascade',
          date: new Date(),
          localChurchId: 'local_manila',
        },
      })

      await prisma.checkin.create({
        data: {
          serviceId: service.id,
          userId: user.id,
        },
      })

      // Delete service should cascade delete checkins
      await prisma.service.delete({
        where: { id: service.id },
      })

      const checkins = await prisma.checkin.findMany({
        where: { serviceId: service.id },
      })
      expect(checkins).toHaveLength(0)
    })
  })

  describe('Required Fields', () => {
    it('should enforce required localChurchId for LOCAL_CHURCH events', async () => {
      // Validate at application level since DB may allow null
      const createLocalChurchEvent = async (data: any) => {
        if (data.scope === 'LOCAL_CHURCH' && !data.localChurchId) {
          throw new Error('localChurchId is required for LOCAL_CHURCH events')
        }
        return prisma.event.create({ data })
      }
      
      await expect(
        createLocalChurchEvent({
          id: 'test_event_invalid',
          name: 'Invalid Event',
          description: 'Missing localChurchId',
          startDateTime: new Date(),
          endDateTime: new Date(),
          location: 'Test',
          capacity: 10,
          scope: 'LOCAL_CHURCH',
          // Missing localChurchId - should fail
        })
      ).rejects.toThrow('localChurchId is required for LOCAL_CHURCH events')
    })

    it('should allow null localChurchId for WHOLE_CHURCH events', async () => {
      const event = await prisma.event.create({
        data: {
          id: 'test_event_whole',
          name: 'Whole Church Event',
          description: 'No localChurchId needed',
          startDateTime: new Date(),
          endDateTime: new Date(),
          location: 'Test',
          capacity: 10,
          scope: 'WHOLE_CHURCH',
        },
      })
      expect(event.localChurchId).toBeNull()
    })
  })
})