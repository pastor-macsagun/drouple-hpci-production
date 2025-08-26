import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EnrollmentStatus } from '@prisma/client'

vi.mock('@/app/lib/db', () => {
  const mockDb = {
    pathwayProgress: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    pathwayStep: {
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    pathwayEnrollment: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((fn: any) => fn(mockDb)),
  }
  return { db: mockDb }
})

import { completeStep, getPathwayProgress, isPathwayComplete } from './progress'
import { db } from '@/app/lib/db'

describe('Pathway Progress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('completeStep', () => {
    it('should mark a step as completed', async () => {
      const mockStep = { id: 'step1', pathwayId: 'pathway1' }
      const mockProgress = {
        id: 'progress1',
        stepId: 'step1',
        userId: 'user1',
        completedBy: 'leader1',
      }

      vi.mocked(db.pathwayStep.findUnique).mockResolvedValue(mockStep as any)
      vi.mocked(db.pathwayProgress.findFirst).mockResolvedValue(null)
      vi.mocked(db.pathwayProgress.create).mockResolvedValue(mockProgress as any)
      vi.mocked(db.pathwayStep.count).mockResolvedValue(2)
      vi.mocked(db.pathwayProgress.findMany).mockResolvedValue([{ stepId: 'step1' }] as any)

      const result = await completeStep('step1', 'user1', 'leader1', 'Good progress')

      expect(result).toEqual(mockProgress)
      expect(db.pathwayProgress.create).toHaveBeenCalledWith({
        data: {
          stepId: 'step1',
          userId: 'user1',
          completedBy: 'leader1',
          notes: 'Good progress',
        },
      })
    })

    it('should not duplicate completion', async () => {
      const existingProgress = {
        id: 'progress1',
        stepId: 'step1',
        userId: 'user1',
      }

      vi.mocked(db.pathwayStep.findUnique).mockResolvedValue({ id: 'step1' } as any)
      vi.mocked(db.pathwayProgress.findFirst).mockResolvedValue(existingProgress as any)

      const result = await completeStep('step1', 'user1', 'leader1')

      expect(result).toEqual(existingProgress)
      expect(db.pathwayProgress.create).not.toHaveBeenCalled()
    })

    it('should throw error if step not found', async () => {
      vi.mocked(db.pathwayStep.findUnique).mockResolvedValue(null)

      await expect(completeStep('step1', 'user1', 'leader1')).rejects.toThrow(
        'Step not found'
      )
    })

    it('should auto-complete pathway when all steps are done', async () => {
      const mockStep = { id: 'step3', pathwayId: 'pathway1' }
      const mockProgress = {
        id: 'progress3',
        stepId: 'step3',
        userId: 'user1',
      }
      const mockEnrollment = {
        id: 'enrollment1',
        pathwayId: 'pathway1',
        userId: 'user1',
        status: EnrollmentStatus.ENROLLED,
      }

      vi.mocked(db.pathwayStep.findUnique).mockResolvedValue(mockStep as any)
      vi.mocked(db.pathwayProgress.findFirst).mockResolvedValue(null)
      vi.mocked(db.pathwayProgress.create).mockResolvedValue(mockProgress as any)
      vi.mocked(db.pathwayStep.count).mockResolvedValue(3)
      vi.mocked(db.pathwayProgress.findMany).mockResolvedValue([
        { stepId: 'step1' },
        { stepId: 'step2' },
        { stepId: 'step3' },
      ] as any)
      vi.mocked(db.pathwayEnrollment.findFirst).mockResolvedValue(mockEnrollment as any)
      vi.mocked(db.pathwayEnrollment.update).mockResolvedValue({
        ...mockEnrollment,
        status: EnrollmentStatus.COMPLETED,
      } as any)

      const result = await completeStep('step3', 'user1', 'leader1')

      expect(result).toEqual(mockProgress)
      expect(db.pathwayEnrollment.update).toHaveBeenCalledWith({
        where: { id: 'enrollment1' },
        data: {
          status: EnrollmentStatus.COMPLETED,
          completedAt: expect.any(Date),
        },
      })
    })
  })

  describe('getPathwayProgress', () => {
    it('should return progress for a pathway', async () => {
      const mockProgress = [
        { stepId: 'step1', completedAt: new Date() },
        { stepId: 'step2', completedAt: new Date() },
      ]

      vi.mocked(db.pathwayProgress.findMany).mockResolvedValue(mockProgress as any)

      const result = await getPathwayProgress('pathway1', 'user1')

      expect(result).toEqual(mockProgress)
      expect(db.pathwayProgress.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user1',
          step: { pathwayId: 'pathway1' },
        },
        include: {
          step: true,
        },
        orderBy: { completedAt: 'asc' },
      })
    })
  })

  describe('isPathwayComplete', () => {
    it('should return true when all steps are completed', async () => {
      vi.mocked(db.pathwayStep.count).mockResolvedValue(3)
      vi.mocked(db.pathwayProgress.findMany).mockResolvedValue([
        { stepId: 'step1' },
        { stepId: 'step2' },
        { stepId: 'step3' },
      ] as any)

      const result = await isPathwayComplete('pathway1', 'user1')

      expect(result).toBe(true)
    })

    it('should return false when some steps are incomplete', async () => {
      vi.mocked(db.pathwayStep.count).mockResolvedValue(3)
      vi.mocked(db.pathwayProgress.findMany).mockResolvedValue([
        { stepId: 'step1' },
        { stepId: 'step2' },
      ] as any)

      const result = await isPathwayComplete('pathway1', 'user1')

      expect(result).toBe(false)
    })
  })
})