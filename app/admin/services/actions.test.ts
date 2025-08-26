import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserRole } from '@prisma/client'

// Mock Next.js specific imports
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  revalidatePath: vi.fn()
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn()
}))

// Mock dependencies
vi.mock('@/app/lib/db', () => ({
  db: {
    service: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    checkin: {
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    localChurch: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/rbac', () => ({
  getCurrentUser: vi.fn(),
  requireRole: vi.fn(),
}))

// Import after mocks
import { 
  getServices,
  createService,
  updateService,
  deleteService,
  getServiceDetails,
  exportServiceAttendance
} from './actions'
import { db } from '@/app/lib/db'
import { requireRole } from '@/lib/rbac'

describe('Service Admin Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockAdmin = {
    id: 'admin1',
    email: 'admin@test.com',
    role: UserRole.ADMIN,
    tenantId: 'church1',
    memberships: [
      { localChurchId: 'local1' }
    ],
  }

  describe('getServices', () => {
    it('should fetch services for the local church', async () => {
      vi.mocked(requireRole).mockResolvedValue(mockAdmin as any)
      vi.mocked(db.service.findMany).mockResolvedValue([
        {
          id: 'service1',
          date: new Date('2024-01-01'),
          localChurchId: 'local1',
          _count: { checkins: 50 },
        }
      ] as any)

      const result = await getServices()
      
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(db.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { localChurchId: 'local1' }
        })
      )
    })
  })

  describe('createService', () => {
    it('should create a new service', async () => {
      vi.mocked(requireRole).mockResolvedValue(mockAdmin as any)
      const serviceDate = new Date('2024-01-07')
      
      vi.mocked(db.service.create).mockResolvedValue({
        id: 'service1',
        date: serviceDate,
        localChurchId: 'local1',
      } as any)

      const result = await createService({
        date: serviceDate,
        localChurchId: 'local1'
      })
      
      expect(result.success).toBe(true)
      expect(db.service.create).toHaveBeenCalledWith({
        data: {
          date: serviceDate,
          localChurchId: 'local1',
        }
      })
    })

    it('should prevent duplicate services', async () => {
      vi.mocked(requireRole).mockResolvedValue(mockAdmin as any)
      const serviceDate = new Date('2024-01-07')
      
      vi.mocked(db.service.create).mockRejectedValue({
        code: 'P2002',
        message: 'Unique constraint failed'
      })

      const result = await createService({
        date: serviceDate,
        localChurchId: 'local1'
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('already exists')
    })
  })

  describe('getServiceDetails', () => {
    it('should fetch service with recent checkins', async () => {
      vi.mocked(requireRole).mockResolvedValue(mockAdmin as any)
      vi.mocked(db.service.findUnique).mockResolvedValue({
        id: 'service1',
        date: new Date('2024-01-01'),
        localChurchId: 'local1',
        checkins: [
          {
            id: 'checkin1',
            userId: 'user1',
            checkedInAt: new Date(),
            user: { name: 'Test User', email: 'test@example.com' }
          }
        ],
        _count: { checkins: 25 }
      } as any)

      const result = await getServiceDetails('service1')
      
      expect(result.success).toBe(true)
      expect(result.data?.checkins).toHaveLength(1)
      expect(db.service.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'service1' }
        })
      )
    })

    it('should enforce tenant isolation', async () => {
      vi.mocked(requireRole).mockResolvedValue(mockAdmin as any)
      vi.mocked(db.service.findUnique).mockResolvedValue({
        id: 'service1',
        localChurchId: 'different-church',
      } as any)

      const result = await getServiceDetails('service1')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Access denied')
    })
  })

  describe('deleteService', () => {
    it('should delete service and cascade checkins', async () => {
      vi.mocked(requireRole).mockResolvedValue(mockAdmin as any)
      vi.mocked(db.service.findUnique).mockResolvedValue({
        id: 'service1',
        localChurchId: 'local1',
      } as any)
      vi.mocked(db.service.delete).mockResolvedValue({
        id: 'service1',
      } as any)

      const result = await deleteService('service1')
      
      expect(result.success).toBe(true)
      expect(db.service.delete).toHaveBeenCalledWith({
        where: { id: 'service1' }
      })
    })
  })

  describe('exportServiceAttendance', () => {
    it('should generate CSV export data', async () => {
      vi.mocked(requireRole).mockResolvedValue(mockAdmin as any)
      vi.mocked(db.service.findUnique).mockResolvedValue({
        id: 'service1',
        date: new Date('2024-01-01'),
        localChurchId: 'local1',
        localChurch: { name: 'Test Church' },
        checkins: [
          {
            user: {
              name: 'John Doe',
              email: 'john@example.com',
              phone: '123-456-7890',
            },
            checkedInAt: new Date('2024-01-01T10:00:00Z'),
            isNewBeliever: false,
          }
        ]
      } as any)

      const result = await exportServiceAttendance('service1')
      
      expect(result.success).toBe(true)
      expect(result.data).toContain('Name,Email,Phone')
      expect(result.data).toContain('John Doe')
      expect(result.data).toContain('john@example.com')
    })
  })

  describe('updateService', () => {
    it('should update service date', async () => {
      vi.mocked(requireRole).mockResolvedValue(mockAdmin as any)
      vi.mocked(db.service.findUnique).mockResolvedValue({
        id: 'service1',
        localChurchId: 'local1',
      } as any)
      
      const newDate = new Date('2024-01-14')
      vi.mocked(db.service.update).mockResolvedValue({
        id: 'service1',
        date: newDate,
      } as any)

      const result = await updateService('service1', { date: newDate })
      
      expect(result.success).toBe(true)
      expect(db.service.update).toHaveBeenCalledWith({
        where: { id: 'service1' },
        data: { date: newDate }
      })
    })
  })
})