'use client'

import { z } from 'zod'

// Background sync operation types
export enum SyncOperationType {
  CHECKIN = 'checkin',
  EVENT_RSVP = 'event_rsvp',
  LIFEGROUP_JOIN = 'lifegroup_join',
  PATHWAY_PROGRESS = 'pathway_progress',
  MEMBER_UPDATE = 'member_update',
  NOTIFICATION_READ = 'notification_read'
}

// Sync operation schema
export const SyncOperationSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(SyncOperationType),
  endpoint: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  data: z.record(z.any()).optional(),
  headers: z.record(z.string()).optional(),
  tenantId: z.string(),
  userId: z.string(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  maxRetries: z.number().default(3),
  retryCount: z.number().default(0),
  createdAt: z.number(),
  lastAttempt: z.number().optional(),
  error: z.string().optional()
})

export type SyncOperation = z.infer<typeof SyncOperationSchema>

export class BackgroundSyncManager {
  private static instance: BackgroundSyncManager
  private dbName = 'drouple-offline-v1'
  private storeName = 'syncQueue'
  private db: IDBDatabase | null = null

  static getInstance(): BackgroundSyncManager {
    if (!BackgroundSyncManager.instance) {
      BackgroundSyncManager.instance = new BackgroundSyncManager()
    }
    return BackgroundSyncManager.instance
  }

