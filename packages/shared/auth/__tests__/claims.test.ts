import { describe, it, expect } from 'vitest'
import { createClaims, validateClaims } from '../claims'
import { UserRole } from '@prisma/client'

describe('Claims utilities', () => {
  describe('createClaims', () => {
    it('should create valid claims with default expiration', () => {
      const claims = createClaims('user123', 'tenant456', [UserRole.MEMBER])
      
      expect(claims.sub).toBe('user123')
      expect(claims.tenantId).toBe('tenant456')
      expect(claims.roles).toEqual([UserRole.MEMBER])
      expect(claims.iat).toBeTypeOf('number')
      expect(claims.exp).toBeTypeOf('number')
      expect(claims.exp - claims.iat).toBe(900) // Default 15 minutes
    })

    it('should create claims with custom expiration', () => {
      const customExpiration = 1800 // 30 minutes
      const claims = createClaims('user123', 'tenant456', [UserRole.ADMIN], customExpiration)
      
      expect(claims.exp - claims.iat).toBe(customExpiration)
    })

    it('should handle null tenantId', () => {
      const claims = createClaims('user123', null, [UserRole.SUPER_ADMIN])
      
      expect(claims.tenantId).toBeNull()
    })

    it('should handle multiple roles', () => {
      const roles = [UserRole.ADMIN, UserRole.LEADER]
      const claims = createClaims('user123', 'tenant456', roles)
      
      expect(claims.roles).toEqual(roles)
    })

    it('should set issued at time correctly', () => {
      const beforeTime = Math.floor(Date.now() / 1000)
      const claims = createClaims('user123', 'tenant456', [UserRole.MEMBER])
      const afterTime = Math.floor(Date.now() / 1000)
      
      expect(claims.iat).toBeGreaterThanOrEqual(beforeTime)
      expect(claims.iat).toBeLessThanOrEqual(afterTime)
    })
  })

  describe('validateClaims', () => {
    it('should validate correct claims structure', () => {
      const validClaims = createClaims('user123', 'tenant456', [UserRole.MEMBER])
      
      expect(validateClaims(validClaims)).toBe(true)
    })

    it('should reject claims with missing sub', () => {
      const invalidClaims = {
        tenantId: 'tenant456',
        roles: [UserRole.MEMBER],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900
      }
      
      expect(validateClaims(invalidClaims)).toBe(false)
    })

    it('should reject claims with invalid sub type', () => {
      const invalidClaims = {
        sub: 123, // Should be string
        tenantId: 'tenant456',
        roles: [UserRole.MEMBER],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900
      }
      
      expect(validateClaims(invalidClaims)).toBe(false)
    })

    it('should accept null tenantId', () => {
      const validClaims = createClaims('user123', null, [UserRole.SUPER_ADMIN])
      
      expect(validateClaims(validClaims)).toBe(true)
    })

    it('should reject invalid tenantId type', () => {
      const invalidClaims = {
        sub: 'user123',
        tenantId: 123, // Should be string or null
        roles: [UserRole.MEMBER],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900
      }
      
      expect(validateClaims(invalidClaims)).toBe(false)
    })

    it('should reject claims with non-array roles', () => {
      const invalidClaims = {
        sub: 'user123',
        tenantId: 'tenant456',
        roles: 'MEMBER', // Should be array
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900
      }
      
      expect(validateClaims(invalidClaims)).toBe(false)
    })

    it('should reject expired claims', () => {
      const expiredClaims = {
        sub: 'user123',
        tenantId: 'tenant456',
        roles: [UserRole.MEMBER],
        iat: Math.floor(Date.now() / 1000) - 1000,
        exp: Math.floor(Date.now() / 1000) - 100 // Expired
      }
      
      expect(validateClaims(expiredClaims)).toBe(false)
    })

    it('should reject claims with missing required fields', () => {
      const incompleteClaims = {
        sub: 'user123',
        roles: [UserRole.MEMBER]
        // Missing iat, exp, tenantId
      }
      
      expect(validateClaims(incompleteClaims)).toBe(false)
    })

    it('should reject non-object input', () => {
      expect(validateClaims('string')).toBe(false)
      expect(validateClaims(123)).toBe(false)
      expect(validateClaims(null)).toBe(false)
      expect(validateClaims(undefined)).toBe(false)
      expect(validateClaims([])).toBe(false)
    })
  })
})