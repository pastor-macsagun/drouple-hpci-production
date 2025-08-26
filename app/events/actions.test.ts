import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventScope, UserRole } from '@prisma/client'

// Mock Next.js specific imports
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn()
}))

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    eventRsvp: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn()
    },
    $transaction: vi.fn(),
  },
}))

// Import after mocks
import { rsvpToEvent, cancelRsvp } from './actions'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

describe('Event Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rsvpToEvent', () => {
    const mockSession = {
      user: {
        id: 'user1',
        email: 'user@test.com',
        role: UserRole.MEMBER,
        tenantId: 'church1',
      }
    }

    const mockEvent = {
      id: 'event1',
      title: 'Test Event',
      capacity: 10,
      scope: EventScope.LOCAL_CHURCH,
      localChurchId: 'church1',
      requiresRsvp: true,
      visibleToRoles: [],
      isActive: true,
    }

    it('should create RSVP when space available', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any)
      vi.mocked(prisma.event.findUnique).mockResolvedValue(mockEvent as any)
      vi.mocked(prisma.eventRsvp.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.eventRsvp.count).mockResolvedValue(5)
      vi.mocked(prisma.eventRsvp.create).mockResolvedValue({
        id: 'rsvp1',
        eventId: 'event1',
        userId: 'user1',
        status: 'GOING',
      } as any)

      const result = await rsvpToEvent('event1')
      
      expect(result.success).toBe(true)
      expect(prisma.eventRsvp.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventId: 'event1',
          userId: 'user1',
          status: 'GOING',
        })
      })
    })

    it('should add to waitlist when at capacity', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any)
      vi.mocked(prisma.event.findUnique).mockResolvedValue(mockEvent as any)
      vi.mocked(prisma.eventRsvp.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.eventRsvp.count).mockResolvedValue(10) // At capacity
      vi.mocked(prisma.eventRsvp.create).mockResolvedValue({
        id: 'rsvp1',
        eventId: 'event1',
        userId: 'user1',
        status: 'WAITLIST',
      } as any)

      const result = await rsvpToEvent('event1')
      
      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('WAITLIST')
      expect(prisma.eventRsvp.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'WAITLIST',
        })
      })
    })

    it('should prevent duplicate RSVPs', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any)
      vi.mocked(prisma.event.findUnique).mockResolvedValue(mockEvent as any)
      vi.mocked(prisma.eventRsvp.findFirst).mockResolvedValue({
        id: 'existing-rsvp',
        eventId: 'event1',
        userId: 'user1',
      } as any)

      const result = await rsvpToEvent('event1')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('already')
      expect(prisma.eventRsvp.create).not.toHaveBeenCalled()
    })

    it('should require authentication', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const result = await rsvpToEvent('event1')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('authenticated')
    })
  })

  describe('cancelRsvp', () => {
    const mockSession = {
      user: {
        id: 'user1',
        email: 'user@test.com',
        role: UserRole.MEMBER,
      }
    }

    it('should cancel existing RSVP', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any)
      vi.mocked(prisma.eventRsvp.findFirst).mockResolvedValue({
        id: 'rsvp1',
        eventId: 'event1',
        userId: 'user1',
        status: 'GOING',
      } as any)
      vi.mocked(prisma.eventRsvp.update).mockResolvedValue({
        id: 'rsvp1',
        status: 'CANCELLED',
      } as any)

      const result = await cancelRsvp('event1')
      
      expect(result.success).toBe(true)
      expect(prisma.eventRsvp.update).toHaveBeenCalledWith({
        where: { id: 'rsvp1' },
        data: expect.objectContaining({
          status: 'CANCELLED',
        })
      })
    })

    it('should handle non-existent RSVP', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any)
      vi.mocked(prisma.eventRsvp.findFirst).mockResolvedValue(null)

      const result = await cancelRsvp('event1')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('No RSVP found')
    })
  })
})