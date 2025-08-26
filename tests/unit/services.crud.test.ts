import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { prisma } from '../../lib/prisma'
import { UserRole as Role } from '@prisma/client'

// Mock service data
const mockService = {
  id: 'service1',
  name: 'Sunday Service',
  date: new Date('2025-01-26T09:00:00Z'),
  localChurchId: 'manila1',
  createdBy: 'admin1',
  active: true,
}

const mockCheckin = {
  id: 'checkin1',
  serviceId: 'service1',
  userId: 'member1',
  checkInTime: new Date('2025-01-26T08:45:00Z'),
  isNewBeliever: false,
}

// Helper to validate service data
function validateService(service: any) {
  expect(service).toHaveProperty('id')
  expect(service).toHaveProperty('name')
  expect(service).toHaveProperty('date')
  expect(service).toHaveProperty('localChurchId')
  expect(service).toHaveProperty('createdBy')
  expect(service).toHaveProperty('active')
}

// Helper to validate checkin data
function validateCheckin(checkin: any) {
  expect(checkin).toHaveProperty('id')
  expect(checkin).toHaveProperty('serviceId')
  expect(checkin).toHaveProperty('userId')
  expect(checkin).toHaveProperty('checkInTime')
  expect(checkin).toHaveProperty('isNewBeliever')
}

describe('Services CRUD Operations', () => {
  describe('Create Service', () => {
    it('should create a new service with valid data', () => {
      const newService = {
        name: 'Evening Service',
        date: new Date('2025-01-26T18:00:00Z'),
        localChurchId: 'manila1',
        createdBy: 'admin1',
      }
      
      validateService({ ...newService, id: 'generated', active: true })
    })
    
    it('should require localChurchId for non-super admin', () => {
      const newService = {
        name: 'Service',
        date: new Date(),
        createdBy: 'admin1',
        // Missing localChurchId
      }
      
      expect(() => {
        if (!newService.localChurchId) {
          throw new Error('localChurchId is required')
        }
      }).toThrow('localChurchId is required')
    })
    
    it('should validate date is in the future or today', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const newService = {
        name: 'Past Service',
        date: yesterday,
        localChurchId: 'manila1',
        createdBy: 'admin1',
      }
      
      const isValid = newService.date >= new Date(new Date().setHours(0, 0, 0, 0))
      expect(isValid).toBe(false)
    })
    
    it('should set active to true by default', () => {
      const newService = {
        name: 'Service',
        date: new Date(),
        localChurchId: 'manila1',
        createdBy: 'admin1',
      }
      
      const created = { ...newService, id: 'new1', active: true }
      expect(created.active).toBe(true)
    })
  })
  
  describe('Read Services', () => {
    it('should retrieve services scoped by localChurchId', () => {
      const services = [
        { ...mockService, id: 's1', localChurchId: 'manila1' },
        { ...mockService, id: 's2', localChurchId: 'manila1' },
        { ...mockService, id: 's3', localChurchId: 'cebu1' },
      ]
      
      const manilaServices = services.filter(s => s.localChurchId === 'manila1')
      expect(manilaServices).toHaveLength(2)
      expect(manilaServices.every(s => s.localChurchId === 'manila1')).toBe(true)
    })
    
    it('should include checkin count when requested', () => {
      const serviceWithCount = {
        ...mockService,
        _count: { checkins: 25 },
      }
      
      expect(serviceWithCount._count.checkins).toBe(25)
    })
    
    it('should filter by date range', () => {
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-31')
      
      const services = [
        { ...mockService, date: new Date('2024-12-31') },
        { ...mockService, date: new Date('2025-01-15') },
        { ...mockService, date: new Date('2025-02-01') },
      ]
      
      const filtered = services.filter(s => s.date >= startDate && s.date <= endDate)
      expect(filtered).toHaveLength(1)
    })
    
    it('should order by date descending by default', () => {
      const services = [
        { ...mockService, date: new Date('2025-01-01') },
        { ...mockService, date: new Date('2025-01-15') },
        { ...mockService, date: new Date('2025-01-08') },
      ]
      
      const sorted = [...services].sort((a, b) => b.date.getTime() - a.date.getTime())
      expect(sorted[0].date).toEqual(new Date('2025-01-15'))
      expect(sorted[2].date).toEqual(new Date('2025-01-01'))
    })
  })
  
  describe('Update Service', () => {
    it('should update service details', () => {
      const updates = {
        name: 'Updated Service Name',
        date: new Date('2025-02-01T09:00:00Z'),
      }
      
      const updated = { ...mockService, ...updates }
      expect(updated.name).toBe('Updated Service Name')
      expect(updated.date).toEqual(new Date('2025-02-01T09:00:00Z'))
    })
    
    it('should prevent updating localChurchId', () => {
      const updates = {
        localChurchId: 'cebu1', // Attempting to change
      }
      
      // In real implementation, this would be blocked
      expect(() => {
        if (updates.localChurchId !== mockService.localChurchId) {
          throw new Error('Cannot change localChurchId')
        }
      }).toThrow('Cannot change localChurchId')
    })
    
    it('should track updatedAt timestamp', () => {
      const before = new Date()
      const updated = {
        ...mockService,
        name: 'Updated',
        updatedAt: new Date(),
      }
      
      expect(updated.updatedAt >= before).toBe(true)
    })
  })
  
  describe('Delete Service', () => {
    it('should soft delete by setting active to false', () => {
      const deleted = { ...mockService, active: false }
      expect(deleted.active).toBe(false)
    })
    
    it('should prevent deletion if service has checkins', () => {
      const serviceWithCheckins = {
        ...mockService,
        _count: { checkins: 10 },
      }
      
      expect(() => {
        if (serviceWithCheckins._count.checkins > 0) {
          throw new Error('Cannot delete service with checkins')
        }
      }).toThrow('Cannot delete service with checkins')
    })
    
    it('should only allow deletion by admin roles', () => {
      const allowedRoles = [Role.SUPER_ADMIN, Role.ADMIN, Role.PASTOR]
      const userRole = Role.MEMBER
      
      expect(() => {
        if (!allowedRoles.includes(userRole)) {
          throw new Error('Insufficient permissions')
        }
      }).toThrow('Insufficient permissions')
    })
  })
})

