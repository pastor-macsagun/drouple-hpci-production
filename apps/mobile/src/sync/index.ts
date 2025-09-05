/**
 * Sync System Integration
 * Complete offline-first sync architecture with background processing
 */

export { database, generateId, toISOString } from '../data/db';
export { outboxManager } from './outbox';
export { backgroundSyncManager } from './background';

// Repository exports
export * from '../data/repos';

// Sync components
export * from '../components/sync/SyncStatusBadge';

// Sync utilities
export const syncUtils = {
  /**
   * Initialize sync system
   */
  async initialize() {
    await backgroundSyncManager.initialize();
    console.log('🔄 Sync system initialized');
  },

  /**
   * Force immediate sync
   */
  async forceSync() {
    await backgroundSyncManager.forcSync();
  },

  /**
   * Get overall sync health
   */
  async getHealth() {
    const [syncStatus, outboxStats] = await Promise.all([
      backgroundSyncManager.getSyncStatus(),
      backgroundSyncManager.getSyncStats(),
    ]);

    return {
      isHealthy: syncStatus.isOnline && syncStatus.pendingItems < 10,
      isOnline: syncStatus.isOnline,
      lastSync: syncStatus.lastSync,
      pendingItems: syncStatus.pendingItems,
      errors: syncStatus.syncErrors,
      stats: outboxStats,
    };
  },

  /**
   * Reset sync system (for debugging)
   */
  async reset() {
    await backgroundSyncManager.resetSync();
    await outboxManager.resetFailedItems();
  },

  /**
   * Cleanup old data
   */
  async cleanup() {
    await outboxManager.clearSyncedItems(7); // Keep 7 days
  },
};

// Hook for React components
export const useSyncHealth = () => {
  const [health, setHealth] = React.useState<any>(null);

  React.useEffect(() => {
    const updateHealth = async () => {
      try {
        const currentHealth = await syncUtils.getHealth();
        setHealth(currentHealth);
      } catch (error) {
        console.warn('Failed to get sync health:', error);
      }
    };

    updateHealth();
    const interval = setInterval(updateHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return health;
};

import React from 'react';