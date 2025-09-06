/**
 * Unit tests for check-in rate limiting functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkIn } from '@/app/checkin/actions'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { rateLimiter } from '@/lib/rate-limiter'

// Mock dependencies
vi.mock('@/lib/auth')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    service: {
      findFirst: vi.fn()
    },
    checkin: {
      findUnique: vi.fn(),
      create: vi.fn()
    },
    user: {
      update: vi.fn()
    },
    pathway: {
      findFirst: vi.fn()
    },
    pathwayEnrollment: {
      create: vi.fn()
    }
  }
}))

vi.mock('@/lib/rate-limiter')

describe('Check-in Rate Limiting', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'MEMBER',
    tenantId: 'test-tenant-id'
  }

  const mockService = {
    id: 'test-service-id',
    localChurchId: 'test-tenant-id'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({
      user: mockUser
    })
  })

  it('should apply rate limiting to check-in requests', async () => {
    // Mock rate limiter to deny request
    vi.mocked(rateLimiter.checkLimit).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 60000
    })

    const formData = new FormData()
    formData.append('serviceId', 'test-service-id')
    formData.append('isNewBeliever', 'false')

    const result = await checkIn(formData)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Please wait before trying to check in again')
    expect(rateLimiter.checkLimit).toHaveBeenCalledWith('checkin:test-user-id', 'API')
  })

  it('should proceed with check-in when rate limit allows', async () => {
    // Mock rate limiter to allow request
    vi.mocked(rateLimiter.checkLimit).mockResolvedValue({
      allowed: true,
      remaining: 10,
      resetTime: Date.now() + 60000
    })

    // Mock service lookup
    vi.mocked(prisma.service.findFirst).mockResolvedValue(mockService)

    // Mock no existing checkin
    vi.mocked(prisma.checkin.findUnique).mockResolvedValue(null)

    // Mock successful checkin creation
    const mockCheckin = {
      id: 'test-checkin-id',
      serviceId: 'test-service-id',
      userId: 'test-user-id',
      isNewBeliever: false,
      checkedInAt: new Date()
    }
    vi.mocked(prisma.checkin.create).mockResolvedValue(mockCheckin)

    const formData = new FormData()
    formData.append('serviceId', 'test-service-id')
    formData.append('isNewBeliever', 'false')

    const result = await checkIn(formData)

    expect(rateLimiter.checkLimit).toHaveBeenCalledWith('checkin:test-user-id', 'API')
    expect(result.success).toBe(true)
    expect(result.data).toEqual(mockCheckin)
  })

  it('should use user-specific rate limiting keys', async () => {
    const user2 = { ...mockUser, id: 'user-2-id' }
    vi.mocked(auth).mockResolvedValue({ user: user2 })
    
    vi.mocked(rateLimiter.checkLimit).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 60000
    })

    const formData = new FormData()
    formData.append('serviceId', 'test-service-id')

    await checkIn(formData)

    expect(rateLimiter.checkLimit).toHaveBeenCalledWith('checkin:user-2-id', 'API')
  })
})