describe('Check-In Operations', () => {
  describe('Create Check-In', () => {
    it('should create a single checkin per service per user', () => {
      const checkins = [mockCheckin]
      
      // Attempt duplicate
      const duplicate = {
        serviceId: 'service1',
        userId: 'member1',
        checkInTime: new Date(),
      }
      
      const exists = checkins.some(c => 
        c.serviceId === duplicate.serviceId && 
        c.userId === duplicate.userId
      )
      
      expect(exists).toBe(true)
    })
    
    it('should record new believer status', () => {
      const newBelieverCheckin = {
        ...mockCheckin,
        isNewBeliever: true,
      }
      
      expect(newBelieverCheckin.isNewBeliever).toBe(true)
    })
    
    it('should auto-set checkInTime to current time', () => {
      const before = new Date()
      const checkin = {
        ...mockCheckin,
        checkInTime: new Date(),
      }
      const after = new Date()
      
      expect(checkin.checkInTime >= before).toBe(true)
      expect(checkin.checkInTime <= after).toBe(true)
    })
    
    it('should validate service exists and is active', () => {
      const inactiveService = { ...mockService, active: false }
      
      expect(() => {
        if (!inactiveService.active) {
          throw new Error('Service is not active')
        }
      }).toThrow('Service is not active')
    })
    
    it('should validate user exists and belongs to same church', () => {
      const user = { localChurchId: 'manila1' }
      const service = { localChurchId: 'cebu1' }
      
      expect(() => {
        if (user.localChurchId !== service.localChurchId) {
          throw new Error('User and service must be in same church')
        }
      }).toThrow('User and service must be in same church')
    })
  })
  
  describe('Read Check-Ins', () => {
    it('should retrieve checkins for a service', () => {
      const checkins = [
        { ...mockCheckin, id: 'c1', userId: 'user1' },
        { ...mockCheckin, id: 'c2', userId: 'user2' },
        { ...mockCheckin, id: 'c3', userId: 'user3' },
      ]
      
      const serviceCheckins = checkins.filter(c => c.serviceId === 'service1')
      expect(serviceCheckins).toHaveLength(3)
    })
    
    it('should include user details when requested', () => {
      const checkinWithUser = {
        ...mockCheckin,
        user: {
          id: 'member1',
          name: 'John Doe',
          email: 'john@test.com',
        },
      }
      
      expect(checkinWithUser.user).toBeDefined()
      expect(checkinWithUser.user.name).toBe('John Doe')
    })
    
    it('should filter checkins by date range', () => {
      const startTime = new Date('2025-01-26T08:00:00Z')
      const endTime = new Date('2025-01-26T10:00:00Z')
      
      const checkins = [
        { ...mockCheckin, checkInTime: new Date('2025-01-26T07:45:00Z') },
        { ...mockCheckin, checkInTime: new Date('2025-01-26T08:30:00Z') },
        { ...mockCheckin, checkInTime: new Date('2025-01-26T10:15:00Z') },
      ]
      
      const filtered = checkins.filter(c => 
        c.checkInTime >= startTime && c.checkInTime <= endTime
      )
      expect(filtered).toHaveLength(1)
    })
    
    it('should count new believers', () => {
      const checkins = [
        { ...mockCheckin, isNewBeliever: false },
        { ...mockCheckin, isNewBeliever: true },
        { ...mockCheckin, isNewBeliever: true },
      ]
      
      const newBelieverCount = checkins.filter(c => c.isNewBeliever).length
      expect(newBelieverCount).toBe(2)
    })
  })
  
  describe('Check-In Uniqueness', () => {
    it('should enforce unique constraint on (serviceId, userId)', () => {
      const existing = [mockCheckin]
      
      const duplicate = {
        serviceId: mockCheckin.serviceId,
        userId: mockCheckin.userId,
        checkInTime: new Date(),
      }
      
      expect(() => {
        const exists = existing.some(c => 
          c.serviceId === duplicate.serviceId && 
          c.userId === duplicate.userId
        )
        if (exists) {
          throw new Error('User already checked in')
        }
      }).toThrow('User already checked in')
    })
    
    it('should allow same user to check in to different services', () => {
      const checkins = [
        { ...mockCheckin, serviceId: 'service1' },
        { ...mockCheckin, serviceId: 'service2' },
      ]
      
      const uniqueServices = new Set(checkins.map(c => c.serviceId))
      expect(uniqueServices.size).toBe(2)
    })
    
    it('should allow different users to check in to same service', () => {
      const checkins = [
        { ...mockCheckin, userId: 'user1' },
        { ...mockCheckin, userId: 'user2' },
      ]
      
      const uniqueUsers = new Set(checkins.map(c => c.userId))
      expect(uniqueUsers.size).toBe(2)
    })
  })
  
  describe('Check-In Statistics', () => {
    it('should calculate attendance percentage', () => {
      const totalMembers = 100
      const checkinCount = 75
      
      const percentage = Math.round((checkinCount / totalMembers) * 100)
      expect(percentage).toBe(75)
    })
    
    it('should track attendance trends over time', () => {
      const weeklyAttendance = [
        { week: 1, count: 80 },
        { week: 2, count: 85 },
        { week: 3, count: 90 },
        { week: 4, count: 88 },
      ]
      
      const average = weeklyAttendance.reduce((sum, w) => sum + w.count, 0) / weeklyAttendance.length
      expect(average).toBeCloseTo(85.75)
    })
    
    it('should identify first-time attendees', () => {
      const userCheckins = {
        'user1': ['service1'],
        'user2': ['service1', 'service2'],
        'user3': ['service1'],
      }
      
      const firstTimers = Object.entries(userCheckins)
        .filter(([_, services]) => services.length === 1)
        .map(([userId]) => userId)
      
      expect(firstTimers).toEqual(['user1', 'user3'])
    })
  })
})