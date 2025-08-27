import { describe, it, expect } from 'vitest'
import { generate2FASecret, verify2FAToken, is2FARequired, is2FAEnabled } from '@/lib/2fa'
import { authenticator } from 'otplib'

describe('Two-Factor Authentication', () => {
  describe('generate2FASecret', () => {
    it('should generate a valid secret', () => {
      const secret = generate2FASecret()
      expect(secret).toBeDefined()
      expect(typeof secret).toBe('string')
      expect(secret.length).toBeGreaterThan(10)
    })

    it('should generate different secrets on each call', () => {
      const secret1 = generate2FASecret()
      const secret2 = generate2FASecret()
      expect(secret1).not.toBe(secret2)
    })
  })

  describe('verify2FAToken', () => {
    it('should verify valid token', () => {
      const secret = generate2FASecret()
      const token = authenticator.generate(secret)
      
      const isValid = verify2FAToken(token, secret)
      expect(isValid).toBe(true)
    })

    it('should reject invalid token', () => {
      const secret = generate2FASecret()
      const invalidToken = '123456'
      
      const isValid = verify2FAToken(invalidToken, secret)
      expect(isValid).toBe(false)
    })

    it('should reject malformed token', () => {
      const secret = generate2FASecret()
      
      expect(verify2FAToken('abc123', secret)).toBe(false)
      expect(verify2FAToken('12345', secret)).toBe(false) // Too short
      expect(verify2FAToken('1234567', secret)).toBe(false) // Too long
      expect(verify2FAToken('', secret)).toBe(false)
    })

    it('should handle token with spaces', () => {
      const secret = generate2FASecret()
      const token = authenticator.generate(secret)
      const tokenWithSpaces = `${token.slice(0, 3)} ${token.slice(3)}`
      
      const isValid = verify2FAToken(tokenWithSpaces, secret)
      expect(isValid).toBe(true)
    })
  })

  describe('is2FARequired', () => {
    it('should require 2FA for PASTOR role', () => {
      expect(is2FARequired('PASTOR')).toBe(true)
    })

    it('should require 2FA for ADMIN role', () => {
      expect(is2FARequired('ADMIN')).toBe(true)
    })

    it('should not require 2FA for other roles', () => {
      expect(is2FARequired('MEMBER')).toBe(false)
      expect(is2FARequired('LEADER')).toBe(false)
      expect(is2FARequired('VIP')).toBe(false)
      expect(is2FARequired('SUPER_ADMIN')).toBe(false)
    })
  })

  describe('is2FAEnabled', () => {
    it('should return false when ENABLE_2FA is not set', () => {
      const originalValue = process.env.ENABLE_2FA
      delete process.env.ENABLE_2FA
      
      expect(is2FAEnabled()).toBe(false)
      
      // Restore
      if (originalValue) process.env.ENABLE_2FA = originalValue
    })

    it('should return false when ENABLE_2FA is false', () => {
      const originalValue = process.env.ENABLE_2FA
      process.env.ENABLE_2FA = 'false'
      
      expect(is2FAEnabled()).toBe(false)
      
      // Restore
      if (originalValue) process.env.ENABLE_2FA = originalValue
    })

    it('should return true when ENABLE_2FA is true', () => {
      const originalValue = process.env.ENABLE_2FA
      process.env.ENABLE_2FA = 'true'
      
      expect(is2FAEnabled()).toBe(true)
      
      // Restore
      if (originalValue) process.env.ENABLE_2FA = originalValue
    })
  })
})