import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  listMembers, 
  createMember, 
  updateMember, 
  deactivateMember,
  resetPassword,
  getLocalChurches
} from './actions'
import { UserRole, BelieverStatus } from '@prisma/client'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn()
}))

vi.mock('@/app/lib/db', () => ({
  db: {
    localChurch: {
      findMany: vi.fn()
    }
  }
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn()
    },
    membership: {
      create: vi.fn(),
      updateMany: vi.fn()
    },
    localChurch: {
      findMany: vi.fn()
    }
  }
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
// Removed duplicate db import - using prisma from @/lib/prisma

describe('Member Management Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listMembers', () => {
    it('should list members for admin user', async () => {
      const mockSession = { 
        user: { 
          id: 'admin1', 
          role: UserRole.ADMIN, 
          tenantId: 'church1' 
        } 
      }
      const mockMembers = [
        {
          id: 'member1',
          name: 'John Doe',
          email: 'john@test.com',
          role: UserRole.MEMBER,
          tenantId: 'church1',
          isNewBeliever: false,
          joinedAt: new Date(),
          createdAt: new Date(),
          memberships: []
        }
      ]

      vi.mocked(auth).mockResolvedValue(mockSession as any)
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockMembers as any)

      const result = await listMembers()

      expect(result.success).toBe(true)
      expect(result.data?.items).toEqual(mockMembers)
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 'church1' }
        })
      )
    })

    it('should allow super admin to list all members', async () => {
      const mockSession = { 
        user: { 
          id: 'super1', 
          role: UserRole.SUPER_ADMIN,
          tenantId: 'church1' // Super admin still needs a tenantId for scoping
        } 
      }

      // Mock the database call for getAllChurches
      const mockChurches = [
        { 
          id: 'church1',
          name: 'Manila Church',
          email: null,
          phone: null,
          address: null,
          city: null,
          zipCode: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          state: null,
          country: null,
          churchId: 'parent-church'
        },
        { 
          id: 'church2',
          name: 'Cebu Church',
          email: null,
          phone: null,
          address: null,
          city: null,
          zipCode: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          state: null,
          country: null,
          churchId: 'parent-church'
        }
      ]
      vi.mocked(prisma.localChurch.findMany).mockResolvedValue(mockChurches as any)

      vi.mocked(auth).mockResolvedValue(mockSession as any)
      vi.mocked(prisma.user.findMany).mockResolvedValue([])

      await listMembers()

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: { in: ['church1', 'church2'] } }
        })
      )
    })

    it('should filter by search term', async () => {
      const mockSession = { 
        user: { 
          id: 'admin1', 
          role: UserRole.ADMIN, 
          tenantId: 'church1' 
        } 
      }

      vi.mocked(auth).mockResolvedValue(mockSession as any)
      vi.mocked(prisma.user.findMany).mockResolvedValue([])

      await listMembers({ search: 'john' })

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId: 'church1',
            OR: [
              { name: { contains: 'john', mode: 'insensitive' } },
              { email: { contains: 'john', mode: 'insensitive' } }
            ]
          }
        })
      )
    })

    it('should reject unauthorized users', async () => {
      const mockSession = { 
        user: { 
          id: 'member1', 
          role: UserRole.MEMBER 
        } 
      }

      vi.mocked(auth).mockResolvedValue(mockSession as any)

      const result = await listMembers()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })
  })

  describe('createMember', () => {
    it('should create a new member', async () => {
      const mockSession = { 
        user: { 
          id: 'admin1', 
          role: UserRole.ADMIN, 
          tenantId: 'church1' 
        } 
      }
      const newMemberData = {
        name: 'Jane Doe',
        email: 'jane@test.com',
        role: UserRole.MEMBER,
        tenantId: 'church1',
      }

      vi.mocked(auth).mockResolvedValue(mockSession as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.create).mockResolvedValue({ 
        id: 'newmember1',
        ...newMemberData 
      } as any)

      const result = await createMember(newMemberData)

      expect(result.success).toBe(true)
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Jane Doe',
          email: 'jane@test.com',
          role: UserRole.MEMBER,
          tenantId: 'church1'
        })
      })
      expect(prisma.membership.create).toHaveBeenCalled()
    })

    it('should prevent duplicate emails', async () => {
      const mockSession = { 
        user: { 
          id: 'admin1', 
          role: UserRole.ADMIN, 
          tenantId: 'church1' 
        } 
      }

      vi.mocked(auth).mockResolvedValue(mockSession as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ 
        id: 'existing1' 
      } as any)

      const result = await createMember({
        name: 'Jane Doe',
        email: 'existing@test.com',
        role: UserRole.MEMBER,
        tenantId: 'church1',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('This email address is already registered')
    })

    it('should prevent cross-church creation for non-super admins', async () => {
      const mockSession = { 
        user: { 
          id: 'admin1', 
          role: UserRole.ADMIN, 
          tenantId: 'church1' 
        } 
      }

      vi.mocked(auth).mockResolvedValue(mockSession as any)

      const result = await createMember({
        name: 'Jane Doe',
        email: 'jane@test.com',
        role: UserRole.MEMBER,
        tenantId: 'church2',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot create member for another church')
    })
  })

  describe('updateMember', () => {
    it('should update member details', async () => {
      const mockSession = { 
        user: { 
          id: 'admin1', 
          role: UserRole.ADMIN, 
          tenantId: 'church1' 
        } 
      }
      const existingMember = {
        id: 'member1',
        email: 'old@test.com',
        tenantId: 'church1'
      }

      vi.mocked(auth).mockResolvedValue(mockSession as any)
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(existingMember as any) // First call for finding member
        .mockResolvedValueOnce(null) // Second call for checking email uniqueness
      vi.mocked(prisma.user.update).mockResolvedValue({ 
        id: 'member1',
        name: 'Updated Name' 
      } as any)

      const result = await updateMember({
        id: 'member1',
        name: 'Updated Name',
        email: 'new@test.com',
        role: UserRole.LEADER,
        memberStatus: 'ACTIVE'
      })

      expect(result.success).toBe(true)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'member1' },
        data: expect.objectContaining({
          name: 'Updated Name',
          email: 'new@test.com',
          role: UserRole.LEADER
        })
      })
    })

    it('should prevent email conflicts on update', async () => {
      const mockSession = { 
        user: { 
          id: 'admin1', 
          role: UserRole.ADMIN, 
          tenantId: 'church1' 
        } 
      }

      vi.mocked(auth).mockResolvedValue(mockSession as any)
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({ 
          id: 'member1', 
          email: 'old@test.com', 
          tenantId: 'church1' 
        } as any)
        .mockResolvedValueOnce({ 
          id: 'member2', 
          email: 'taken@test.com' 
        } as any)

      const result = await updateMember({
        id: 'member1',
        name: 'John',
        email: 'taken@test.com',
        role: UserRole.MEMBER,
        memberStatus: 'ACTIVE'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email already in use')
    })
  })

  describe('deactivateMember', () => {
    it('should deactivate an active member', async () => {
      const mockSession = { 
        user: { 
          id: 'admin1', 
          role: UserRole.ADMIN, 
          tenantId: 'church1' 
        } 
      }

      vi.mocked(auth).mockResolvedValue(mockSession as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ 
        id: 'member1',
        tenantId: 'church1',
        memberships: []
      } as any)
      vi.mocked(prisma.user.update).mockResolvedValue({ 
        id: 'member1',
        emailVerified: null
      } as any)

      const result = await deactivateMember('member1')

      expect(result.success).toBe(true)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'member1' },
        data: { memberStatus: 'INACTIVE' }
      })
    })
  })

  describe('resetPassword', () => {
    it('should reset a member password', async () => {
      const mockSession = { 
        user: { 
          id: 'admin1', 
          role: UserRole.ADMIN, 
          tenantId: 'church1' 
        } 
      }

      vi.mocked(auth).mockResolvedValue(mockSession as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ 
        id: 'member1',
        tenantId: 'church1'
      } as any)
      vi.mocked(prisma.user.update).mockResolvedValue({ 
        id: 'member1',
        mustChangePassword: true
      } as any)

      const result = await resetPassword('member1')

      expect(result.success).toBe(true)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'member1' },
        data: expect.objectContaining({
          mustChangePassword: true
        })
      })
    })
  })

  describe('getLocalChurches', () => {
    it('should get local churches for the tenant', async () => {
      const mockSession = { 
        user: { 
          id: 'admin1', 
          role: UserRole.ADMIN, 
          tenantId: 'church1' 
        } 
      }
      const mockChurches = [
        {
          id: 'local1',
          name: 'HPCI Manila',
          churchId: 'church1'
        }
      ]

      vi.mocked(auth).mockResolvedValue(mockSession as any)
      vi.mocked(prisma.localChurch.findMany).mockResolvedValue(mockChurches as any)

      const result = await getLocalChurches()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockChurches)
      expect(prisma.localChurch.findMany).toHaveBeenCalledWith({
        where: { id: 'church1' },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      })
      expect(result.data).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'HPCI Manila' })
      ]))
    })
  })

  describe('getLocalChurches', () => {
    it('should get churches for admin user', async () => {
      const mockSession = { 
        user: { 
          id: 'admin1', 
          role: UserRole.ADMIN, 
          tenantId: 'church1' 
        } 
      }
      const mockChurches = [
        { id: 'church1', name: 'HPCI Manila' }
      ]

      vi.mocked(auth).mockResolvedValue(mockSession as any)
      vi.mocked(prisma.localChurch.findMany).mockResolvedValue(mockChurches as any)

      const result = await getLocalChurches()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockChurches)
      expect(prisma.localChurch.findMany).toHaveBeenCalledWith({
        where: { id: 'church1' },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      })
    })

    it('should get all churches for super admin', async () => {
      const mockSession = { 
        user: { 
          id: 'super1', 
          role: UserRole.SUPER_ADMIN 
        } 
      }

      vi.mocked(auth).mockResolvedValue(mockSession as any)
      vi.mocked(prisma.localChurch.findMany).mockResolvedValue([])

      await getLocalChurches()

      expect(prisma.localChurch.findMany).toHaveBeenCalledWith({
        where: {},
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      })
    })
  })
})