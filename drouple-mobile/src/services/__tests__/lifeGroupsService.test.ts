/**
 * LifeGroupsService Unit Tests
 * Tests for life groups discovery, join requests, and attendance marking
 */

import { QueryClient } from '@tanstack/react-query';
import { LifeGroupsService } from '../lifeGroupsService';
import { database } from '@/lib/db/database';
import { MOCK_LIFE_GROUPS } from '@/data/mockGroups';
import toast from '@/utils/toast';

// Mock dependencies
jest.mock('@/lib/db/database', () => ({
  database: {
    enqueue: jest.fn(),
    getQueue: jest.fn(),
    removeFromQueue: jest.fn(),
    setKV: jest.fn(),
    getKVJson: jest.fn(),
    deleteKV: jest.fn(),
  },
}));

jest.mock('@/lib/monitoring/sentryService', () => ({
  SentryService: {
    captureError: jest.fn(),
  },
}));

jest.mock('@/utils/toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/api/client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

const mockDatabase = database as jest.Mocked<typeof database>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('LifeGroupsService', () => {
  let queryClient: QueryClient;
  let lifeGroupsService: LifeGroupsService;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    lifeGroupsService = new LifeGroupsService(queryClient);
    
    // Setup default cache responses
    mockDatabase.getKVJson.mockImplementation((key) => {
      if (key === 'cached_life_groups') {
        return Promise.resolve({
          groups: MOCK_LIFE_GROUPS,
          timestamp: Date.now(),
        });
      }
      return Promise.resolve(null);
    });
  });

  describe('requestToJoinGroup', () => {
    it('should submit join request successfully online', async () => {
      const groupId = 'lg-1';
      const userId = 'user-1';
      const message = 'I want to join this group';

      // Mock successful API response
      const mockApiClient = require('@/lib/api/client').apiClient;
      mockApiClient.post.mockResolvedValue({ success: true });

      const result = await lifeGroupsService.requestToJoinGroup(groupId, userId, message);

      expect(result).toBe(true);
      expect(mockApiClient.post).toHaveBeenCalledWith(
        expect.stringContaining(groupId),
        expect.objectContaining({
          groupId,
          userId,
          message,
        })
      );
      expect(mockDatabase.setKV).toHaveBeenCalledWith(
        'cached_life_groups',
        expect.any(Object)
      );
      expect(mockToast.success).toHaveBeenCalledWith('Join request sent successfully!');
    });

    it('should queue join request for offline sync when API fails', async () => {
      const groupId = 'lg-1';
      const userId = 'user-1';

      // Mock API failure
      const mockApiClient = require('@/lib/api/client').apiClient;
      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      const result = await lifeGroupsService.requestToJoinGroup(groupId, userId);

      expect(result).toBe(false);
      expect(mockDatabase.enqueue).toHaveBeenCalledWith(
        'GROUP_JOIN_REQUEST',
        expect.objectContaining({
          groupId,
          userId,
        })
      );
      expect(mockToast.info).toHaveBeenCalledWith('Join request queued - will sync when online');
    });

    it('should update local group with join request', async () => {
      const groupId = 'lg-1';
      const userId = 'user-1';
      const message = 'Join request message';

      // Mock API success
      const mockApiClient = require('@/lib/api/client').apiClient;
      mockApiClient.post.mockResolvedValue({ success: true });

      await lifeGroupsService.requestToJoinGroup(groupId, userId, message);

      // Verify the group was updated in cache with new join request
      expect(mockDatabase.setKV).toHaveBeenCalledWith(
        'cached_life_groups',
        expect.objectContaining({
          groups: expect.arrayContaining([
            expect.objectContaining({
              id: groupId,
              joinRequests: expect.arrayContaining([
                expect.objectContaining({
                  userId,
                  status: 'pending',
                  message,
                })
              ]),
            })
          ]),
        })
      );
    });
  });

  describe('markAttendance', () => {
    it('should mark attendance successfully online', async () => {
      const groupId = 'lg-1';
      const sessionId = 'session-1';
      const userId = 'user-1';

      // Mock successful API response
      const mockApiClient = require('@/lib/api/client').apiClient;
      mockApiClient.post.mockResolvedValue({ success: true });

      const result = await lifeGroupsService.markAttendance(groupId, sessionId, userId, true);

      expect(result).toBe(true);
      expect(mockApiClient.post).toHaveBeenCalledWith(
        expect.stringContaining(groupId),
        expect.objectContaining({
          groupId,
          sessionId,
          userId,
          isPresent: true,
        })
      );
      expect(mockToast.success).toHaveBeenCalledWith('Attendance marked!');
    });

    it('should queue attendance for offline sync when API fails', async () => {
      const groupId = 'lg-1';
      const sessionId = 'session-1';
      const userId = 'user-1';

      // Mock API failure
      const mockApiClient = require('@/lib/api/client').apiClient;
      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      const result = await lifeGroupsService.markAttendance(groupId, sessionId, userId, false);

      expect(result).toBe(false);
      expect(mockDatabase.enqueue).toHaveBeenCalledWith(
        'GROUP_ATTENDANCE',
        expect.objectContaining({
          groupId,
          sessionId,
          userId,
          isPresent: false,
        })
      );
      expect(mockToast.info).toHaveBeenCalledWith('Attendance queued - will sync when online');
    });

    it('should update local attendance for present status', async () => {
      const groupId = 'lg-1';
      const sessionId = 'existing-session-1';
      const userId = 'user-1';

      // Mock API success
      const mockApiClient = require('@/lib/api/client').apiClient;
      mockApiClient.post.mockResolvedValue({ success: true });

      await lifeGroupsService.markAttendance(groupId, sessionId, userId, true);

      // Verify the session was updated in cache with new attendee
      expect(mockDatabase.setKV).toHaveBeenCalledWith(
        'cached_life_groups',
        expect.objectContaining({
          groups: expect.arrayContaining([
            expect.objectContaining({
              id: groupId,
              sessions: expect.arrayContaining([
                expect.objectContaining({
                  id: sessionId,
                  attendees: expect.arrayContaining([userId]),
                })
              ]),
            })
          ]),
        })
      );
    });

    it('should remove user from attendance for absent status', async () => {
      // Create a group with user already marked present
      const testGroups = [{
        ...MOCK_LIFE_GROUPS[0],
        sessions: [{
          id: 'test-session',
          date: new Date().toISOString(),
          attendees: ['user-1', 'user-2'],
          createdBy: 'leader-1',
        }],
      }];

      mockDatabase.getKVJson.mockImplementation((key) => {
        if (key === 'cached_life_groups') {
          return Promise.resolve({
            groups: testGroups,
            timestamp: Date.now(),
          });
        }
        return Promise.resolve(null);
      });

      const groupId = testGroups[0].id;
      const sessionId = 'test-session';
      const userId = 'user-1';

      // Mock API success
      const mockApiClient = require('@/lib/api/client').apiClient;
      mockApiClient.post.mockResolvedValue({ success: true });

      await lifeGroupsService.markAttendance(groupId, sessionId, userId, false);

      // Verify the user was removed from attendees
      expect(mockDatabase.setKV).toHaveBeenCalledWith(
        'cached_life_groups',
        expect.objectContaining({
          groups: expect.arrayContaining([
            expect.objectContaining({
              id: groupId,
              sessions: expect.arrayContaining([
                expect.objectContaining({
                  id: sessionId,
                  attendees: ['user-2'], // user-1 should be removed
                })
              ]),
            })
          ]),
        })
      );
    });
  });

  describe('getGroupStats', () => {
    it('should calculate group statistics correctly', async () => {
      const userId = 'member-1';
      const churchId = 'hpci-manila';

      const stats = await lifeGroupsService.getGroupStats(userId, churchId);

      expect(stats).toEqual(
        expect.objectContaining({
          totalGroups: expect.any(Number),
          myGroups: expect.any(Number),
          availableGroups: expect.any(Number),
          totalAttendances: expect.any(Number),
        })
      );
      
      expect(stats.totalGroups).toBeGreaterThan(0);
      expect(stats.myGroups).toBeGreaterThanOrEqual(0);
      expect(stats.availableGroups).toBeGreaterThanOrEqual(0);
    });

    it('should return zero stats on error', async () => {
      mockDatabase.getKVJson.mockRejectedValue(new Error('Cache error'));

      const stats = await lifeGroupsService.getGroupStats('user-1', 'church-1');

      expect(stats).toEqual({
        totalGroups: 0,
        myGroups: 0,
        availableGroups: 0,
        totalAttendances: 0,
      });
    });
  });

  describe('createGroupSession', () => {
    it('should create a new group session', async () => {
      const groupId = 'lg-1';
      const topic = 'Bible Study';
      const notes = 'Session notes';

      const session = await lifeGroupsService.createGroupSession(groupId, topic, notes);

      expect(session).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          date: expect.any(String),
          topic,
          notes,
          attendees: [],
          createdBy: 'current-user',
        })
      );

      // Verify session was added to cached group
      expect(mockDatabase.setKV).toHaveBeenCalledWith(
        'cached_life_groups',
        expect.objectContaining({
          groups: expect.arrayContaining([
            expect.objectContaining({
              id: groupId,
              sessions: expect.arrayContaining([
                expect.objectContaining({
                  topic,
                  notes,
                })
              ]),
            })
          ]),
        })
      );

      expect(mockToast.success).toHaveBeenCalledWith('Group session created!');
    });

    it('should return null on session creation error', async () => {
      mockDatabase.getKVJson.mockRejectedValue(new Error('Cache error'));

      const session = await lifeGroupsService.createGroupSession('lg-1', 'Topic');

      expect(session).toBeNull();
      expect(mockToast.error).toHaveBeenCalledWith('Failed to create session');
    });
  });

  describe('getLifeGroups', () => {
    it('should return all life groups when no church ID provided', async () => {
      const groups = await lifeGroupsService.getLifeGroups();

      expect(groups).toEqual(MOCK_LIFE_GROUPS);
      expect(mockDatabase.getKVJson).toHaveBeenCalledWith('cached_life_groups');
    });

    it('should filter by church ID when provided', async () => {
      const churchId = 'hpci-manila';

      const groups = await lifeGroupsService.getLifeGroups(churchId);

      expect(groups).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            churchId,
          })
        ])
      );
      
      // Verify all returned groups belong to the specified church
      groups.forEach(group => {
        expect(group.churchId).toBe(churchId);
      });
    });

    it('should return mock data if cache fails', async () => {
      mockDatabase.getKVJson.mockRejectedValue(new Error('Cache error'));

      const groups = await lifeGroupsService.getLifeGroups();

      expect(groups).toEqual(MOCK_LIFE_GROUPS);
    });
  });

  describe('getLifeGroup', () => {
    it('should return specific group by ID', async () => {
      const groupId = 'lg-1';

      const group = await lifeGroupsService.getLifeGroup(groupId);

      expect(group).toEqual(
        expect.objectContaining({
          id: groupId,
        })
      );
    });

    it('should return null if group not found', async () => {
      const group = await lifeGroupsService.getLifeGroup('non-existent-group');

      expect(group).toBeNull();
    });
  });

  describe('syncGroupActions', () => {
    it('should sync queued join requests and attendance', async () => {
      const joinRequests = [
        {
          id: 'queue-1',
          data: {
            clientRequestId: 'request-1',
            groupId: 'lg-1',
            userId: 'user-1',
            timestamp: new Date().toISOString(),
          },
        },
      ];

      const attendances = [
        {
          id: 'queue-2',
          data: {
            clientRequestId: 'attendance-1',
            groupId: 'lg-1',
            sessionId: 'session-1',
            userId: 'user-1',
            isPresent: true,
            timestamp: new Date().toISOString(),
          },
        },
      ];

      mockDatabase.getQueue
        .mockResolvedValueOnce(joinRequests)
        .mockResolvedValueOnce(attendances);
      
      // Mock API success
      const mockApiClient = require('@/lib/api/client').apiClient;
      mockApiClient.post.mockResolvedValue({ success: true });

      await lifeGroupsService.syncGroupActions();

      expect(mockDatabase.getQueue).toHaveBeenCalledWith('GROUP_JOIN_REQUEST');
      expect(mockDatabase.getQueue).toHaveBeenCalledWith('GROUP_ATTENDANCE');
      expect(mockApiClient.post).toHaveBeenCalledTimes(2);
      expect(mockDatabase.removeFromQueue).toHaveBeenCalledWith('queue-1');
      expect(mockDatabase.removeFromQueue).toHaveBeenCalledWith('queue-2');
    });

    it('should keep items in queue if sync fails', async () => {
      const joinRequests = [
        {
          id: 'queue-1',
          data: {
            clientRequestId: 'request-1',
            groupId: 'lg-1',
            userId: 'user-1',
            timestamp: new Date().toISOString(),
          },
        },
      ];

      mockDatabase.getQueue
        .mockResolvedValueOnce(joinRequests)
        .mockResolvedValueOnce([]);
      
      // Mock API failure
      const mockApiClient = require('@/lib/api/client').apiClient;
      mockApiClient.post.mockRejectedValue(new Error('Sync failed'));

      await lifeGroupsService.syncGroupActions();

      expect(mockDatabase.removeFromQueue).not.toHaveBeenCalled();
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', async () => {
      await lifeGroupsService.clearCache();

      expect(mockDatabase.deleteKV).toHaveBeenCalledWith('cached_life_groups');
    });
  });
});