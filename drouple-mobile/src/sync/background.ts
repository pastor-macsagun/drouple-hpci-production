/**
 * Background Sync Manager
 * Handles periodic data synchronization and outbox processing
 * Works with iOS Background App Refresh and Android background tasks
 */

import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { AppState, AppStateStatus } from 'react-native';
import { outboxManager } from './outbox';
import { membersRepo } from '../data/repos/members';
import { eventsRepo } from '../data/repos/events';
import { announcementsRepo } from '../data/repos/announcements';

const BACKGROUND_SYNC_TASK = 'background-sync';
const BACKGROUND_FETCH_INTERVAL = 15 * 60 * 1000; // 15 minutes minimum per iOS guidelines

export interface SyncStatus {
  isEnabled: boolean;
  lastSync?: string;
  nextSync?: string;
  status: 'idle' | 'syncing' | 'error';
  error?: string;
}

class BackgroundSyncManager {
  private syncStatus: SyncStatus = {
    isEnabled: false,
    status: 'idle',
  };
  private listeners: Array<(status: SyncStatus) => void> = [];
  private appStateSubscription?: any;

  async initialize(): Promise<void> {
    await this.registerBackgroundTask();
    await this.enableBackgroundFetch();
    this.setupAppStateHandling();
    
    console.log('Background sync initialized');
  }

  private async registerBackgroundTask(): Promise<void> {
    TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
      console.log('Background sync task executed');
      
      try {
        this.updateStatus({ status: 'syncing' });
        
        // Process outbox first (critical writes)
        const outboxResult = await outboxManager.processQueue();
        console.log('Outbox sync result:', outboxResult);
        
        // Then sync reads (less critical)
        await this.performDataSync();
        
        this.updateStatus({
          status: 'idle',
          lastSync: new Date().toISOString(),
          error: undefined,
        });
        
        return BackgroundFetch.BackgroundFetchResult.NewData;
        
      } catch (error) {
        console.error('Background sync failed:', error);
        this.updateStatus({
          status: 'error',
          error: error instanceof Error ? error.message : 'Sync failed',
        });
        
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });
  }

  private async enableBackgroundFetch(): Promise<void> {
    try {
      // Check if background fetch is available and enabled
      const status = await BackgroundFetch.getStatusAsync();
      console.log('Background fetch status:', status);
      
      if (status !== BackgroundFetch.BackgroundFetchStatus.Available) {
        console.warn('Background fetch not available');
        return;
      }
      
      // Register the background fetch task
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: BACKGROUND_FETCH_INTERVAL,
        stopOnTerminate: false,
        startOnBoot: true,
      });
      
      this.syncStatus.isEnabled = true;
      console.log('Background fetch registered successfully');
      
    } catch (error) {
      console.error('Failed to register background fetch:', error);
    }
  }

  private setupAppStateHandling(): void {
    // Sync when app becomes active
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange
    );
  }

  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    if (nextAppState === 'active') {
      console.log('App became active, triggering sync');
      this.performImmediateSync().catch(console.error);
    }
  };

  private async performDataSync(): Promise<void> {
    console.log('Starting data sync...');
    
    // Sync in priority order (most important first)
    const syncOperations = [
      { name: 'Events', operation: () => eventsRepo.syncFromServer() },
      { name: 'Members', operation: () => membersRepo.syncFromServer() },
      { name: 'Announcements', operation: () => announcementsRepo.syncFromServer() },
    ];
    
    for (const { name, operation } of syncOperations) {
      try {
        console.log(`Syncing ${name}...`);
        const result = await operation();
        
        if (result.success) {
          console.log(`${name} sync completed: ${result.count || 0} items`);
        } else {
          console.warn(`${name} sync failed:`, result.error);
        }
      } catch (error) {
        console.error(`${name} sync error:`, error);
      }
    }
  }

  // Public API
  async performImmediateSync(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      this.updateStatus({ status: 'syncing' });
      
      // Process outbox first
      const outboxResult = await outboxManager.processQueue();
      
      // Then sync data
      await this.performDataSync();
      
      this.updateStatus({
        status: 'idle',
        lastSync: new Date().toISOString(),
        error: undefined,
      });
      
      return { success: true };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      
      this.updateStatus({
        status: 'error',
        error: errorMessage,
      });
      
      return { success: false, error: errorMessage };
    }
  }

  getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private updateStatus(updates: Partial<SyncStatus>): void {
    this.syncStatus = { ...this.syncStatus, ...updates };
    this.listeners.forEach(listener => listener(this.syncStatus));
  }

  async disable(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      this.syncStatus.isEnabled = false;
      console.log('Background sync disabled');
    } catch (error) {
      console.error('Failed to disable background sync:', error);
    }
  }

  async enable(): Promise<void> {
    await this.enableBackgroundFetch();
  }

  // Cleanup
  cleanup(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    
    this.listeners = [];
  }
}

// Singleton instance
export const backgroundSync = new BackgroundSyncManager();

// Auto-initialize on import
backgroundSync.initialize().catch(console.error);