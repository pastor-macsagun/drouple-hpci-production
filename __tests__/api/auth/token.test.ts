import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { POST } from '@/app/api/auth/token/route'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {}
}))

vi.mock('@/lib/logger', () => ({
  authLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('@/lib/auth-rate-limit', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, remainingAttempts: 5 })),
  recordAttempt: vi.fn()
}))

// Mock JwtService
const mockJwtService = {
  getInstance: vi.fn(() => ({
    signJwt: vi.fn().mockResolvedValue('mock-jwt-token')
  }))
}

vi.mock('@/packages/shared/auth', () => ({
  JwtService: mockJwtService,
  createClaims: vi.fn((userId, tenantId, roles, expiresIn) => ({
    sub: userId,
    tenantId,
    roles,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresIn
  }))
}))

describe('/api/auth/token', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.AUTH_SECRET = 'test-secret'
  })

  afterEach(() => {
    delete process.env.AUTH_SECRET
  })

  it('should return JWT token for authenticated user', async () => {
    // Mock authenticated session
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'MEMBER',
        tenantId: 'tenant456'
      }
    })

    const request = new NextRequest('http://localhost:3000/api/auth/token', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      token: 'mock-jwt-token',
      expiresIn: 900
    })
  })

  it('should return 401 for unauthenticated request', async () => {
    // Mock no session
    vi.mocked(getServerSession).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/auth/token', {
      method: 'POST'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Authentication required')
  })

  it('should return 401 for session without user ID', async () => {
    // Mock session without user ID
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        email: 'test@example.com',
        name: 'Test User'
        // Missing id
      }
    })

    const request = new NextRequest('http://localhost:3000/api/auth/token', {
      method: 'POST'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Authentication required')
  })

  it('should return 429 when rate limited', async () => {
    const { checkRateLimit } = await import('@/lib/auth-rate-limit')
    vi.mocked(checkRateLimit).mockReturnValue({
      allowed: false,
      remainingAttempts: 0,
      resetTime: Date.now() + 60000
    })

    const request = new NextRequest('http://localhost:3000/api/auth/token', {
      method: 'POST'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toBe('Too many token requests. Please try again later.')
  })

  it('should handle JWT signing errors', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: 'user123',
        email: 'test@example.com',
        role: 'MEMBER',
        tenantId: 'tenant456'
      }
    })

    // Mock JWT service to throw error
    mockJwtService.getInstance.mockReturnValue({
      signJwt: vi.fn().mockRejectedValue(new Error('JWT signing failed'))
    })

    const request = new NextRequest('http://localhost:3000/api/auth/token', {
      method: 'POST'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })

  it('should extract IP address from headers', async () => {
    const { recordAttempt } = await import('@/lib/auth-rate-limit')
    
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: 'user123',
        email: 'test@example.com',
        role: 'MEMBER',
        tenantId: 'tenant456'
      }
    })

    const request = new NextRequest('http://localhost:3000/api/auth/token', {
      method: 'POST',
      headers: {
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        'x-real-ip': '192.168.1.2'
      }
    })

    await POST(request)

    expect(recordAttempt).toHaveBeenCalledWith('192.168.1.1', 'token-request')
  })

  it('should handle user with null tenantId', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: 'super-admin',
        email: 'admin@example.com',
        role: 'SUPER_ADMIN',
        tenantId: null
      }
    })

    const request = new NextRequest('http://localhost:3000/api/auth/token', {
      method: 'POST'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.token).toBe('mock-jwt-token')
  })

  describe('HTTP method validation', () => {
    it('should return 405 for GET requests', async () => {
      const { GET } = await import('@/app/api/auth/token/route')
      const response = await GET()
      const data = await response.json()
      
      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed')
    })

    it('should return 405 for PUT requests', async () => {
      const { PUT } = await import('@/app/api/auth/token/route')
      const response = await PUT()
      const data = await response.json()
      
      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed')
    })

    it('should return 405 for DELETE requests', async () => {
      const { DELETE } = await import('@/app/api/auth/token/route')
      const response = await DELETE()
      const data = await response.json()
      
      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed')
    })
  })
})