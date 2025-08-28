import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import middleware from '@/middleware'

// Mock dependencies
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

vi.mock('@/lib/edge/session-cookie', () => ({
  getSession: vi.fn()
}))

import { getSession } from '@/lib/edge/session-cookie'

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

  function createMockRequest(url: string, method = 'GET'): NextRequest {
    return new NextRequest(new URL(url, 'http://localhost:3000'), { method })
  }

  describe('/super route protection', () => {
    it('should allow SUPER_ADMIN access to /super', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSuperAdminSession)
      
      const request = createMockRequest('/super')
      const response = await middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should allow SUPER_ADMIN access to /super/churches', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSuperAdminSession)
      
      const request = createMockRequest('/super/churches')
      const response = await middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should allow SUPER_ADMIN access to /super/local-churches', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSuperAdminSession)
      
      const request = createMockRequest('/super/local-churches/123/admins')
      const response = await middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should redirect ADMIN from /super to /dashboard', async () => {
      vi.mocked(getSession).mockResolvedValue(mockAdminSession)
      
      const request = createMockRequest('/super')
      const response = await middleware(request)
      
      expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard')
      expect(response.status).toBe(307)
    })

    it('should redirect MEMBER from /super to /dashboard', async () => {
      vi.mocked(getSession).mockResolvedValue(mockMemberSession)
      
      const request = createMockRequest('/super/churches')
      const response = await middleware(request)
      
      expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard')
      expect(response.status).toBe(307)
    })

    it('should redirect unauthenticated users from /super', async () => {
      vi.mocked(getSession).mockResolvedValue(null)
      
      const request = createMockRequest('/super')
      const response = await middleware(request)
      
      expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard')
      expect(response.status).toBe(307)
    })
  })

  describe('SUPER_ADMIN bypass for other routes', () => {
    it('should allow SUPER_ADMIN to access /admin routes', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSuperAdminSession)
      
      const request = createMockRequest('/admin/members')
      const response = await middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should allow SUPER_ADMIN to access /vip routes', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSuperAdminSession)
      
      const request = createMockRequest('/vip/firsttimers')
      const response = await middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should allow SUPER_ADMIN to access /leader routes', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSuperAdminSession)
      
      const request = createMockRequest('/leader')
      const response = await middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should allow SUPER_ADMIN to access regular user routes', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSuperAdminSession)
      
      const request = createMockRequest('/dashboard')
      const response = await middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })
  })

  describe('Role isolation for non-SUPER_ADMIN', () => {
    it('should prevent ADMIN from accessing /vip routes', async () => {
      vi.mocked(getSession).mockResolvedValue(mockAdminSession)
      
      const request = createMockRequest('/vip')
      const response = await middleware(request)
      
      expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard')
      expect(response.status).toBe(307)
    })

    it('should prevent MEMBER from accessing /admin routes', async () => {
      vi.mocked(getSession).mockResolvedValue(mockMemberSession)
      
      const request = createMockRequest('/admin/services')
      const response = await middleware(request)
      
      expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard')
      expect(response.status).toBe(307)
    })
  })

  describe('Authentication redirects', () => {
    it('should redirect unauthenticated users from /dashboard to signin', async () => {
      vi.mocked(getSession).mockResolvedValue(null)
      
      const request = createMockRequest('/dashboard')
      const response = await middleware(request)
      
      expect(response.headers.get('location')).toBe('http://localhost:3000/auth/signin')
      expect(response.status).toBe(307)
    })

    it('should redirect authenticated users from auth pages', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSuperAdminSession)
      
      const request = createMockRequest('/auth/signin')
      const response = await middleware(request)
      
      expect(response.headers.get('location')).toBe('http://localhost:3000/')
      expect(response.status).toBe(307)
    })
  })
})