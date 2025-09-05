/**
 * DashboardService Unit Tests
 */

import { DashboardService } from '../dashboardService';
import type { User } from '@/types/auth';

// Mock dependencies
jest.mock('@/data/mockData', () => ({
  getMockEvents: jest.fn(),
  getMockPathways: jest.fn(),
  getLifeGroups: jest.fn(),
  getActiveServices: jest.fn(),
  getFirstTimers: jest.fn(),
}));

const mockUser: User = {
  id: 'user123',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  role: 'MEMBER',
  roles: ['MEMBER'],
  tenantId: 'church123',
  isActive: true,
  lastLoginAt: '2025-01-06',
};

describe('DashboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    DashboardService.clearCache();
    
    // Setup navigator mock
    Object.defineProperty(window, 'navigator', {
      value: {
        onLine: true,
      },
      writable: true,
    });
  });

  describe('getDashboardStats', () => {
    it('should return member stats', async () => {
      const memberUser: User = { ...mockUser, role: 'MEMBER' };
      
      // Mock data imports
      const mockData = await import('@/data/mockData');
      (mockData.getMockEvents as jest.Mock).mockReturnValue([
        {
          id: 'event1',
          name: 'Sunday Service',
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);
      (mockData.getMockPathways as jest.Mock).mockReturnValue([
        {
          id: 'pathway1',
          name: 'ROOTS',
          members: ['user123'],
          completedSteps: 3,
          totalSteps: 5,
        },
      ]);

      const stats = await DashboardService.getDashboardStats(memberUser);

      expect(stats).toEqual(expect.objectContaining({
        nextEventName: 'Sunday Service',
        pathwayProgress: 60,
        pathwayName: 'ROOTS',
        isOnline: true,
      }));
    });

    it('should return leader stats', async () => {
      const leaderUser: User = { ...mockUser, role: 'LEADER' };
      
      const mockData = await import('@/data/mockData');
      (mockData.getLifeGroups as jest.Mock).mockReturnValue([
        {
          id: 'group1',
          name: 'Young Adults',
          leaderId: 'user123',
          members: ['member1', 'member2'],
        },
      ]);

      const stats = await DashboardService.getDashboardStats(leaderUser);

      expect(stats).toEqual(expect.objectContaining({
        myGroupsCount: 1,
        nextGroupMeeting: 'Young Adults',
        isOnline: true,
      }));
    });

    it('should return VIP stats', async () => {
      const vipUser: User = { ...mockUser, role: 'VIP' };
      
      const mockData = await import('@/data/mockData');
      (mockData.getFirstTimers as jest.Mock).mockReturnValue([
        {
          id: 'ft1',
          assignedVipId: 'user123',
          visitDate: new Date().toISOString(),
        },
        {
          id: 'ft2',
          assignedVipId: 'user456',
          visitDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        },
      ]);

      const stats = await DashboardService.getDashboardStats(vipUser);

      expect(stats).toEqual(expect.objectContaining({
        newFirstTimersCount: expect.any(Number),
        assignedFirstTimersCount: 1,
        isOnline: true,
      }));
    });

    it('should return admin stats', async () => {
      const adminUser: User = { ...mockUser, role: 'ADMIN' };
      
      const mockData = await import('@/data/mockData');
      (mockData.getActiveServices as jest.Mock).mockReturnValue([
        {
          id: 'service1',
          date: new Date().toISOString(),
        },
      ]);
      (mockData.getMockEvents as jest.Mock).mockReturnValue([
        {
          id: 'event1',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        },
      ]);

      const stats = await DashboardService.getDashboardStats(adminUser);

      expect(stats).toEqual(expect.objectContaining({
        todayCheckInsCount: expect.any(Number),
        activeServicesCount: 1,
        upcomingEventsCount: 1,
        totalMembersCount: 247,
        isOnline: true,
      }));
    });

    it('should cache stats for performance', async () => {
      const mockData = await import('@/data/mockData');
      const mockGetEvents = (mockData.getMockEvents as jest.Mock).mockReturnValue([]);
      const mockGetPathways = (mockData.getMockPathways as jest.Mock).mockReturnValue([]);

      // First call
      await DashboardService.getDashboardStats(mockUser);
      expect(mockGetEvents).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await DashboardService.getDashboardStats(mockUser);
      expect(mockGetEvents).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should handle errors gracefully', async () => {
      const mockData = await import('@/data/mockData');
      (mockData.getMockEvents as jest.Mock).mockImplementation(() => {
        throw new Error('Data fetch error');
      });

      const stats = await DashboardService.getDashboardStats(mockUser);

      expect(stats).toEqual(expect.objectContaining({
        isOnline: true,
      }));
    });
  });

  describe('getDashboardCards', () => {
    it('should return member cards', async () => {
      const memberUser: User = { ...mockUser, role: 'MEMBER' };
      
      const mockData = await import('@/data/mockData');
      (mockData.getMockEvents as jest.Mock).mockReturnValue([
        {
          id: 'event1',
          name: 'Sunday Service',
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);
      (mockData.getMockPathways as jest.Mock).mockReturnValue([
        {
          id: 'pathway1',
          name: 'ROOTS',
          members: ['user123'],
          completedSteps: 3,
          totalSteps: 5,
        },
      ]);

      const cards = await DashboardService.getDashboardCards(memberUser);

      expect(cards).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: 'next-event',
          title: 'Next Event',
          subtitle: 'Sunday Service',
        }),
        expect.objectContaining({
          id: 'pathway-progress',
          title: 'Pathway Progress',
          subtitle: 'ROOTS',
          value: '60%',
        }),
        expect.objectContaining({
          id: 'quick-checkin',
          title: 'Quick Check-In',
          navigateTo: 'CheckIn',
        }),
      ]));
    });

    it('should return leader cards', async () => {
      const leaderUser: User = { ...mockUser, role: 'LEADER' };
      
      const mockData = await import('@/data/mockData');
      (mockData.getLifeGroups as jest.Mock).mockReturnValue([
        {
          id: 'group1',
          name: 'Young Adults',
          leaderId: 'user123',
          members: ['member1', 'member2'],
        },
      ]);

      const cards = await DashboardService.getDashboardCards(leaderUser);

      expect(cards).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: 'my-groups',
          title: 'My Life Groups',
          value: 1,
        }),
      ]));
    });

    it('should return VIP cards', async () => {
      const vipUser: User = { ...mockUser, role: 'VIP' };
      
      const mockData = await import('@/data/mockData');
      (mockData.getFirstTimers as jest.Mock).mockReturnValue([
        {
          id: 'ft1',
          assignedVipId: 'user123',
          visitDate: new Date().toISOString(),
        },
      ]);

      const cards = await DashboardService.getDashboardCards(vipUser);

      expect(cards).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: 'new-first-timers',
          title: 'New First-Timers',
          navigateTo: 'VIP',
        }),
        expect.objectContaining({
          id: 'my-assignments',
          title: 'My Assignments',
          value: 1,
        }),
      ]));
    });

    it('should return admin cards', async () => {
      const adminUser: User = { ...mockUser, role: 'ADMIN' };
      
      const mockData = await import('@/data/mockData');
      (mockData.getActiveServices as jest.Mock).mockReturnValue([]);
      (mockData.getMockEvents as jest.Mock).mockReturnValue([]);

      const cards = await DashboardService.getDashboardCards(adminUser);

      expect(cards).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: 'today-checkins',
          title: 'Today\'s Check-ins',
        }),
        expect.objectContaining({
          id: 'upcoming-events',
          title: 'Upcoming Events',
          navigateTo: 'Events',
        }),
      ]));
    });

    it('should sort cards by priority', async () => {
      const cards = await DashboardService.getDashboardCards(mockUser);
      
      // Verify cards are sorted by priority (ascending)
      for (let i = 1; i < cards.length; i++) {
        expect(cards[i].priority).toBeGreaterThanOrEqual(cards[i - 1].priority);
      }
    });
  });

  describe('refreshDashboard', () => {
    it('should clear cache and refetch data', async () => {
      const mockData = await import('@/data/mockData');
      const mockGetEvents = (mockData.getMockEvents as jest.Mock).mockReturnValue([]);

      // Initial call to populate cache
      await DashboardService.getDashboardStats(mockUser);
      expect(mockGetEvents).toHaveBeenCalledTimes(1);

      // Refresh should clear cache and refetch
      await DashboardService.refreshDashboard(mockUser);
      expect(mockGetEvents).toHaveBeenCalledTimes(2); // Called again after refresh
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', async () => {
      // Populate cache
      await DashboardService.getDashboardStats(mockUser);
      
      // Clear cache
      DashboardService.clearCache();
      
      const mockData = await import('@/data/mockData');
      const mockGetEvents = (mockData.getMockEvents as jest.Mock).mockReturnValue([]);
      
      // Next call should fetch fresh data
      await DashboardService.getDashboardStats(mockUser);
      expect(mockGetEvents).toHaveBeenCalledTimes(1);
    });
  });
});