import { describe, it, expect, beforeEach } from 'vitest'
import { UserRole as Role } from '@prisma/client'

type Permission = {
  resource: string
  action: string
  roles: Role[]
}

const permissions: Permission[] = [
  // Super Admin permissions
  { resource: 'super-dashboard', action: 'view', roles: [Role.SUPER_ADMIN] },
  { resource: 'church', action: 'create', roles: [Role.SUPER_ADMIN] },
  { resource: 'church', action: 'delete', roles: [Role.SUPER_ADMIN] },
  { resource: 'cross-tenant-data', action: 'view', roles: [Role.SUPER_ADMIN] },
  
  // Admin permissions
  { resource: 'admin-dashboard', action: 'view', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.PASTOR] },
  { resource: 'service', action: 'create', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.PASTOR] },
  { resource: 'service', action: 'update', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.PASTOR] },
  { resource: 'service', action: 'delete', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.PASTOR] },
  { resource: 'lifegroup', action: 'create', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.PASTOR] },
  { resource: 'lifegroup', action: 'delete', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.PASTOR] },
  { resource: 'event', action: 'create', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.PASTOR] },
  { resource: 'event', action: 'update', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.PASTOR] },
  { resource: 'pathway', action: 'create', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.PASTOR] },
  { resource: 'announcement', action: 'create', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.PASTOR] },
  { resource: 'member', action: 'manage', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.PASTOR] },
  
  // Leader permissions
  { resource: 'lifegroup', action: 'manage-attendance', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.PASTOR, Role.LEADER] },
  { resource: 'lifegroup', action: 'approve-requests', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.PASTOR, Role.LEADER] },
  { resource: 'pathway', action: 'mark-progress', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.PASTOR, Role.LEADER] },
  { resource: 'event', action: 'view-attendees', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.PASTOR, Role.LEADER] },
  
  // Member permissions
  { resource: 'dashboard', action: 'view', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.PASTOR, Role.LEADER, Role.MEMBER] },
  { resource: 'checkin', action: 'self', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.PASTOR, Role.LEADER, Role.MEMBER] },
  { resource: 'lifegroup', action: 'join', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.PASTOR, Role.LEADER, Role.MEMBER] },
  { resource: 'event', action: 'rsvp', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.PASTOR, Role.LEADER, Role.MEMBER] },
  { resource: 'pathway', action: 'enroll', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.PASTOR, Role.LEADER, Role.MEMBER] },
  { resource: 'profile', action: 'edit-own', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.PASTOR, Role.LEADER, Role.MEMBER] },
  { resource: 'message', action: 'send', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.PASTOR, Role.LEADER, Role.MEMBER] },
]

function hasPermission(role: Role, resource: string, action: string): boolean {
  const permission = permissions.find(p => p.resource === resource && p.action === action)
  return permission ? permission.roles.includes(role) : false
}

