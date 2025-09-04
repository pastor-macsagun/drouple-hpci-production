/**
 * @file Tests for Bulk Check-ins API
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/mobile/v1/sync/checkins/bulk/route';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    service: {
      findMany: vi.fn(),
    },
    checkin: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/mobile-auth', () => ({
  withMobileAuth: vi.fn(),
  createMobileResponse: vi.fn(),
  handleMobileApiError: vi.fn(),
  createMobileTenantWhere: vi.fn(),
}));

vi.mock('@/lib/socket-server', () => ({
  broadcastServiceCounts: vi.fn(),
}));

describe('Bulk Check-ins API', () => {
  const { prisma } = vi.mocked(await import('@/lib/db'));
  const { 
    withMobileAuth, 
    createMobileResponse, 
    handleMobileApiError, 
    createMobileTenantWhere 
  } = vi.mocked(await import('@/lib/mobile-auth'));
  const { broadcastServiceCounts } = vi.mocked(await import('@/lib/socket-server'));

  const mockUser = {
    sub: 'user123',
    email: 'test@example.com',
    roles: ['MEMBER'],
    tenantId: 'tenant123',
    churchId: 'church123',
  };

  const mockServices = [
    {
      id: 'service1',
      name: 'Sunday Service',
      churchId: 'church123',
      serviceDate: new Date('2024-06-02'),
      church: { name: 'Test Church' },
    },
    {
      id: 'service2',
      name: 'Evening Service',
      churchId: 'church123',
      serviceDate: new Date('2024-06-02'),
      church: { name: 'Test Church' },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful authentication
    withMobileAuth.mockImplementation(async (request, handler) => {
      return handler(request, mockUser);
    });

    // Mock response creators
    createMobileResponse.mockImplementation((data, status = 200) => ({
      json: () => Promise.resolve(data),
      status,
    }));

    handleMobileApiError.mockImplementation((error) => ({
      json: () => Promise.resolve({ error: error.message }),
      status: 500,
    }));

    createMobileTenantWhere.mockReturnValue({ tenantId: 'tenant123' });
  });

  describe('POST /api/mobile/v1/sync/checkins/bulk', () => {
    const validBulkRequest = {
      checkins: [
        {
          serviceId: 'service1',
          checkinTime: '2024-06-02T10:30:00.000Z',
          offlineId: 'offline1',
        },
        {
          serviceId: 'service2',
          checkinTime: '2024-06-02T18:30:00.000Z',
          clientId: 'client1',
        },
      ],
      conflictResolution: 'last-write-wins',
    };

    it('should process bulk check-ins successfully', async () => {
      prisma.service.findMany.mockResolvedValue(mockServices);
      prisma.checkin.findFirst.mockResolvedValue(null); // No existing check-ins
      prisma.checkin.create
        .mockResolvedValueOnce({ id: 'checkin1' })
        .mockResolvedValueOnce({ id: 'checkin2' });
      prisma.checkin.count
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);
      prisma.checkin.findMany
        .mockResolvedValueOnce([{ userId: 'user123' }])
        .mockResolvedValueOnce([{ userId: 'user123' }]);

      const request = new NextRequest('http://localhost/api/mobile/v1/sync/checkins/bulk', {
        method: 'POST',
        body: JSON.stringify(validBulkRequest),
      });

      const response = await POST(request);

      expect(prisma.service.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant123',
          id: { in: ['service1', 'service2'] },
        },
        select: {
          id: true,
          name: true,
          churchId: true,
          serviceDate: true,
          church: { select: { name: true } },
        },
      });

      expect(prisma.checkin.create).toHaveBeenCalledTimes(2);
      expect(prisma.checkin.create).toHaveBeenCalledWith({
        data: {
          serviceId: 'service1',
          userId: 'user123',
          checkinTime: new Date('2024-06-02T10:30:00.000Z'),
        },
      });

      expect(broadcastServiceCounts).toHaveBeenCalledTimes(2);
      expect(broadcastServiceCounts).toHaveBeenCalledWith(
        'tenant123',
        'church123',
        {
          serviceId: 'service1',
          totalCheckins: 1,
          currentAttendance: 1,
          timestamp: expect.any(String),
        }
      );

      expect(createMobileResponse).toHaveBeenCalledWith({
        results: [
          {
            success: true,
            id: 'offline1',
            serverId: 'checkin1',
            action: 'created',
          },
          {
            success: true,
            id: 'client1',
            serverId: 'checkin2',
            action: 'created',
          },
        ],
        summary: {
          total: 2,
          successful: 2,
          failed: 0,
          conflicts: 0,
        },
        timestamp: expect.any(String),
      });
    });

    it('should handle existing check-ins with last-write-wins', async () => {
      const existingCheckin = {
        id: 'existing1',
        serviceId: 'service1',
        userId: 'user123',
        checkinTime: new Date('2024-06-02T09:00:00.000Z'),
      };

      prisma.service.findMany.mockResolvedValue([mockServices[0]]);
      prisma.checkin.findFirst.mockResolvedValue(existingCheckin);
      prisma.checkin.update.mockResolvedValue({
        ...existingCheckin,
        checkinTime: new Date('2024-06-02T10:30:00.000Z'),
      });
      prisma.checkin.count.mockResolvedValue(1);
      prisma.checkin.findMany.mockResolvedValue([{ userId: 'user123' }]);

      const request = new NextRequest('http://localhost/api/mobile/v1/sync/checkins/bulk', {
        method: 'POST',
        body: JSON.stringify({
          checkins: [validBulkRequest.checkins[0]],
          conflictResolution: 'last-write-wins',
        }),
      });

      const response = await POST(request);

      expect(prisma.checkin.update).toHaveBeenCalledWith({
        where: { id: 'existing1' },
        data: {
          checkinTime: new Date('2024-06-02T10:30:00.000Z'),
          updatedAt: expect.any(Date),
        },
      });

      expect(createMobileResponse).toHaveBeenCalledWith({
        results: [
          {
            success: true,
            id: 'offline1',
            serverId: 'existing1',
            action: 'updated',
          },
        ],
        summary: {
          total: 1,
          successful: 1,
          failed: 0,
          conflicts: 0,
        },
        timestamp: expect.any(String),
      });
    });

    it('should handle existing check-ins with fail-on-conflict', async () => {
      const existingCheckin = {
        id: 'existing1',
        serviceId: 'service1',
        userId: 'user123',
      };

      prisma.service.findMany.mockResolvedValue([mockServices[0]]);
      prisma.checkin.findFirst.mockResolvedValue(existingCheckin);

      const request = new NextRequest('http://localhost/api/mobile/v1/sync/checkins/bulk', {
        method: 'POST',
        body: JSON.stringify({
          checkins: [validBulkRequest.checkins[0]],
          conflictResolution: 'fail-on-conflict',
        }),
      });

      const response = await POST(request);

      expect(prisma.checkin.update).not.toHaveBeenCalled();
      expect(prisma.checkin.create).not.toHaveBeenCalled();

      expect(createMobileResponse).toHaveBeenCalledWith({
        results: [
          {
            success: false,
            id: 'offline1',
            error: 'Check-in already exists',
            conflictType: 'duplicate',
          },
        ],
        summary: {
          total: 1,
          successful: 0,
          failed: 1,
          conflicts: 1,
        },
        timestamp: expect.any(String),
      });
    });

    it('should validate request body schema', async () => {
      const invalidRequest = {
        checkins: [
          {
            serviceId: 'service1',
            // Missing checkinTime
          },
        ],
      };

      const request = new NextRequest('http://localhost/api/mobile/v1/sync/checkins/bulk', {
        method: 'POST',
        body: JSON.stringify(invalidRequest),
      });

      const response = await POST(request);

      expect(createMobileResponse).toHaveBeenCalledWith(
        {
          error: 'Invalid request data',
          details: expect.any(Array),
        },
        400
      );
    });

    it('should reject empty check-ins array', async () => {
      const request = new NextRequest('http://localhost/api/mobile/v1/sync/checkins/bulk', {
        method: 'POST',
        body: JSON.stringify({
          checkins: [],
          conflictResolution: 'last-write-wins',
        }),
      });

      const response = await POST(request);

      expect(createMobileResponse).toHaveBeenCalledWith(
        { error: 'No check-ins provided' },
        400
      );
    });

    it('should reject too many check-ins', async () => {
      const manyCheckins = Array.from({ length: 101 }, (_, i) => ({
        serviceId: 'service1',
        checkinTime: '2024-06-02T10:30:00.000Z',
        offlineId: `offline${i}`,
      }));

      const request = new NextRequest('http://localhost/api/mobile/v1/sync/checkins/bulk', {
        method: 'POST',
        body: JSON.stringify({
          checkins: manyCheckins,
          conflictResolution: 'last-write-wins',
        }),
      });

      const response = await POST(request);

      expect(createMobileResponse).toHaveBeenCalledWith(
        { error: 'Maximum 100 check-ins per bulk request' },
        400
      );
    });

    it('should validate service existence', async () => {
      prisma.service.findMany.mockResolvedValue([mockServices[0]]); // Only one service found

      const request = new NextRequest('http://localhost/api/mobile/v1/sync/checkins/bulk', {
        method: 'POST',
        body: JSON.stringify(validBulkRequest),
      });

      const response = await POST(request);

      expect(createMobileResponse).toHaveBeenCalledWith(
        { error: 'Services not found: service2' },
        404
      );
    });

    it('should validate church access for non-super admins', async () => {
      const otherChurchService = {
        ...mockServices[0],
        churchId: 'other-church',
      };

      prisma.service.findMany.mockResolvedValue([otherChurchService]);

      const request = new NextRequest('http://localhost/api/mobile/v1/sync/checkins/bulk', {
        method: 'POST',
        body: JSON.stringify({
          checkins: [validBulkRequest.checkins[0]],
          conflictResolution: 'last-write-wins',
        }),
      });

      const response = await POST(request);

      expect(createMobileResponse).toHaveBeenCalledWith(
        { error: 'Access denied to services in other churches' },
        403
      );
    });

    it('should allow super admin access to all churches', async () => {
      const superAdminUser = {
        ...mockUser,
        roles: ['SUPER_ADMIN'],
      };

      withMobileAuth.mockImplementation(async (request, handler) => {
        return handler(request, superAdminUser);
      });

      const otherChurchService = {
        ...mockServices[0],
        churchId: 'other-church',
      };

      prisma.service.findMany.mockResolvedValue([otherChurchService]);
      prisma.checkin.findFirst.mockResolvedValue(null);
      prisma.checkin.create.mockResolvedValue({ id: 'checkin1' });
      prisma.checkin.count.mockResolvedValue(1);
      prisma.checkin.findMany.mockResolvedValue([{ userId: 'user123' }]);

      const request = new NextRequest('http://localhost/api/mobile/v1/sync/checkins/bulk', {
        method: 'POST',
        body: JSON.stringify({
          checkins: [validBulkRequest.checkins[0]],
          conflictResolution: 'last-write-wins',
        }),
      });

      const response = await POST(request);

      expect(prisma.checkin.create).toHaveBeenCalled();
      expect(createMobileResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          results: [
            expect.objectContaining({ success: true }),
          ],
        })
      );
    });

    it('should handle individual check-in errors gracefully', async () => {
      prisma.service.findMany.mockResolvedValue(mockServices);
      prisma.checkin.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      prisma.checkin.create
        .mockResolvedValueOnce({ id: 'checkin1' })
        .mockRejectedValueOnce(new Error('Database error'));
      prisma.checkin.count.mockResolvedValue(1);
      prisma.checkin.findMany.mockResolvedValue([{ userId: 'user123' }]);

      const request = new NextRequest('http://localhost/api/mobile/v1/sync/checkins/bulk', {
        method: 'POST',
        body: JSON.stringify(validBulkRequest),
      });

      const response = await POST(request);

      expect(createMobileResponse).toHaveBeenCalledWith({
        results: [
          {
            success: true,
            id: 'offline1',
            serverId: 'checkin1',
            action: 'created',
          },
          {
            success: false,
            id: 'client1',
            error: 'Database error',
          },
        ],
        summary: {
          total: 2,
          successful: 1,
          failed: 1,
          conflicts: 0,
        },
        timestamp: expect.any(String),
      });
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      prisma.service.findMany.mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost/api/mobile/v1/sync/checkins/bulk', {
        method: 'POST',
        body: JSON.stringify(validBulkRequest),
      });

      const response = await POST(request);

      expect(handleMobileApiError).toHaveBeenCalledWith(dbError);
    });
  });
});