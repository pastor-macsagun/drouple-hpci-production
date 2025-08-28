import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UserRole } from '@prisma/client'
import { getAccessibleChurchIds, createTenantWhereClause, getCurrentUser, hasAnyRole, hasMinRole, canManageEntity } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    localChurch: {
      findMany: vi.fn(),
    }
  }
}))

// Mock Auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn()
}))

describe('SUPER_ADMIN RBAC Tests', () => {
  const mockSuperAdmin = {
    role: UserRole.SUPER_ADMIN,
    tenantId: null,
  }

  const mockAdmin = {
    role: UserRole.ADMIN,
    tenantId: 'church-1',
  }

  const mockMember = {
    role: UserRole.MEMBER,
    tenantId: 'church-2',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAccessibleChurchIds', () => {
    it('should return all church IDs for SUPER_ADMIN', async () => {
      const mockChurches = [
        { id: 'church-1' },
        { id: 'church-2' },
        { id: 'church-3' }
      ]
      
      vi.mocked(prisma.localChurch.findMany).mockResolvedValue(mockChurches)

      const result = await getAccessibleChurchIds(mockSuperAdmin)
      
      expect(result).toEqual(['church-1', 'church-2', 'church-3'])
      expect(prisma.localChurch.findMany).toHaveBeenCalledWith({
        select: { id: true }
      })
    })

    it('should return single church ID for ADMIN', async () => {
      const result = await getAccessibleChurchIds(mockAdmin)
      
      expect(result).toEqual(['church-1'])
      expect(prisma.localChurch.findMany).not.toHaveBeenCalled()
    })

    it('should return empty array for user without tenantId', async () => {
      const userWithoutTenant = {
        role: UserRole.MEMBER,
        tenantId: null,
      }

      const result = await getAccessibleChurchIds(userWithoutTenant)
      
      expect(result).toEqual([])
    })

    it('should throw error for null user', async () => {
      await expect(getAccessibleChurchIds(null)).rejects.toThrow('No user provided for tenant scoping')
    })
  })

  describe('createTenantWhereClause', () => {
    it('should allow SUPER_ADMIN access to all churches when no override', async () => {
      const mockChurches = [
        { id: 'church-1' },
        { id: 'church-2' }
      ]
      
      vi.mocked(prisma.localChurch.findMany).mockResolvedValue(mockChurches)

      const result = await createTenantWhereClause(mockSuperAdmin)
      
      expect(result).toEqual({
        tenantId: { in: ['church-1', 'church-2'] }
      })
    })

    it('should enforce church override for SUPER_ADMIN', async () => {
      const mockChurches = [
        { id: 'church-1' },
        { id: 'church-2' }
      ]
      
      vi.mocked(prisma.localChurch.findMany).mockResolvedValue(mockChurches)

      const result = await createTenantWhereClause(mockSuperAdmin, {}, 'church-1')
      
      expect(result).toEqual({
        tenantId: 'church-1'
      })
    })

    it('should restrict ADMIN to their tenant', async () => {
      const result = await createTenantWhereClause(mockAdmin)
      
      expect(result).toEqual({
        tenantId: 'church-1'
      })
    })

    it('should return empty results for user without tenant', async () => {
      const userWithoutTenant = {
        role: UserRole.MEMBER,
        tenantId: null,
      }

      const result = await createTenantWhereClause(userWithoutTenant)
      
      expect(result).toEqual({
        tenantId: { in: [] }
      })
    })
  })

  describe('hasAnyRole', () => {
    it('should always return true for SUPER_ADMIN', () => {
      expect(hasAnyRole(UserRole.SUPER_ADMIN, [UserRole.MEMBER])).toBe(true)
      expect(hasAnyRole(UserRole.SUPER_ADMIN, [UserRole.ADMIN, UserRole.PASTOR])).toBe(true)
    })

    it('should check role inclusion for non-super users', () => {
      expect(hasAnyRole(UserRole.ADMIN, [UserRole.ADMIN, UserRole.PASTOR])).toBe(true)
      expect(hasAnyRole(UserRole.MEMBER, [UserRole.ADMIN, UserRole.PASTOR])).toBe(false)
    })
  })

  describe('hasMinRole', () => {
    it('should always return true for SUPER_ADMIN', () => {
      expect(hasMinRole(UserRole.SUPER_ADMIN, UserRole.PASTOR)).toBe(true)
      expect(hasMinRole(UserRole.SUPER_ADMIN, UserRole.MEMBER)).toBe(true)
    })

    it('should check role hierarchy for non-super users', () => {
      expect(hasMinRole(UserRole.ADMIN, UserRole.MEMBER)).toBe(true)
      expect(hasMinRole(UserRole.MEMBER, UserRole.ADMIN)).toBe(false)
    })
  })

  describe('canManageEntity', () => {
    it('should allow SUPER_ADMIN all actions on all entities', () => {
      const entities = ['church', 'localChurch', 'user', 'lifeGroup', 'event', 'pathway'] as const
      const actions = ['create', 'read', 'update', 'delete'] as const

      entities.forEach(entity => {
        actions.forEach(action => {
          expect(canManageEntity(UserRole.SUPER_ADMIN, entity, action)).toBe(true)
        })
      })
    })

    it('should restrict church management to SUPER_ADMIN only', () => {
      const nonSuperRoles = [UserRole.PASTOR, UserRole.ADMIN, UserRole.VIP, UserRole.LEADER, UserRole.MEMBER]
      const actions = ['create', 'update', 'delete'] as const

      nonSuperRoles.forEach(role => {
        actions.forEach(action => {
          expect(canManageEntity(role, 'church', action)).toBe(false)
        })
      })
    })

    it('should allow PASTOR and ADMIN limited church read access', () => {
      expect(canManageEntity(UserRole.PASTOR, 'church', 'read')).toBe(true)
      expect(canManageEntity(UserRole.ADMIN, 'church', 'read')).toBe(true)
      expect(canManageEntity(UserRole.VIP, 'church', 'read')).toBe(false)
    })
  })
})