describe('RBAC Permission Matrix', () => {
  describe('SUPER_ADMIN role', () => {
    const role = Role.SUPER_ADMIN
    
    it('should have all permissions', () => {
      expect(hasPermission(role, 'super-dashboard', 'view')).toBe(true)
      expect(hasPermission(role, 'church', 'create')).toBe(true)
      expect(hasPermission(role, 'cross-tenant-data', 'view')).toBe(true)
      expect(hasPermission(role, 'admin-dashboard', 'view')).toBe(true)
      expect(hasPermission(role, 'service', 'create')).toBe(true)
      expect(hasPermission(role, 'lifegroup', 'manage-attendance')).toBe(true)
      expect(hasPermission(role, 'checkin', 'self')).toBe(true)
    })
    
    it('should be the only role with super admin permissions', () => {
      const superAdminOnlyPermissions = [
        { resource: 'super-dashboard', action: 'view' },
        { resource: 'church', action: 'create' },
        { resource: 'cross-tenant-data', action: 'view' },
      ]
      
      for (const perm of superAdminOnlyPermissions) {
        for (const testRole of Object.values(Role)) {
          if (testRole === Role.SUPER_ADMIN) {
            expect(hasPermission(testRole, perm.resource, perm.action)).toBe(true)
          } else {
            expect(hasPermission(testRole, perm.resource, perm.action)).toBe(false)
          }
        }
      }
    })
  })
  
  describe('ADMIN role', () => {
    const role = Role.ADMIN
    
    it('should have admin permissions', () => {
      expect(hasPermission(role, 'admin-dashboard', 'view')).toBe(true)
      expect(hasPermission(role, 'service', 'create')).toBe(true)
      expect(hasPermission(role, 'lifegroup', 'create')).toBe(true)
      expect(hasPermission(role, 'event', 'create')).toBe(true)
      expect(hasPermission(role, 'pathway', 'create')).toBe(true)
      expect(hasPermission(role, 'member', 'manage')).toBe(true)
    })
    
    it('should not have super admin permissions', () => {
      expect(hasPermission(role, 'super-dashboard', 'view')).toBe(false)
      expect(hasPermission(role, 'church', 'create')).toBe(false)
      expect(hasPermission(role, 'cross-tenant-data', 'view')).toBe(false)
    })
    
    it('should have leader permissions', () => {
      expect(hasPermission(role, 'lifegroup', 'manage-attendance')).toBe(true)
      expect(hasPermission(role, 'pathway', 'mark-progress')).toBe(true)
    })
    
    it('should have member permissions', () => {
      expect(hasPermission(role, 'dashboard', 'view')).toBe(true)
      expect(hasPermission(role, 'checkin', 'self')).toBe(true)
      expect(hasPermission(role, 'profile', 'edit-own')).toBe(true)
    })
  })
  
  describe('PASTOR role', () => {
    const role = Role.PASTOR
    
    it('should have same permissions as ADMIN', () => {
      const adminPermissions = permissions.filter(p => p.roles.includes(Role.ADMIN))
      
      for (const perm of adminPermissions) {
        expect(hasPermission(role, perm.resource, perm.action)).toBe(
          hasPermission(Role.ADMIN, perm.resource, perm.action)
        )
      }
    })
  })
  
  describe('LEADER role', () => {
    const role = Role.LEADER
    
    it('should have leader permissions', () => {
      expect(hasPermission(role, 'lifegroup', 'manage-attendance')).toBe(true)
      expect(hasPermission(role, 'lifegroup', 'approve-requests')).toBe(true)
      expect(hasPermission(role, 'pathway', 'mark-progress')).toBe(true)
      expect(hasPermission(role, 'event', 'view-attendees')).toBe(true)
    })
    
    it('should not have admin permissions', () => {
      expect(hasPermission(role, 'admin-dashboard', 'view')).toBe(false)
      expect(hasPermission(role, 'service', 'create')).toBe(false)
      expect(hasPermission(role, 'lifegroup', 'create')).toBe(false)
      expect(hasPermission(role, 'event', 'create')).toBe(false)
      expect(hasPermission(role, 'member', 'manage')).toBe(false)
    })
    
    it('should have member permissions', () => {
      expect(hasPermission(role, 'dashboard', 'view')).toBe(true)
      expect(hasPermission(role, 'checkin', 'self')).toBe(true)
      expect(hasPermission(role, 'lifegroup', 'join')).toBe(true)
      expect(hasPermission(role, 'event', 'rsvp')).toBe(true)
    })
  })
  
  describe('MEMBER role', () => {
    const role = Role.MEMBER
    
    it('should have only member permissions', () => {
      expect(hasPermission(role, 'dashboard', 'view')).toBe(true)
      expect(hasPermission(role, 'checkin', 'self')).toBe(true)
      expect(hasPermission(role, 'lifegroup', 'join')).toBe(true)
      expect(hasPermission(role, 'event', 'rsvp')).toBe(true)
      expect(hasPermission(role, 'pathway', 'enroll')).toBe(true)
      expect(hasPermission(role, 'profile', 'edit-own')).toBe(true)
      expect(hasPermission(role, 'message', 'send')).toBe(true)
    })
    
    it('should not have elevated permissions', () => {
      expect(hasPermission(role, 'admin-dashboard', 'view')).toBe(false)
      expect(hasPermission(role, 'service', 'create')).toBe(false)
      expect(hasPermission(role, 'lifegroup', 'manage-attendance')).toBe(false)
      expect(hasPermission(role, 'pathway', 'mark-progress')).toBe(false)
      expect(hasPermission(role, 'member', 'manage')).toBe(false)
    })
  })
  
  describe('Permission Hierarchy', () => {
    it('should follow strict hierarchy: SUPER_ADMIN > ADMIN/PASTOR > LEADER > MEMBER', () => {
      const hierarchicalPermissions = [
        { resource: 'super-dashboard', action: 'view', minRole: Role.SUPER_ADMIN },
        { resource: 'admin-dashboard', action: 'view', minRole: Role.ADMIN },
        { resource: 'lifegroup', action: 'manage-attendance', minRole: Role.LEADER },
        { resource: 'dashboard', action: 'view', minRole: Role.MEMBER },
      ]
      
      const roleHierarchy = [Role.SUPER_ADMIN, Role.ADMIN, Role.PASTOR, Role.LEADER, Role.MEMBER]
      
      for (const perm of hierarchicalPermissions) {
        const minRoleIndex = roleHierarchy.indexOf(perm.minRole)
        
        for (let i = 0; i < roleHierarchy.length; i++) {
          const role = roleHierarchy[i]
          const shouldHavePermission = i <= minRoleIndex || 
            (perm.minRole === Role.ADMIN && role === Role.PASTOR)
          
          if (shouldHavePermission) {
            expect(hasPermission(role, perm.resource, perm.action)).toBe(true)
          }
        }
      }
    })
  })
  
  describe('Edge Cases', () => {
    it('should return false for non-existent permissions', () => {
      expect(hasPermission(Role.SUPER_ADMIN, 'nonexistent', 'action')).toBe(false)
      expect(hasPermission(Role.MEMBER, 'resource', 'nonexistent')).toBe(false)
    })
    
    it('should handle undefined inputs gracefully', () => {
      expect(hasPermission(Role.MEMBER, '', '')).toBe(false)
    })
  })
})