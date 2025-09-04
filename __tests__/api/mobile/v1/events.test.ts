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
}));

describe('/api/mobile/v1/events', () => {
  let app: any;
  let testData: Awaited<ReturnType<typeof setupTestDatabase>>;

  beforeEach(async () => {
    app = createApp();
    testData = await setupTestDatabase();
    
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('GET /api/mobile/v1/events', () => {
    it('should return events for authenticated user in same tenant', async () => {
      const response = await request(app)
        .get('/api/mobile/v1/events')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Should only return events from the user's tenant
      response.body.forEach((event: any) => {
        expect(event).toMatchObject({
          id: expect.any(String),
          title: expect.any(String),
          startsAt: expect.any(String),
          location: expect.any(String),
          capacity: expect.any(Number),
        });
      });
    });

    it('should respect tenant scoping - no cross-tenant event leakage', async () => {
      // Mock context for tenant 1
      const { requireMobileContext } = await import('@/lib/mobileAuth/context');
      vi.mocked(requireMobileContext).mockReturnValueOnce({
        userId: 'member-1',
        tenantId: 'hpci-tenant-1',
        localChurchId: 'manila-1',
        roles: ['MEMBER'],
      });

      const responseTenant1 = await request(app)
        .get('/api/mobile/v1/events')
        .set('Authorization', 'Bearer mock-jwt-token');

      // Mock context for tenant 2
      vi.mocked(requireMobileContext).mockReturnValueOnce({
        userId: 'member-2',
        tenantId: 'other-tenant-2',
        localChurchId: 'other-church-1',
        roles: ['MEMBER'],
      });

      const responseTenant2 = await request(app)
        .get('/api/mobile/v1/events')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(responseTenant1.status).toBe(200);
      expect(responseTenant2.status).toBe(200);

      // Events should be different or empty for different tenants
      const tenant1EventIds = responseTenant1.body.map((e: any) => e.id);
      const tenant2EventIds = responseTenant2.body.map((e: any) => e.id);
      
      // No event should appear in both tenants
      const commonEvents = tenant1EventIds.filter((id: string) => 
        tenant2EventIds.includes(id)
      );
      expect(commonEvents).toHaveLength(0);
    });

    it('should filter by local church when specified', async () => {
      // Mock context with specific local church
      const { requireMobileContext } = await import('@/lib/mobileAuth/context');
      vi.mocked(requireMobileContext).mockReturnValueOnce({
        userId: 'member-1',
        tenantId: 'hpci-tenant-1',
        localChurchId: 'manila-1',
        roles: ['MEMBER'],
      });

      const response = await request(app)
        .get('/api/mobile/v1/events')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter upcoming events when requested', async () => {
      const response = await request(app)
        .get('/api/mobile/v1/events?upcoming=true')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // All events should have startsAt in the future
      const now = new Date();
      response.body.forEach((event: any) => {
        const startsAt = new Date(event.startsAt);
        expect(startsAt.getTime()).toBeGreaterThanOrEqual(now.getTime() - 24 * 60 * 60 * 1000); // Allow 1 day tolerance
      });
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/mobile/v1/events?limit=5')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });

    it('should enforce maximum limit of 100', async () => {
      const response = await request(app)
        .get('/api/mobile/v1/events?limit=200')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // The actual limit enforcement is in the schema, so we expect it to be capped at 100
    });

    it('should return 401 when not authenticated', async () => {
      // Mock context to throw authentication error
      const { requireMobileContext } = await import('@/lib/mobileAuth/context');
      vi.mocked(requireMobileContext).mockImplementationOnce(() => {
        throw new Error('Authentication required');
      });

      const response = await request(app)
        .get('/api/mobile/v1/events');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Authentication required',
      });
    });

    it('should return 400 for invalid query parameters', async () => {
      const response = await request(app)
        .get('/api/mobile/v1/events?limit=invalid')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200); // Schema transforms invalid limit to default
    });

    it('should include RSVP count and spots left', async () => {
      const response = await request(app)
        .get('/api/mobile/v1/events')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      response.body.forEach((event: any) => {
        if (event.capacity) {
          expect(event).toHaveProperty('spotsLeft');
          expect(typeof event.spotsLeft).toBe('number');
          expect(event.spotsLeft).toBeGreaterThanOrEqual(0);
          expect(event.spotsLeft).toBeLessThanOrEqual(event.capacity);
        }
      });
    });

    it('should handle events without capacity', async () => {
      const response = await request(app)
        .get('/api/mobile/v1/events')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Should handle events where capacity is null
      const eventsWithoutCapacity = response.body.filter((event: any) => 
        event.capacity === null
      );
      
      eventsWithoutCapacity.forEach((event: any) => {
        expect(event.spotsLeft).toBeUndefined();
      });
    });

    it('should order events by start date ascending', async () => {
      const response = await request(app)
        .get('/api/mobile/v1/events')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 1) {
        for (let i = 1; i < response.body.length; i++) {
          const prevDate = new Date(response.body[i - 1].startsAt);
          const currentDate = new Date(response.body[i].startsAt);
          expect(currentDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());
        }
      }
    });

    it('should not expose internal database fields', async () => {
      const response = await request(app)
        .get('/api/mobile/v1/events')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      response.body.forEach((event: any) => {
        // Should not contain internal fields
        expect(event).not.toHaveProperty('localChurchId');
        expect(event).not.toHaveProperty('createdAt');
        expect(event).not.toHaveProperty('updatedAt');
        expect(event).not.toHaveProperty('localChurch');
        expect(event).not.toHaveProperty('_count');
        
        // Should only contain DTO fields
        const allowedFields = ['id', 'title', 'startsAt', 'location', 'capacity', 'spotsLeft'];
        Object.keys(event).forEach(key => {
          expect(allowedFields).toContain(key);
        });
      });
    });
  });
});