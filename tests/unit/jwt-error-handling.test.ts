import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { getSession } from '@/lib/edge/session-cookie'
import { validateAuthSecret, isJWTError } from '@/lib/session-cleanup'

// Mock next-auth/jwt
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn()
}))

describe('JWT Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset environment
    process.env.NEXTAUTH_SECRET = 'test-secret-that-is-long-enough-for-validation'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getSession', () => {
    it('should handle JWT decryption errors gracefully', async () => {
      const { getToken } = await import('next-auth/jwt')
      const mockGetToken = getToken as any

      // Mock JWT decryption error
      mockGetToken.mockRejectedValue(new Error('no matching decryption secret'))

      const req = new NextRequest('http://localhost:3000/test', {
        headers: {
          'user-agent': 'test-agent'
        }
      })
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const session = await getSession(req)

      expect(session).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith(
        '[AUTH] JWT decryption error - clearing invalid session:',
        expect.objectContaining({
          error: 'no matching decryption secret',
          timestamp: expect.any(String),
          path: '/test'
        })
      )

      consoleSpy.mockRestore()
    })

    it('should handle successful token retrieval', async () => {
      const { getToken } = await import('next-auth/jwt')
      const mockGetToken = getToken as any

      const mockToken = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'MEMBER'
      }

      mockGetToken.mockResolvedValue(mockToken)

      const req = new NextRequest('http://localhost:3000/test', {
        headers: {
          'user-agent': 'test-agent'
        }
      })
      const session = await getSession(req)

      expect(session).toEqual(mockToken)
    })

    it('should handle generic errors', async () => {
      const { getToken } = await import('next-auth/jwt')
      const mockGetToken = getToken as any

      mockGetToken.mockRejectedValue(new Error('Network error'))

      const req = new NextRequest('http://localhost:3000/test', {
        headers: {
          'user-agent': 'test-agent'
        }
      })
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const session = await getSession(req)

      expect(session).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith(
        '[AUTH] Unexpected session error:',
        expect.objectContaining({
          error: 'Network error',
          stack: expect.any(String)
        })
      )

      consoleSpy.mockRestore()
    })
  })

  describe('validateAuthSecret', () => {
    it('should return true for valid secret', () => {
      process.env.NEXTAUTH_SECRET = 'this-is-a-very-long-secret-key-for-testing'
      expect(validateAuthSecret()).toBe(true)
    })

    it('should return false for missing secret', () => {
      delete process.env.NEXTAUTH_SECRET
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(validateAuthSecret()).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith('[AUTH] NEXTAUTH_SECRET is not configured')

      consoleSpy.mockRestore()
    })

    it('should return false for short secret', () => {
      process.env.NEXTAUTH_SECRET = 'short'
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(validateAuthSecret()).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith('[AUTH] NEXTAUTH_SECRET is too short (minimum 32 characters)')

      consoleSpy.mockRestore()
    })
  })

  describe('isJWTError', () => {
    it('should identify JWT decryption errors', () => {
      const error = new Error('no matching decryption secret')
      expect(isJWTError(error)).toBe(true)
    })

    it('should identify JWT session errors', () => {
      const error = new Error('JWTSessionError: token invalid')
      expect(isJWTError(error)).toBe(true)
    })

    it('should identify malformed JWT errors', () => {
      const error = new Error('JWT malformed')
      expect(isJWTError(error)).toBe(true)
    })

    it('should not identify generic errors as JWT errors', () => {
      const error = new Error('Database connection failed')
      expect(isJWTError(error)).toBe(false)
    })
  })
})