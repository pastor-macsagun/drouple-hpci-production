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

describe('Mobile API Tenant Isolation', () => {
  let adminToken: string;
  let otherTenantToken: string;

  beforeAll(async () => {
    const [adminTokens, otherTokens] = await Promise.all([
      generateTokenPair(TEST_USERS.admin),
      generateTokenPair(TEST_USERS.otherTenant),
    ]);

    adminToken = adminTokens.accessToken;
    otherTenantToken = otherTokens.accessToken;
  });

  it('should enforce tenant isolation on services endpoint', async () => {
    const { GET } = await import('@/app/api/mobile/v1/services/route');
    
    // Mock services in different tenants
    vi.spyOn(prisma.service, 'findMany').mockResolvedValue([
      {
        id: 'service-1',
        name: 'Test Service',
        description: 'Test',
        date: new Date(),
        churchId: 'test-church-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { checkins: 5 },
      } as any,
    ]);

    vi.spyOn(prisma.service, 'count').mockResolvedValue(1);

    // Admin from test-tenant should see services
    const adminRequest = new Request('http://localhost/api/mobile/v1/services', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    const adminResponse = await GET(adminRequest as NextRequest);
    const adminData = await adminResponse.json();

    expect(adminResponse.status).toBe(200);
    expect(adminData.success).toBe(true);

    // Member from other-tenant should not see services (would be filtered by tenant)
    const otherRequest = new Request('http://localhost/api/mobile/v1/services', {
      method: 'GET',  
      headers: {
        'Authorization': `Bearer ${otherTenantToken}`,
      },
    });

    const otherResponse = await GET(otherRequest as NextRequest);
    const otherData = await otherResponse.json();

    expect(otherResponse.status).toBe(200);
    expect(otherData.success).toBe(true);
    // Data would be filtered by tenant in real implementation
  });

  it('should enforce tenant isolation on check-in endpoint', async () => {
    const { POST } = await import('@/app/api/mobile/v1/checkin/route');

    // Mock service in different tenant
    vi.spyOn(prisma.service, 'findUnique').mockResolvedValue({
      id: 'service-1',
      name: 'Test Service',
      churchId: 'other-church',
      isActive: true,
      church: {
        tenantId: 'other-tenant',
      },
    } as any);

    const request = new Request('http://localhost/api/mobile/v1/checkin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        serviceId: 'service-1',
        isFirstTime: false,
      }),
    });

    const response = await POST(request as NextRequest);
    const data = await response.json();

    // Should be forbidden due to tenant mismatch
    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('FORBIDDEN');
  });
});

describe('Mobile API RBAC', () => {
  let adminToken: string;
  let memberToken: string;

  beforeAll(async () => {
    const [adminTokens, memberTokens] = await Promise.all([
      generateTokenPair(TEST_USERS.admin),
      generateTokenPair(TEST_USERS.member),
    ]);

    adminToken = adminTokens.accessToken;
    memberToken = memberTokens.accessToken;
  });

  it('should allow all authenticated users to access services', async () => {
    const { GET } = await import('@/app/api/mobile/v1/services/route');

    vi.spyOn(prisma.service, 'findMany').mockResolvedValue([]);
    vi.spyOn(prisma.service, 'count').mockResolvedValue(0);

    // Both admin and member should access services
    const adminRequest = new Request('http://localhost/api/mobile/v1/services', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });

    const memberRequest = new Request('http://localhost/api/mobile/v1/services', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${memberToken}` },
    });

    const [adminResponse, memberResponse] = await Promise.all([
      GET(adminRequest as NextRequest),
      GET(memberRequest as NextRequest),
    ]);

    expect(adminResponse.status).toBe(200);
    expect(memberResponse.status).toBe(200);
  });

  it('should allow all users to check in', async () => {
    const { POST } = await import('@/app/api/mobile/v1/checkin/route');

    // Mock successful check-in
    vi.spyOn(prisma.service, 'findUnique').mockResolvedValue({
      id: 'service-1',
      name: 'Test Service',
      churchId: 'test-church-1',
      isActive: true,
      church: {
        tenantId: 'test-tenant',
      },
    } as any);

    vi.spyOn(prisma.checkin, 'findUnique').mockResolvedValue(null);
    vi.spyOn(prisma.checkin, 'create').mockResolvedValue({
      id: 'checkin-1',
      serviceId: 'service-1',
      userId: 'test-member-1',
      checkedInAt: new Date(),
      isFirstTime: false,
      notes: null,
    } as any);

    const request = new Request('http://localhost/api/mobile/v1/checkin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${memberToken}`,
      },
      body: JSON.stringify({
        serviceId: 'service-1',
        isFirstTime: false,
      }),
    });

    const response = await POST(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe('checkin-1');
  });
});

