/**
 * Sync Manager
 * Handles offline/online data synchronization with exponential backoff
 */

// Network detection service
interface NetworkInfo {
  isConnected: boolean | null;
  type: string;
}

class MockNetworkService {
  static async fetch(): Promise<NetworkInfo> {
    return { isConnected: true, type: 'wifi' };
  }

  static addEventListener(callback: (state: NetworkInfo) => void): () => void {
    callback({ isConnected: true, type: 'wifi' });
    return () => {};
  }
}
import { database } from '@/data/db';
import { authApi } from '@/lib/api';
import type { DbCheckInQueue, DbRSVPQueue } from '@/data/db';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  queueCount: number;
  errors: string[];
}

interface SyncConfig {
  enableAutoSync: boolean;
  syncIntervalMs: number;
  maxRetryAttempts: number;
  backoffMultiplier: number;
  maxBackoffMs: number;
}

class SyncManager {
  private status: SyncStatus = {
    isOnline: false,
    isSyncing: false,
    lastSync: null,
    queueCount: 0,
    errors: [],
  };

  private config: SyncConfig = {
    enableAutoSync: true,
    syncIntervalMs: 30000, // 30 seconds
    maxRetryAttempts: 3,
    backoffMultiplier: 2,
    maxBackoffMs: 300000, // 5 minutes
  };

  private listeners: Array<(status: SyncStatus) => void> = [];
  private syncTimer: any = null;
  private netInfoUnsubscribe: (() => void) | null = null;
  private initialized = false;

