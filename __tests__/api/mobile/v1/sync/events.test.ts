/**
 * @file Tests for Events Delta Sync API
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/mobile/v1/sync/events/route';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    event: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('@/lib/mobile-auth', () => ({
  withMobileAuth: vi.fn(),
  createMobileResponse: vi.fn(),
  handleMobileApiError: vi.fn(),
  createMobileTenantWhere: vi.fn(),
}));

describe('Events Delta Sync API', () => {
  const { prisma } = vi.mocked(await import('@/lib/db'));
  const { 
    withMobileAuth, 
    createMobileResponse, 
    handleMobileApiError, 
    createMobileTenantWhere 
  } = vi.mocked(await import('@/lib/mobile-auth'));

  const mockUser = {
    sub: 'user123',
    email: 'test@example.com',
    roles: ['MEMBER'],
    tenantId: 'tenant123',
    churchId: 'church123',
  };

  const mockEvents = [
    {
      id: 'event1',
      title: 'Test Event 1',
      description: 'First test event',
      eventDate: new Date('2024-06-01'),
      eventTime: '10:00',
      location: 'Main Hall',
      capacity: 100,
      fee: null,
      visibility: 'PUBLIC',
      scope: 'WHOLE_CHURCH',
      status: 'PUBLISHED',
      churchId: 'church123',
      church: { id: 'church123', name: 'Test Church' },
      rsvps: [],
      _count: { rsvps: 25 },
      createdAt: new Date('2024-05-01'),
      updatedAt: new Date('2024-05-15'),
    },
    {
      id: 'event2',
      title: 'Test Event 2',
      description: 'Second test event',
      eventDate: new Date('2024-06-15'),
      eventTime: '14:00',
      location: 'Room A',
      capacity: 50,
      fee: 25.50,
      visibility: 'MEMBERS',
      scope: 'LOCAL_CHURCH',
      status: 'PUBLISHED',
      churchId: 'church123',
      church: { id: 'church123', name: 'Test Church' },
      rsvps: [
        {
          id: 'rsvp1',
          status: 'CONFIRMED',
          rsvpDate: new Date('2024-05-20'),
        },
      ],
      _count: { rsvps: 45 },
      createdAt: new Date('2024-05-10'),
      updatedAt: new Date('2024-05-20'),
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

  describe('GET /api/mobile/v1/sync/events', () => {
    it('should return events with default parameters', async () => {
      prisma.event.findMany.mockResolvedValue(mockEvents);
      prisma.event.count.mockResolvedValue(2);

      const request = new NextRequest('http://localhost/api/mobile/v1/sync/events');
      const response = await GET(request);

      expect(prisma.event.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant123',
          OR: [
            { updatedAt: { gte: expect.any(Date) } },
            { createdAt: { gte: expect.any(Date) } },
          ],
          OR: [
            { visibility: 'PUBLIC' },
            { visibility: 'MEMBERS' },
            { visibility: 'LEADERS' },
            { visibility: 'ADMINS' },
          ],
          OR: [
            { scope: 'WHOLE_CHURCH' },
            { 
              scope: 'LOCAL_CHURCH',
              church: { id: 'church123' },
            },
          ],
        },
        include: {
          church: { select: { id: true, name: true } },
          rsvps: {
            where: { userId: 'user123' },
            select: { id: true, status: true, rsvpDate: true },
          },
          _count: {
            select: {
              rsvps: { where: { status: 'CONFIRMED' } },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
        skip: 0,
      });

      expect(createMobileResponse).toHaveBeenCalledWith({
        events: expect.arrayContaining([
          expect.objectContaining({
            id: 'event1',
            title: 'Test Event 1',
            churchName: 'Test Church',
            userRsvp: null,
            attendeeCount: 25,
            isFull: false,
          }),
          expect.objectContaining({
            id: 'event2',
            title: 'Test Event 2',
            userRsvp: {
              id: 'rsvp1',
              status: 'CONFIRMED',
              rsvpDate: expect.any(String),
            },
            attendeeCount: 45,
            isFull: false,
          }),
        ]),
        hasMore: false,
        nextOffset: null,
        timestamp: expect.any(String),
        syncVersion: 1,
      });
    });

    it('should handle updatedAfter parameter', async () => {
      const updatedAfter = '2024-05-10T00:00:00.000Z';
      prisma.event.findMany.mockResolvedValue(mockEvents);
      prisma.event.count.mockResolvedValue(2);

      const request = new NextRequest(
        `http://localhost/api/mobile/v1/sync/events?updatedAfter=${updatedAfter}`
      );
      const response = await GET(request);

      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { updatedAt: { gte: new Date(updatedAfter) } },
              { createdAt: { gte: new Date(updatedAfter) } },
            ],
          }),
        })
      );
    });

    it('should handle limit and offset parameters', async () => {
      prisma.event.findMany.mockResolvedValue([mockEvents[0]]);
      prisma.event.count.mockResolvedValue(2);

      const request = new NextRequest(
        'http://localhost/api/mobile/v1/sync/events?limit=1&offset=1'
      );
      const response = await GET(request);

      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1,
          skip: 1,
        })
      );

      expect(createMobileResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          events: expect.arrayContaining([
            expect.objectContaining({ id: 'event1' }),
          ]),
          hasMore: true,
          nextOffset: 2,
        })
      );
    });

    it('should respect maximum limit of 100', async () => {
      prisma.event.findMany.mockResolvedValue([]);
      prisma.event.count.mockResolvedValue(0);

      const request = new NextRequest(
        'http://localhost/api/mobile/v1/sync/events?limit=200'
      );
      const response = await GET(request);

      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100, // Should be capped at 100
        })
      );
    });

    it('should handle invalid updatedAfter format', async () => {
      const request = new NextRequest(
        'http://localhost/api/mobile/v1/sync/events?updatedAfter=invalid-date'
      );
      const response = await GET(request);

      expect(createMobileResponse).toHaveBeenCalledWith(
        { error: 'Invalid updatedAfter timestamp format. Use ISO 8601 format.' },
        400
      );
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      prisma.event.findMany.mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost/api/mobile/v1/sync/events');
      const response = await GET(request);

      expect(handleMobileApiError).toHaveBeenCalledWith(dbError);
    });

    it('should properly format event with capacity and fees', async () => {
      const fullEvent = {
        ...mockEvents[1],
        capacity: 45, // Same as attendee count
        fee: 25.50,
        _count: { rsvps: 45 }, // Full capacity
      };

      prisma.event.findMany.mockResolvedValue([fullEvent]);
      prisma.event.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost/api/mobile/v1/sync/events');
      const response = await GET(request);

      expect(createMobileResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          events: expect.arrayContaining([
            expect.objectContaining({
              id: 'event2',
              fee: 25.5,
              capacity: 45,
              attendeeCount: 45,
              isFull: true,
            }),
          ]),
        })
      );
    });

    it('should handle super admin access to all churches', async () => {
      const superAdminUser = {
        ...mockUser,
        roles: ['SUPER_ADMIN'],
      };

      withMobileAuth.mockImplementation(async (request, handler) => {
        return handler(request, superAdminUser);
      });

      prisma.event.findMany.mockResolvedValue(mockEvents);
      prisma.event.count.mockResolvedValue(2);

      const request = new NextRequest('http://localhost/api/mobile/v1/sync/events');
      const response = await GET(request);

      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                scope: 'LOCAL_CHURCH',
                church: { id: 'church123' },
              }),
            ]),
          }),
        })
      );
    });

    it('should return empty results when no events match criteria', async () => {
      prisma.event.findMany.mockResolvedValue([]);
      prisma.event.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost/api/mobile/v1/sync/events');
      const response = await GET(request);

      expect(createMobileResponse).toHaveBeenCalledWith({
        events: [],
        hasMore: false,
        nextOffset: null,
        timestamp: expect.any(String),
        syncVersion: 1,
      });
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Authentication required');
      withMobileAuth.mockRejectedValue(authError);

      const request = new NextRequest('http://localhost/api/mobile/v1/sync/events');
      
      await expect(GET(request)).rejects.toThrow('Authentication required');
    });
  });

  describe('Event Visibility and Scope Rules', () => {
    it('should apply correct visibility rules for different user roles', async () => {
      const leaderUser = { ...mockUser, roles: ['LEADER'] };
      
      withMobileAuth.mockImplementation(async (request, handler) => {
        return handler(request, leaderUser);
      });

      prisma.event.findMany.mockResolvedValue([]);
      prisma.event.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost/api/mobile/v1/sync/events');
      const response = await GET(request);

      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { visibility: 'PUBLIC' },
              { visibility: 'MEMBERS' },
              { visibility: 'LEADERS' },
              { visibility: 'ADMINS' },
            ],
          }),
        })
      );
    });

    it('should apply scope filtering for non-super admins', async () => {
      prisma.event.findMany.mockResolvedValue([]);
      prisma.event.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost/api/mobile/v1/sync/events');
      const response = await GET(request);

      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { scope: 'WHOLE_CHURCH' },
              { 
                scope: 'LOCAL_CHURCH',
                church: { id: 'church123' },
              },
            ],
          }),
        })
      );
    });
  });
});