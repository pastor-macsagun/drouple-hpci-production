import { describe, it, expect, vi } from 'vitest'
import { UserRole } from '@prisma/client'

// Mock Next.js specific imports
vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn()
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    }
  }
}))

// Import functions after mocks
import { hasMinRole, hasAnyRole, canManageEntity } from './rbac'

describe('RBAC Utilities', () => {
  describe('hasMinRole', () => {
    it('should return true when user has exact role', () => {
      expect(hasMinRole(UserRole.ADMIN, UserRole.ADMIN)).toBe(true)
    })

    it('should return true when user has higher role', () => {
      expect(hasMinRole(UserRole.PASTOR, UserRole.ADMIN)).toBe(true)
    })

    it('should return false when user has lower role', () => {
      expect(hasMinRole(UserRole.MEMBER, UserRole.LEADER)).toBe(false)
    })

    it('should return true for SUPER_ADMIN regardless of requirement', () => {
      expect(hasMinRole(UserRole.SUPER_ADMIN, UserRole.PASTOR)).toBe(true)
      expect(hasMinRole(UserRole.SUPER_ADMIN, UserRole.ADMIN)).toBe(true)
      expect(hasMinRole(UserRole.SUPER_ADMIN, UserRole.LEADER)).toBe(true)
      expect(hasMinRole(UserRole.SUPER_ADMIN, UserRole.MEMBER)).toBe(true)
    })
  })

  describe('hasAnyRole', () => {
    it('should return true when user has one of the roles', () => {
      expect(hasAnyRole(UserRole.LEADER, [UserRole.LEADER, UserRole.ADMIN])).toBe(true)
    })

    it('should return false when user has none of the roles', () => {
      expect(hasAnyRole(UserRole.MEMBER, [UserRole.LEADER, UserRole.ADMIN])).toBe(false)
    })

    it('should return false for empty roles array', () => {
      expect(hasAnyRole(UserRole.ADMIN, [])).toBe(false)
    })

    it('should return true for SUPER_ADMIN with any roles', () => {
      expect(hasAnyRole(UserRole.SUPER_ADMIN, [UserRole.MEMBER])).toBe(true)
      expect(hasAnyRole(UserRole.SUPER_ADMIN, [])).toBe(true)
    })
  })

  describe('canManageEntity', () => {
    describe('User management', () => {
      it('SUPER_ADMIN can manage any user', () => {
        expect(canManageEntity(UserRole.SUPER_ADMIN, 'user', 'update')).toBe(true)
      })

      it('PASTOR can manage users', () => {
        expect(canManageEntity(UserRole.PASTOR, 'user', 'update')).toBe(true)
      })

      it('ADMIN can manage users', () => {
        expect(canManageEntity(UserRole.ADMIN, 'user', 'update')).toBe(true)
      })

      it('LEADER cannot manage users', () => {
        expect(canManageEntity(UserRole.LEADER, 'user', 'update')).toBe(false)
      })

      it('MEMBER cannot manage users', () => {
        expect(canManageEntity(UserRole.MEMBER, 'user', 'update')).toBe(false)
      })
    })

    describe('Service management', () => {
      it('only ADMIN and above can manage services', () => {
        expect(canManageEntity(UserRole.SUPER_ADMIN, 'user', 'update')).toBe(true)
        expect(canManageEntity(UserRole.PASTOR, 'user', 'update')).toBe(true)
        expect(canManageEntity(UserRole.ADMIN, 'user', 'update')).toBe(true)
        expect(canManageEntity(UserRole.LEADER, 'user', 'update')).toBe(false)
        expect(canManageEntity(UserRole.MEMBER, 'user', 'update')).toBe(false)
      })
    })

    describe('LifeGroup management', () => {
      it('LEADER and above can manage life groups', () => {
        expect(canManageEntity(UserRole.SUPER_ADMIN, 'lifeGroup', 'update')).toBe(true)
        expect(canManageEntity(UserRole.PASTOR, 'lifeGroup', 'update')).toBe(true)
        expect(canManageEntity(UserRole.ADMIN, 'lifeGroup', 'update')).toBe(true)
        expect(canManageEntity(UserRole.LEADER, 'lifeGroup', 'update')).toBe(true)
        expect(canManageEntity(UserRole.MEMBER, 'lifeGroup', 'update')).toBe(false)
      })
    })

    describe('Event management', () => {
      it('LEADER can read events', () => {
        expect(canManageEntity(UserRole.SUPER_ADMIN, 'event', 'update')).toBe(true)
        expect(canManageEntity(UserRole.PASTOR, 'event', 'update')).toBe(true)
        expect(canManageEntity(UserRole.ADMIN, 'event', 'update')).toBe(true)
        expect(canManageEntity(UserRole.LEADER, 'event', 'update')).toBe(false)
        expect(canManageEntity(UserRole.LEADER, 'event', 'read')).toBe(true)
        expect(canManageEntity(UserRole.MEMBER, 'event', 'update')).toBe(false)
      })
    })

    describe('Pathway management', () => {
      it('only ADMIN and above can manage pathways', () => {
        expect(canManageEntity(UserRole.SUPER_ADMIN, 'pathway', 'update')).toBe(true)
        expect(canManageEntity(UserRole.PASTOR, 'pathway', 'update')).toBe(true)
        expect(canManageEntity(UserRole.ADMIN, 'pathway', 'update')).toBe(true)
        expect(canManageEntity(UserRole.LEADER, 'pathway', 'update')).toBe(true) // Leaders can update progress
        expect(canManageEntity(UserRole.MEMBER, 'pathway', 'update')).toBe(false)
      })
    })

    describe('Church management', () => {
      it('only SUPER_ADMIN can manage churches', () => {
        expect(canManageEntity(UserRole.SUPER_ADMIN, 'church', 'update')).toBe(true)
        expect(canManageEntity(UserRole.PASTOR, 'church', 'update')).toBe(false)
        expect(canManageEntity(UserRole.ADMIN, 'church', 'update')).toBe(false)
        expect(canManageEntity(UserRole.LEADER, 'church', 'update')).toBe(false)
        expect(canManageEntity(UserRole.MEMBER, 'church', 'update')).toBe(false)
      })
    })

    describe('LocalChurch management', () => {
      it('only SUPER_ADMIN and PASTOR can manage local churches', () => {
        expect(canManageEntity(UserRole.SUPER_ADMIN, 'localChurch', 'update')).toBe(true)
        expect(canManageEntity(UserRole.PASTOR, 'localChurch', 'update')).toBe(true)
        expect(canManageEntity(UserRole.ADMIN, 'localChurch', 'update')).toBe(false)
        expect(canManageEntity(UserRole.LEADER, 'localChurch', 'update')).toBe(false)
        expect(canManageEntity(UserRole.MEMBER, 'localChurch', 'update')).toBe(false)
      })
    })
  })

  describe('Role hierarchy', () => {
    it('should correctly order roles by hierarchy', () => {
      // Each role should have min access to itself and lower roles
      expect(hasMinRole(UserRole.SUPER_ADMIN, UserRole.SUPER_ADMIN)).toBe(true)
      expect(hasMinRole(UserRole.SUPER_ADMIN, UserRole.PASTOR)).toBe(true)
      expect(hasMinRole(UserRole.SUPER_ADMIN, UserRole.MEMBER)).toBe(true)
      
      expect(hasMinRole(UserRole.PASTOR, UserRole.PASTOR)).toBe(true)
      expect(hasMinRole(UserRole.PASTOR, UserRole.ADMIN)).toBe(true)
      expect(hasMinRole(UserRole.PASTOR, UserRole.SUPER_ADMIN)).toBe(false)
      
      expect(hasMinRole(UserRole.MEMBER, UserRole.MEMBER)).toBe(true)
      expect(hasMinRole(UserRole.MEMBER, UserRole.LEADER)).toBe(false)
    })
  })
})