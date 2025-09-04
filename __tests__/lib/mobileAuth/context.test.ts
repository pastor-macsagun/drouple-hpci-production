/**
 * Mobile Auth Context Utilities Tests
 * Tests for request context extraction and authorization helpers
 */

import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import {
  getMobileContext,
  requireMobileContext,
  hasRole,
  requireRole,
  validateTenantAccess,
  requireTenantAccess,
  hasChurchAccess,
  requireChurchAccess,
  type MobileRequestContext,
} from '@/lib/mobileAuth/context';

// Helper to create NextRequest with context header
function createRequestWithContext(context?: MobileRequestContext): NextRequest {
  const headers: Record<string, string> = {};
  if (context) {
    headers['x-mobile-context'] = JSON.stringify(context);
  }

  return new NextRequest('http://localhost/api/mobile/v1/test', {
    method: 'GET',
    headers,
  });
}

describe('Mobile Auth Context Utilities', () => {
  const mockContext: MobileRequestContext = {
    userId: 'user123',
    roles: ['MEMBER'],
    tenantId: 'tenant123',
    localChurchId: 'church123',
  };

  const adminContext: MobileRequestContext = {
    userId: 'admin123',
    roles: ['ADMIN'],
    tenantId: 'tenant123',
    localChurchId: 'church123',
  };

  const pastorContext: MobileRequestContext = {
    userId: 'pastor123',
    roles: ['PASTOR'],
    tenantId: 'tenant123',
  };

  describe('getMobileContext', () => {
    it('should extract context from request headers', () => {
      const request = createRequestWithContext(mockContext);
      const context = getMobileContext(request);

      expect(context).toEqual(mockContext);
    });

    it('should return null when no context header', () => {
      const request = createRequestWithContext();
      const context = getMobileContext(request);

      expect(context).toBeNull();
    });

    it('should return null when invalid JSON in header', () => {
      const request = new NextRequest('http://localhost/api/mobile/v1/test', {
        method: 'GET',
        headers: {
          'x-mobile-context': 'invalid-json',
        },
      });

      const context = getMobileContext(request);

      expect(context).toBeNull();
    });
  });

  describe('requireMobileContext', () => {
    it('should return context when present', () => {
      const request = createRequestWithContext(mockContext);
      const context = requireMobileContext(request);

      expect(context).toEqual(mockContext);
    });

    it('should throw error when no context', () => {
      const request = createRequestWithContext();
      
      expect(() => requireMobileContext(request)).toThrow('Authentication required');
    });
  });

  describe('hasRole', () => {
    it('should return true for exact role match', () => {
      expect(hasRole(mockContext, 'MEMBER')).toBe(true);
      expect(hasRole(adminContext, 'ADMIN')).toBe(true);
    });

    it('should return true for higher role', () => {
      expect(hasRole(adminContext, 'MEMBER')).toBe(true);
      expect(hasRole(adminContext, 'LEADER')).toBe(true);
      expect(hasRole(pastorContext, 'ADMIN')).toBe(true);
    });

    it('should return false for insufficient role', () => {
      expect(hasRole(mockContext, 'ADMIN')).toBe(false);
      expect(hasRole(mockContext, 'PASTOR')).toBe(false);
    });

    it('should handle multiple roles correctly', () => {
      const multiRoleContext: MobileRequestContext = {
        userId: 'user123',
        roles: ['MEMBER', 'LEADER'],
        tenantId: 'tenant123',
        localChurchId: 'church123',
      };

      expect(hasRole(multiRoleContext, 'MEMBER')).toBe(true);
      expect(hasRole(multiRoleContext, 'LEADER')).toBe(true);
      expect(hasRole(multiRoleContext, 'ADMIN')).toBe(false);
    });

    it('should handle SUPER_ADMIN correctly', () => {
      const superAdminContext: MobileRequestContext = {
        userId: 'superadmin123',
        roles: ['SUPER_ADMIN'],
        tenantId: 'tenant123',
      };

      expect(hasRole(superAdminContext, 'SUPER_ADMIN')).toBe(true);
      expect(hasRole(superAdminContext, 'PASTOR')).toBe(true);
      expect(hasRole(superAdminContext, 'ADMIN')).toBe(true);
      expect(hasRole(superAdminContext, 'MEMBER')).toBe(true);
    });
  });

  describe('requireRole', () => {
    it('should not throw for sufficient role', () => {
      expect(() => requireRole(adminContext, 'MEMBER')).not.toThrow();
      expect(() => requireRole(adminContext, 'ADMIN')).not.toThrow();
    });

    it('should throw for insufficient role', () => {
      expect(() => requireRole(mockContext, 'ADMIN')).toThrow(
        'Insufficient permissions. ADMIN role required.'
      );
    });
  });

  describe('validateTenantAccess', () => {
    it('should return true for matching tenant', () => {
      expect(validateTenantAccess(mockContext, 'tenant123')).toBe(true);
    });

    it('should return false for different tenant', () => {
      expect(validateTenantAccess(mockContext, 'other-tenant')).toBe(false);
    });
  });

  describe('requireTenantAccess', () => {
    it('should not throw for matching tenant', () => {
      expect(() => requireTenantAccess(mockContext, 'tenant123')).not.toThrow();
    });

    it('should throw for different tenant', () => {
      expect(() => requireTenantAccess(mockContext, 'other-tenant')).toThrow(
        'Access denied: insufficient tenant permissions'
      );
    });
  });

  describe('hasChurchAccess', () => {
    it('should return true for matching church', () => {
      expect(hasChurchAccess(mockContext, 'church123')).toBe(true);
    });

    it('should return false for different church (MEMBER role)', () => {
      expect(hasChurchAccess(mockContext, 'other-church')).toBe(false);
    });

    it('should return true for PASTOR regardless of church', () => {
      expect(hasChurchAccess(pastorContext, 'any-church')).toBe(true);
    });

    it('should return true for ADMIN regardless of church', () => {
      expect(hasChurchAccess(adminContext, 'any-church')).toBe(true);
    });

    it('should handle context without localChurchId', () => {
      const contextWithoutChurch: MobileRequestContext = {
        userId: 'user123',
        roles: ['MEMBER'],
        tenantId: 'tenant123',
      };

      expect(hasChurchAccess(contextWithoutChurch, 'church123')).toBe(false);
    });
  });

  describe('requireChurchAccess', () => {
    it('should not throw for matching church', () => {
      expect(() => requireChurchAccess(mockContext, 'church123')).not.toThrow();
    });

    it('should not throw for PASTOR role', () => {
      expect(() => requireChurchAccess(pastorContext, 'any-church')).not.toThrow();
    });

    it('should throw for different church (insufficient permissions)', () => {
      expect(() => requireChurchAccess(mockContext, 'other-church')).toThrow(
        'Access denied: insufficient church permissions'
      );
    });
  });

  describe('Role Hierarchy', () => {
    const testCases = [
      { role: 'SUPER_ADMIN', level: 6 },
      { role: 'PASTOR', level: 5 },
      { role: 'ADMIN', level: 4 },
      { role: 'LEADER', level: 3 },
      { role: 'VIP', level: 2 },
      { role: 'MEMBER', level: 1 },
    ];

    testCases.forEach(({ role, level }) => {
      it(`should respect ${role} hierarchy level ${level}`, () => {
        const context: MobileRequestContext = {
          userId: 'user123',
          roles: [role as any],
          tenantId: 'tenant123',
          localChurchId: 'church123',
        };

        // Should have access to all roles at or below their level
        const lowerRoles = testCases.filter(tc => tc.level <= level);
        lowerRoles.forEach(({ role: lowerRole }) => {
          expect(hasRole(context, lowerRole as any)).toBe(true);
        });

        // Should NOT have access to roles above their level
        const higherRoles = testCases.filter(tc => tc.level > level);
        higherRoles.forEach(({ role: higherRole }) => {
          expect(hasRole(context, higherRole as any)).toBe(false);
        });
      });
    });
  });
});