  async initialize(): Promise<void> {
    if (this.db) return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('type', 'type', { unique: false })
          store.createIndex('priority', 'priority', { unique: false })
          store.createIndex('tenantId', 'tenantId', { unique: false })
          store.createIndex('userId', 'userId', { unique: false })
          store.createIndex('createdAt', 'createdAt', { unique: false })
        }
      }
    })
  }

  async queueOperation(
    type: SyncOperationType,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    data?: any,
    options: {
      priority?: 'low' | 'normal' | 'high'
      maxRetries?: number
      tenantId?: string
      userId?: string
    } = {}
  ): Promise<string> {
    await this.initialize()

    const operation: SyncOperation = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      endpoint,
      method,
      data,
      headers: {
        'Content-Type': 'application/json'
      },
      tenantId: options.tenantId || '',
      userId: options.userId || '',
      priority: options.priority || 'normal',
      maxRetries: options.maxRetries || 3,
      retryCount: 0,
      createdAt: Date.now()
    }

    const validatedOperation = SyncOperationSchema.parse(operation)

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.add(validatedOperation)

      request.onsuccess = () => {
        console.log('Operation queued for sync:', validatedOperation.id)
        this.requestBackgroundSync()
        resolve(validatedOperation.id)
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  async getQueuedOperations(): Promise<SyncOperation[]> {
    await this.initialize()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        const operations = request.result
          .sort((a: any, b: any) => {
            // Sort by priority (high -> normal -> low) then by creation time
            const priorityOrder: Record<string, number> = { high: 3, normal: 2, low: 1 }
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
              return priorityOrder[b.priority] - priorityOrder[a.priority]
            }
            return a.createdAt - b.createdAt
          })
        resolve(operations)
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  async removeOperation(operationId: string): Promise<void> {
    await this.initialize()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(operationId)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async updateOperation(operation: SyncOperation): Promise<void> {
    await this.initialize()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put(operation)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async processQueue(): Promise<{ processed: number, failed: number }> {
    const operations = await this.getQueuedOperations()
    let processed = 0
    let failed = 0

    for (const operation of operations) {
      try {
        await this.executeOperation(operation)
        await this.removeOperation(operation.id)
        processed++

        // Notify client about successful sync
        this.notifyClients({
          type: 'sync_success',
          operationType: operation.type,
          operationId: operation.id
        })
      } catch (error) {
        console.error('Failed to execute operation:', operation.id, error)
        
        operation.retryCount++
        operation.lastAttempt = Date.now()
        operation.error = error instanceof Error ? error.message : 'Unknown error'

        if (operation.retryCount >= operation.maxRetries) {
          // Max retries reached, remove from queue
          await this.removeOperation(operation.id)
          failed++

          // Notify client about failed sync
          this.notifyClients({
            type: 'sync_failed',
            operationType: operation.type,
            operationId: operation.id,
            error: operation.error
          })
        } else {
          // Update operation with retry count
          await this.updateOperation(operation)
        }
      }
    }

    return { processed, failed }
  }

  private async executeOperation(operation: SyncOperation): Promise<Response> {
    const { endpoint, method, data, headers } = operation

    const fetchOptions: RequestInit = {
      method,
      headers: headers || { 'Content-Type': 'application/json' }
    }

    if (data && method !== 'GET') {
      fetchOptions.body = JSON.stringify(data)
    }

    const response = await fetch(endpoint, fetchOptions)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response
  }

  private requestBackgroundSync(): void {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        return (registration as any).sync.register('church-data-sync')
      }).catch(error => {
        console.error('Background sync registration failed:', error)
      })
    }
  }

  private notifyClients(message: any): void {
    // Send message to main thread
    window.dispatchEvent(new CustomEvent('pwa-sync-update', { detail: message }))
  }

  // Helper methods for common church operations
  async queueCheckin(serviceId: string, memberId: string, tenantId: string): Promise<string> {
    return this.queueOperation(
      SyncOperationType.CHECKIN,
      '/api/checkin',
      'POST',
      { serviceId, memberId },
      { priority: 'high', tenantId, userId: memberId }
    )
  }

  async queueEventRSVP(eventId: string, memberId: string, status: string, tenantId: string): Promise<string> {
    return this.queueOperation(
      SyncOperationType.EVENT_RSVP,
      `/api/events/${eventId}/rsvp`,
      'POST',
      { status },
      { priority: 'normal', tenantId, userId: memberId }
    )
  }

  async queueLifeGroupJoin(lifeGroupId: string, memberId: string, tenantId: string): Promise<string> {
    return this.queueOperation(
      SyncOperationType.LIFEGROUP_JOIN,
      `/api/lifegroups/${lifeGroupId}/join`,
      'POST',
      {},
      { priority: 'normal', tenantId, userId: memberId }
    )
  }

  async queuePathwayProgress(pathwayId: string, stepId: string, memberId: string, tenantId: string): Promise<string> {
    return this.queueOperation(
      SyncOperationType.PATHWAY_PROGRESS,
      `/api/pathways/${pathwayId}/progress`,
      'POST',
      { stepId, completed: true },
      { priority: 'normal', tenantId, userId: memberId }
    )
  }

  async queueMemberUpdate(memberId: string, updates: any, tenantId: string): Promise<string> {
    return this.queueOperation(
      SyncOperationType.MEMBER_UPDATE,
      `/api/members/${memberId}`,
      'PATCH',
      updates,
      { priority: 'low', tenantId, userId: memberId }
    )
  }

  async queueNotificationRead(notificationId: string, memberId: string, tenantId: string): Promise<string> {
    return this.queueOperation(
      SyncOperationType.NOTIFICATION_READ,
      `/api/notifications/${notificationId}/read`,
      'POST',
      {},
      { priority: 'low', tenantId, userId: memberId }
    )
  }

  // Get sync statistics
  async getSyncStats(): Promise<{
    totalQueued: number
    byType: Record<SyncOperationType, number>
    byPriority: Record<string, number>
    oldestOperation?: SyncOperation
  }> {
    const operations = await this.getQueuedOperations()

    const byType = operations.reduce((acc, op) => {
      acc[op.type] = (acc[op.type] || 0) + 1
      return acc
    }, {} as Record<SyncOperationType, number>)

    const byPriority = operations.reduce((acc, op) => {
      acc[op.priority] = (acc[op.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const oldestOperation = operations.length > 0 
      ? operations.sort((a, b) => a.createdAt - b.createdAt)[0]
      : undefined

    return {
      totalQueued: operations.length,
      byType,
      byPriority,
      oldestOperation
    }
  }
}