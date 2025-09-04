/**
 * Sync Manager
 * Handles offline queue flushing and network state management
 */

import * as Network from 'expo-network';
import { AppState, AppStateStatus } from 'react-native';

import { database, QueuedAction, QueueActionType } from '@/lib/db/database';
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/config/endpoints';
import toast from '@/utils/toast';

export interface SyncStatus {
  isOnline: boolean;
  isSync: boolean;
  lastSync: Date | null;
  queueCount: number;
  failedCount: number;
}

export interface SyncResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
}

class SyncManager {
  private isInitialized = false;
  private listeners: ((status: SyncStatus) => void)[] = [];
  private currentStatus: SyncStatus = {
    isOnline: false,
    isSync: false,
    lastSync: null,
    queueCount: 0,
    failedCount: 0,
  };

  /**
   * Initialize sync manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize database
      await database.initialize();

      // Check initial network state
      const networkState = await Network.getNetworkStateAsync();
      this.currentStatus.isOnline = networkState.isConnected ?? false;

      // Update queue count
      this.currentStatus.queueCount = await database.getQueueCount();

      // Setup network state listener
      this.setupNetworkListener();

      // Setup app state listener
      this.setupAppStateListener();

      this.isInitialized = true;
      this.notifyListeners();

      console.log('SyncManager initialized');
    } catch (error) {
      console.error('Failed to initialize SyncManager:', error);
      throw error;
    }
  }

  /**
   * Subscribe to sync status changes
   */
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);

    // Send current status immediately
    listener(this.currentStatus);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return { ...this.currentStatus };
  }

  /**
   * Manual sync trigger
   */
  async syncNow(): Promise<SyncResult> {
    if (!this.isInitialized) {
      throw new Error('SyncManager not initialized');
    }

    if (this.currentStatus.isSync) {
      console.log('Sync already in progress');
      return { processed: 0, succeeded: 0, failed: 0, errors: [] };
    }

    console.log('Starting manual sync...');
    return this.flushQueue();
  }

  /**
   * Flush offline queue
   */
  async flushQueue(): Promise<SyncResult> {
    // Check online status first
    const networkState = await Network.getNetworkStateAsync();
    this.currentStatus.isOnline = networkState.isConnected ?? false;

    if (!this.currentStatus.isOnline) {
      console.log('Device offline, skipping sync');
      toast.info('Device offline - sync will resume when online');
      return {
        processed: 0,
        succeeded: 0,
        failed: 0,
        errors: ['Device offline'],
      };
    }

    this.currentStatus.isSync = true;
    this.notifyListeners();

    const result: SyncResult = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Get all queued actions
      const queuedActions = await database.listQueue();

      if (queuedActions.length === 0) {
        console.log('No actions in queue');
        this.currentStatus.lastSync = new Date();
        return result;
      }

      console.log(`Processing ${queuedActions.length} queued actions`);

      for (const action of queuedActions) {
        result.processed++;

        try {
          const success = await this.processAction(action);

          if (success) {
            await database.removeFromQueue(action.id);
            result.succeeded++;
            console.log(
              `Successfully processed ${action.type} action ${action.id}`
            );
          } else {
            // Update retry count
            const retryCount = (action.retryCount || 0) + 1;
            await database.updateRetryCount(action.id, retryCount);
            result.failed++;

            const errorMsg = `Failed to process ${action.type} action ${action.id} (retry ${retryCount})`;
            result.errors.push(errorMsg);

            // Remove action if too many retries
            if (retryCount >= 3) {
              await database.removeFromQueue(action.id);
              console.log(
                `Removed ${action.type} action ${action.id} after ${retryCount} retries`
              );
            }
          }
        } catch (error) {
          result.failed++;
          const errorMsg = `Error processing ${action.type} action ${action.id}: ${error}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);

          // Stop processing on server errors (>=500)
          if (error instanceof Error && error.message.includes('5')) {
            console.log('Server error detected, stopping sync');
            break;
          }
        }
      }

      // Update status
      this.currentStatus.lastSync = new Date();
      this.currentStatus.queueCount = await database.getQueueCount();
      this.currentStatus.failedCount = result.failed;

      // Show result toast
      if (result.succeeded > 0) {
        toast.success(`Synced ${result.succeeded} actions successfully`);
      }
      if (result.failed > 0) {
        toast.warning(`${result.failed} actions failed to sync`);
      }

      console.log('Sync completed:', result);
      return result;
    } catch (error) {
      result.errors.push(`Sync failed: ${error}`);
      console.error('Sync failed:', error);
      toast.error('Sync failed - please try again');
      return result;
    } finally {
      this.currentStatus.isSync = false;
      this.notifyListeners();
    }
  }

  /**
   * Process individual queued action
   */
  private async processAction(action: QueuedAction): Promise<boolean> {
    try {
      const payload = JSON.parse(action.payload);

      switch (action.type) {
        case 'CHECKIN':
          return await this.processCheckIn(payload);

        case 'RSVP':
          return await this.processRSVP(payload);

        case 'GROUP_REQUEST':
          return await this.processGroupRequest(payload);

        case 'PATHWAY_STEP':
          return await this.processPathwayStep(payload);

        default:
          console.warn(`Unknown action type: ${action.type}`);
          return false;
      }
    } catch (error) {
      console.error(`Failed to process action ${action.id}:`, error);
      return false;
    }
  }

  /**
   * Process check-in action
   */
  private async processCheckIn(payload: any): Promise<boolean> {
    const response = await apiClient.post(ENDPOINTS.CHECKIN.CHECKIN, payload, {
      idempotencyKey: payload.clientRequestId,
    });

    return response.success;
  }

  /**
   * Process RSVP action
   */
  private async processRSVP(payload: any): Promise<boolean> {
    const response = await apiClient.post(
      ENDPOINTS.EVENTS.RSVP(payload.eventId),
      payload,
      {
        idempotencyKey: payload.clientRequestId,
      }
    );

    return response.success;
  }

  /**
   * Process group request action
   */
  private async processGroupRequest(payload: any): Promise<boolean> {
    const response = await apiClient.post(
      ENDPOINTS.GROUPS.JOIN_REQUEST(payload.groupId),
      payload,
      {
        idempotencyKey: payload.clientRequestId,
      }
    );

    return response.success;
  }

  /**
   * Process pathway step action
   */
  private async processPathwayStep(payload: any): Promise<boolean> {
    const response = await apiClient.post(
      ENDPOINTS.PATHWAYS.COMPLETE_STEP(payload.pathwayId, payload.stepId),
      payload,
      {
        idempotencyKey: payload.clientRequestId,
      }
    );

    return response.success;
  }

  /**
   * Setup network state listener
   */
  private setupNetworkListener(): void {
    // Note: expo-network doesn't have a continuous listener
    // We'll check network state periodically and on app focus
    setInterval(async () => {
      const networkState = await Network.getNetworkStateAsync();
      const wasOnline = this.currentStatus.isOnline;
      this.currentStatus.isOnline = networkState.isConnected ?? false;

      // Auto-sync when coming back online
      if (
        !wasOnline &&
        this.currentStatus.isOnline &&
        this.currentStatus.queueCount > 0
      ) {
        console.log('Device came online, auto-syncing...');
        this.flushQueue();
      }

      this.notifyListeners();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Setup app state listener for sync on app focus
   */
  private setupAppStateListener(): void {
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Check network and sync when app becomes active
        this.checkAndSync();
      }
    });
  }

  /**
   * Check network and sync if online
   */
  private async checkAndSync(): Promise<void> {
    const networkState = await Network.getNetworkStateAsync();
    const wasOnline = this.currentStatus.isOnline;
    this.currentStatus.isOnline = networkState.isConnected ?? false;

    if (this.currentStatus.isOnline && this.currentStatus.queueCount > 0) {
      console.log('App focused and online, auto-syncing...');
      this.flushQueue();
    } else {
      // Update queue count
      this.currentStatus.queueCount = await database.getQueueCount();
    }

    this.notifyListeners();
  }

  /**
   * Notify all listeners of status changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentStatus);
      } catch (error) {
        console.error('Error notifying sync listener:', error);
      }
    });
  }

  /**
   * Cache data in key-value store
   */
  async cacheData(key: string, data: any): Promise<void> {
    await database.setKV(key, data);
    console.log(`Cached data with key: ${key}`);
  }

  /**
   * Get cached data
   */
  async getCachedData<T = any>(key: string): Promise<T | null> {
    return database.getKVJson<T>(key);
  }
}

// Create singleton instance
export const syncManager = new SyncManager();

// Export types
export type { SyncStatus, SyncResult };

export default syncManager;
