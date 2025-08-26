import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UserRole } from '@prisma/client'

// Mock Next.js specific imports
vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn()
}))

vi.mock('@/app/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn()
    }
  }
}))

// Import after mocks
import { assertTenant, hasAnyRole, hasMinRole, canManageEntity } from '@/lib/rbac'

describe('RBAC Guards', () => {
  describe('hasMinRole', () => {
    it('should enforce role hierarchy', () => {
      // Member can only access MEMBER level
      expect(hasMinRole(UserRole.MEMBER, UserRole.MEMBER)).toBe(true)
      expect(hasMinRole(UserRole.MEMBER, UserRole.LEADER)).toBe(false)
      expect(hasMinRole(UserRole.MEMBER, UserRole.ADMIN)).toBe(false)

      // Leader can access MEMBER and LEADER levels
      expect(hasMinRole(UserRole.LEADER, UserRole.MEMBER)).toBe(true)
      expect(hasMinRole(UserRole.LEADER, UserRole.LEADER)).toBe(true)
      expect(hasMinRole(UserRole.LEADER, UserRole.ADMIN)).toBe(false)

      // Admin can access up to ADMIN level
      expect(hasMinRole(UserRole.ADMIN, UserRole.MEMBER)).toBe(true)
      expect(hasMinRole(UserRole.ADMIN, UserRole.LEADER)).toBe(true)
      expect(hasMinRole(UserRole.ADMIN, UserRole.ADMIN)).toBe(true)
      expect(hasMinRole(UserRole.ADMIN, UserRole.PASTOR)).toBe(false)

      // Pastor can access up to PASTOR level
      expect(hasMinRole(UserRole.PASTOR, UserRole.MEMBER)).toBe(true)
      expect(hasMinRole(UserRole.PASTOR, UserRole.ADMIN)).toBe(true)
      expect(hasMinRole(UserRole.PASTOR, UserRole.PASTOR)).toBe(true)
      expect(hasMinRole(UserRole.PASTOR, UserRole.SUPER_ADMIN)).toBe(false)

      // Super Admin can access everything
      expect(hasMinRole(UserRole.SUPER_ADMIN, UserRole.MEMBER)).toBe(true)
      expect(hasMinRole(UserRole.SUPER_ADMIN, UserRole.LEADER)).toBe(true)
      expect(hasMinRole(UserRole.SUPER_ADMIN, UserRole.ADMIN)).toBe(true)
      expect(hasMinRole(UserRole.SUPER_ADMIN, UserRole.PASTOR)).toBe(true)
      expect(hasMinRole(UserRole.SUPER_ADMIN, UserRole.SUPER_ADMIN)).toBe(true)
    })
  })

  describe('hasAnyRole', () => {
    it('should check if user has any of the allowed roles', () => {
      expect(hasAnyRole(UserRole.MEMBER, [UserRole.MEMBER, UserRole.LEADER])).toBe(true)
      expect(hasAnyRole(UserRole.LEADER, [UserRole.MEMBER, UserRole.LEADER])).toBe(true)
      expect(hasAnyRole(UserRole.ADMIN, [UserRole.MEMBER, UserRole.LEADER])).toBe(false)
      
      // Super Admin always has access
      expect(hasAnyRole(UserRole.SUPER_ADMIN, [])).toBe(true)
      expect(hasAnyRole(UserRole.SUPER_ADMIN, [UserRole.MEMBER])).toBe(true)
    })
  })

  describe('canManageEntity', () => {
    it('should enforce entity permissions', () => {
      // Church management - only SUPER_ADMIN
      expect(canManageEntity(UserRole.SUPER_ADMIN, 'church', 'create')).toBe(true)
      expect(canManageEntity(UserRole.PASTOR, 'church', 'create')).toBe(false)
      expect(canManageEntity(UserRole.ADMIN, 'church', 'create')).toBe(false)

      // LocalChurch management - SUPER_ADMIN and PASTOR can update
      expect(canManageEntity(UserRole.SUPER_ADMIN, 'localChurch', 'update')).toBe(true)
      expect(canManageEntity(UserRole.PASTOR, 'localChurch', 'update')).toBe(true)
      expect(canManageEntity(UserRole.ADMIN, 'localChurch', 'update')).toBe(false)

      // User management - ADMIN and above can update
      expect(canManageEntity(UserRole.SUPER_ADMIN, 'user', 'update')).toBe(true)
      expect(canManageEntity(UserRole.PASTOR, 'user', 'update')).toBe(true)
      expect(canManageEntity(UserRole.ADMIN, 'user', 'update')).toBe(true)
      expect(canManageEntity(UserRole.LEADER, 'user', 'update')).toBe(false)
      expect(canManageEntity(UserRole.MEMBER, 'user', 'update')).toBe(false)

      // LifeGroup management - Leaders can update
      expect(canManageEntity(UserRole.LEADER, 'lifeGroup', 'update')).toBe(true)
      expect(canManageEntity(UserRole.MEMBER, 'lifeGroup', 'update')).toBe(false)

      // Event management - only ADMIN and above can update
      expect(canManageEntity(UserRole.ADMIN, 'event', 'update')).toBe(true)
      expect(canManageEntity(UserRole.LEADER, 'event', 'update')).toBe(false)
      expect(canManageEntity(UserRole.LEADER, 'event', 'read')).toBe(true)

      // Pathway management - Leaders can update (progress)
      expect(canManageEntity(UserRole.ADMIN, 'pathway', 'update')).toBe(true)
      expect(canManageEntity(UserRole.LEADER, 'pathway', 'update')).toBe(true)
      expect(canManageEntity(UserRole.MEMBER, 'pathway', 'update')).toBe(false)
    })
  })

  describe('assertTenant', () => {
    it('should throw if entity localChurchId does not match actor', async () => {
      const entity = { localChurchId: 'church1' }
      const actorChurchId = 'church2'

      await expect(async () => {
        await assertTenant(entity, actorChurchId)
      }).rejects.toThrow('Access denied: different tenant')
    })

    it('should not throw if localChurchIds match', async () => {
      const entity = { localChurchId: 'church1' }
      const actorChurchId = 'church1'

      await expect(assertTenant(entity, actorChurchId)).resolves.not.toThrow()
    })

    it('should handle string entityId', async () => {
      const entityId = 'church1'
      const actorChurchId = 'church1'

      await expect(assertTenant(entityId, actorChurchId)).resolves.not.toThrow()
    })

    it('should throw if entity has no localChurchId', async () => {
      const entity = { localChurchId: null }
      const actorChurchId = 'church1'

      await expect(async () => {
        await assertTenant(entity, actorChurchId)
      }).rejects.toThrow('Entity has no localChurchId')
    })
  })
})