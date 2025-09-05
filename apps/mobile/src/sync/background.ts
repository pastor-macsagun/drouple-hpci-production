/**
 * Background Sync Manager
 * Handles automatic sync every 15-60 minutes + on app focus
 */

import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { AppState, AppStateStatus } from 'react-native';
import { database } from '../data/db';
import { outboxManager } from './outbox';
import { membersRepository } from '../data/repos/members';
import { attendanceRepository } from '../data/repos/attendance';
import { eventsRepository } from '../data/repos/events';
import { announcementsRepository } from '../data/repos/announcements';
import NetInfo from '@react-native-community/netinfo';

// Task names
const SYNC_TASK_NAME = 'background-sync';
const OUTBOX_TASK_NAME = 'outbox-process';

// Sync intervals (milliseconds)
const SYNC_INTERVAL = {
  MINIMAL: 15 * 60 * 1000,      // 15 minutes
  NORMAL: 30 * 60 * 1000,       // 30 minutes  
  EXTENDED: 60 * 60 * 1000,     // 60 minutes
};

export interface SyncStatus {
  isActive: boolean;
  lastSync?: Date;
  nextSync?: Date;
  pendingItems: number;
  isOnline: boolean;
  syncErrors: string[];
}

class BackgroundSyncManager {
  private appStateSubscription: any;
  private syncErrors: string[] = [];
  private isInitialized = false;
  private isOnline = true;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize database
      await database.initialize();

      // Setup network monitoring
      this.setupNetworkMonitoring();

      // Setup background tasks
      await this.registerBackgroundTasks();

      // Setup app state monitoring
      this.setupAppStateMonitoring();

      // Initial sync on startup
      this.performSync().catch(console.error);

