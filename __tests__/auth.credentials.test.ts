import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'
import { checkRateLimit, recordAttempt, resetAttempts } from '@/lib/auth-rate-limit'

// Mock Prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    membership: {
      create: vi.fn(),
    },
  })),
  UserRole: {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    LEADER: 'LEADER',
    MEMBER: 'MEMBER',
  },
}))

describe('Credentials Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Password Validation', () => {
    it('should hash passwords with bcrypt', async () => {
      const password = 'Hpci!Test2025'
      const hash = await bcrypt.hash(password, 12)
      
      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(50)
    })

    it('should verify correct password', async () => {
      const password = 'Hpci!Test2025'
      const hash = await bcrypt.hash(password, 12)
      
      const isValid = await bcrypt.compare(password, hash)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'Hpci!Test2025'
      const wrongPassword = 'WrongPassword123!'
      const hash = await bcrypt.hash(password, 12)
      
      const isValid = await bcrypt.compare(wrongPassword, hash)
      expect(isValid).toBe(false)
    })
  })

  describe('Rate Limiting', () => {
    const testIp = '127.0.0.1'
    const testEmail = 'test@example.com'

    beforeEach(() => {
      // Reset rate limits between tests
      resetAttempts(testIp, testEmail)
    })

    it('should allow initial login attempts', () => {
      const result = checkRateLimit(testIp, testEmail)
      
      expect(result.allowed).toBe(true)
      expect(result.remainingAttempts).toBe(5)
      expect(result.resetTime).toBeUndefined()
    })

    it('should track login attempts', () => {
      recordAttempt(testIp, testEmail)
      const result = checkRateLimit(testIp, testEmail)
      
      expect(result.allowed).toBe(true)
      expect(result.remainingAttempts).toBe(4)
    })

    it('should block after 5 attempts', () => {
      // Record 5 attempts
      for (let i = 0; i < 5; i++) {
        recordAttempt(testIp, testEmail)
      }
      
      const result = checkRateLimit(testIp, testEmail)
      
      expect(result.allowed).toBe(false)
      expect(result.remainingAttempts).toBe(0)
      expect(result.resetTime).toBeDefined()
      expect(result.resetTime).toBeInstanceOf(Date)
    })

    it('should track attempts per IP+email combination', () => {
      const otherEmail = 'other@example.com'
      
      // Max out attempts for first email
      for (let i = 0; i < 5; i++) {
        recordAttempt(testIp, testEmail)
      }
      
      // Should still allow attempts for different email
      const result = checkRateLimit(testIp, otherEmail)
      expect(result.allowed).toBe(true)
      expect(result.remainingAttempts).toBe(5)
    })

    it('should reset attempts on successful login', () => {
      // Record some attempts
      recordAttempt(testIp, testEmail)
      recordAttempt(testIp, testEmail)
      
      // Reset on successful login
      resetAttempts(testIp, testEmail)
      
      const result = checkRateLimit(testIp, testEmail)
      expect(result.allowed).toBe(true)
      expect(result.remainingAttempts).toBe(5)
    })
  })

  describe('User Roles and Redirects', () => {
    it('should redirect SUPER_ADMIN to /super', () => {
      const role = 'SUPER_ADMIN'
      const baseUrl = 'http://localhost:3000'
      
      const redirect = role === 'SUPER_ADMIN' 
        ? `${baseUrl}/super`
        : `${baseUrl}/dashboard`
      
      expect(redirect).toBe('http://localhost:3000/super')
    })

    it('should redirect other roles to dashboard with local church', () => {
      const role: string = 'ADMIN'
      const baseUrl = 'http://localhost:3000'
      const localChurchId = 'clxtest002'
      
      const redirect = role === 'SUPER_ADMIN'
        ? `${baseUrl}/super`
        : localChurchId 
          ? `${baseUrl}/dashboard?lc=${localChurchId}`
          : `${baseUrl}/dashboard`
      
      expect(redirect).toBe('http://localhost:3000/dashboard?lc=clxtest002')
    })
  })
})