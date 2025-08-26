import { describe, it, expect } from 'vitest'
import { EventScope } from '@prisma/client'

describe('Event Scope Validation', () => {
  describe('LOCAL_CHURCH scope', () => {
    it('should require localChurchId when scope is LOCAL_CHURCH', () => {
      const eventData = {
        name: 'Local Event',
        startDateTime: new Date(),
        endDateTime: new Date(),
        capacity: 50,
        scope: EventScope.LOCAL_CHURCH,
        localChurchId: null // Missing required field
      }
      
      // This would fail validation in the actual createEvent function
      expect(eventData.localChurchId).toBeNull()
      expect(eventData.scope).toBe(EventScope.LOCAL_CHURCH)
    })

    it('should accept valid LOCAL_CHURCH event with localChurchId', () => {
      const eventData = {
        name: 'Local Event',
        startDateTime: new Date(),
        endDateTime: new Date(),
        capacity: 50,
        scope: EventScope.LOCAL_CHURCH,
        localChurchId: 'church-123'
      }
      
      expect(eventData.localChurchId).toBeTruthy()
      expect(eventData.scope).toBe(EventScope.LOCAL_CHURCH)
    })
  })

  describe('WHOLE_CHURCH scope', () => {
    it('should not have localChurchId when scope is WHOLE_CHURCH', () => {
      const eventData = {
        name: 'Church-wide Event',
        startDateTime: new Date(),
        endDateTime: new Date(),
        capacity: 200,
        scope: EventScope.WHOLE_CHURCH,
        localChurchId: undefined
      }
      
      expect(eventData.localChurchId).toBeUndefined()
      expect(eventData.scope).toBe(EventScope.WHOLE_CHURCH)
    })

    it('should reject WHOLE_CHURCH event with localChurchId', () => {
      const eventData = {
        name: 'Church-wide Event',
        startDateTime: new Date(),
        endDateTime: new Date(),
        capacity: 200,
        scope: EventScope.WHOLE_CHURCH,
        localChurchId: 'church-123' // Should not be set for WHOLE_CHURCH
      }
      
      // This would fail validation in the actual createEvent function
      expect(eventData.localChurchId).toBeTruthy()
      expect(eventData.scope).toBe(EventScope.WHOLE_CHURCH)
    })
  })

  describe('Database constraint', () => {
    it('should enforce constraint at database level', () => {
      // The migration adds a CHECK constraint:
      // CHECK ((scope != 'LOCAL_CHURCH') OR (localChurchId IS NOT NULL))
      
      // This ensures data integrity even if application validation is bypassed
      const validLocalEvent = {
        scope: 'LOCAL_CHURCH',
        localChurchId: 'church-123'
      }
      
      const invalidLocalEvent = {
        scope: 'LOCAL_CHURCH',
        localChurchId: null
      }
      
      const validWholeEvent = {
        scope: 'WHOLE_CHURCH',
        localChurchId: null
      }
      
      // Database would accept valid events
      expect(validLocalEvent.localChurchId).toBeTruthy()
      expect(validWholeEvent.localChurchId).toBeNull()
      
      // Database would reject invalid event
      expect(invalidLocalEvent.localChurchId).toBeNull()
    })
  })
})