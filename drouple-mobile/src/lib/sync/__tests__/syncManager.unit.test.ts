/**
 * Sync Manager Unit Tests
 * Tests the offline sync functionality in isolation
 */

import { SyncManager } from '../syncManager';
import { database } from '../../db/database';
import { NetworkService } from '../../net/networkService';
import { productionApiClient } from '../../api/productionClient';

// Mock dependencies
jest.mock('../../db/database');
jest.mock('../../net/networkService');
jest.mock('../../api/productionClient');
jest.mock('../../store/authStore');

const mockDatabase = database as jest.Mocked<typeof database>;
const mockNetworkService = NetworkService as jest.Mocked<typeof NetworkService>;
const mockApiClient = productionApiClient as jest.Mocked<
  typeof productionApiClient
>;

describe('SyncManager', () => {
  let syncManager: SyncManager;

  beforeEach(() => {
    syncManager = new SyncManager();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('initialize', () => {
    it('should initialize database and network service', async () => {
      mockDatabase.initialize.mockResolvedValue();
      mockNetworkService.addConnectionChangeListener.mockImplementation(
        () => {}
      );
      mockNetworkService.isConnected.mockResolvedValue(true);

      await syncManager.initialize();

      expect(mockDatabase.initialize).toHaveBeenCalledTimes(1);
      expect(
        mockNetworkService.addConnectionChangeListener
      ).toHaveBeenCalledTimes(1);
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Database initialization failed');
      mockDatabase.initialize.mockRejectedValue(error);

      await expect(syncManager.initialize()).rejects.toThrow(
        'Database initialization failed'
      );
    });
  });

  describe('enqueueAction', () => {
    beforeEach(async () => {
      mockDatabase.initialize.mockResolvedValue();
      mockNetworkService.addConnectionChangeListener.mockImplementation(
        () => {}
      );
      mockNetworkService.isConnected.mockResolvedValue(true);
      await syncManager.initialize();
    });

    it('should enqueue action successfully', async () => {
      const mockActionId = 123;
      mockDatabase.enqueue.mockResolvedValue(mockActionId);
      mockNetworkService.isConnected.mockResolvedValue(false);

      const result = await syncManager.enqueueAction('CHECKIN', {
        serviceId: 'service-123',
        userId: 'user-456',
      });

      expect(result).toBe(mockActionId);
      expect(mockDatabase.enqueue).toHaveBeenCalledWith('CHECKIN', {
        serviceId: 'service-123',
        userId: 'user-456',
      });
    });

    it('should attempt immediate sync when online', async () => {
      const mockActionId = 123;
      mockDatabase.enqueue.mockResolvedValue(mockActionId);
      mockNetworkService.isConnected.mockResolvedValue(true);
      mockDatabase.listQueue.mockResolvedValue([]);

      const result = await syncManager.enqueueAction('CHECKIN', {
        serviceId: 'service-123',
      });

      expect(result).toBe(mockActionId);
      // Should have attempted to sync
      expect(mockDatabase.listQueue).toHaveBeenCalled();
    });
  });

  describe('syncQueuedActions', () => {
    beforeEach(async () => {
      mockDatabase.initialize.mockResolvedValue();
      mockNetworkService.addConnectionChangeListener.mockImplementation(
        () => {}
      );
      mockNetworkService.isConnected.mockResolvedValue(true);
      await syncManager.initialize();
    });

    it('should return early if already syncing', async () => {
      // Mock a sync in progress
      const firstSyncPromise = syncManager.syncQueuedActions();
      const secondSyncPromise = syncManager.syncQueuedActions();

      const [firstResult, secondResult] = await Promise.all([
        firstSyncPromise,
        secondSyncPromise,
      ]);

      expect(secondResult.success).toBe(false);
      expect(secondResult.errors).toContain('Sync already in progress');
    });

    it('should return error when offline', async () => {
      mockNetworkService.isConnected.mockResolvedValue(false);

      const result = await syncManager.syncQueuedActions();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Device is offline');
    });

    it('should process queued actions successfully', async () => {
      const mockQueuedActions = [
        {
          id: 1,
          type: 'CHECKIN' as const,
          payload: JSON.stringify({ serviceId: 'service-123' }),
          createdAt: new Date().toISOString(),
          retryCount: 0,
        },
      ];

      mockNetworkService.isConnected.mockResolvedValue(true);
      mockDatabase.listQueue.mockResolvedValue(mockQueuedActions);
      mockApiClient.post.mockResolvedValue({ success: true });
      mockDatabase.removeFromQueue.mockResolvedValue();

      // Mock auth store to return authenticated state
      jest.doMock('../../store/authStore', () => ({
        useAuthStore: {
          getState: () => ({
            isAuthenticated: true,
            tokens: { accessToken: 'test-token' },
          }),
        },
      }));

      const result = await syncManager.syncQueuedActions();

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(mockDatabase.removeFromQueue).toHaveBeenCalledWith(1);
    });

    it('should handle API failures with retry logic', async () => {
      const mockQueuedActions = [
        {
          id: 1,
          type: 'CHECKIN' as const,
          payload: JSON.stringify({ serviceId: 'service-123' }),
          createdAt: new Date().toISOString(),
          retryCount: 2, // Already retried twice
        },
      ];

      mockNetworkService.isConnected.mockResolvedValue(true);
      mockDatabase.listQueue.mockResolvedValue(mockQueuedActions);
      mockApiClient.post.mockResolvedValue({ success: false });
      mockDatabase.removeFromQueue.mockResolvedValue();
      mockDatabase.updateRetryCount.mockResolvedValue();

      // Mock auth store
      jest.doMock('../../store/authStore', () => ({
        useAuthStore: {
          getState: () => ({
            isAuthenticated: true,
            tokens: { accessToken: 'test-token' },
          }),
        },
      }));

      const result = await syncManager.syncQueuedActions();

      expect(result.processedCount).toBe(0);
      expect(result.failedCount).toBe(1);
      // Should remove action after max retries
      expect(mockDatabase.removeFromQueue).toHaveBeenCalledWith(1);
    });

    it('should update retry count for failed actions under max retries', async () => {
      const mockQueuedActions = [
        {
          id: 1,
          type: 'CHECKIN' as const,
          payload: JSON.stringify({ serviceId: 'service-123' }),
          createdAt: new Date().toISOString(),
          retryCount: 1,
        },
      ];

      mockNetworkService.isConnected.mockResolvedValue(true);
      mockDatabase.listQueue.mockResolvedValue(mockQueuedActions);
      mockApiClient.post.mockResolvedValue({ success: false });
      mockDatabase.updateRetryCount.mockResolvedValue();

      // Mock auth store
      jest.doMock('../../store/authStore', () => ({
        useAuthStore: {
          getState: () => ({
            isAuthenticated: true,
            tokens: { accessToken: 'test-token' },
          }),
        },
      }));

      const result = await syncManager.syncQueuedActions();

      expect(result.failedCount).toBe(1);
      expect(mockDatabase.updateRetryCount).toHaveBeenCalledWith(1, 2);
      expect(mockDatabase.removeFromQueue).not.toHaveBeenCalled();
    });
  });

  describe('getSyncStatus', () => {
    beforeEach(async () => {
      mockDatabase.initialize.mockResolvedValue();
      mockNetworkService.addConnectionChangeListener.mockImplementation(
        () => {}
      );
      mockNetworkService.isConnected.mockResolvedValue(true);
      await syncManager.initialize();
    });

    it('should return current sync status', async () => {
      const mockQueueCount = 5;
      mockDatabase.getQueueCount.mockResolvedValue(mockQueueCount);
      mockNetworkService.isConnected.mockResolvedValue(true);

      const status = await syncManager.getSyncStatus();

      expect(status.isOnline).toBe(true);
      expect(status.isSyncing).toBe(false);
      expect(status.queuedActions).toBe(mockQueueCount);
      expect(status.failedSyncCount).toBe(0);
    });
  });

  describe('network connectivity changes', () => {
    let networkListener: (isConnected: boolean) => void;

    beforeEach(async () => {
      mockDatabase.initialize.mockResolvedValue();
      mockNetworkService.addConnectionChangeListener.mockImplementation(
        listener => {
          networkListener = listener;
        }
      );
      mockNetworkService.isConnected.mockResolvedValue(true);
      await syncManager.initialize();
    });

    it('should handle network reconnection', async () => {
      mockDatabase.listQueue.mockResolvedValue([]);

      // Simulate network reconnection
      networkListener(true);

      // Should attempt to sync
      expect(mockDatabase.listQueue).toHaveBeenCalled();
    });

    it('should handle network disconnection gracefully', () => {
      // Simulate network disconnection
      expect(() => networkListener(false)).not.toThrow();
    });
  });

  describe('shutdown', () => {
    beforeEach(async () => {
      mockDatabase.initialize.mockResolvedValue();
      mockNetworkService.addConnectionChangeListener.mockImplementation(
        () => {}
      );
      mockNetworkService.isConnected.mockResolvedValue(true);
      await syncManager.initialize();
    });

    it('should clean up resources on shutdown', async () => {
      mockNetworkService.removeAllConnectionChangeListeners.mockImplementation(
        () => {}
      );

      await syncManager.shutdown();

      expect(
        mockNetworkService.removeAllConnectionChangeListeners
      ).toHaveBeenCalled();
    });
  });
});
