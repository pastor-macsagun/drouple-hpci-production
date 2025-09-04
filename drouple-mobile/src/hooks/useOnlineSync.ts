/**
 * useOnlineSync Hook
 * React hook for sync status and manual sync triggers
 */

import { useState, useEffect, useCallback } from 'react';
import { syncManager, SyncStatus, SyncResult } from '@/lib/net/syncManager';

export interface UseSyncReturn {
  status: SyncStatus;
  syncNow: () => Promise<SyncResult>;
  isInitialized: boolean;
}

export const useOnlineSync = (): UseSyncReturn => {
  const [status, setStatus] = useState<SyncStatus>(syncManager.getStatus());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeSync = async () => {
      try {
        await syncManager.initialize();
        setIsInitialized(true);

        // Subscribe to sync status updates
        unsubscribe = syncManager.subscribe(newStatus => {
          setStatus(newStatus);
        });
      } catch (error) {
        console.error('Failed to initialize sync manager:', error);
      }
    };

    initializeSync();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const syncNow = useCallback(async (): Promise<SyncResult> => {
    if (!isInitialized) {
      console.warn('Sync manager not initialized');
      return {
        processed: 0,
        succeeded: 0,
        failed: 0,
        errors: ['Not initialized'],
      };
    }

    return syncManager.syncNow();
  }, [isInitialized]);

  return {
    status,
    syncNow,
    isInitialized,
  };
};

// Utility hook for queue operations
export const useOfflineQueue = () => {
  const { database } = require('@/lib/db/database');

  const enqueue = useCallback(async (type: any, payload: any) => {
    return database.enqueue(type, payload);
  }, []);

  const getQueueCount = useCallback(async () => {
    return database.getQueueCount();
  }, []);

  const getStats = useCallback(async () => {
    return database.getStats();
  }, []);

  return {
    enqueue,
    getQueueCount,
    getStats,
  };
};

export default useOnlineSync;
