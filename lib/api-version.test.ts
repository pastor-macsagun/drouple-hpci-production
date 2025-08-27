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

    it('should extract version from v2 path', () => {
      const result = getApiVersion('/api/v2/users')
      expect(result).toBe('v2')
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

    it('should transform user data for v2 with nested structure', () => {
      const result = responseTransformers.v2.user(mockUser)
      
      expect(result).toEqual({
        id: 'user123',
        email: 'test@test.com',
        profile: {
          name: 'Test User',
          bio: 'Test bio',
          phone: '+1234567890'
        },
        role: 'MEMBER',
        metadata: {
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z'
        }
      })
    })

    it('should transform event data with different field names in v2', () => {
      const mockEvent = {
        id: 'event123',
        name: 'Test Event',
        description: 'Event description',
        startDateTime: '2025-01-01T10:00:00Z',
        endDateTime: '2025-01-01T12:00:00Z',
        location: 'Test Location',
        capacity: 50,
        currentAttendees: 20
      }

      const v1Result = responseTransformers.v1.event(mockEvent)
      const v2Result = responseTransformers.v2.event(mockEvent)

      // v1 uses original field names
      expect(v1Result.name).toBe('Test Event')
      expect(v1Result.description).toBe('Event description')
      expect(v1Result.location).toBe('Test Location')

      // v2 uses renamed fields and nested structure
      expect(v2Result.title).toBe('Test Event') // name -> title
      expect(v2Result.content).toBe('Event description') // description -> content  
      expect(v2Result.venue).toBe('Test Location') // location -> venue
      expect(v2Result.schedule).toEqual({
        start: '2025-01-01T10:00:00Z',
        end: '2025-01-01T12:00:00Z'
      })
      expect(v2Result.capacity).toEqual({
        total: 50,
        available: 30
      })
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
      expect(SUPPORTED_VERSIONS).toContain('v2')
    })

    it('should have current version set', () => {
      expect(CURRENT_VERSION).toBe('v2')
    })
  })
})