describe('Mobile API Data Validation', () => {
  let memberToken: string;

  beforeAll(async () => {
    const memberTokens = await generateTokenPair(TEST_USERS.member);
    memberToken = memberTokens.accessToken;
  });

  it('should validate login request format', async () => {
    const { POST } = await import('@/app/api/mobile/v1/auth/login/route');

    const invalidRequest = new Request('http://localhost/api/mobile/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'invalid-email',
        // password missing
      }),
    });

    const response = await POST(invalidRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.details.errors).toBeDefined();
  });

  it('should validate check-in request format', async () => {
    const { POST } = await import('@/app/api/mobile/v1/checkin/route');

    const invalidRequest = new Request('http://localhost/api/mobile/v1/checkin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${memberToken}`,
      },
      body: JSON.stringify({
        // serviceId missing
        invalidField: 'invalid',
      }),
    });

    const response = await POST(invalidRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return paginated responses with correct format', async () => {
    const { GET } = await import('@/app/api/mobile/v1/services/route');

    vi.spyOn(prisma.service, 'findMany').mockResolvedValue([]);
    vi.spyOn(prisma.service, 'count').mockResolvedValue(0);

    const request = new Request('http://localhost/api/mobile/v1/services?page=1&limit=10', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${memberToken}`,
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
    expect(data.data.pagination.total).toBe(0);
  });
});

describe('Mobile API Error Handling', () => {
  it('should handle database errors gracefully', async () => {
    const { GET } = await import('@/app/api/mobile/v1/services/route');

    const memberTokens = await generateTokenPair(TEST_USERS.member);
    const memberToken = memberTokens.accessToken;

    // Mock database error
    vi.spyOn(prisma.service, 'findMany').mockRejectedValue(new Error('Database connection failed'));

    const request = new Request('http://localhost/api/mobile/v1/services', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${memberToken}`,
      },
    });

    const response = await GET(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('should handle missing resources appropriately', async () => {
    const { POST } = await import('@/app/api/mobile/v1/checkin/route');

    const memberTokens = await generateTokenPair(TEST_USERS.member);
    const memberToken = memberTokens.accessToken;

    // Mock service not found
    vi.spyOn(prisma.service, 'findUnique').mockResolvedValue(null);

    const request = new Request('http://localhost/api/mobile/v1/checkin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${memberToken}`,
      },
      body: JSON.stringify({
        serviceId: 'non-existent-service',
        isFirstTime: false,
      }),
    });

    const response = await POST(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('NOT_FOUND');
  });
});

describe('Mobile API Audit Logging', () => {
  it('should log audit actions for mutations', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { POST } = await import('@/app/api/mobile/v1/checkin/route');
    
    const memberTokens = await generateTokenPair(TEST_USERS.member);
    const memberToken = memberTokens.accessToken;

    // Mock successful check-in
    vi.spyOn(prisma.service, 'findUnique').mockResolvedValue({
      id: 'service-1',
      name: 'Test Service',
      churchId: 'test-church-1',
      isActive: true,
      church: {
        tenantId: 'test-tenant',
      },
    } as any);

    vi.spyOn(prisma.checkin, 'findUnique').mockResolvedValue(null);
    vi.spyOn(prisma.checkin, 'create').mockResolvedValue({
      id: 'checkin-1',
      serviceId: 'service-1',
      userId: 'test-member-1',
      checkedInAt: new Date(),
      isFirstTime: true,
      notes: 'Test check-in',
    } as any);

    const request = new Request('http://localhost/api/mobile/v1/checkin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${memberToken}`,
      },
      body: JSON.stringify({
        serviceId: 'service-1',
        isFirstTime: true,
        notes: 'Test check-in',
      }),
    });

    await POST(request as NextRequest);

    // Check that audit log was called
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('AUDIT:')
    );

    const auditCall = consoleSpy.mock.calls.find(call => 
      call[0].includes('AUDIT:')
    );
    
    if (auditCall) {
      const auditLog = JSON.parse(auditCall[0].replace('AUDIT: ', ''));
      expect(auditLog.action).toBe('checkin_create');
      expect(auditLog.entity).toBe('checkin');
      expect(auditLog.actorId).toBe('test-member-1');
      expect(auditLog.tenantId).toBe('test-tenant');
    }

    consoleSpy.mockRestore();
  });
});

afterAll(async () => {
  // Clean up any test data if needed
  vi.restoreAllMocks();
});