      this.isInitialized = true;
      console.log('🔄 Background sync manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize background sync:', error);
      throw error;
    }
  }

  /**
   * Register background tasks with Expo TaskManager
   */
  private async registerBackgroundTasks(): Promise<void> {
    // Define sync task
    TaskManager.defineTask(SYNC_TASK_NAME, async () => {
      try {
        console.log('🔄 Running background sync task');
        await this.performSync();
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error('❌ Background sync task failed:', error);
        this.syncErrors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    // Define outbox processing task
    TaskManager.defineTask(OUTBOX_TASK_NAME, async () => {
      try {
        console.log('📤 Running background outbox processing');
        await outboxManager.processQueue();
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error('❌ Outbox processing failed:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    // Register background fetch
    await BackgroundFetch.registerTaskAsync(SYNC_TASK_NAME, {
      minimumInterval: SYNC_INTERVAL.NORMAL,
      stopOnTerminate: false,
      startOnBoot: true,
    });

    await BackgroundFetch.registerTaskAsync(OUTBOX_TASK_NAME, {
      minimumInterval: SYNC_INTERVAL.MINIMAL,
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log('📋 Background tasks registered');
  }

  /**
   * Setup network connectivity monitoring
   */
  private setupNetworkMonitoring(): void {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected === true;

      if (!wasOnline && this.isOnline) {
        console.log('🌐 Network reconnected, triggering sync');
        this.performSync().catch(console.error);
      }
    });
  }

  /**
   * Setup app state monitoring for foreground sync
   */
  private setupAppStateMonitoring(): void {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && this.isOnline) {
        console.log('📱 App became active, triggering sync');
        this.performSync().catch(console.error);
      }
    });
  }

  /**
   * Perform full sync operation
   */
  async performSync(): Promise<void> {
    if (!this.isOnline) {
      console.log('📡 Offline, skipping sync');
      return;
    }

    console.log('🔄 Starting sync operation');
    const startTime = Date.now();

    try {
      // Clear old errors
      this.syncErrors = [];

      // Process outbox first (uploads)
      await outboxManager.processQueue();

      // Sync core data (downloads)
      await this.syncCoreData();

      // Cleanup old synced items
      await outboxManager.clearSyncedItems();

      const duration = Date.now() - startTime;
      console.log(`✅ Sync completed in ${duration}ms`);

      // Update sync metadata
      await this.updateSyncMetadata();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      this.syncErrors.push(errorMessage);
      console.error('❌ Sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync core data from API
   */
  private async syncCoreData(): Promise<void> {
    try {
      // Sync in parallel for better performance
      await Promise.allSettled([
        // Sync members (most critical)
        membersRepository.list({ active: true }).catch(err => {
          console.warn('⚠️ Members sync failed:', err);
          this.syncErrors.push('Failed to sync members');
        }),

        // Sync today's attendance
        attendanceRepository.getTodayStats().catch(err => {
          console.warn('⚠️ Attendance sync failed:', err);
          this.syncErrors.push('Failed to sync attendance');
        }),

        // Sync upcoming events
        eventsRepository.getUpcoming().catch(err => {
          console.warn('⚠️ Events sync failed:', err);
          this.syncErrors.push('Failed to sync events');
        }),

        // Sync recent announcements
        announcementsRepository.getRecent().catch(err => {
          console.warn('⚠️ Announcements sync failed:', err);
          this.syncErrors.push('Failed to sync announcements');
        }),
      ]);
    } catch (error) {
      console.error('❌ Core data sync failed:', error);
      throw error;
    }
  }

  /**
   * Update sync metadata
   */
  private async updateSyncMetadata(): Promise<void> {
    const db = await database.getDb();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT OR REPLACE INTO meta (resource_key, last_fetch) 
       VALUES ('background_sync', ?)`,
      [now]
    );
  }

  /**
   * Force immediate sync
   */
  async forcSync(): Promise<void> {
    console.log('🔄 Force sync triggered');
    await this.performSync();
  }

  /**
   * Get current sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const db = await database.getDb();

    // Get last sync time
    const metaResult = await db.getFirstAsync<{ last_fetch: string }>(
      'SELECT last_fetch FROM meta WHERE resource_key = ?',
      ['background_sync']
    );

    // Get pending items count
    const pendingResult = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM outbox 
       WHERE status IN ('PENDING', 'FAILED')`
    );

    const lastSync = metaResult?.last_fetch ? new Date(metaResult.last_fetch) : undefined;
    const nextSync = lastSync ? new Date(lastSync.getTime() + SYNC_INTERVAL.NORMAL) : undefined;

    return {
      isActive: await BackgroundFetch.getStatusAsync() === BackgroundFetch.BackgroundFetchStatus.Available,
      lastSync,
      nextSync,
      pendingItems: pendingResult?.count || 0,
      isOnline: this.isOnline,
      syncErrors: [...this.syncErrors],
    };
  }

  /**
   * Pause background sync (e.g., for battery saving)
   */
  async pauseSync(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(SYNC_TASK_NAME);
      console.log('⏸️ Background sync paused');
    } catch (error) {
      console.warn('⚠️ Failed to pause sync:', error);
    }
  }

  /**
   * Resume background sync
   */
  async resumeSync(): Promise<void> {
    try {
      await BackgroundFetch.registerTaskAsync(SYNC_TASK_NAME, {
        minimumInterval: SYNC_INTERVAL.NORMAL,
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('▶️ Background sync resumed');
    } catch (error) {
      console.warn('⚠️ Failed to resume sync:', error);
    }
  }

  /**
   * Cleanup and shutdown
   */
  async cleanup(): Promise<void> {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }

    try {
      await BackgroundFetch.unregisterTaskAsync(SYNC_TASK_NAME);
      await BackgroundFetch.unregisterTaskAsync(OUTBOX_TASK_NAME);
    } catch (error) {
      console.warn('⚠️ Cleanup failed:', error);
    }

    this.isInitialized = false;
    console.log('🛑 Background sync manager cleaned up');
  }

  /**
   * Get sync statistics for debugging
   */
  async getSyncStats(): Promise<{
    totalSynced: number;
    pendingSync: number;
    failedSync: number;
    lastSyncDuration?: number;
    backgroundTaskStatus: string;
  }> {
    const db = await database.getDb();

    const [syncedResult, pendingResult, failedResult] = await Promise.all([
      db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM outbox WHERE status = 'SYNCED'"
      ),
      db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM outbox WHERE status = 'PENDING'"
      ),
      db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM outbox WHERE status = 'FAILED'"
      ),
    ]);

    const bgStatus = await BackgroundFetch.getStatusAsync();
    const statusMap = {
      [BackgroundFetch.BackgroundFetchStatus.Denied]: 'Denied',
      [BackgroundFetch.BackgroundFetchStatus.Restricted]: 'Restricted',
      [BackgroundFetch.BackgroundFetchStatus.Available]: 'Available',
    };

    return {
      totalSynced: syncedResult?.count || 0,
      pendingSync: pendingResult?.count || 0,
      failedSync: failedResult?.count || 0,
      backgroundTaskStatus: statusMap[bgStatus] || 'Unknown',
    };
  }

  /**
   * Reset all sync data (for testing/debugging)
   */
  async resetSync(): Promise<void> {
    const db = await database.getDb();
    
    // Clear all sync metadata
    await db.execAsync('DELETE FROM meta');
    
    // Reset all outbox items to pending
    await db.runAsync(
      `UPDATE outbox SET 
       status = 'PENDING',
       retry_count = 0,
       next_retry_at = NULL,
       error_message = NULL
       WHERE status = 'FAILED'`
    );

    console.log('🔄 Sync state reset');
    
    // Trigger immediate sync
    this.performSync().catch(console.error);
  }
}

// Export singleton instance
export const backgroundSyncManager = new BackgroundSyncManager();

// Initialize on import in production
if (process.env.NODE_ENV !== 'test') {
  backgroundSyncManager.initialize().catch(console.error);
}