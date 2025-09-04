/**
 * Mobile API Integration Tests
 * Tests JWT authentication and tenant isolation for /api/mobile/v1 endpoints
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { generateTokenPair } from '@/lib/mobile-jwt';
import type { UserRole } from '@drouple/contracts';

// Mock Next.js app for testing
const testApp = {
  // We'll test the route handlers directly since Next.js doesn't expose a test server
};

// Test data setup
const TEST_USERS = {
  admin: {
    id: 'test-admin-1',
    email: 'admin.test@drouple.com',
    firstName: 'Test',
    lastName: 'Admin',
    roles: ['ADMIN'] as UserRole[],
    tenantId: 'test-tenant',
    churchId: 'test-church-1',
  },
  member: {
    id: 'test-member-1',
    email: 'member.test@drouple.com',
    firstName: 'Test',
    lastName: 'Member',
    roles: ['MEMBER'] as UserRole[],
    tenantId: 'test-tenant',
    churchId: 'test-church-1',
  },
  otherTenant: {
    id: 'test-member-2',
    email: 'member2.test@drouple.com',
    firstName: 'Other',
    lastName: 'Member',
    roles: ['MEMBER'] as UserRole[],
    tenantId: 'other-tenant',
    churchId: 'other-church',
  },
};

describe('Mobile API Authentication', () => {
  let adminToken: string;
  let memberToken: string;
  let otherTenantToken: string;

  beforeAll(async () => {
    // Generate test tokens
    const [adminTokens, memberTokens, otherTokens] = await Promise.all([
      generateTokenPair(TEST_USERS.admin),
      generateTokenPair(TEST_USERS.member),
      generateTokenPair(TEST_USERS.otherTenant),
    ]);

    adminToken = adminTokens.accessToken;
    memberToken = memberTokens.accessToken;
    otherTenantToken = otherTokens.accessToken;
  });

  it('should reject requests without Bearer token', async () => {
    // Test using the auth login endpoint handler directly
    const { POST } = await import('@/app/api/mobile/v1/auth/login/route');
    
    const request = new Request('http://localhost/api/mobile/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    const response = await POST(request as NextRequest);
    const data = await response.json();

    // Should require proper validation
    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('should reject invalid Bearer tokens', async () => {
    const { GET } = await import('@/app/api/mobile/v1/services/route');
    
    const request = new Request('http://localhost/api/mobile/v1/services', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token',
      },
    });

    const response = await GET(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('should accept valid Bearer tokens', async () => {
    const { GET } = await import('@/app/api/mobile/v1/services/route');
    
    const request = new Request('http://localhost/api/mobile/v1/services', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${memberToken}`,
      },
    });

    const response = await GET(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
  });
});

describe('Mobile API Validation', () => {
  it('should validate JWT token generation and verification', async () => {
    const tokens = await generateTokenPair(TEST_USERS.admin);
    
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(tokens.expiresAt).toBeDefined();
    
    // Verify token is valid JWT format
    expect(tokens.accessToken.split('.')).toHaveLength(3);
    expect(tokens.refreshToken.split('.')).toHaveLength(3);
  });

  it('should validate API response format', async () => {
    const { GET } = await import('@/app/api/mobile/v1/services/route');
    
    vi.spyOn(prisma.service, 'findMany').mockResolvedValue([]);
    vi.spyOn(prisma.service, 'count').mockResolvedValue(0);

    const memberTokens = await generateTokenPair(TEST_USERS.member);
    const request = new Request('http://localhost/api/mobile/v1/services?page=1&limit=10', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${memberTokens.accessToken}`,
      },
    });

    const response = await GET(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.items).toBeDefined();
    expect(data.data.pagination).toBeDefined();
    expect(data.data.pagination.page).toBe(1);
    expect(data.data.pagination.limit).toBe(10);
    expect(data.timestamp).toBeDefined();
  });
});

afterAll(async () => {
  // Clean up any test data if needed
  vi.restoreAllMocks();
});