/**
 * PathwaysService Unit Tests
 * Tests for pathway progress tracking, step completion, and milestone notifications
 */

import { QueryClient } from '@tanstack/react-query';
import { PathwaysService, UserAchievement } from '../pathwaysService';
import { database } from '@/lib/db/database';
import { NotificationService } from '@/lib/notifications/notificationService';
import { MOCK_PATHWAYS, MockPathway } from '@/data/mockPathways';
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

jest.mock('@/lib/notifications/notificationService', () => ({
  NotificationService: {
    sendPathwayMilestone: jest.fn(),
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
const mockNotificationService = NotificationService as jest.Mocked<typeof NotificationService>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('PathwaysService', () => {
  let queryClient: QueryClient;
  let pathwaysService: PathwaysService;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    pathwaysService = new PathwaysService(queryClient);
    
    // Setup default cache responses
    mockDatabase.getKVJson.mockImplementation((key) => {
      if (key === 'cached_pathways') {
        return Promise.resolve({
          pathways: MOCK_PATHWAYS,
          timestamp: Date.now(),
        });
      }
      if (key === 'cached_achievements') {
        return Promise.resolve({
          achievements: [],
          timestamp: Date.now(),
        });
      }
      return Promise.resolve(null);
    });
  });

  describe('completeStep', () => {
    it('should complete a step successfully online', async () => {
      const pathwayId = 'pathway-1';
      const stepId = 'step-1-1';
      const notes = 'Test completion notes';

      // Mock successful API response
      const mockApiClient = require('@/lib/api/client').apiClient;
      mockApiClient.post.mockResolvedValue({ success: true });

      const result = await pathwaysService.completeStep(pathwayId, stepId, notes);

      expect(result).toBe(true);
      expect(mockApiClient.post).toHaveBeenCalledWith(
        expect.stringContaining(pathwayId),
        expect.objectContaining({
          pathwayId,
          stepId,
          notes,
        })
      );
      expect(mockDatabase.setKV).toHaveBeenCalledWith(
        'cached_pathways',
        expect.any(Object)
      );
      expect(mockToast.success).toHaveBeenCalledWith('Step completed!');
    });

    it('should queue step completion for offline sync when API fails', async () => {
      const pathwayId = 'pathway-1';
      const stepId = 'step-1-1';

      // Mock API failure
      const mockApiClient = require('@/lib/api/client').apiClient;
      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      const result = await pathwaysService.completeStep(pathwayId, stepId);

      expect(result).toBe(false);
      expect(mockDatabase.enqueue).toHaveBeenCalledWith(
        'STEP_COMPLETION',
        expect.objectContaining({
          pathwayId,
          stepId,
        })
      );
      expect(mockToast.info).toHaveBeenCalledWith('Step completion queued - will sync when online');
    });

    it('should update local progress correctly after step completion', async () => {
      const pathwayId = 'pathway-1';
      const stepId = 'step-1-3'; // An incomplete step

      // Mock API success
      const mockApiClient = require('@/lib/api/client').apiClient;
      mockApiClient.post.mockResolvedValue({ success: true });

      await pathwaysService.completeStep(pathwayId, stepId);

      // Verify the pathway was updated in cache
      expect(mockDatabase.setKV).toHaveBeenCalledWith(
        'cached_pathways',
        expect.objectContaining({
          pathways: expect.arrayContaining([
            expect.objectContaining({
              id: pathwayId,
              steps: expect.arrayContaining([
                expect.objectContaining({
                  id: stepId,
                  isCompleted: true,
                  completedAt: expect.any(String),
                })
              ]),
            })
          ]),
        })
      );
    });
  });

  describe('milestone notifications', () => {
    it('should send notification for 25% milestone', async () => {
      const pathwayId = 'pathway-test';
      const stepId = 'step-test';
      
      // Create a test pathway with 4 steps
      const testPathway: MockPathway = {
        id: pathwayId,
        title: 'Test Pathway',
        description: 'Test pathway for milestone testing',
        category: 'spiritual_growth',
        difficulty: 'beginner',
        estimatedDuration: '4 weeks',
        totalSteps: 4,
        completedSteps: 0,
        isEnrolled: true,
        progress: 0,
        tags: ['test'],
        steps: [
          { id: 'step-1', title: 'Step 1', description: 'First step', order: 1, isCompleted: false },
          { id: 'step-2', title: 'Step 2', description: 'Second step', order: 2, isCompleted: false },
          { id: stepId, title: 'Step 3', description: 'Third step', order: 3, isCompleted: false },
          { id: 'step-4', title: 'Step 4', description: 'Fourth step', order: 4, isCompleted: false },
        ],
      };

      // Mock cache to return test pathway
      mockDatabase.getKVJson.mockImplementation((key) => {
        if (key === 'cached_pathways') {
          return Promise.resolve({
            pathways: [testPathway],
            timestamp: Date.now(),
          });
        }
        if (key === 'cached_achievements') {
          return Promise.resolve({
            achievements: [],
            timestamp: Date.now(),
          });
        }
        return Promise.resolve(null);
      });

      // Mock API success
      const mockApiClient = require('@/lib/api/client').apiClient;
      mockApiClient.post.mockResolvedValue({ success: true });

      await pathwaysService.completeStep(pathwayId, stepId);

      expect(mockNotificationService.sendPathwayMilestone).toHaveBeenCalledWith(
        expect.objectContaining({
          pathwayId,
          pathwayName: 'Test Pathway',
          percentage: 25,
        })
      );
    });

    it('should award achievement badges for milestones', async () => {
      const pathwayId = 'pathway-test';
      const stepId = 'step-test';
      
      // Create a test pathway at 100% completion
      const testPathway: MockPathway = {
        id: pathwayId,
        title: 'Test Pathway',
        description: 'Test pathway for achievement testing',
        category: 'spiritual_growth',
        difficulty: 'beginner',
        estimatedDuration: '2 weeks',
        totalSteps: 2,
        completedSteps: 1,
        isEnrolled: true,
        progress: 50,
        tags: ['test'],
        steps: [
          { id: 'step-1', title: 'Step 1', description: 'First step', order: 1, isCompleted: true },
          { id: stepId, title: 'Step 2', description: 'Second step', order: 2, isCompleted: false },
        ],
      };

      mockDatabase.getKVJson.mockImplementation((key) => {
        if (key === 'cached_pathways') {
          return Promise.resolve({
            pathways: [testPathway],
            timestamp: Date.now(),
          });
        }
        if (key === 'cached_achievements') {
          return Promise.resolve({
            achievements: [],
            timestamp: Date.now(),
          });
        }
        return Promise.resolve(null);
      });

      // Mock API success
      const mockApiClient = require('@/lib/api/client').apiClient;
      mockApiClient.post.mockResolvedValue({ success: true });

      await pathwaysService.completeStep(pathwayId, stepId);

      // Should award 100% completion achievement
      expect(mockDatabase.setKV).toHaveBeenCalledWith(
        'cached_achievements',
        expect.objectContaining({
          achievements: expect.arrayContaining([
            expect.objectContaining({
              pathwayId,
              badgeType: 'pathway_completed',
              description: 'Completed Test Pathway',
              iconName: 'trophy',
              color: '#4caf50',
            })
          ]),
        })
      );

      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringContaining('🏆 Achievement Unlocked: Completed Test Pathway!')
      );
    });
  });

  describe('enrollInPathway', () => {
    it('should enroll user in pathway successfully', async () => {
      const pathwayId = 'pathway-2';

      const result = await pathwaysService.enrollInPathway(pathwayId);

      expect(result).toBe(true);
      expect(mockDatabase.setKV).toHaveBeenCalledWith(
        'cached_pathways',
        expect.objectContaining({
          pathways: expect.arrayContaining([
            expect.objectContaining({
              id: pathwayId,
              isEnrolled: true,
              enrolledAt: expect.any(String),
            })
          ]),
        })
      );
      expect(mockToast.success).toHaveBeenCalledWith('Enrolled successfully!');
    });

    it('should award enrollment achievement', async () => {
      const pathwayId = 'pathway-2';

      await pathwaysService.enrollInPathway(pathwayId);

      expect(mockDatabase.setKV).toHaveBeenCalledWith(
        'cached_achievements',
        expect.objectContaining({
          achievements: expect.arrayContaining([
            expect.objectContaining({
              pathwayId,
              badgeType: 'pathway_started',
              iconName: 'rocket-launch',
              color: '#1e7ce8',
            })
          ]),
        })
      );
    });
  });

  describe('getUserPathways', () => {
    it('should return cached pathways', async () => {
      const pathways = await pathwaysService.getUserPathways();

      expect(pathways).toEqual(MOCK_PATHWAYS);
      expect(mockDatabase.getKVJson).toHaveBeenCalledWith('cached_pathways');
    });

    it('should return mock data if cache fails', async () => {
      mockDatabase.getKVJson.mockRejectedValue(new Error('Cache error'));

      const pathways = await pathwaysService.getUserPathways();

      expect(pathways).toEqual(MOCK_PATHWAYS);
    });
  });

  describe('getAchievements', () => {
    it('should return cached achievements', async () => {
      const mockAchievements: UserAchievement[] = [
        {
          id: 'test-achievement',
          pathwayId: 'pathway-1',
          pathwayName: 'Test Pathway',
          badgeType: 'pathway_completed',
          earnedAt: new Date().toISOString(),
          description: 'Completed Test Pathway',
          iconName: 'trophy',
          color: '#4caf50',
        },
      ];

      mockDatabase.getKVJson.mockResolvedValueOnce({
        achievements: mockAchievements,
        timestamp: Date.now(),
      });

      const achievements = await pathwaysService.getAchievements();

      expect(achievements).toEqual(mockAchievements);
      expect(mockDatabase.getKVJson).toHaveBeenCalledWith('cached_achievements');
    });

    it('should return empty array if no achievements cached', async () => {
      mockDatabase.getKVJson.mockResolvedValueOnce(null);

      const achievements = await pathwaysService.getAchievements();

      expect(achievements).toEqual([]);
    });
  });

  describe('syncProgress', () => {
    it('should sync queued step completions', async () => {
      const queuedItems = [
        {
          id: 'queue-1',
          data: {
            clientRequestId: 'test-request',
            pathwayId: 'pathway-1',
            stepId: 'step-1',
            timestamp: new Date().toISOString(),
          },
        },
      ];

      mockDatabase.getQueue.mockResolvedValue(queuedItems);
      
      // Mock API success
      const mockApiClient = require('@/lib/api/client').apiClient;
      mockApiClient.post.mockResolvedValue({ success: true });

      await pathwaysService.syncProgress();

      expect(mockDatabase.getQueue).toHaveBeenCalledWith('STEP_COMPLETION');
      expect(mockApiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          pathwayId: 'pathway-1',
          stepId: 'step-1',
        })
      );
      expect(mockDatabase.removeFromQueue).toHaveBeenCalledWith('queue-1');
    });

    it('should keep items in queue if sync fails', async () => {
      const queuedItems = [
        {
          id: 'queue-1',
          data: {
            clientRequestId: 'test-request',
            pathwayId: 'pathway-1',
            stepId: 'step-1',
            timestamp: new Date().toISOString(),
          },
        },
      ];

      mockDatabase.getQueue.mockResolvedValue(queuedItems);
      
      // Mock API failure
      const mockApiClient = require('@/lib/api/client').apiClient;
      mockApiClient.post.mockRejectedValue(new Error('Sync failed'));

      await pathwaysService.syncProgress();

      expect(mockDatabase.removeFromQueue).not.toHaveBeenCalled();
    });
  });

  describe('calculateProgress', () => {
    it('should calculate progress correctly', () => {
      const pathway: MockPathway = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        category: 'spiritual_growth',
        difficulty: 'beginner',
        estimatedDuration: '4 weeks',
        totalSteps: 4,
        completedSteps: 2,
        isEnrolled: true,
        progress: 0, // Will be calculated
        tags: [],
        steps: [
          { id: '1', title: 'Step 1', description: '', order: 1, isCompleted: true },
          { id: '2', title: 'Step 2', description: '', order: 2, isCompleted: true },
          { id: '3', title: 'Step 3', description: '', order: 3, isCompleted: false },
          { id: '4', title: 'Step 4', description: '', order: 4, isCompleted: false },
        ],
      };

      const progress = PathwaysService.calculateProgress(pathway);

      expect(progress).toBe(50);
    });

    it('should return 0 for pathway with no steps', () => {
      const pathway: MockPathway = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        category: 'spiritual_growth',
        difficulty: 'beginner',
        estimatedDuration: '0 weeks',
        totalSteps: 0,
        completedSteps: 0,
        isEnrolled: true,
        progress: 0,
        tags: [],
        steps: [],
      };

      const progress = PathwaysService.calculateProgress(pathway);

      expect(progress).toBe(0);
    });
  });

  describe('getNextStep', () => {
    it('should return next incomplete step', () => {
      const pathway: MockPathway = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        category: 'spiritual_growth',
        difficulty: 'beginner',
        estimatedDuration: '3 weeks',
        totalSteps: 3,
        completedSteps: 1,
        isEnrolled: true,
        progress: 33,
        tags: [],
        steps: [
          { id: '1', title: 'Step 1', description: '', order: 1, isCompleted: true },
          { id: '2', title: 'Step 2', description: '', order: 2, isCompleted: false },
          { id: '3', title: 'Step 3', description: '', order: 3, isCompleted: false },
        ],
      };

      const nextStep = PathwaysService.getNextStep(pathway);

      expect(nextStep).toEqual(
        expect.objectContaining({
          id: '2',
          title: 'Step 2',
          isCompleted: false,
        })
      );
    });

    it('should return null if all steps are completed', () => {
      const pathway: MockPathway = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        category: 'spiritual_growth',
        difficulty: 'beginner',
        estimatedDuration: '2 weeks',
        totalSteps: 2,
        completedSteps: 2,
        isEnrolled: true,
        progress: 100,
        tags: [],
        steps: [
          { id: '1', title: 'Step 1', description: '', order: 1, isCompleted: true },
          { id: '2', title: 'Step 2', description: '', order: 2, isCompleted: true },
        ],
      };

      const nextStep = PathwaysService.getNextStep(pathway);

      expect(nextStep).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', async () => {
      await pathwaysService.clearCache();

      expect(mockDatabase.deleteKV).toHaveBeenCalledWith('cached_pathways');
      expect(mockDatabase.deleteKV).toHaveBeenCalledWith('cached_achievements');
    });
  });
});