import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Mock the auth wrapper and dependencies
vi.mock('@/lib/auth', () => ({
  auth: vi.fn((handler) => handler)
}))

vi.mock('@/lib/rate-limit', () => ({
  getClientIp: vi.fn().mockReturnValue('127.0.0.1')
}))

vi.mock('@/lib/rate-limit-policies', () => ({
  checkRateLimitWithHeaders: vi.fn().mockResolvedValue({
    allowed: true,
    headers: {},
    message: null
  })
}))

// Import middleware after mocks
const { default: middleware } = await import('@/middleware')

describe('SUPER_ADMIN Middleware Tests', () => {
  const mockSuperAdminSession = {
    role: 'SUPER_ADMIN',
    email: 'super@test.com',
    id: 'super-1'
  }

  const mockAdminSession = {
    role: 'ADMIN',
    email: 'admin@test.com',
    id: 'admin-1'
  }

  const mockMemberSession = {
    role: 'MEMBER',
    email: 'member@test.com',
    id: 'member-1'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NODE_ENV = 'development' // Disable rate limiting for tests
  })

  function createMockRequest(url: string, method = 'GET', mockSession = null): NextRequest {
    const req = new NextRequest(new URL(url, 'http://localhost:3000'), { method })
    // Mock the req.auth property that gets set by NextAuth middleware
    Object.defineProperty(req, 'auth', {
      value: mockSession,
      writable: true
    })
    return req
  }

  describe('/super route protection', () => {
    it('should allow SUPER_ADMIN access to /super', async () => {
      const request = createMockRequest('/super', 'GET', { user: mockSuperAdminSession })
      const response = await middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should allow SUPER_ADMIN access to /super/churches', async () => {
      const request = createMockRequest('/super/churches', 'GET', { user: mockSuperAdminSession })
      const response = await middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should allow SUPER_ADMIN access to /super/local-churches', async () => {
      const request = createMockRequest('/super/local-churches/123/admins', 'GET', { user: mockSuperAdminSession })
      const response = await middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should redirect ADMIN from /super to /', async () => {
      const request = createMockRequest('/super', 'GET', { user: mockAdminSession })
      const response = await middleware(request)
      
      expect(response.headers.get('location')).toBe('http://localhost:3000/')
      expect(response.status).toBe(307)
    })

    it('should redirect MEMBER from /super to /', async () => {
      const request = createMockRequest('/super/churches', 'GET', { user: mockMemberSession })
      const response = await middleware(request)
      
      expect(response.headers.get('location')).toBe('http://localhost:3000/')
      expect(response.status).toBe(307)
    })

    it('should redirect unauthenticated users from /super', async () => {
      const request = createMockRequest('/super', 'GET', null)
      const response = await middleware(request)
      
      expect(response.headers.get('location')).toBe('http://localhost:3000/auth/signin?returnTo=%2Fsuper')
      expect(response.status).toBe(307)
    })
  })

  describe('SUPER_ADMIN bypass for other routes', () => {
    it('should allow SUPER_ADMIN to access /admin routes', async () => {
      const request = createMockRequest('/admin/members', 'GET', { user: mockSuperAdminSession })
      const response = await middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should allow SUPER_ADMIN to access /vip routes', async () => {
      const request = createMockRequest('/vip/firsttimers', 'GET', { user: mockSuperAdminSession })
      const response = await middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should allow SUPER_ADMIN to access /leader routes', async () => {
      const request = createMockRequest('/leader', 'GET', { user: mockSuperAdminSession })
      const response = await middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should allow SUPER_ADMIN to access regular user routes', async () => {
      const request = createMockRequest('/dashboard', 'GET', { user: mockSuperAdminSession })
      const response = await middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })
  })

  describe('Role isolation for non-SUPER_ADMIN', () => {
    it('should allow ADMIN to access /vip routes', async () => {
      const request = createMockRequest('/vip', 'GET', { user: mockAdminSession })
      const response = await middleware(request)
      
      // ADMIN should be able to access /vip routes according to middleware.ts line 112
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should prevent MEMBER from accessing /admin routes', async () => {
      const request = createMockRequest('/admin/services', 'GET', { user: mockMemberSession })
      const response = await middleware(request)
      
      expect(response.headers.get('location')).toBe('http://localhost:3000/')
      expect(response.status).toBe(307)
    })
  })

  describe('Authentication redirects', () => {
    it('should redirect unauthenticated users from /dashboard to signin', async () => {
      const request = createMockRequest('/dashboard', 'GET', null)
      const response = await middleware(request)
      
      expect(response.headers.get('location')).toBe('http://localhost:3000/auth/signin?returnTo=%2Fdashboard')
      expect(response.status).toBe(307)
    })

    it('should allow auth pages to prevent redirect loops', async () => {
      const request = createMockRequest('/auth/signin', 'GET', { user: mockSuperAdminSession })
      const response = await middleware(request)
      
      // Auth pages return NextResponse.next() to prevent redirect loops
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })
  })
})