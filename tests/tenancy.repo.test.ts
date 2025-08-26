import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TenantRepository } from '@/lib/db/middleware/tenancy'

describe('TenantRepository', () => {
  let mockDb: any
  let repo: TenantRepository

  beforeEach(() => {
    mockDb = {
      service: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      lifeGroup: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      event: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      membership: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    }
  })

  describe('Service operations', () => {
    it('should filter services by localChurchId on read', async () => {
      repo = new TenantRepository(mockDb, ['church1', 'church2'])
      
      await repo.findServices({ date: new Date() })
      
      expect(mockDb.service.findMany).toHaveBeenCalledWith({
        where: {
          date: expect.any(Date),
          localChurchId: { in: ['church1', 'church2'] }
        }
      })
    })

    it('should prevent creating service for different tenant', async () => {
      repo = new TenantRepository(mockDb, ['church1'])
      
      await expect(
        repo.createService({ localChurchId: 'church2', date: new Date() })
      ).rejects.toThrow('Cannot create service for different tenant')
    })

    it('should allow creating service for same tenant', async () => {
      repo = new TenantRepository(mockDb, ['church1'])
      mockDb.service.create.mockResolvedValue({ id: 'service1' })
      
      const result = await repo.createService({ 
        localChurchId: 'church1', 
        date: new Date() 
      })
      
      expect(result).toEqual({ id: 'service1' })
      expect(mockDb.service.create).toHaveBeenCalled()
    })

    it('should prevent updating service from different tenant', async () => {
      repo = new TenantRepository(mockDb, ['church1'])
      mockDb.service.findFirst.mockResolvedValue(null)
      
      await expect(
        repo.updateService('service1', { date: new Date() })
      ).rejects.toThrow('Service not found or access denied')
    })

    it('should allow updating service from same tenant', async () => {
      repo = new TenantRepository(mockDb, ['church1'])
      mockDb.service.findFirst.mockResolvedValue({ 
        id: 'service1', 
        localChurchId: 'church1' 
      })
      mockDb.service.update.mockResolvedValue({ id: 'service1' })
      
      const result = await repo.updateService('service1', { date: new Date() })
      
      expect(result).toEqual({ id: 'service1' })
      expect(mockDb.service.update).toHaveBeenCalled()
    })
  })

  describe('LifeGroup operations', () => {
    it('should filter life groups by localChurchId', async () => {
      repo = new TenantRepository(mockDb, ['church1'])
      
      await repo.findLifeGroups({ isActive: true })
      
      expect(mockDb.lifeGroup.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          localChurchId: { in: ['church1'] }
        }
      })
    })

    it('should prevent creating life group for different tenant', async () => {
      repo = new TenantRepository(mockDb, ['church1'])
      
      await expect(
        repo.createLifeGroup({ 
          localChurchId: 'church2', 
          name: 'Youth Group' 
        })
      ).rejects.toThrow('Cannot create life group for different tenant')
    })

    it('should allow deleting life group from same tenant', async () => {
      repo = new TenantRepository(mockDb, ['church1'])
      mockDb.lifeGroup.findFirst.mockResolvedValue({ 
        id: 'lg1', 
        localChurchId: 'church1' 
      })
      mockDb.lifeGroup.delete.mockResolvedValue({ id: 'lg1' })
      
      const result = await repo.deleteLifeGroup('lg1')
      
      expect(result).toEqual({ id: 'lg1' })
      expect(mockDb.lifeGroup.delete).toHaveBeenCalled()
    })
  })

  describe('Event operations', () => {
    it('should show WHOLE_CHURCH events to all users', async () => {
      repo = new TenantRepository(mockDb, ['church1'])
      
      await repo.findEvents()
      
      expect(mockDb.event.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { scope: 'WHOLE_CHURCH' },
            {
              scope: 'LOCAL_CHURCH',
              localChurchId: { in: ['church1'] }
            }
          ]
        }
      })
    })

    it('should filter LOCAL_CHURCH events by tenant', async () => {
      repo = new TenantRepository(mockDb, ['church1', 'church2'])
      
      await repo.findEvents({ isActive: true })
      
      expect(mockDb.event.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          OR: [
            { scope: 'WHOLE_CHURCH' },
            {
              scope: 'LOCAL_CHURCH',
              localChurchId: { in: ['church1', 'church2'] }
            }
          ]
        }
      })
    })

    it('should prevent creating LOCAL_CHURCH event for different tenant', async () => {
      repo = new TenantRepository(mockDb, ['church1'])
      
      await expect(
        repo.createEvent({ 
          scope: 'LOCAL_CHURCH',
          localChurchId: 'church2', 
          name: 'Youth Camp' 
        })
      ).rejects.toThrow('Cannot create event for different tenant')
    })

    it('should allow creating WHOLE_CHURCH event', async () => {
      repo = new TenantRepository(mockDb, ['church1'])
      mockDb.event.create.mockResolvedValue({ id: 'event1' })
      
      const result = await repo.createEvent({ 
        scope: 'WHOLE_CHURCH',
        name: 'Annual Conference' 
      })
      
      expect(result).toEqual({ id: 'event1' })
      expect(mockDb.event.create).toHaveBeenCalled()
    })
  })

  describe('Membership operations', () => {
    it('should filter memberships by localChurchId', async () => {
      repo = new TenantRepository(mockDb, ['church1', 'church2'])
      
      await repo.findMemberships({ role: 'MEMBER' })
      
      expect(mockDb.membership.findMany).toHaveBeenCalledWith({
        where: {
          role: 'MEMBER',
          localChurchId: { in: ['church1', 'church2'] }
        }
      })
    })

    it('should prevent creating membership for different tenant', async () => {
      repo = new TenantRepository(mockDb, ['church1'])
      
      await expect(
        repo.createMembership({ 
          localChurchId: 'church2',
          userId: 'user1',
          role: 'MEMBER'
        })
      ).rejects.toThrow('Cannot create membership for different tenant')
    })

    it('should allow updating membership from same tenant', async () => {
      repo = new TenantRepository(mockDb, ['church1'])
      mockDb.membership.findFirst.mockResolvedValue({ 
        id: 'mem1', 
        localChurchId: 'church1' 
      })
      mockDb.membership.update.mockResolvedValue({ id: 'mem1' })
      
      const result = await repo.updateMembership('mem1', { role: 'LEADER' })
      
      expect(result).toEqual({ id: 'mem1' })
      expect(mockDb.membership.update).toHaveBeenCalled()
    })
  })

  describe('Empty tenant list', () => {
    it('should return empty results when user has no local church access', async () => {
      repo = new TenantRepository(mockDb, [])
      
      await repo.findServices()
      
      expect(mockDb.service.findMany).toHaveBeenCalledWith({
        where: {
          localChurchId: 'no-access'
        }
      })
    })
  })
})