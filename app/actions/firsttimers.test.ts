import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  getFirstTimers, 
  createFirstTimer, 
  updateFirstTimer, 
  deleteFirstTimer,
  getVipTeamMembers,
  markBelieverInactive 
} from './firsttimers'
import { UserRole, PathwayType, EnrollmentStatus, BelieverStatus } from '@prisma/client'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn()
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn()
    },
    firstTimer: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    pathway: {
      findFirst: vi.fn()
    },
    pathwayEnrollment: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    membership: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    $transaction: vi.fn()
  }
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

describe('FirstTimer Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getFirstTimers', () => {
    it('should throw error if user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)
      
      await expect(getFirstTimers()).rejects.toThrow('Unauthorized')
    })

    it('should throw error if user does not have VIP access', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' }
      } as any)
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        role: UserRole.MEMBER,
        tenantId: 'tenant-1'
      } as any)
      
      await expect(getFirstTimers()).rejects.toThrow('Access denied. VIP role or higher required.')
    })

    it('should return first timers for VIP user', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'vip-1', email: 'vip@example.com' }
      } as any)
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'vip-1',
        role: UserRole.VIP,
        tenantId: 'tenant-1'
      } as any)
      
      const mockFirstTimers = [
        {
          id: 'ft-1',
          memberId: 'member-1',
          gospelShared: false,
          rootsCompleted: false,
          member: {
            id: 'member-1',
            name: 'John Doe',
            email: 'john@example.com',
            tenantId: 'tenant-1'
          }
        }
      ]
      
      vi.mocked(prisma.firstTimer.findMany).mockResolvedValue(mockFirstTimers as any)
      
      const result = await getFirstTimers()
      
      expect(result).toEqual(mockFirstTimers)
      expect(prisma.firstTimer.findMany).toHaveBeenCalledWith({
        where: { member: { tenantId: 'tenant-1' } },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should return all first timers for SUPER_ADMIN', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'admin-1', email: 'admin@example.com' }
      } as any)
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'admin-1',
        role: UserRole.SUPER_ADMIN,
        tenantId: null
      } as any)
      
      vi.mocked(prisma.firstTimer.findMany).mockResolvedValue([])
      
      await getFirstTimers()
      
      expect(prisma.firstTimer.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      })
    })
  })

  describe('createFirstTimer', () => {
    it('should create a new first timer and auto-enroll in ROOTS', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'vip-1', email: 'vip@example.com' }
      } as any)
      
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({
          id: 'vip-1',
          role: UserRole.VIP,
          tenantId: 'tenant-1'
        } as any)
        .mockResolvedValueOnce(null) // No existing user with email
      
      const mockFirstTimer = {
        id: 'ft-1',
        memberId: 'member-1',
        member: { id: 'member-1', name: 'John Doe' },
        assignedVip: null
      }
      
      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        const tx = {
          user: {
            create: vi.fn().mockResolvedValue({ id: 'member-1', name: 'John Doe' })
          },
          firstTimer: {
            create: vi.fn().mockResolvedValue(mockFirstTimer)
          },
          pathway: {
            findFirst: vi.fn().mockResolvedValue({ id: 'pathway-1' })
          },
          pathwayEnrollment: {
            create: vi.fn().mockResolvedValue({ id: 'enrollment-1' })
          }
        }
        return fn(tx)
      })
      
      const result = await createFirstTimer({
        name: 'John Doe',
        email: 'john@example.com',
        phone: undefined,
        assignedVipId: undefined,
        notes: undefined
      })
      
      expect(result).toEqual(mockFirstTimer)
    })

    it('should throw error if email already exists', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'vip-1', email: 'vip@example.com' }
      } as any)
      
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({
          id: 'vip-1',
          role: UserRole.VIP,
          tenantId: 'tenant-1'
        } as any)
        .mockResolvedValueOnce({
          id: 'existing-user',
          email: 'john@example.com'
        } as any)
      
      await expect(createFirstTimer({
        name: 'John Doe',
        email: 'john@example.com',
        phone: undefined,
        assignedVipId: undefined,
        notes: undefined
      })).rejects.toThrow('A user with this email already exists')
    })
  })

  describe('updateFirstTimer', () => {
    it('should update first timer status', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'vip-1', email: 'vip@example.com' }
      } as any)
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'vip-1',
        role: UserRole.VIP,
        tenantId: 'tenant-1'
      } as any)
      
      vi.mocked(prisma.firstTimer.findUnique).mockResolvedValue({
        id: 'ft-1',
        memberId: 'member-1',
        member: { tenantId: 'tenant-1' }
      } as any)
      
      const mockUpdated = {
        id: 'ft-1',
        gospelShared: true,
        member: { id: 'member-1' },
        assignedVip: null
      }
      
      vi.mocked(prisma.firstTimer.update).mockResolvedValue(mockUpdated as any)
      
      const result = await updateFirstTimer('ft-1', { gospelShared: true })
      
      expect(result).toEqual(mockUpdated)
      expect(prisma.firstTimer.update).toHaveBeenCalledWith({
        where: { id: 'ft-1' },
        data: { gospelShared: true },
        include: expect.any(Object)
      })
    })

    it('should update pathway enrollment when ROOTS is marked complete', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'vip-1', email: 'vip@example.com' }
      } as any)
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'vip-1',
        role: UserRole.VIP,
        tenantId: 'tenant-1'
      } as any)
      
      vi.mocked(prisma.firstTimer.findUnique).mockResolvedValue({
        id: 'ft-1',
        memberId: 'member-1',
        member: { tenantId: 'tenant-1' }
      } as any)
      
      vi.mocked(prisma.firstTimer.update).mockResolvedValue({
        id: 'ft-1',
        rootsCompleted: true
      } as any)
      
      vi.mocked(prisma.pathwayEnrollment.findFirst).mockResolvedValue({
        id: 'enrollment-1',
        status: EnrollmentStatus.ENROLLED
      } as any)
      
      vi.mocked(prisma.pathwayEnrollment.update).mockResolvedValue({
        id: 'enrollment-1',
        status: EnrollmentStatus.COMPLETED
      } as any)
      
      await updateFirstTimer('ft-1', { rootsCompleted: true })
      
      expect(prisma.pathwayEnrollment.update).toHaveBeenCalledWith({
        where: { id: 'enrollment-1' },
        data: {
          status: EnrollmentStatus.COMPLETED,
          completedAt: expect.any(Date)
        }
      })
    })
  })

  describe('deleteFirstTimer', () => {
    it('should allow ADMIN to delete first timer', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'admin-1', email: 'admin@example.com' }
      } as any)
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'admin-1',
        role: UserRole.ADMIN,
        tenantId: 'tenant-1'
      } as any)
      
      vi.mocked(prisma.firstTimer.findUnique).mockResolvedValue({
        id: 'ft-1',
        member: { tenantId: 'tenant-1' }
      } as any)
      
      vi.mocked(prisma.firstTimer.delete).mockResolvedValue({ id: 'ft-1' } as any)
      
      const result = await deleteFirstTimer('ft-1')
      
      expect(result).toEqual({ success: true })
      expect(prisma.firstTimer.delete).toHaveBeenCalledWith({
        where: { id: 'ft-1' }
      })
    })

    it('should not allow VIP to delete first timer', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'vip-1', email: 'vip@example.com' }
      } as any)
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'vip-1',
        role: UserRole.VIP,
        tenantId: 'tenant-1'
      } as any)
      
      await expect(deleteFirstTimer('ft-1')).rejects.toThrow('Access denied. Admin role required.')
    })
  })

  describe('getVipTeamMembers', () => {
    it('should return VIP team members for the tenant', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'vip-1', email: 'vip@example.com' }
      } as any)
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'vip-1',
        role: UserRole.VIP,
        tenantId: 'tenant-1'
      } as any)
      
      const mockVipMembers = [
        { id: 'vip-1', name: 'VIP User', email: 'vip@example.com', role: UserRole.VIP },
        { id: 'admin-1', name: 'Admin User', email: 'admin@example.com', role: UserRole.ADMIN }
      ]
      
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockVipMembers as any)
      
      const result = await getVipTeamMembers()
      
      expect(result).toEqual(mockVipMembers)
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          role: { in: [UserRole.VIP, UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN] },
          tenantId: 'tenant-1'
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        },
        orderBy: { name: 'asc' }
      })
    })
  })

  describe('markBelieverInactive', () => {
    it('should mark a believer as inactive', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'vip-1', email: 'vip@example.com' }
      } as any)
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'vip-1',
        role: UserRole.VIP,
        tenantId: 'tenant-1'
      } as any)
      
      vi.mocked(prisma.membership.findUnique).mockResolvedValue({
        id: 'membership-1',
        user: { tenantId: 'tenant-1' },
        localChurch: {}
      } as any)
      
      const mockUpdated = {
        id: 'membership-1',
        believerStatus: BelieverStatus.INACTIVE,
        updatedAt: new Date()
      }
      
      vi.mocked(prisma.membership.update).mockResolvedValue(mockUpdated as any)
      
      const result = await markBelieverInactive('membership-1')
      
      expect(result).toEqual(mockUpdated)
      expect(prisma.membership.update).toHaveBeenCalledWith({
        where: { id: 'membership-1' },
        data: {
          believerStatus: BelieverStatus.INACTIVE,
          updatedAt: expect.any(Date)
        }
      })
    })

    it('should throw error if user does not have VIP access', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'member-1', email: 'member@example.com' }
      } as any)
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'member-1',
        role: UserRole.MEMBER,
        tenantId: 'tenant-1'
      } as any)
      
      await expect(markBelieverInactive('membership-1')).rejects.toThrow('Access denied. VIP role or higher required.')
    })

    it('should throw error if membership not found', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'vip-1', email: 'vip@example.com' }
      } as any)
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'vip-1',
        role: UserRole.VIP,
        tenantId: 'tenant-1'
      } as any)
      
      vi.mocked(prisma.membership.findUnique).mockResolvedValue(null)
      
      await expect(markBelieverInactive('membership-1')).rejects.toThrow('Membership not found')
    })

    it('should enforce tenant isolation', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'vip-1', email: 'vip@example.com' }
      } as any)
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'vip-1',
        role: UserRole.VIP,
        tenantId: 'tenant-1'
      } as any)
      
      vi.mocked(prisma.membership.findUnique).mockResolvedValue({
        id: 'membership-1',
        user: { tenantId: 'tenant-2' }, // Different tenant
        localChurch: {}
      } as any)
      
      await expect(markBelieverInactive('membership-1')).rejects.toThrow('Access denied')
    })
  })
})