  /**
   * Initialize sync manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize database
      await database.initialize();

      // Subscribe to network state changes
      this.netInfoUnsubscribe = MockNetworkService.addEventListener(
        (state: NetworkInfo) => {
          const wasOnline = this.status.isOnline;
          this.status.isOnline = !!state.isConnected;

          if (!wasOnline && this.status.isOnline) {
            console.log('Network connection restored, starting sync...');
            this.syncNow();
          }

          this.notifyStatusChange();
        }
      );

      // Get initial network state
      const netState = await MockNetworkService.fetch();
      this.status.isOnline = !!netState.isConnected;

      // Update queue count
      await this.updateQueueCount();

      // Start auto-sync if online
      if (this.config.enableAutoSync && this.status.isOnline) {
        this.startAutoSync();
      }

      this.initialized = true;
      console.log('Sync manager initialized successfully');
      this.notifyStatusChange();
    } catch (error) {
      console.error('Sync manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Add status listener
   */
  addStatusListener(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);

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
    return { ...this.status };
  }

  /**
   * Start manual sync
   */
  async syncNow(): Promise<boolean> {
    if (!this.status.isOnline) {
      console.log('Cannot sync while offline');
      return false;
    }

    if (this.status.isSyncing) {
      console.log('Sync already in progress');
      return false;
    }

    this.status.isSyncing = true;
    this.status.errors = [];
    this.notifyStatusChange();

    try {
      console.log('Starting manual sync...');

      // Sync queued operations
      await this.syncQueuedOperations();

      // Sync fresh data from server
      await this.pullLatestData();

      this.status.lastSync = new Date();
      await this.updateQueueCount();

      console.log('Manual sync completed successfully');
      return true;
    } catch (error) {
      console.error('Manual sync failed:', error);
      this.status.errors.push(
        error instanceof Error ? error.message : 'Unknown sync error'
      );
      return false;
    } finally {
      this.status.isSyncing = false;
      this.notifyStatusChange();
    }
  }

  /**
   * Start automatic sync timer
   */
  startAutoSync(): void {
    if (this.syncTimer) {
      this.stopAutoSync();
    }

    this.syncTimer = setInterval(async () => {
      if (this.status.isOnline && !this.status.isSyncing) {
        await this.syncNow();
      }
    }, this.config.syncIntervalMs);

    console.log(
      `Auto-sync started with ${this.config.syncIntervalMs}ms interval`
    );
  }

  /**
   * Stop automatic sync timer
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('Auto-sync stopped');
    }
  }

  /**
   * Sync queued operations to server
   */
  private async syncQueuedOperations(): Promise<void> {
    // Sync check-ins
    const queuedCheckIns = await database.getQueuedCheckIns();
    for (const checkIn of queuedCheckIns) {
      await this.syncCheckIn(checkIn);
    }

    // Sync RSVPs
    const queuedRSVPs = await database.getQueuedRSVPs();
    for (const rsvp of queuedRSVPs) {
      await this.syncRSVP(rsvp);
    }
  }

  /**
   * Sync individual check-in
   */
  private async syncCheckIn(checkIn: DbCheckInQueue): Promise<void> {
    try {
      const response = await this.mockApiCall('POST', '/mobile/v1/checkins', {
        serviceId: checkIn.serviceId,
        memberId: checkIn.memberId,
        checkInTime: checkIn.checkInTime,
        isNewBeliever: checkIn.isNewBeliever,
      });

      if (response.success) {
        // Mark as synced and delete from queue
        await database.updateCheckInStatus(checkIn.id, 'synced');
        await database.deleteCheckIn(checkIn.id);
        console.log(`Check-in synced successfully: ${checkIn.id}`);
      } else {
        throw new Error(response.error || 'Check-in sync failed');
      }
    } catch (error) {
      const attempts = checkIn.attempts + 1;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (attempts >= this.config.maxRetryAttempts) {
        // Mark as failed after max attempts
        await database.updateCheckInStatus(checkIn.id, 'failed', errorMessage);
        console.error(
          `Check-in sync failed permanently: ${checkIn.id} - ${errorMessage}`
        );
      } else {
        // Update attempt count and retry later
        await database.updateCheckInStatus(checkIn.id, 'queued', errorMessage);
        console.warn(
          `Check-in sync failed (attempt ${attempts}): ${checkIn.id} - ${errorMessage}`
        );
      }
    }
  }

  /**
   * Sync individual RSVP
   */
  private async syncRSVP(rsvp: DbRSVPQueue): Promise<void> {
    try {
      let endpoint = '';
      let body = {};

      switch (rsvp.action) {
        case 'rsvp':
          endpoint = `/mobile/v1/events/${rsvp.eventId}/rsvp`;
          body = { action: 'confirm' };
          break;
        case 'cancel':
          endpoint = `/mobile/v1/events/${rsvp.eventId}/rsvp`;
          body = { action: 'cancel' };
          break;
        case 'waitlist':
          endpoint = `/mobile/v1/events/${rsvp.eventId}/waitlist`;
          body = {};
          break;
        default:
          throw new Error(`Unknown RSVP action: ${rsvp.action}`);
      }

      const response = await this.mockApiCall('POST', endpoint, body);

      if (response.success) {
        // Mark as synced and delete from queue
        await database.updateRSVPStatus(rsvp.id, 'synced');
        await database.deleteRSVP(rsvp.id);
        console.log(`RSVP synced successfully: ${rsvp.id}`);
      } else {
        throw new Error(response.error || 'RSVP sync failed');
      }
    } catch (error) {
      const attempts = rsvp.attempts + 1;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (attempts >= this.config.maxRetryAttempts) {
        // Mark as failed after max attempts
        await database.updateRSVPStatus(rsvp.id, 'failed', errorMessage);
        console.error(
          `RSVP sync failed permanently: ${rsvp.id} - ${errorMessage}`
        );
      } else {
        // Update attempt count and retry later
        await database.updateRSVPStatus(rsvp.id, 'queued', errorMessage);
        console.warn(
          `RSVP sync failed (attempt ${attempts}): ${rsvp.id} - ${errorMessage}`
        );
      }
    }
  }

  /**
   * Mock API call for development
   */
  private async mockApiCall(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<{ success: boolean; data?: any }> {
    // Mock API response - replace with actual API implementation
    await new Promise(resolve => setTimeout(resolve, 100));
    return { success: true, data: { id: Date.now() } };
  }

  /**
   * Pull latest data from server
   */
  private async pullLatestData(): Promise<void> {
    try {
      // Get last sync timestamp
      const lastSyncStr = await database.getValue('last_data_sync');
      const lastSync = lastSyncStr ? new Date(lastSyncStr) : new Date(0);

      // Fetch updates since last sync
      const response = await this.mockApiCall('GET', `/mobile/v1/sync`, {
        params: { since: lastSync.toISOString() },
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch sync data');
      }

      const { members, events } = response.data;

      // Update members
      if (members && Array.isArray(members)) {
        for (const member of members) {
          await database.upsertMember({
            id: member.id,
            name: member.name,
            email: member.email,
            phone: member.phone,
            role: member.roles?.[0] || 'MEMBER',
            churchId: member.churchId,
            isActive: member.isActive ?? true,
            updatedAt: member.updatedAt || new Date().toISOString(),
          });
        }
        console.log(`Updated ${members.length} members from server`);
      }

      // Update events
      if (events && Array.isArray(events)) {
        for (const event of events) {
          await database.upsertEvent({
            id: event.id,
            title: event.title,
            description: event.description,
            location: event.location,
            startsAt: event.startsAt,
            endsAt: event.endsAt,
            capacity: event.capacity,
            currentAttendees: event.currentAttendees || 0,
            waitlistCount: event.waitlistCount || 0,
            fee: event.fee || 0,
            userRSVPStatus: event.userRSVPStatus,
            tags: JSON.stringify(event.tags || []),
            updatedAt: event.updatedAt || new Date().toISOString(),
          });
        }
        console.log(`Updated ${events.length} events from server`);
      }

      // Save last sync timestamp
      await database.setValue('last_data_sync', new Date().toISOString());
    } catch (error) {
      console.error('Failed to pull latest data:', error);
      throw error;
    }
  }

  /**
   * Update queue count in status
   */
  private async updateQueueCount(): Promise<void> {
    try {
      const counts = await database.getQueueCounts();
      this.status.queueCount = counts.checkIns + counts.rsvps;
    } catch (error) {
      console.error('Failed to update queue count:', error);
    }
  }

  /**
   * Notify all listeners of status changes
   */
  private notifyStatusChange(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in sync status listener:', error);
      }
    });
  }

  /**
   * Update sync configuration
   */
  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart auto-sync with new interval if changed
    if (newConfig.syncIntervalMs && this.syncTimer) {
      this.stopAutoSync();
      if (this.config.enableAutoSync && this.status.isOnline) {
        this.startAutoSync();
      }
    }
  }

  /**
   * Flush all queued operations immediately
   */
  async flushQueue(): Promise<{
    success: boolean;
    syncedCount: number;
    failedCount: number;
  }> {
    if (!this.status.isOnline) {
      return { success: false, syncedCount: 0, failedCount: 0 };
    }

    let syncedCount = 0;
    let failedCount = 0;

    try {
      // Get all queued items
      const queuedCheckIns = await database.getQueuedCheckIns();
      const queuedRSVPs = await database.getQueuedRSVPs();

      // Process check-ins
      for (const checkIn of queuedCheckIns) {
        try {
          await this.syncCheckIn(checkIn);
          syncedCount++;
        } catch (error) {
          failedCount++;
        }
      }

      // Process RSVPs
      for (const rsvp of queuedRSVPs) {
        try {
          await this.syncRSVP(rsvp);
          syncedCount++;
        } catch (error) {
          failedCount++;
        }
      }

      await this.updateQueueCount();
      this.notifyStatusChange();

      return {
        success: syncedCount > 0 || (syncedCount === 0 && failedCount === 0),
        syncedCount,
        failedCount,
      };
    } catch (error) {
      console.error('Queue flush failed:', error);
      return { success: false, syncedCount, failedCount };
    }
  }

  /**
   * Clear old failed operations
   */
  async cleanupOldData(): Promise<void> {
    try {
      // Clear failed queue items older than 7 days
      await database.clearOldFailedQueue(7);

      // Clear old member data (keep last 30 days)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      await database.deleteOldMembers(cutoffDate.toISOString());

      console.log('Old data cleanup completed');
    } catch (error) {
      console.error('Data cleanup failed:', error);
    }
  }

  /**
   * Shutdown sync manager
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down sync manager...');

    // Stop auto-sync
    this.stopAutoSync();

    // Unsubscribe from network events
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }

    // Clear listeners
    this.listeners = [];

    // Close database
    await database.close();

    this.initialized = false;
    console.log('Sync manager shutdown complete');
  }
}

// Export singleton instance
export const syncManager = new SyncManager();

// Export types
export type { SyncStatus, SyncConfig };

export default syncManager;
