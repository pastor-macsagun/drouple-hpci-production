import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PathwayType, EnrollmentStatus } from '@prisma/client'

vi.mock('@/app/lib/db', () => ({
  db: {
    pathway: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    pathwayEnrollment: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

import { enrollUserInPathway, autoEnrollNewBeliever, getUserEnrollments } from './enrollment'
import { db } from '@/app/lib/db'

describe('Pathway Enrollment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('enrollUserInPathway', () => {
    it('should enroll a user in a pathway', async () => {
      const mockPathway = { id: 'pathway1', type: PathwayType.VINES }
      const mockEnrollment = {
        id: 'enrollment1',
        pathwayId: 'pathway1',
        userId: 'user1',
        status: EnrollmentStatus.ENROLLED,
      }

      vi.mocked(db.pathway.findFirst).mockResolvedValue(mockPathway as any)
      vi.mocked(db.pathwayEnrollment.findFirst).mockResolvedValue(null)
      vi.mocked(db.pathwayEnrollment.create).mockResolvedValue(mockEnrollment as any)

      const result = await enrollUserInPathway('user1', 'pathway1', 'tenant1')

      expect(result).toEqual(mockEnrollment)
      expect(db.pathway.findFirst).toHaveBeenCalledWith({
        where: { id: 'pathway1', tenantId: 'tenant1', isActive: true },
      })
      expect(db.pathwayEnrollment.create).toHaveBeenCalledWith({
        data: {
          pathwayId: 'pathway1',
          userId: 'user1',
          status: EnrollmentStatus.ENROLLED,
        },
      })
    })

    it('should not duplicate existing enrollment', async () => {
      const mockPathway = { id: 'pathway1', type: PathwayType.VINES }
      const existingEnrollment = {
        id: 'enrollment1',
        pathwayId: 'pathway1',
        userId: 'user1',
        status: EnrollmentStatus.ENROLLED,
      }

      vi.mocked(db.pathway.findFirst).mockResolvedValue(mockPathway as any)
      vi.mocked(db.pathwayEnrollment.findFirst).mockResolvedValue(existingEnrollment as any)

      const result = await enrollUserInPathway('user1', 'pathway1', 'tenant1')

      expect(result).toEqual(existingEnrollment)
      expect(db.pathwayEnrollment.create).not.toHaveBeenCalled()
    })

    it('should throw error if pathway not found', async () => {
      vi.mocked(db.pathway.findFirst).mockResolvedValue(null)

      await expect(enrollUserInPathway('user1', 'pathway1', 'tenant1')).rejects.toThrow(
        'Pathway not found'
      )
    })
  })

  describe('autoEnrollNewBeliever', () => {
    it('should auto-enroll new believer in ROOTS pathway', async () => {
      const mockUser = {
        id: 'user1',
        isNewBeliever: true,
        tenantId: 'tenant1',
      }
      const mockPathway = {
        id: 'roots1',
        type: PathwayType.ROOTS,
        tenantId: 'tenant1',
      }
      const mockEnrollment = {
        id: 'enrollment1',
        pathwayId: 'roots1',
        userId: 'user1',
        status: EnrollmentStatus.ENROLLED,
      }

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(db.pathway.findFirst).mockResolvedValue(mockPathway as any)
      vi.mocked(db.pathwayEnrollment.findFirst).mockResolvedValue(null)
      vi.mocked(db.pathwayEnrollment.create).mockResolvedValue(mockEnrollment as any)

      const result = await autoEnrollNewBeliever('user1')

      expect(result).toEqual(mockEnrollment)
      expect(db.pathway.findFirst).toHaveBeenCalledWith({
        where: {
          type: PathwayType.ROOTS,
          tenantId: 'tenant1',
          isActive: true,
        },
      })
    })

    it('should not enroll if user is not new believer', async () => {
      const mockUser = {
        id: 'user1',
        isNewBeliever: false,
        tenantId: 'tenant1',
      }

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as any)

      const result = await autoEnrollNewBeliever('user1')

      expect(result).toBeNull()
      expect(db.pathway.findFirst).not.toHaveBeenCalled()
    })

    it('should not enroll if already enrolled in ROOTS', async () => {
      const mockUser = {
        id: 'user1',
        isNewBeliever: true,
        tenantId: 'tenant1',
      }
      const mockPathway = {
        id: 'roots1',
        type: PathwayType.ROOTS,
        tenantId: 'tenant1',
      }
      const existingEnrollment = {
        id: 'enrollment1',
        pathwayId: 'roots1',
        userId: 'user1',
        status: EnrollmentStatus.ENROLLED,
      }

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(db.pathway.findFirst).mockResolvedValue(mockPathway as any)
      vi.mocked(db.pathwayEnrollment.findFirst).mockResolvedValue(existingEnrollment as any)

      const result = await autoEnrollNewBeliever('user1')

      expect(result).toEqual(existingEnrollment)
      expect(db.pathwayEnrollment.create).not.toHaveBeenCalled()
    })

    it('should create ROOTS pathway if it does not exist', async () => {
      const mockUser = {
        id: 'user1',
        isNewBeliever: true,
        tenantId: 'tenant1',
      }
      const newPathway = {
        id: 'roots1',
        type: PathwayType.ROOTS,
        name: 'ROOTS',
        description: 'Foundation course for new believers',
        tenantId: 'tenant1',
      }
      const mockEnrollment = {
        id: 'enrollment1',
        pathwayId: 'roots1',
        userId: 'user1',
        status: EnrollmentStatus.ENROLLED,
      }

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(db.pathway.findFirst).mockResolvedValueOnce(null)
      vi.mocked(db.pathway.create).mockResolvedValue(newPathway as any)
      vi.mocked(db.pathwayEnrollment.findFirst).mockResolvedValue(null)
      vi.mocked(db.pathwayEnrollment.create).mockResolvedValue(mockEnrollment as any)

      const result = await autoEnrollNewBeliever('user1')

      expect(result).toEqual(mockEnrollment)
      expect(db.pathway.create).toHaveBeenCalledWith({
        data: {
          type: PathwayType.ROOTS,
          name: 'ROOTS',
          description: 'Foundation course for new believers',
          tenantId: 'tenant1',
        },
      })
    })
  })

  describe('getUserEnrollments', () => {
    it('should return user enrollments with pathway details', async () => {
      const mockEnrollments = [
        {
          id: 'enrollment1',
          pathwayId: 'pathway1',
          userId: 'user1',
          status: EnrollmentStatus.ENROLLED,
          pathway: {
            id: 'pathway1',
            name: 'ROOTS',
            type: PathwayType.ROOTS,
            steps: [
              { id: 'step1', name: 'Step 1', orderIndex: 0 },
              { id: 'step2', name: 'Step 2', orderIndex: 1 },
            ],
          },
        },
      ]

      vi.mocked(db.pathwayEnrollment.findMany).mockResolvedValue(mockEnrollments as any)

      const result = await getUserEnrollments('user1')

      expect(result).toEqual(mockEnrollments)
      expect(db.pathwayEnrollment.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        include: {
          pathway: {
            include: {
              steps: {
                orderBy: { orderIndex: 'asc' },
              },
            },
          },
        },
        orderBy: { enrolledAt: 'desc' },
      })
    })
  })
})