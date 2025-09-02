import { describe, it, expect } from 'vitest';
import { getRoleBasedRedirectUrl, getPostAuthRedirectUrl } from '../role-redirects';
import { UserRole } from '@prisma/client';

describe('role-redirects', () => {
  describe('getRoleBasedRedirectUrl', () => {
    it('should return /super for SUPER_ADMIN role', () => {
      const result = getRoleBasedRedirectUrl(UserRole.SUPER_ADMIN);
      expect(result).toBe('/super');
    });

    it('should return /admin for PASTOR role', () => {
      const result = getRoleBasedRedirectUrl(UserRole.PASTOR);
      expect(result).toBe('/admin');
    });

    it('should return /admin for ADMIN role', () => {
      const result = getRoleBasedRedirectUrl(UserRole.ADMIN);
      expect(result).toBe('/admin');
    });

    it('should return /vip for VIP role', () => {
      const result = getRoleBasedRedirectUrl(UserRole.VIP);
      expect(result).toBe('/vip');
    });

    it('should return /leader for LEADER role', () => {
      const result = getRoleBasedRedirectUrl(UserRole.LEADER);
      expect(result).toBe('/leader');
    });

    it('should return /dashboard for MEMBER role', () => {
      const result = getRoleBasedRedirectUrl(UserRole.MEMBER);
      expect(result).toBe('/dashboard');
    });

    it('should return /dashboard as fallback for any unexpected role', () => {
      // Cast to bypass TypeScript enum checking for testing purposes
      const result = getRoleBasedRedirectUrl('UNKNOWN_ROLE' as UserRole);
      expect(result).toBe('/dashboard');
    });
  });

  describe('getPostAuthRedirectUrl', () => {
    it('should return callbackUrl when provided and not home page', () => {
      const result = getPostAuthRedirectUrl(UserRole.ADMIN, '/admin/members');
      expect(result).toBe('/admin/members');
    });

    it('should return role-based URL when callbackUrl is home page', () => {
      const result = getPostAuthRedirectUrl(UserRole.ADMIN, '/');
      expect(result).toBe('/admin');
    });

    it('should return role-based URL when callbackUrl is empty string', () => {
      const result = getPostAuthRedirectUrl(UserRole.MEMBER, '');
      expect(result).toBe('/dashboard');
    });

    it('should return role-based URL when callbackUrl is null', () => {
      const result = getPostAuthRedirectUrl(UserRole.VIP, null);
      expect(result).toBe('/vip');
    });

    it('should return role-based URL when callbackUrl is undefined', () => {
      const result = getPostAuthRedirectUrl(UserRole.LEADER);
      expect(result).toBe('/leader');
    });

    it('should prioritize specific callback URLs over role-based redirects', () => {
      const result = getPostAuthRedirectUrl(UserRole.MEMBER, '/events/123');
      expect(result).toBe('/events/123');
    });
  });
});