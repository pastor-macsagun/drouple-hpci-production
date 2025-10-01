import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { isDatabaseAvailable } from '../utils/db-availability'

const prisma = new PrismaClient()
const dbAvailable = await isDatabaseAvailable()
if (!dbAvailable) {
  console.warn('[vitest] Skipping Check-in Duplicate Handling tests because the Postgres test database is unavailable.')
  await prisma.$disconnect().catch(() => undefined)
}
const describeIfDb = dbAvailable ? describe : describe.skip

describeIfDb('Check-in Duplicate Handling', () => {
  const testUserId = 'test_user_duplicate_checkin'
  const testServiceId = 'test_service_duplicate'
  
  beforeEach(async () => {
    // Clean up test data
    await prisma.checkin.deleteMany({
      where: {
        OR: [
          { userId: testUserId },
          { serviceId: testServiceId }
        ]
      }
    })
    
    await prisma.service.deleteMany({
      where: { id: testServiceId }
    })
    
    await prisma.user.deleteMany({
      where: { id: testUserId }
    })

    // Ensure local church exists (should be created by seed)
    let localChurch = await prisma.localChurch.findUnique({
      where: { id: 'local_manila' }
    })
    
    if (!localChurch) {
      // Create church structure if not exists
      let church = await prisma.church.findUnique({
        where: { id: 'church_hpci' }
      })
      
      if (!church) {
        church = await prisma.church.create({
          data: {
            id: 'church_hpci',
            name: 'HPCI',
            description: 'House of Prayer Christian International',
          }
        })
      }
      
      localChurch = await prisma.localChurch.create({
        data: {
          id: 'local_manila',
          name: 'HPCI Manila',
          churchId: 'church_hpci',
        }
      })
    }

    // Create test data
    await prisma.user.create({
      data: {
        id: testUserId,
        email: 'test_duplicate@test.com',
        name: 'Test User',
        role: 'MEMBER',
        tenantId: 'church_hpci',
      },
    })

    await prisma.service.create({
      data: {
        id: testServiceId,
        date: new Date(),
        localChurchId: 'local_manila',
      },
    })
  })

  afterEach(async () => {
    // Clean up test data
    await prisma.checkin.deleteMany({
      where: {
        OR: [
          { userId: testUserId },
          { serviceId: testServiceId }
        ]
      }
    })
    
    await prisma.service.deleteMany({
      where: { id: testServiceId }
    })
    
    await prisma.user.deleteMany({
      where: { id: testUserId }
    })
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('should handle duplicate check-in gracefully', async () => {
    // First check-in should succeed
    const firstCheckin = await prisma.checkin.create({
      data: {
        serviceId: testServiceId,
        userId: testUserId,
        isNewBeliever: false
      }
    })

    expect(firstCheckin.serviceId).toBe(testServiceId)
    expect(firstCheckin.userId).toBe(testUserId)

    // Second check-in should fail with constraint violation
    try {
      await prisma.checkin.create({
        data: {
          serviceId: testServiceId,
          userId: testUserId,
          isNewBeliever: false
        }
      })
      // Should not reach this line
      expect.fail('Expected duplicate check-in to throw error')
    } catch (error: any) {
      expect(error.code).toBe('P2002')
      expect(error.meta?.target).toContain('serviceId')
      expect(error.meta?.target).toContain('userId')
    }

    // Verify only one check-in exists
    const checkins = await prisma.checkin.findMany({
      where: {
        serviceId: testServiceId,
        userId: testUserId
      }
    })

    expect(checkins).toHaveLength(1)
  })

  it('should allow different users to check in to same service', { timeout: 30000 }, async () => {
    const secondUserId = 'test_user_2_duplicate_checkin'
    
    // Ensure church exists for second user
    const church = await prisma.church.findUnique({
      where: { id: 'church_hpci' }
    })
    if (!church) {
      throw new Error('Church church_hpci not found in test setup')
    }
    
    // Create second user
    await prisma.user.create({
      data: {
        id: secondUserId,
        email: 'test_duplicate_2@test.com',
        name: 'Test User 2',
        role: 'MEMBER',
        tenantId: 'church_hpci',
      },
    })

    try {
      // Both users should be able to check in
      const checkin1 = await prisma.checkin.create({
        data: {
          serviceId: testServiceId,
          userId: testUserId,
          isNewBeliever: false
        }
      })

      const checkin2 = await prisma.checkin.create({
        data: {
          serviceId: testServiceId,
          userId: secondUserId,
          isNewBeliever: false
        }
      })

      expect(checkin1.serviceId).toBe(testServiceId)
      expect(checkin1.userId).toBe(testUserId)
      expect(checkin2.serviceId).toBe(testServiceId)
      expect(checkin2.userId).toBe(secondUserId)

      // Verify both check-ins exist
      const checkins = await prisma.checkin.findMany({
        where: {
          serviceId: testServiceId
        }
      })

      expect(checkins).toHaveLength(2)
    } finally {
      // Clean up second user
      await prisma.checkin.deleteMany({
        where: { userId: secondUserId }
      })
      await prisma.user.deleteMany({
        where: { id: secondUserId }
      })
    }
  })

  it('should allow same user to check in to different services', { timeout: 30000 }, async () => {
    const secondServiceId = 'test_service_duplicate_2'
    
    // Create second service with different date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Ensure local church exists
    const localChurch = await prisma.localChurch.findUnique({
      where: { id: 'local_manila' }
    })
    if (!localChurch) {
      throw new Error('Local church local_manila not found in test setup')
    }
    
    await prisma.service.create({
      data: {
        id: secondServiceId,
        date: tomorrow,
        localChurchId: 'local_manila',
      },
    })

    try {
      // User should be able to check in to both services
      const checkin1 = await prisma.checkin.create({
        data: {
          serviceId: testServiceId,
          userId: testUserId,
          isNewBeliever: false
        }
      })

      const checkin2 = await prisma.checkin.create({
        data: {
          serviceId: secondServiceId,
          userId: testUserId,
          isNewBeliever: false
        }
      })

      expect(checkin1.serviceId).toBe(testServiceId)
      expect(checkin1.userId).toBe(testUserId)
      expect(checkin2.serviceId).toBe(secondServiceId)
      expect(checkin2.userId).toBe(testUserId)

      // Verify both check-ins exist
      const checkins = await prisma.checkin.findMany({
        where: {
          userId: testUserId
        }
      })

      expect(checkins).toHaveLength(2)
    } finally {
      // Clean up second service
      await prisma.checkin.deleteMany({
        where: { serviceId: secondServiceId }
      })
      await prisma.service.deleteMany({
        where: { id: secondServiceId }
      })
    }
  })
})
