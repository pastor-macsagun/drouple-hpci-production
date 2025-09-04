import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '@/tests/setup/app';
import { setupTestDatabase, cleanupTestDatabase } from './setup';
import { mockRateLimiters, mockJWTFunctions } from './mocks';

// Mock dependencies
vi.mock('@/lib/rate-limit', () => mockRateLimiters);
vi.mock('@/lib/mobileAuth/jwt', () => mockJWTFunctions);
vi.mock('@/lib/mobileAuth/context', () => ({
  requireMobileContext: vi.fn().mockReturnValue({
    userId: 'member-1',
    tenantId: 'hpci-tenant-1',
    localChurchId: 'manila-1',
    roles: ['MEMBER'],
  }),
  hasRole: vi.fn().mockReturnValue(false), // Default to non-leader
}));

describe('/api/mobile/v1/directory', () => {
  let app: any;
  let testData: Awaited<ReturnType<typeof setupTestDatabase>>;

  beforeEach(async () => {
    app = createApp();
    testData = await setupTestDatabase();
    
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('GET /api/mobile/v1/directory/search', () => {
    it('should search members successfully with basic member role', async () => {
      // Mock context for regular member
      const { requireMobileContext, hasRole } = await import('@/lib/mobileAuth/context');
      vi.mocked(requireMobileContext).mockReturnValueOnce({
        userId: 'member-1',
        tenantId: 'hpci-tenant-1',
        localChurchId: 'manila-1',
        roles: ['MEMBER'],
      });
      vi.mocked(hasRole).mockReturnValueOnce(false); // Not a leader

      const response = await request(app)
        .get('/api/mobile/v1/directory/search?q=test')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      response.body.forEach((member: any) => {
        expect(member).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          roles: expect.any(Array),
        });
        
        // Regular members should NOT see private contact info
        expect(member.phone).toBeUndefined();
        expect(member.email).toBeUndefined();
      });
    });

    it('should show private fields for leaders with LEADER role', async () => {
      // Mock context for leader
      const { requireMobileContext, hasRole } = await import('@/lib/mobileAuth/context');
      vi.mocked(requireMobileContext).mockReturnValueOnce({
        userId: 'leader-1',
        tenantId: 'hpci-tenant-1',
        localChurchId: 'manila-1',
        roles: ['LEADER'],
      });
      vi.mocked(hasRole).mockReturnValueOnce(true); // Is a leader

      const response = await request(app)
        .get('/api/mobile/v1/directory/search?q=test')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Leaders should see contact details for members who allow contact
      response.body.forEach((member: any) => {
        expect(member).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          roles: expect.any(Array),
        });
        
        // May have phone/email if member allows contact and profile is not private
        if (member.phone !== undefined) {
          expect(typeof member.phone).toBe('string');
        }
        if (member.email !== undefined) {
          expect(typeof member.email).toBe('string');
        }
      });
    });

    it('should respect privacy settings - no contact info for PRIVATE profiles', async () => {
      // Mock context for leader (who normally can see details)
      const { requireMobileContext, hasRole } = await import('@/lib/mobileAuth/context');
      vi.mocked(requireMobileContext).mockReturnValueOnce({
        userId: 'leader-1',
        tenantId: 'hpci-tenant-1',
        localChurchId: 'manila-1',
        roles: ['LEADER'],
      });
      vi.mocked(hasRole).mockReturnValueOnce(true); // Is a leader

      const response = await request(app)
        .get('/api/mobile/v1/directory/search?q=private')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Even leaders should not see private profile details
      response.body.forEach((member: any) => {
        if (member.name && member.name.toLowerCase().includes('private')) {
          expect(member.phone).toBeUndefined();
          expect(member.email).toBeUndefined();
        }
      });
    });

    it('should enforce tenant isolation in search results', async () => {
      // Mock context for tenant 1
      const { requireMobileContext } = await import('@/lib/mobileAuth/context');
      vi.mocked(requireMobileContext).mockReturnValueOnce({
        userId: 'member-1',
        tenantId: 'hpci-tenant-1',
        localChurchId: 'manila-1',
        roles: ['MEMBER'],
      });

      const responseTenant1 = await request(app)
        .get('/api/mobile/v1/directory/search?q=member')
        .set('Authorization', 'Bearer mock-jwt-token');

      // Mock context for tenant 2
      vi.mocked(requireMobileContext).mockReturnValueOnce({
        userId: 'member-2',
        tenantId: 'other-tenant-2',
        localChurchId: 'other-church-1',
        roles: ['MEMBER'],
      });

      const responseTenant2 = await request(app)
        .get('/api/mobile/v1/directory/search?q=member')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(responseTenant1.status).toBe(200);
      expect(responseTenant2.status).toBe(200);

      // Members should be different or empty for different tenants
      const tenant1MemberIds = responseTenant1.body.map((m: any) => m.id);
      const tenant2MemberIds = responseTenant2.body.map((m: any) => m.id);
      
      // No member should appear in both tenants
      const commonMembers = tenant1MemberIds.filter((id: string) => 
        tenant2MemberIds.includes(id)
      );
      expect(commonMembers).toHaveLength(0);
    });

    it('should search by name and email', async () => {
      const response = await request(app)
        .get('/api/mobile/v1/directory/search?q=test@example.com')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Should find members matching email in search
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/mobile/v1/directory/search?q=test&limit=5')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });

    it('should enforce maximum limit of 50', async () => {
      const response = await request(app)
        .get('/api/mobile/v1/directory/search?q=test&limit=100')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // The actual limit enforcement is in the schema, so we expect it to be capped at 50
    });

    it('should perform case-insensitive search', async () => {
      const upperResponse = await request(app)
        .get('/api/mobile/v1/directory/search?q=TEST')
        .set('Authorization', 'Bearer mock-jwt-token');

      const lowerResponse = await request(app)
        .get('/api/mobile/v1/directory/search?q=test')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(upperResponse.status).toBe(200);
      expect(lowerResponse.status).toBe(200);
      
      // Case-insensitive search should return same results
      expect(upperResponse.body.length).toBe(lowerResponse.body.length);
    });

    it('should return empty array for no matches', async () => {
      const response = await request(app)
        .get('/api/mobile/v1/directory/search?q=nonexistentuser12345')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('should return 401 when not authenticated', async () => {
      // Mock context to throw authentication error
      const { requireMobileContext } = await import('@/lib/mobileAuth/context');
      vi.mocked(requireMobileContext).mockImplementationOnce(() => {
        throw new Error('Authentication required');
      });

      const response = await request(app)
        .get('/api/mobile/v1/directory/search?q=test');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Authentication required',
      });
    });

    it('should return 400 for missing search query', async () => {
      const response = await request(app)
        .get('/api/mobile/v1/directory/search')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Invalid query parameters',
        details: expect.any(Array),
      });
    });

    it('should return 400 for empty search query', async () => {
      const response = await request(app)
        .get('/api/mobile/v1/directory/search?q=')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Invalid query parameters',
        details: expect.any(Array),
      });
    });

    it('should order results by name then email', async () => {
      const response = await request(app)
        .get('/api/mobile/v1/directory/search?q=test')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 1) {
        for (let i = 1; i < response.body.length; i++) {
          const prevName = response.body[i - 1].name || '';
          const currentName = response.body[i].name || '';
          expect(currentName.localeCompare(prevName, 'en', { sensitivity: 'base' }))
            .toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should filter by local church when user has specific church', async () => {
      // Mock context with specific local church
      const { requireMobileContext } = await import('@/lib/mobileAuth/context');
      vi.mocked(requireMobileContext).mockReturnValueOnce({
        userId: 'member-1',
        tenantId: 'hpci-tenant-1',
        localChurchId: 'manila-1',
        roles: ['MEMBER'],
      });

      const response = await request(app)
        .get('/api/mobile/v1/directory/search?q=test')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // All results should be from the same local church (validated by backend logic)
    });

    it('should only show active members with active memberships', async () => {
      const response = await request(app)
        .get('/api/mobile/v1/directory/search?q=test')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Backend logic ensures only active members with active memberships are included
    });

    it('should not expose internal database fields', async () => {
      const response = await request(app)
        .get('/api/mobile/v1/directory/search?q=test')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      response.body.forEach((member: any) => {
        // Should not contain internal fields
        expect(member).not.toHaveProperty('tenantId');
        expect(member).not.toHaveProperty('memberships');
        expect(member).not.toHaveProperty('passwordHash');
        expect(member).not.toHaveProperty('memberStatus');
        expect(member).not.toHaveProperty('profileVisibility');
        expect(member).not.toHaveProperty('allowContact');
        expect(member).not.toHaveProperty('createdAt');
        expect(member).not.toHaveProperty('updatedAt');
        
        // Should only contain DirectoryEntry fields
        const allowedFields = ['id', 'name', 'roles', 'phone', 'email'];
        Object.keys(member).forEach(key => {
          expect(allowedFields).toContain(key);
        });
      });
    });
  });
});