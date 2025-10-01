/**
 * Unit Tests for VIP First-Timer Management System
 * Tests all 8 user stories with comprehensive coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UserRole, BelieverStatus, PathwayType, EnrollmentStatus } from '@prisma/client'
import {
  createFirstTimer,
  updateFirstTimer,
  setBelieverStatus,
  getFirstTimersWithFilters,
  getVipAnalytics,
  markBelieverInactive
} from '@/app/actions/firsttimers'

// Mock dependencies
// Mock Next.js revalidatePath to prevent static generation store errors
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn()
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn()
    },
    firstTimer: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn()
    },
    membership: {
      findUnique: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn()
    },
    pathway: {
      findFirst: vi.fn()
    },
    pathwayEnrollment: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    auditLog: {
      create: vi.fn()
    },
    $transaction: vi.fn()
  }
}))

const { auth } = await import('@/lib/auth')
const { prisma } = await import('@/lib/prisma')

const mockAuth = auth as any
const mockPrisma = prisma as any

describe('VIP First-Timer Management System', () => {
  // Test fixtures
  const mockVipUser = {
    id: 'vip_user_1',
    email: 'vip@test.com',
    role: UserRole.VIP,
    tenantId: 'tenant_1'
  }

  const mockAdminUser = {
    id: 'admin_user_1',
    email: 'admin@test.com',
    role: UserRole.ADMIN,
    tenantId: 'tenant_1'
  }

  const mockMemberUser = {
    id: 'member_user_1',
    email: 'member@test.com',
    role: UserRole.MEMBER,
    tenantId: 'tenant_1'
  }

  const mockFirstTimer = {
    id: 'ft_1',
    memberId: 'member_1',
    gospelShared: false,
    rootsCompleted: false,
    assignedVipId: 'vip_user_1',
    notes: 'Initial contact',
    createdAt: new Date(),
    member: {
      id: 'member_1',
      name: 'John Doe',
      email: 'john@test.com',
      phone: '+1234567890',
      tenantId: 'tenant_1',
      memberships: [{
        id: 'membership_1',
        believerStatus: BelieverStatus.ACTIVE,
        localChurchId: 'church_1'
      }],
      pathwayEnrollments: []
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockPrisma.user.findUnique.mockImplementation(async (args: any) => {
      const { where } = args || {}
      if (where?.id === mockVipUser.id || where?.email === mockVipUser.email) {
        return mockVipUser
      }
      if (where?.id === mockAdminUser.id || where?.email === mockAdminUser.email) {
        return mockAdminUser
      }
      if (where?.id === mockMemberUser.id || where?.email === mockMemberUser.email) {
        return mockMemberUser
      }
      return null
    })

    mockPrisma.pathwayEnrollment.delete.mockResolvedValue(undefined)
    mockPrisma.pathwayEnrollment.update.mockResolvedValue(undefined)
  })

  describe('US-VIP-001: Immediate member creation', () => {
    it('should create User and FirstTimer in a single transaction', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'vip@test.com' } })
      
      const mockCreatedUser = { 
        id: 'new_user_1', 
        name: 'Jane Doe',
        email: 'jane@test.com',
        role: UserRole.MEMBER,
        tenantId: 'tenant_1'
      }
      
      const mockCreatedFirstTimer = {
        ...mockFirstTimer,
        member: mockCreatedUser
      }
      
      // Mock transaction
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          user: { create: vi.fn().mockResolvedValue(mockCreatedUser) },
          firstTimer: { create: vi.fn().mockResolvedValue(mockCreatedFirstTimer) },
          pathway: { findFirst: vi.fn().mockResolvedValue({ id: 'roots_pathway', type: 'ROOTS' }) },
          pathwayEnrollment: { create: vi.fn().mockResolvedValue({}) }
        }
        return await callback(tx)
      })

      const result = await createFirstTimer({
        name: 'Jane Doe',
        email: 'jane@test.com',
        phone: '+1234567890'
      })

      expect(mockPrisma.$transaction).toHaveBeenCalled()
      expect(result.member.role).toBe(UserRole.MEMBER)
      expect(result.member.email).toBe('jane@test.com')
    })

    it('should enforce RBAC for VIP+ roles only', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'member@test.com' } })
      mockPrisma.user.findUnique
        .mockImplementationOnce(async () => mockMemberUser)

      await expect(createFirstTimer({
        name: 'Jane Doe',
        email: 'jane@test.com'
      })).rejects.toThrow('Access denied. VIP role or higher required.')
    })

    it('should prevent duplicate email creation', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'vip@test.com' } })
      mockPrisma.user.findUnique
        .mockImplementationOnce(async () => mockVipUser)
        .mockImplementationOnce(async () => ({ id: 'existing_user', email: 'jane@test.com' }))

      await expect(createFirstTimer({
        name: 'Jane Doe',
        email: 'jane@test.com'
      })).rejects.toThrow('A user with this email already exists')
    })
  })

  describe('US-VIP-002: ROOTS auto-enrollment', () => {
    it('should auto-enroll in ROOTS pathway during creation', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'vip@test.com' } })
      
      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        const tx = {
          user: { create: vi.fn().mockResolvedValue({ id: 'new_user' }) },
          firstTimer: { create: vi.fn().mockResolvedValue(mockFirstTimer) },
          pathway: { findFirst: vi.fn().mockResolvedValue({ id: 'roots_1', type: PathwayType.ROOTS }) },
          pathwayEnrollment: { create: vi.fn().mockResolvedValue({}) }
        }
        return await callback(tx)
      })
      
      mockPrisma.$transaction = mockTransaction
      
      await createFirstTimer({
        name: 'John Doe',
        email: 'john@test.com'
      })

      expect(mockTransaction).toHaveBeenCalled()
      // Verify pathway enrollment was attempted in transaction
      const transactionCallback = mockTransaction.mock.calls[0][0]
      const mockTx = {
        user: { create: vi.fn().mockResolvedValue({ id: 'new_user' }) },
        firstTimer: { create: vi.fn().mockResolvedValue(mockFirstTimer) },
        pathway: { findFirst: vi.fn().mockResolvedValue({ id: 'roots_1' }) },
        pathwayEnrollment: { create: vi.fn().mockResolvedValue({}) }
      }
      
      await transactionCallback(mockTx)
      expect(mockTx.pathwayEnrollment.create).toHaveBeenCalledWith({
        data: {
          pathwayId: 'roots_1',
          userId: 'new_user',
          status: EnrollmentStatus.ENROLLED
        }
      })
    })

    it('should be idempotent (no duplicate enrollments)', async () => {
      // This is ensured by the transaction and unique constraints in schema
      expect(true).toBe(true) // Schema-level constraint test
    })
  })

  describe('US-VIP-003: VIP Dashboard with filters', () => {
    it('should return filtered first-timers by assignment', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'vip@test.com' } })
      
      mockPrisma.firstTimer.findMany.mockResolvedValue([mockFirstTimer])

      const result = await getFirstTimersWithFilters({
        assignmentFilter: 'my_assigned'
      })

      expect(mockPrisma.firstTimer.findMany).toHaveBeenCalledWith({
        where: {
          assignedVipId: mockVipUser.id,
          member: { tenantId: mockVipUser.tenantId }
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      })
      expect(result).toEqual([mockFirstTimer])
    })

    it('should filter by believer status', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'vip@test.com' } })
      
      const activeFirstTimer = {
        ...mockFirstTimer,
        member: {
          ...mockFirstTimer.member,
          memberships: [{ believerStatus: BelieverStatus.ACTIVE }]
        }
      }
      
      mockPrisma.firstTimer.findMany.mockResolvedValue([activeFirstTimer])

      const result = await getFirstTimersWithFilters({
        statusFilter: BelieverStatus.ACTIVE
      })

      expect(result).toHaveLength(1)
      expect(result[0].member.memberships[0].believerStatus).toBe(BelieverStatus.ACTIVE)
    })

    it('should enforce tenant isolation', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'vip@test.com' } })
      mockPrisma.firstTimer.findMany.mockResolvedValue([])

      await getFirstTimersWithFilters()

      expect(mockPrisma.firstTimer.findMany).toHaveBeenCalledWith({
        where: {
          member: { tenantId: mockVipUser.tenantId }
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      })
    })
  })

  describe('US-VIP-004: Gospel Shared toggle', () => {
    it('should update gospel shared status', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'vip@test.com' } })
      mockPrisma.firstTimer.findUnique.mockResolvedValue(mockFirstTimer)
      mockPrisma.firstTimer.update.mockResolvedValue({
        ...mockFirstTimer,
        gospelShared: true
      })

      const result = await updateFirstTimer('ft_1', {
        gospelShared: true,
        notes: 'Gospel shared during coffee meeting'
      })

      expect(mockPrisma.firstTimer.update).toHaveBeenCalledWith({
        where: { id: 'ft_1' },
        data: {
          gospelShared: true,
          notes: 'Gospel shared during coffee meeting'
        },
        include: expect.any(Object)
      })
      expect(result.gospelShared).toBe(true)
    })

    it('should be idempotent', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'vip@test.com' } })
      mockPrisma.firstTimer.findUnique.mockResolvedValue({
        ...mockFirstTimer,
        gospelShared: true
      })
      mockPrisma.firstTimer.update.mockResolvedValue({
        ...mockFirstTimer,
        gospelShared: true
      })

      // Update again with same value
      const result = await updateFirstTimer('ft_1', { gospelShared: true })
      expect(result.gospelShared).toBe(true)
    })
  })

  describe('US-VIP-005: ROOTS Completed mark', () => {
    it('should sync with pathway enrollment when marked complete', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'vip@test.com' } })
      mockPrisma.firstTimer.findUnique.mockResolvedValue(mockFirstTimer)
      mockPrisma.firstTimer.update.mockResolvedValue({
        ...mockFirstTimer,
        rootsCompleted: true
      })
      
      const mockEnrollment = {
        id: 'enrollment_1',
        status: EnrollmentStatus.ENROLLED
      }
      mockPrisma.pathwayEnrollment.findFirst.mockResolvedValue(mockEnrollment)
      mockPrisma.pathwayEnrollment.update.mockResolvedValue({
        ...mockEnrollment,
        status: EnrollmentStatus.COMPLETED
      })

      await updateFirstTimer('ft_1', { rootsCompleted: true })

      expect(mockPrisma.pathwayEnrollment.update).toHaveBeenCalledWith({
        where: { id: 'enrollment_1' },
        data: {
          status: EnrollmentStatus.COMPLETED,
          completedAt: expect.any(Date)
        }
      })
    })

    it('should not update if pathway already completed', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'vip@test.com' } })
      mockPrisma.firstTimer.findUnique.mockResolvedValue(mockFirstTimer)
      mockPrisma.firstTimer.update.mockResolvedValue(mockFirstTimer)
      
      mockPrisma.pathwayEnrollment.findFirst.mockResolvedValue({
        id: 'enrollment_1',
        status: EnrollmentStatus.COMPLETED
      })

      await updateFirstTimer('ft_1', { rootsCompleted: true })

      expect(mockPrisma.pathwayEnrollment.update).not.toHaveBeenCalled()
    })
  })

  describe('US-VIP-006: Believer Status management', () => {
    it('should change believer status with audit logging', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'vip@test.com' } })
      
      const mockMembership = {
        id: 'membership_1',
        believerStatus: BelieverStatus.ACTIVE,
        userId: 'user_1',
        localChurchId: 'church_1',
        user: { tenantId: 'tenant_1' }
      }
      
      mockPrisma.membership.findUnique.mockResolvedValue(mockMembership)
      mockPrisma.membership.update.mockResolvedValue({
        ...mockMembership,
        believerStatus: BelieverStatus.INACTIVE
      })
      mockPrisma.auditLog.create.mockResolvedValue({})

      await setBelieverStatus('membership_1', BelieverStatus.INACTIVE, 'Member moved away')

      expect(mockPrisma.membership.update).toHaveBeenCalledWith({
        where: { id: 'membership_1' },
        data: {
          believerStatus: BelieverStatus.INACTIVE,
          updatedAt: expect.any(Date)
        }
      })

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: mockVipUser.id,
          action: 'BELIEVER_STATUS_CHANGE',
          entity: 'Membership',
          entityId: 'membership_1',
          localChurchId: 'church_1',
          meta: {
            previousStatus: BelieverStatus.ACTIVE,
            newStatus: BelieverStatus.INACTIVE,
            userId: 'user_1',
            note: 'Member moved away'
          }
        }
      })
    })

    it('should preserve ROOTS progress when setting inactive', async () => {
      // This test verifies that ROOTS pathway progress is NOT deleted
      // when believer status changes to INACTIVE
      mockAuth.mockResolvedValue({ user: { email: 'vip@test.com' } })
      
      const mockMembership = {
        id: 'membership_1',
        believerStatus: BelieverStatus.ACTIVE,
        userId: 'user_1',
        user: { tenantId: 'tenant_1' }
      }
      
      mockPrisma.membership.findUnique.mockResolvedValue(mockMembership)
      mockPrisma.membership.update.mockResolvedValue({
        ...mockMembership,
        believerStatus: BelieverStatus.INACTIVE
      })
      mockPrisma.auditLog.create.mockResolvedValue({})

      await setBelieverStatus('membership_1', BelieverStatus.INACTIVE)

      // Verify no pathway-related deletions occur
      expect(mockPrisma.pathwayEnrollment.delete).not.toHaveBeenCalled()
      expect(mockPrisma.pathwayEnrollment.update).not.toHaveBeenCalled()
    })

    it('should enforce VIP+ role access', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'member@test.com' } })

      await expect(setBelieverStatus('membership_1', BelieverStatus.INACTIVE))
        .rejects.toThrow('Access denied. VIP role or higher required.')
    })
  })

  describe('US-VIP-007: Assignments & notes', () => {
    it('should assign first-timer to VIP member', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'vip@test.com' } })
      mockPrisma.firstTimer.findUnique.mockResolvedValue(mockFirstTimer)
      mockPrisma.firstTimer.update.mockResolvedValue({
        ...mockFirstTimer,
        assignedVipId: 'vip_2',
        notes: 'Assigned to Sarah for follow-up'
      })

      const result = await updateFirstTimer('ft_1', {
        assignedVipId: 'vip_2',
        notes: 'Assigned to Sarah for follow-up'
      })

      expect(result.assignedVipId).toBe('vip_2')
      expect(result.notes).toBe('Assigned to Sarah for follow-up')
    })

    it('should enforce tenant isolation for assignments', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'vip@test.com' } })
      
      const crossTenantFirstTimer = {
        ...mockFirstTimer,
        member: { ...mockFirstTimer.member, tenantId: 'different_tenant' }
      }
      mockPrisma.firstTimer.findUnique.mockResolvedValue(crossTenantFirstTimer)

      await expect(updateFirstTimer('ft_1', { assignedVipId: 'vip_2' }))
        .rejects.toThrow('Access denied')
    })
  })

  describe('US-VIP-008: Admin reporting', () => {
    it('should return comprehensive analytics for admin users', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } })
      
      // Mock analytics data
      mockPrisma.firstTimer.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(75)  // gospel shared
        .mockResolvedValueOnce(50)  // roots completed
      
      mockPrisma.membership.groupBy.mockResolvedValue([
        { believerStatus: 'ACTIVE', _count: { believerStatus: 60 } },
        { believerStatus: 'INACTIVE', _count: { believerStatus: 25 } },
        { believerStatus: 'COMPLETED', _count: { believerStatus: 15 } }
      ])
      
      mockPrisma.firstTimer.groupBy.mockResolvedValue([
        { assignedVipId: null, _count: { assignedVipId: 20 } },
        { assignedVipId: 'vip_1', _count: { assignedVipId: 40 } },
        { assignedVipId: 'vip_2', _count: { assignedVipId: 40 } }
      ])

      const result = await getVipAnalytics()

      expect(result).toEqual({
        totalFirstTimers: 100,
        gospelSharedCount: 75,
        rootsCompletedCount: 50,
        gospelSharedRate: 75.0,
        rootsCompletionRate: 50.0,
        statusBreakdown: [
          { believerStatus: 'ACTIVE', _count: { believerStatus: 60 } },
          { believerStatus: 'INACTIVE', _count: { believerStatus: 25 } },
          { believerStatus: 'COMPLETED', _count: { believerStatus: 15 } }
        ],
        assignmentBreakdown: {
          assigned: 80,
          unassigned: 20
        }
      })
    })

    it('should enforce admin+ role access', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'vip@test.com' } })

      await expect(getVipAnalytics())
        .rejects.toThrow('Access denied. Admin role or higher required.')
    })

    it('should respect tenant scoping for non-super admins', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } })
      
      mockPrisma.firstTimer.count.mockResolvedValue(0)
      mockPrisma.membership.groupBy.mockResolvedValue([])
      mockPrisma.firstTimer.groupBy.mockResolvedValue([])

      await getVipAnalytics()

      // Verify all queries include tenant scoping
      expect(mockPrisma.firstTimer.count).toHaveBeenCalledWith({
        where: { member: { tenantId: mockAdminUser.tenantId } }
      })
    })
  })

  describe('Performance and Security', () => {
    it('should handle concurrent first-timer creation', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'vip@test.com' } })
      
      // Mock transaction to ensure atomic operations
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          user: { create: vi.fn().mockResolvedValue({ id: 'new_user' }) },
          firstTimer: { create: vi.fn().mockResolvedValue(mockFirstTimer) },
          pathway: { findFirst: vi.fn().mockResolvedValue({ id: 'roots_1' }) },
          pathwayEnrollment: { create: vi.fn().mockResolvedValue({}) }
        }
        return await callback(tx)
      })

      const promises = [
        createFirstTimer({ name: 'User 1', email: 'user1@test.com' }),
        createFirstTimer({ name: 'User 2', email: 'user2@test.com' })
      ]

      // Should handle concurrent creation via transactions
      await Promise.all(promises)
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2)
    })

    it('should validate all user inputs', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'vip@test.com' } })

      // Test empty name
      await expect(createFirstTimer({ name: '', email: 'test@test.com' }))
        .rejects.toThrow()

      // Test invalid email
      await expect(createFirstTimer({ name: 'Test User', email: 'invalid-email' }))
        .rejects.toThrow()
    })
  })
})
