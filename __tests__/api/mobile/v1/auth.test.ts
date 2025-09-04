import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupTestDatabase, cleanupTestDatabase } from './setup';
import { mockRateLimiters, mockJWTFunctions } from './mocks';
import { POST } from '@/app/api/mobile/v1/auth/login/route';
import { POST as RefreshPOST } from '@/app/api/mobile/v1/auth/refresh/route';

// Mock dependencies
vi.mock('@/lib/rate-limit', () => mockRateLimiters);
vi.mock('@/lib/mobileAuth/jwt', () => mockJWTFunctions);
vi.mock('@/lib/mobileAuth/rotate', () => ({
  createRefreshToken: vi.fn().mockResolvedValue('mock-refresh-token'),
  verifyRefreshToken: vi.fn(),
  rotateRefreshToken: vi.fn(),
}));

describe('/api/mobile/v1/auth', () => {
  let testData: Awaited<ReturnType<typeof setupTestDatabase>>;

  beforeEach(async () => {
    testData = await setupTestDatabase();
    
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('POST /api/mobile/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const request = new Request('http://localhost/api/mobile/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'member@test.com',
          password: 'Test123!@#',
        }),
      });
      
      const response = await POST(request as any);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toMatchObject({
        accessToken: expect.stringContaining('mock-jwt-'),
        refreshToken: 'mock-refresh-token',
        user: {
          id: expect.any(String),
          email: 'member@test.com',
          firstName: 'Test',
          lastName: 'Member',
          roles: ['MEMBER'],
          tenantId: testData.hpciChurch.id,
          isActive: true,
        },
      });
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app)
        .post('/api/mobile/v1/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Test123!@#',
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Invalid credentials',
      });
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/mobile/v1/auth/login')
        .send({
          email: 'member@test.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Invalid credentials',
      });
    });

    it('should return 401 for inactive user', async () => {
      const response = await request(app)
        .post('/api/mobile/v1/auth/login')
        .send({
          email: testData.inactiveUser.email,
          password: 'Test123!@#',
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Account is not active',
      });
    });

    it('should return 401 for user without password', async () => {
      const response = await request(app)
        .post('/api/mobile/v1/auth/login')
        .send({
          email: testData.noPasswordUser.email,
          password: 'anypassword',
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Password not set. Please use web interface to set up your password.',
      });
    });

    it('should return 400 for invalid request data', async () => {
      const response = await request(app)
        .post('/api/mobile/v1/auth/login')
        .send({
          email: 'invalid-email',
          password: '',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid request data',
      });
    });

    it('should return 429 when rate limited', async () => {
      // Mock rate limiter to return failure
      const { rateLimiters } = await import('@/lib/rate-limit');
      vi.mocked(rateLimiters.auth.check).mockResolvedValueOnce({
        success: false,
        remaining: 0,
        reset: Date.now() + 3600000,
      });

      const response = await request(app)
        .post('/api/mobile/v1/auth/login')
        .send({
          email: 'member@test.com',
          password: 'Test123!@#',
        });

      expect(response.status).toBe(429);
      expect(response.body).toEqual({
        error: 'Too many login attempts. Please try again later.',
      });
    });
  });

  describe('POST /api/mobile/v1/auth/refresh', () => {
    it('should refresh token successfully with valid refresh token', async () => {
      // Mock successful token verification and rotation
      const { verifyRefreshToken, rotateRefreshToken } = await import('@/lib/mobileAuth/rotate');
      
      vi.mocked(verifyRefreshToken).mockResolvedValueOnce({
        sub: testData.memberUser.id,
        rotationId: 'rotation-123',
      });

      vi.mocked(rotateRefreshToken).mockResolvedValueOnce({
        success: true,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      const response = await request(app)
        .post('/api/mobile/v1/auth/refresh')
        .send({
          refreshToken: 'valid-refresh-token',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });

    it('should return 401 for invalid refresh token', async () => {
      // Mock token verification failure
      const { verifyRefreshToken } = await import('@/lib/mobileAuth/rotate');
      vi.mocked(verifyRefreshToken).mockRejectedValueOnce(new Error('Invalid token'));

      const response = await request(app)
        .post('/api/mobile/v1/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token',
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Invalid refresh token',
      });
    });

    it('should return 401 when token rotation fails', async () => {
      // Mock successful verification but failed rotation
      const { verifyRefreshToken, rotateRefreshToken } = await import('@/lib/mobileAuth/rotate');
      
      vi.mocked(verifyRefreshToken).mockResolvedValueOnce({
        sub: testData.memberUser.id,
        rotationId: 'rotation-123',
      });

      vi.mocked(rotateRefreshToken).mockResolvedValueOnce({
        success: false,
        error: 'Token already used',
      });

      const response = await request(app)
        .post('/api/mobile/v1/auth/refresh')
        .send({
          refreshToken: 'used-refresh-token',
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Token already used',
      });
    });

    it('should return 400 for invalid request data', async () => {
      const response = await request(app)
        .post('/api/mobile/v1/auth/refresh')
        .send({
          refreshToken: '',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid request data',
      });
    });

    it('should return 429 when rate limited', async () => {
      // Mock rate limiter to return failure
      const { rateLimiters } = await import('@/lib/rate-limit');
      vi.mocked(rateLimiters.api.check).mockResolvedValueOnce({
        success: false,
        remaining: 0,
        reset: Date.now() + 3600000,
      });

      const response = await request(app)
        .post('/api/mobile/v1/auth/refresh')
        .send({
          refreshToken: 'any-token',
        });

      expect(response.status).toBe(429);
      expect(response.body).toEqual({
        error: 'Too many refresh attempts. Please try again later.',
      });
    });
  });
});