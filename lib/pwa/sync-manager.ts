'use client'

import { getOfflineStorage, isOnline, onlineStatusChanged, type SyncOperation } from './offline-storage'

export interface SyncConfig {
  maxRetries: number
  retryDelay: number
  batchSize: number
}

const DEFAULT_CONFIG: SyncConfig = {
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  batchSize: 10
}

export class SyncManager {
  private storage = getOfflineStorage()
  private config: SyncConfig
  private syncInProgress = false
  private onlineStatusCleanup: (() => void) | null = null

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.setupOnlineListener()
  }

  private setupOnlineListener(): void {
    this.onlineStatusCleanup = onlineStatusChanged((online) => {
      if (online && !this.syncInProgress) {
        this.startSync()
      }
    })
  }

  // Queue an operation for background sync
  async queueOperation(
    type: SyncOperation['type'],
    entity: string,
    data: any,
    url: string,
    method: string,
    headers: Record<string, string> = {}
  ): Promise<string> {
    const operationId = await this.storage.addToSyncQueue({
      type,
      entity,
      data,
      url,
      method,
      headers
    })

    // If online, try to sync immediately
    if (isOnline() && !this.syncInProgress) {
      setTimeout(() => this.startSync(), 100)
    }

    return operationId
  }

  // Start the sync process
  async startSync(): Promise<void> {
    if (this.syncInProgress || !isOnline()) {
      return
    }

    this.syncInProgress = true
    
    try {
      const operations = await this.storage.getSyncQueue()
      const failedOperations: string[] = []

      // Process operations in batches
      for (let i = 0; i < operations.length; i += this.config.batchSize) {
        const batch = operations.slice(i, i + this.config.batchSize)
        
        for (const operation of batch) {
          try {
            await this.executeOperation(operation)
            await this.storage.removeFromSyncQueue(operation.id)
            
            // Notify client of successful sync
            this.notifyClient('sync-success', {
              operationId: operation.id,
              entity: operation.entity,
              type: operation.type
            })
          } catch (error) {
            console.error('Sync operation failed:', operation.id, error)
            
            await this.storage.incrementRetryCount(operation.id)
            
            if ((operation.retryCount || 0) >= this.config.maxRetries) {
              // Remove operations that have exceeded max retries
              await this.storage.removeFromSyncQueue(operation.id)
              failedOperations.push(operation.id)
              
              // Notify client of permanent failure
              this.notifyClient('sync-failed', {
                operationId: operation.id,
                entity: operation.entity,
                type: operation.type,
                error: error instanceof Error ? error.message : 'Unknown error'
              })
            }
          }
        }

        // Add delay between batches to avoid overwhelming the server
        if (i + this.config.batchSize < operations.length) {
          await this.delay(1000)
        }
      }

      // Update last sync timestamp
      await this.storage.setMetadata('lastSyncAttempt', Date.now())
      
      if (failedOperations.length === 0) {
        await this.storage.setMetadata('lastSuccessfulSync', Date.now())
      }

    } catch (error) {
      console.error('Sync process failed:', error)
      
      // Notify client of sync failure
      this.notifyClient('sync-error', {
        error: error instanceof Error ? error.message : 'Sync process failed'
      })
    } finally {
      this.syncInProgress = false
    }
  }

  private async executeOperation(operation: SyncOperation): Promise<void> {
    const response = await fetch(operation.url, {
      method: operation.method,
      headers: {
        'Content-Type': 'application/json',
        ...operation.headers
      },
      body: operation.data ? JSON.stringify(operation.data) : null
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    // Handle response and potentially update local data
    const responseData = await response.json()
    
    if (responseData && operation.type === 'CREATE' && responseData.data?.id) {
      // Update local record with server-generated ID
      await this.updateLocalRecord(operation.entity, operation.data, responseData.data)
    }
  }

  private async updateLocalRecord(entity: string, localData: any, serverData: any): Promise<void> {
    try {
      // Get tenant ID from the local data or current session
      const tenantId = localData.tenantId || await this.storage.getMetadata('currentTenantId')
      
      if (!tenantId) {
        console.warn('No tenant ID available for local record update')
        return
      }

      // Update local storage with server data
      const storeMap: Record<string, string> = {
        'members': 'members',
        'events': 'events', 
        'lifegroups': 'lifegroups',
        'checkins': 'checkins',
        'pathways': 'pathways'
      }

      const storeName = storeMap[entity]
      if (storeName) {
        await this.storage.store(storeName, [serverData], tenantId)
      }
    } catch (error) {
      console.warn('Failed to update local record:', error)
    }
  }

  // Manually trigger sync
  async forcSync(): Promise<void> {
    return this.startSync()
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    queuedOperations: number
    lastSync: number | null
    lastSuccessfulSync: number | null
    syncInProgress: boolean
  }> {
    const operations = await this.storage.getSyncQueue()
    const lastSync = await this.storage.getMetadata('lastSyncAttempt')
    const lastSuccessfulSync = await this.storage.getMetadata('lastSuccessfulSync')

    return {
      queuedOperations: operations.length,
      lastSync,
      lastSuccessfulSync,
      syncInProgress: this.syncInProgress
    }
  }

  // Clear sync queue (for testing or reset)
  async clearSyncQueue(): Promise<void> {
    const operations = await this.storage.getSyncQueue()
    for (const operation of operations) {
      await this.storage.removeFromSyncQueue(operation.id)
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private notifyClient(type: string, data: any): void {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: `client-${type}`,
        data
      })
    }

    // Also dispatch custom event for components to listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`pwa-${type}`, { detail: data }))
    }
  }

  // Clean up resources
  destroy(): void {
    if (this.onlineStatusCleanup) {
      this.onlineStatusCleanup()
      this.onlineStatusCleanup = null
    }
  }
}

// Singleton instance
let syncManager: SyncManager | null = null

export function getSyncManager(): SyncManager {
  if (!syncManager) {
    syncManager = new SyncManager()
  }
  return syncManager
}

// Utility function to queue common operations
export async function queueCheckin(checkinData: any, tenantId: string): Promise<string> {
  const syncManager = getSyncManager()
  
  return syncManager.queueOperation(
    'CREATE',
    'checkins',
    { ...checkinData, tenantId },
    '/api/checkin',
    'POST',
    { 'Content-Type': 'application/json' }
  )
}

export async function queueEventRSVP(rsvpData: any, eventId: string, tenantId: string): Promise<string> {
  const syncManager = getSyncManager()
  
  return syncManager.queueOperation(
    'CREATE',
    'events',
    { ...rsvpData, tenantId },
    `/api/events/${eventId}/rsvp`,
    'POST',
    { 'Content-Type': 'application/json' }
  )
}

export async function queueLifeGroupJoin(joinData: any, lifegroupId: string, tenantId: string): Promise<string> {
  const syncManager = getSyncManager()
  
  return syncManager.queueOperation(
    'CREATE',
    'lifegroups',
    { ...joinData, tenantId },
    `/api/lifegroups/${lifegroupId}/join`,
    'POST',
    { 'Content-Type': 'application/json' }
  )
}

export async function queuePathwayProgress(progressData: any, pathwayId: string, tenantId: string): Promise<string> {
  const syncManager = getSyncManager()
  
  return syncManager.queueOperation(
    'UPDATE',
    'pathways',
    { ...progressData, tenantId },
    `/api/pathways/${pathwayId}/progress`,
    'POST',
    { 'Content-Type': 'application/json' }
  )
}