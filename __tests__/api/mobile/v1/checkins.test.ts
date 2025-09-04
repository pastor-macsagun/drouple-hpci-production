import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '@/tests/setup/app';
import { setupTestDatabase, cleanupTestDatabase } from './setup';
import { mockRateLimiters, mockJWTFunctions, mockIdempotency } from './mocks';

// Mock dependencies
vi.mock('@/lib/rate-limit', () => mockRateLimiters);
vi.mock('@/lib/mobileAuth/jwt', () => mockJWTFunctions);
vi.mock('@/lib/mobileAuth/context', () => ({
  requireMobileContext: (request: any) => ({
    userId: 'member-1',
    tenantId: 'hpci-tenant-1',
    localChurchId: 'manila-1',
    roles: ['MEMBER'],
  }),
  hasRole: (context: any, role: string) => context.roles.includes(role),
}));
vi.mock('@/lib/mobileAuth/idempotency', () => mockIdempotency);

describe('/api/mobile/v1/checkins', () => {
  let app: any;
  let testData: Awaited<ReturnType<typeof setupTestDatabase>>;

  beforeEach(async () => {
    app = createApp();
    testData = await setupTestDatabase();
    
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('POST /api/mobile/v1/checkins', () => {
    const validCheckInRequest = {
      clientRequestId: 'check-in-123',
      memberId: 'member-1',
      serviceId: 'service-1',
      newBeliever: false,
    };

    it('should create check-in successfully', async () => {
      // Mock idempotency to execute the function
      const { withIdempotency } = await import('@/lib/mobileAuth/idempotency');
      vi.mocked(withIdempotency).mockImplementationOnce(
        async (request, context, endpoint, data, fn) => {
          const result = await fn();
          return new Response(JSON.stringify(result), { status: 200 });
        }
      );

      const response = await request(app)
        .post('/api/mobile/v1/checkins')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send(validCheckInRequest);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        status: 'ok',
      });
    });

    it('should suppress duplicate check-in with same clientRequestId', async () => {
      // Mock idempotency to return duplicate response
      const { withIdempotency } = await import('@/lib/mobileAuth/idempotency');
      vi.mocked(withIdempotency).mockResolvedValueOnce(
        new Response(JSON.stringify({
          id: 'existing-checkin-id',
          status: 'duplicate',
        }), { status: 200 })
      );

      const response = await request(app)
        .post('/api/mobile/v1/checkins')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send(validCheckInRequest);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: 'existing-checkin-id',
        status: 'duplicate',
      });
    });

    it('should handle new believer pathway enrollment', async () => {
      // Mock idempotency to execute the function
      const { withIdempotency } = await import('@/lib/mobileAuth/idempotency');
      vi.mocked(withIdempotency).mockImplementationOnce(
        async (request, context, endpoint, data, fn) => {
          const result = await fn();
          return new Response(JSON.stringify(result), { status: 200 });
        }
      );

      const newBelieverRequest = {
        ...validCheckInRequest,
        newBeliever: true,
      };

      const response = await request(app)
        .post('/api/mobile/v1/checkins')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send(newBelieverRequest);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        status: 'ok',
      });
    });

    it('should return 401 when not authenticated', async () => {
      // Mock context to throw authentication error
      const { requireMobileContext } = await import('@/lib/mobileAuth/context');
      vi.mocked(requireMobileContext).mockImplementationOnce(() => {
        throw new Error('Authentication required');
      });

      const response = await request(app)
        .post('/api/mobile/v1/checkins')
        .send(validCheckInRequest);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Authentication required',
      });
    });

    it('should return 403 when trying to check in other member without permissions', async () => {
      // Mock idempotency to execute the function
      const { withIdempotency } = await import('@/lib/mobileAuth/idempotency');
      vi.mocked(withIdempotency).mockImplementationOnce(
        async (request, context, endpoint, data, fn) => {
          try {
            await fn();
          } catch (error) {
            throw error;
          }
        }
      );

      // Mock context for regular member trying to check in someone else
      const { requireMobileContext } = await import('@/lib/mobileAuth/context');
      vi.mocked(requireMobileContext).mockReturnValueOnce({
        userId: 'member-2',
        tenantId: 'hpci-tenant-1',
        localChurchId: 'manila-1',
        roles: ['MEMBER'],
      });

      const otherMemberRequest = {
        ...validCheckInRequest,
        memberId: 'member-1', // Different from context userId
      };

      const response = await request(app)
        .post('/api/mobile/v1/checkins')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send(otherMemberRequest);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Insufficient permissions');
    });

    it('should return 404 for non-existent service', async () => {
      // Mock idempotency to execute the function
      const { withIdempotency } = await import('@/lib/mobileAuth/idempotency');
      vi.mocked(withIdempotency).mockImplementationOnce(
        async (request, context, endpoint, data, fn) => {
          try {
            await fn();
          } catch (error) {
            throw error;
          }
        }
      );

      const invalidServiceRequest = {
        ...validCheckInRequest,
        serviceId: 'non-existent-service',
      };

      const response = await request(app)
        .post('/api/mobile/v1/checkins')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send(invalidServiceRequest);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Service not found');
    });

    it('should return 404 for non-existent member', async () => {
      // Mock idempotency to execute the function
      const { withIdempotency } = await import('@/lib/mobileAuth/idempotency');
      vi.mocked(withIdempotency).mockImplementationOnce(
        async (request, context, endpoint, data, fn) => {
          try {
            await fn();
          } catch (error) {
            throw error;
          }
        }
      );

      const invalidMemberRequest = {
        ...validCheckInRequest,
        memberId: 'non-existent-member',
      };

      const response = await request(app)
        .post('/api/mobile/v1/checkins')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send(invalidMemberRequest);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Member not found');
    });

    it('should enforce tenant isolation - cannot access cross-tenant service', async () => {
      // Mock context with different tenant
      const { requireMobileContext } = await import('@/lib/mobileAuth/context');
      vi.mocked(requireMobileContext).mockReturnValueOnce({
        userId: 'member-1',
        tenantId: 'other-tenant',
        localChurchId: 'other-church-1',
        roles: ['MEMBER'],
      });

      // Mock idempotency to execute the function
      const { withIdempotency } = await import('@/lib/mobileAuth/idempotency');
      vi.mocked(withIdempotency).mockImplementationOnce(
        async (request, context, endpoint, data, fn) => {
          try {
            await fn();
          } catch (error) {
            throw error;
          }
        }
      );

      const response = await request(app)
        .post('/api/mobile/v1/checkins')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send(validCheckInRequest);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Service not found or access denied');
    });

    it('should return 400 for invalid request data', async () => {
      const invalidRequest = {
        clientRequestId: '',
        memberId: '',
        serviceId: '',
      };

      const response = await request(app)
        .post('/api/mobile/v1/checkins')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Invalid request data',
        details: expect.any(Array),
      });
    });

    it('should allow leader to check in other members', async () => {
      // Mock context for leader
      const { requireMobileContext, hasRole } = await import('@/lib/mobileAuth/context');
      vi.mocked(requireMobileContext).mockReturnValueOnce({
        userId: 'leader-1',
        tenantId: 'hpci-tenant-1',
        localChurchId: 'manila-1',
        roles: ['LEADER'],
      });
      vi.mocked(hasRole).mockReturnValueOnce(true); // Leader has LEADER role

      // Mock idempotency to execute the function
      const { withIdempotency } = await import('@/lib/mobileAuth/idempotency');
      vi.mocked(withIdempotency).mockImplementationOnce(
        async (request, context, endpoint, data, fn) => {
          const result = await fn();
          return new Response(JSON.stringify(result), { status: 200 });
        }
      );

      const response = await request(app)
        .post('/api/mobile/v1/checkins')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send(validCheckInRequest);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        status: 'ok',
      });
    });
  });
});