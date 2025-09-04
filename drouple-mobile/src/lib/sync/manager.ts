/**
 * Sync Manager
 * Coordinates offline queue, cache management, and data synchronization
 */

import React from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { offlineQueue, OfflineQueue } from './queue';
import { cacheManager, CacheManager } from './cache';
import { APP_CONFIG } from '../../config/app';

interface SyncStatus {
  isOnline: boolean;
  queueStatus: {
    pending: number;
    processing: number;
    failed: number;
    total: number;
  };
  cacheStats: {
    totalItems: number;
    totalSize: number;
  };
  lastSyncAt?: string;
  syncInProgress: boolean;
}

interface SyncManagerConfig {
  autoSync: boolean;
  syncOnAppForeground: boolean;
  syncOnReconnect: boolean;
  syncIntervalMs: number;
}

type SyncEventType = 'status' | 'queue' | 'cache' | 'error';
type SyncEventListener = (event: { type: SyncEventType; data: any }) => void;

export class SyncManager {
  private queue: OfflineQueue;
  private cache: CacheManager;
  private isInitialized = false;
  private listeners: SyncEventListener[] = [];
  private status: SyncStatus;
  private config: SyncManagerConfig;
  private syncTimer: NodeJS.Timeout | null = null;
  private networkUnsubscribe: (() => void) | null = null;

  constructor() {
    this.queue = offlineQueue;
    this.cache = cacheManager;
    
    this.config = {
      autoSync: APP_CONFIG.features.enableOfflineMode,
      syncOnAppForeground: true,
      syncOnReconnect: true,
      syncIntervalMs: 5 * 60 * 1000, // 5 minutes
    };

    this.status = {
      isOnline: true,
      queueStatus: { pending: 0, processing: 0, failed: 0, total: 0 },
      cacheStats: { totalItems: 0, totalSize: 0 },
      syncInProgress: false,
    };
  }

  /**
   * Initialize sync manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize queue and cache
      await Promise.all([
        this.queue.initialize(),
        this.cache.initialize(),
      ]);

      // Set up network listener
      this.setupNetworkListener();
      
      // Set up app state listener
      this.setupAppStateListener();

      // Start auto-sync if enabled
      if (this.config.autoSync) {
        this.startAutoSync();
      }

      // Initial status update
      await this.updateStatus();

      this.isInitialized = true;
      console.log('Sync manager initialized');

      this.emit('status', this.status);
    } catch (error) {
      console.error('Failed to initialize sync manager:', error);
      throw error;
    }
  }

  /**
   * Add operation to offline queue
   */
  async queueOperation(operation: {
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: any;
    headers?: Record<string, string>;
    priority?: number;
  }): Promise<string> {
    try {
      const id = await this.queue.enqueue(operation);
      
      // Update status after queueing
      setTimeout(() => this.updateStatus(), 100);
      
      return id;
    } catch (error) {
      console.error('Failed to queue operation:', error);
      this.emit('error', { message: 'Failed to queue operation', error });
      throw error;
    }
  }

  /**
   * Cache data with automatic expiration
   */
  async cacheData<T>(
    key: string,
    data: T,
    ttl?: number
  ): Promise<void> {
    try {
      await this.cache.set(key, data, { ttl });
      
      // Update cache stats
      setTimeout(() => this.updateStatus(), 100);
    } catch (error) {
      console.error('Failed to cache data:', error);
      this.emit('error', { message: 'Failed to cache data', error });
    }
  }

  /**
   * Get cached data or fetch if not available
   */
  async getCachedData<T>(
    key: string,
    fetcher?: () => Promise<T>,
    ttl?: number
  ): Promise<T | null> {
    try {
      if (fetcher) {
        return await this.cache.getOrFetch(key, fetcher, { ttl });
      } else {
        return await this.cache.get<T>(key);
      }
    } catch (error) {
      console.error('Failed to get cached data:', error);
      this.emit('error', { message: 'Failed to get cached data', error });
      return null;
    }
  }

  /**
   * Force sync of all pending operations
   */
  async forceSync(): Promise<void> {
    if (this.status.syncInProgress) {
      console.log('Sync already in progress');
      return;
    }

    this.status.syncInProgress = true;
    this.status.lastSyncAt = new Date().toISOString();
    this.emit('status', this.status);

    try {
      console.log('Force sync started');

      // Clear expired cache items
      await this.cache.clearExpired();

      // Queue processing will happen automatically via the queue manager
      // We just need to wait a bit for processing to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Force sync completed');
    } catch (error) {
      console.error('Force sync failed:', error);
      this.emit('error', { message: 'Force sync failed', error });
    } finally {
      this.status.syncInProgress = false;
      await this.updateStatus();
    }
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return { ...this.status };
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    try {
      await this.cache.clear();
      await this.updateStatus();
      this.emit('cache', { action: 'cleared' });
    } catch (error) {
      console.error('Failed to clear cache:', error);
      this.emit('error', { message: 'Failed to clear cache', error });
    }
  }

  /**
   * Add event listener
   */
  addListener(listener: SyncEventListener): () => void {
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<SyncManagerConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Restart auto-sync if interval changed
    if (updates.syncIntervalMs && this.config.autoSync) {
      this.startAutoSync();
    }
  }

  /**
   * Setup network connectivity listener
   */
  private setupNetworkListener(): void {
    this.networkUnsubscribe = NetInfo.addEventListener(state => {
      const wasOnline = this.status.isOnline;
      const isOnline = state.isConnected ?? false;
      
      this.status.isOnline = isOnline;

      if (!wasOnline && isOnline && this.config.syncOnReconnect) {
        console.log('Network reconnected, triggering sync');
        setTimeout(() => this.forceSync(), 1000);
      }

      this.emit('status', this.status);
    });
  }

  /**
   * Setup app state listener
   */
  private setupAppStateListener(): void {
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && this.config.syncOnAppForeground) {
        console.log('App became active, triggering sync');
        setTimeout(() => this.forceSync(), 500);
      }
    });
  }

  /**
   * Start automatic sync timer
   */
  private startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.status.isOnline && !this.status.syncInProgress) {
        this.forceSync();
      }
    }, this.config.syncIntervalMs);
  }

  /**
   * Update sync status
   */
  private async updateStatus(): Promise<void> {
    try {
      const [queueStatus, cacheStats] = await Promise.all([
        this.queue.getQueueStatus(),
        this.cache.getStats(),
      ]);

      this.status.queueStatus = queueStatus;
      this.status.cacheStats = cacheStats;

      this.emit('status', this.status);
    } catch (error) {
      console.error('Failed to update sync status:', error);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(type: SyncEventType, data: any): void {
    this.listeners.forEach(listener => {
      try {
        listener({ type, data });
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = null;
    }

    this.queue.destroy();
    this.cache.destroy();
    this.listeners = [];
    
    this.isInitialized = false;
  }
}

// Singleton instance
export const syncManager = new SyncManager();

// Hook for React components
export const useSyncManager = () => {
  const [status, setStatus] = React.useState<SyncStatus>(() => syncManager.getStatus());

  React.useEffect(() => {
    const unsubscribe = syncManager.addListener(({ type, data }) => {
      if (type === 'status') {
        setStatus(data);
      }
    });

    return unsubscribe;
  }, []);

  return {
    status,
    forceSync: () => syncManager.forceSync(),
    queueOperation: syncManager.queueOperation.bind(syncManager),
    cacheData: syncManager.cacheData.bind(syncManager),
    getCachedData: syncManager.getCachedData.bind(syncManager),
    clearCache: () => syncManager.clearCache(),
  };
};

export default syncManager;