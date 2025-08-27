import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAccessibleChurchIds, createTenantWhereClause } from '@/lib/rbac'
import { UserRole } from '@prisma/client'
import { db } from '@/app/lib/db'

vi.mock('@/app/lib/db', () => ({
  db: {
    localChurch: {
      findMany: vi.fn()
    }
  }
}))

describe('Tenant Scoping', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAccessibleChurchIds', () => {
    it('throws error when no user provided', async () => {
      await expect(getAccessibleChurchIds(null)).rejects.toThrow('No user provided for tenant scoping')
    })

    it('returns empty array for user without tenantId (non-super-admin)', async () => {
      const user = { role: UserRole.ADMIN, tenantId: null }
      const result = await getAccessibleChurchIds(user)
      expect(result).toEqual([])
    })

    it('returns user tenantId for regular admin', async () => {
      const user = { role: UserRole.ADMIN, tenantId: 'church-manila' }
      const result = await getAccessibleChurchIds(user)
      expect(result).toEqual(['church-manila'])
    })

    it('returns all church IDs for super admin', async () => {
      const user = { role: UserRole.SUPER_ADMIN, tenantId: null }
      const mockChurches = [
        { id: 'church-manila' },
        { id: 'church-cebu' }
      ]
      
      vi.mocked(db.localChurch.findMany).mockResolvedValueOnce(mockChurches)
      
      const result = await getAccessibleChurchIds(user)
      expect(result).toEqual(['church-manila', 'church-cebu'])
      expect(db.localChurch.findMany).toHaveBeenCalledWith({
        select: { id: true }
      })
    })
  })

  describe('createTenantWhereClause', () => {
    it('returns zero-results clause for empty church access', async () => {
      const user = { role: UserRole.ADMIN, tenantId: null }
      const result = await createTenantWhereClause(user)
      
      expect(result).toEqual({
        tenantId: { in: [] }
      })
    })

    it('uses single tenantId for regular admin', async () => {
      const user = { role: UserRole.ADMIN, tenantId: 'church-manila' }
      const result = await createTenantWhereClause(user)
      
      expect(result).toEqual({
        tenantId: 'church-manila'
      })
    })

    it('supports localChurchId field name', async () => {
      const user = { role: UserRole.ADMIN, tenantId: 'church-manila' }
      const result = await createTenantWhereClause(user, {}, undefined, 'localChurchId')
      
      expect(result).toEqual({
        localChurchId: 'church-manila'
      })
    })

    it('supports church override with access validation', async () => {
      const user = { role: UserRole.ADMIN, tenantId: 'church-manila' }
      
      // Should work - user has access to their church
      const result1 = await createTenantWhereClause(user, {}, 'church-manila')
      expect(result1).toEqual({
        tenantId: 'church-manila'
      })
      
      // Should fail - user doesn't have access to different church
      await expect(createTenantWhereClause(user, {}, 'church-cebu'))
        .rejects.toThrow('Access denied: cannot access church church-cebu')
    })

    it('merges additional WHERE conditions', async () => {
      const user = { role: UserRole.ADMIN, tenantId: 'church-manila' }
      const additionalWhere = { status: 'ACTIVE', name: { contains: 'test' } }
      
      const result = await createTenantWhereClause(user, additionalWhere)
      expect(result).toEqual({
        status: 'ACTIVE',
        name: { contains: 'test' },
        tenantId: 'church-manila'
      })
    })

    it('returns multiple church access for super admin', async () => {
      const user = { role: UserRole.SUPER_ADMIN, tenantId: null }
      const mockChurches = [
        { id: 'church-manila' },
        { id: 'church-cebu' }
      ]
      
      vi.mocked(db.localChurch.findMany).mockResolvedValueOnce(mockChurches)
      
      const result = await createTenantWhereClause(user)
      expect(result).toEqual({
        tenantId: { in: ['church-manila', 'church-cebu'] }
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles empty additional where object', async () => {
      const user = { role: UserRole.ADMIN, tenantId: 'church-manila' }
      const result = await createTenantWhereClause(user, {})
      
      expect(result).toEqual({
        tenantId: 'church-manila'
      })
    })

    it('prevents Manila admin from accessing Cebu data via empty access', async () => {
      // Simulate user with no tenantId (edge case)
      const user = { role: UserRole.ADMIN, tenantId: null }
      const result = await createTenantWhereClause(user)
      
      // This should return a clause that yields zero results
      expect(result.tenantId).toEqual({ in: [] })
    })
  })
})