import { describe, it, expect } from 'vitest'
import {
  getApiVersion,
  responseTransformers,
  isVersionCompatible,
  SUPPORTED_VERSIONS,
  CURRENT_VERSION
} from './api-version'

describe('API Versioning', () => {
  describe('getApiVersion', () => {
    it('should extract version from v1 path', () => {
      const result = getApiVersion('/api/v1/users')
      expect(result).toBe('v1')
    })

    it('should return null for removed v2 path', () => {
      const result = getApiVersion('/api/v2/users')
      expect(result).toBe(null)
    })

    it('should return null for non-versioned path', () => {
      const result = getApiVersion('/api/health')
      expect(result).toBe(null)
    })

    it('should return null for unsupported version', () => {
      const result = getApiVersion('/api/v3/users')
      expect(result).toBe(null)
    })
  })

  describe('responseTransformers', () => {
    const mockUser = {
      id: 'user123',
      email: 'test@test.com',
      name: 'Test User',
      bio: 'Test bio',
      phone: '+1234567890',
      role: 'MEMBER',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z'
    }

    it('should transform user data for v1', () => {
      const result = responseTransformers.v1.user(mockUser)
      
      expect(result).toEqual({
        id: 'user123',
        email: 'test@test.com',
        name: 'Test User',
        role: 'MEMBER',
        createdAt: '2025-01-01T00:00:00Z'
      })
      expect(result).not.toHaveProperty('bio')
      expect(result).not.toHaveProperty('phone')
    })

    it('should only have v1 transformer available', () => {
      expect(responseTransformers.v1).toBeDefined()
      expect(responseTransformers.v1.user).toBeDefined()
      expect(responseTransformers.v1.event).toBeDefined()
    })
  })

  describe('isVersionCompatible', () => {
    it('should return true for exact version match', () => {
      expect(isVersionCompatible('1.0.0', '1.0.0')).toBe(true)
    })

    it('should return true for newer version', () => {
      expect(isVersionCompatible('1.1.0', '1.0.0')).toBe(true)
      expect(isVersionCompatible('2.0.0', '1.0.0')).toBe(true)
    })

    it('should return false for older version', () => {
      expect(isVersionCompatible('0.9.0', '1.0.0')).toBe(false)
    })
  })

  describe('configuration', () => {
    it('should have supported versions configured', () => {
      expect(SUPPORTED_VERSIONS).toContain('v1')
      expect(SUPPORTED_VERSIONS).not.toContain('v2')
    })

    it('should have current version set', () => {
      expect(CURRENT_VERSION).toBe('v1')
    })
  })
})