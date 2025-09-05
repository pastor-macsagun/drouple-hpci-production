import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { JwtService } from '../jwt'
import { createClaims } from '../claims'
import { UserRole } from '@prisma/client'

describe('JwtService', () => {
  let jwtService: JwtService
  const originalEnv = process.env

  beforeEach(() => {
    // Mock environment variable
    process.env.AUTH_SECRET = 'test-secret-key-for-jwt-testing-purposes-only'
    JwtService.resetInstance() // Reset singleton for each test
    jwtService = JwtService.getInstance()
  })

  afterEach(() => {
    process.env = originalEnv
    JwtService.resetInstance()
  })

  describe('signJwt', () => {
    it('should sign a JWT token with valid claims', async () => {
      const claims = createClaims('user123', 'tenant456', [UserRole.MEMBER], 900)
      
      const token = await jwtService.signJwt(claims)
      
      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should create tokens with different claims', async () => {
      const claims1 = createClaims('user1', 'tenant1', [UserRole.MEMBER], 900)
      const claims2 = createClaims('user2', 'tenant2', [UserRole.ADMIN], 900)
      
      const token1 = await jwtService.signJwt(claims1)
      const token2 = await jwtService.signJwt(claims2)
      
      expect(token1).not.toBe(token2)
    })
  })

  describe('verifyJwt', () => {
    it('should verify a valid JWT token', async () => {
      const originalClaims = createClaims('user123', 'tenant456', [UserRole.MEMBER], 900)
      const token = await jwtService.signJwt(originalClaims)
      
      const verifiedClaims = await jwtService.verifyJwt(token)
      
      expect(verifiedClaims.sub).toBe('user123')
      expect(verifiedClaims.tenantId).toBe('tenant456')
      expect(verifiedClaims.roles).toEqual([UserRole.MEMBER])
      expect(verifiedClaims.iat).toBeTypeOf('number')
      expect(verifiedClaims.exp).toBeTypeOf('number')
    })

    it('should reject an invalid token', async () => {
      const invalidToken = 'invalid.token.here'
      
      await expect(jwtService.verifyJwt(invalidToken)).rejects.toThrow('Invalid token')
    })

    it('should reject an expired token', async () => {
      // Create an expired token
      const expiredClaims = createClaims('user123', 'tenant456', [UserRole.MEMBER], -1)
      const token = await jwtService.signJwt(expiredClaims)
      
      await expect(jwtService.verifyJwt(token)).rejects.toThrow('Token expired')
    })

    it('should handle null tenantId', async () => {
      const claims = createClaims('user123', null, [UserRole.SUPER_ADMIN], 900)
      const token = await jwtService.signJwt(claims)
      
      const verifiedClaims = await jwtService.verifyJwt(token)
      
      expect(verifiedClaims.tenantId).toBeNull()
    })
  })

  describe('isTokenExpired', () => {
    it('should return false for a valid token', async () => {
      const claims = createClaims('user123', 'tenant456', [UserRole.MEMBER], 900)
      const token = await jwtService.signJwt(claims)
      
      const isExpired = await jwtService.isTokenExpired(token)
      
      expect(isExpired).toBe(false)
    })

    it('should return true for an expired token', async () => {
      const expiredClaims = createClaims('user123', 'tenant456', [UserRole.MEMBER], -1)
      const token = await jwtService.signJwt(expiredClaims)
      
      const isExpired = await jwtService.isTokenExpired(token)
      
      expect(isExpired).toBe(true)
    })

    it('should return true for an invalid token', async () => {
      const invalidToken = 'invalid.token.here'
      
      const isExpired = await jwtService.isTokenExpired(invalidToken)
      
      expect(isExpired).toBe(true)
    })
  })

  describe('getTokenExpirationTime', () => {
    it('should return expiration time for a valid token', async () => {
      const claims = createClaims('user123', 'tenant456', [UserRole.MEMBER], 900)
      const token = await jwtService.signJwt(claims)
      
      const expTime = await jwtService.getTokenExpirationTime(token)
      
      expect(expTime).toBeTypeOf('number')
      expect(expTime).toBeGreaterThan(Math.floor(Date.now() / 1000))
    })

    it('should return null for an invalid token', async () => {
      const invalidToken = 'invalid.token.here'
      
      const expTime = await jwtService.getTokenExpirationTime(invalidToken)
      
      expect(expTime).toBeNull()
    })
  })

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = JwtService.getInstance()
      const instance2 = JwtService.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })

  describe('error handling', () => {
    it('should throw error when AUTH_SECRET is missing', () => {
      delete process.env.AUTH_SECRET
      delete process.env.NEXTAUTH_SECRET
      JwtService.resetInstance() // Reset after env change
      
      expect(() => JwtService.getInstance()).toThrow('AUTH_SECRET or NEXTAUTH_SECRET environment variable is required')
    })
  })
})