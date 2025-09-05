'use client'

// IndexedDB-based offline storage for critical church data
// Respects multi-tenancy and RBAC patterns from the existing system

export interface OfflineStorageConfig {
  dbName: string
  version: number
  stores: {
    members: string
    events: string
    lifegroups: string
    checkins: string
    pathways: string
    syncQueue: string
    metadata: string
  }
}

export interface SyncOperation {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  entity: string
  data: any
  url: string
  method: string
  headers: Record<string, string>
  timestamp: number
  retryCount?: number
}

export interface OfflineMetadata {
  tenantId: string
  userId: string
  lastSync: number
  version: string
}

const CONFIG: OfflineStorageConfig = {
  dbName: 'drouple-offline-v1',
  version: 1,
  stores: {
    members: 'members',
    events: 'events',
    lifegroups: 'lifegroups',
    checkins: 'checkins',
    pathways: 'pathways',
    syncQueue: 'syncQueue',
    metadata: 'metadata'
  }
}

class OfflineStorage {
  private db: IDBDatabase | null = null
  private dbPromise: Promise<IDBDatabase> | null = null

  constructor() {
    this.dbPromise = this.initDB()
  }

  private async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB not supported'))
        return
      }

      const request = indexedDB.open(CONFIG.dbName, CONFIG.version)

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve(request.result)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores for each entity type
        if (!db.objectStoreNames.contains(CONFIG.stores.members)) {
          const membersStore = db.createObjectStore(CONFIG.stores.members, { keyPath: 'id' })
          membersStore.createIndex('tenantId', 'tenantId', { unique: false })
          membersStore.createIndex('email', 'email', { unique: false })
        }

        if (!db.objectStoreNames.contains(CONFIG.stores.events)) {
          const eventsStore = db.createObjectStore(CONFIG.stores.events, { keyPath: 'id' })
          eventsStore.createIndex('tenantId', 'tenantId', { unique: false })
          eventsStore.createIndex('date', 'date', { unique: false })
        }

        if (!db.objectStoreNames.contains(CONFIG.stores.lifegroups)) {
          const lifegroupsStore = db.createObjectStore(CONFIG.stores.lifegroups, { keyPath: 'id' })
          lifegroupsStore.createIndex('tenantId', 'tenantId', { unique: false })
          lifegroupsStore.createIndex('leaderId', 'leaderId', { unique: false })
        }

        if (!db.objectStoreNames.contains(CONFIG.stores.checkins)) {
          const checkinsStore = db.createObjectStore(CONFIG.stores.checkins, { keyPath: 'id' })
          checkinsStore.createIndex('tenantId', 'tenantId', { unique: false })
          checkinsStore.createIndex('memberId', 'memberId', { unique: false })
          checkinsStore.createIndex('serviceId', 'serviceId', { unique: false })
        }

        if (!db.objectStoreNames.contains(CONFIG.stores.pathways)) {
          const pathwaysStore = db.createObjectStore(CONFIG.stores.pathways, { keyPath: 'id' })
          pathwaysStore.createIndex('tenantId', 'tenantId', { unique: false })
          pathwaysStore.createIndex('type', 'type', { unique: false })
        }

        if (!db.objectStoreNames.contains(CONFIG.stores.syncQueue)) {
          const syncStore = db.createObjectStore(CONFIG.stores.syncQueue, { keyPath: 'id' })
          syncStore.createIndex('timestamp', 'timestamp', { unique: false })
          syncStore.createIndex('entity', 'entity', { unique: false })
        }

        if (!db.objectStoreNames.contains(CONFIG.stores.metadata)) {
          db.createObjectStore(CONFIG.stores.metadata, { keyPath: 'key' })
        }
      }
    })
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db
    if (!this.dbPromise) {
      this.dbPromise = this.initDB()
    }
    this.db = await this.dbPromise
    return this.db
  }

  // Generic CRUD operations with tenant isolation
  async store(storeName: string, data: any[], tenantId: string): Promise<void> {
    const db = await this.getDB()
    const transaction = db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)

    // Add tenantId to all records for isolation
    const recordsWithTenant = data.map(record => ({
      ...record,
      tenantId,
      _lastUpdated: Date.now()
    }))

    for (const record of recordsWithTenant) {
      await new Promise<void>((resolve, reject) => {
        const request = store.put(record)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }
  }

  async get(storeName: string, tenantId: string, key?: string): Promise<any[]> {
    const db = await this.getDB()
    const transaction = db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)

    if (key) {
      return new Promise((resolve, reject) => {
        const request = store.get(key)
        request.onsuccess = () => {
          const result = request.result
          if (result && result.tenantId === tenantId) {
            resolve([result])
          } else {
            resolve([])
          }
        }
        request.onerror = () => reject(request.error)
      })
    }

    // Get all records for tenant
    return new Promise((resolve, reject) => {
      const request = store.index('tenantId').getAll(tenantId)
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async delete(storeName: string, id: string, tenantId: string): Promise<void> {
    const db = await this.getDB()
    const transaction = db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)

    // Verify tenant ownership before deletion
    const existing = await new Promise<any>((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    if (!existing || existing.tenantId !== tenantId) {
      throw new Error('Record not found or access denied')
    }

    return new Promise<void>((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Sync queue operations
  async addToSyncQueue(operation: Omit<SyncOperation, 'id' | 'timestamp'>): Promise<string> {
    const syncOp: SyncOperation = {
      ...operation,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0
    }

    const db = await this.getDB()
    const transaction = db.transaction([CONFIG.stores.syncQueue], 'readwrite')
    const store = transaction.objectStore(CONFIG.stores.syncQueue)

    return new Promise((resolve, reject) => {
      const request = store.put(syncOp)
      request.onsuccess = () => resolve(syncOp.id)
      request.onerror = () => reject(request.error)
    })
  }

  async getSyncQueue(): Promise<SyncOperation[]> {
    const db = await this.getDB()
    const transaction = db.transaction([CONFIG.stores.syncQueue], 'readonly')
    const store = transaction.objectStore(CONFIG.stores.syncQueue)

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    const db = await this.getDB()
    const transaction = db.transaction([CONFIG.stores.syncQueue], 'readwrite')
    const store = transaction.objectStore(CONFIG.stores.syncQueue)

    return new Promise<void>((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async incrementRetryCount(id: string): Promise<void> {
    const db = await this.getDB()
    const transaction = db.transaction([CONFIG.stores.syncQueue], 'readwrite')
    const store = transaction.objectStore(CONFIG.stores.syncQueue)

    const operation = await new Promise<SyncOperation>((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    if (operation) {
      operation.retryCount = (operation.retryCount || 0) + 1
      return new Promise<void>((resolve, reject) => {
        const request = store.put(operation)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }
  }

  // Metadata operations
  async setMetadata(key: string, value: any): Promise<void> {
    const db = await this.getDB()
    const transaction = db.transaction([CONFIG.stores.metadata], 'readwrite')
    const store = transaction.objectStore(CONFIG.stores.metadata)

    return new Promise<void>((resolve, reject) => {
      const request = store.put({ key, value, timestamp: Date.now() })
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getMetadata(key: string): Promise<any> {
    const db = await this.getDB()
    const transaction = db.transaction([CONFIG.stores.metadata], 'readonly')
    const store = transaction.objectStore(CONFIG.stores.metadata)

    return new Promise((resolve, reject) => {
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result?.value)
      request.onerror = () => reject(request.error)
    })
  }

  // Convenience methods for specific entities
  async storeMembers(members: any[], tenantId: string): Promise<void> {
    return this.store(CONFIG.stores.members, members, tenantId)
  }

  async getMembers(tenantId: string): Promise<any[]> {
    return this.get(CONFIG.stores.members, tenantId)
  }

  async storeEvents(events: any[], tenantId: string): Promise<void> {
    return this.store(CONFIG.stores.events, events, tenantId)
  }

  async getEvents(tenantId: string): Promise<any[]> {
    return this.get(CONFIG.stores.events, tenantId)
  }

  async storeLifeGroups(lifegroups: any[], tenantId: string): Promise<void> {
    return this.store(CONFIG.stores.lifegroups, lifegroups, tenantId)
  }

  async getLifeGroups(tenantId: string): Promise<any[]> {
    return this.get(CONFIG.stores.lifegroups, tenantId)
  }

  async storeCheckins(checkins: any[], tenantId: string): Promise<void> {
    return this.store(CONFIG.stores.checkins, checkins, tenantId)
  }

  async getCheckins(tenantId: string): Promise<any[]> {
    return this.get(CONFIG.stores.checkins, tenantId)
  }

  async storePathways(pathways: any[], tenantId: string): Promise<void> {
    return this.store(CONFIG.stores.pathways, pathways, tenantId)
  }

  async getPathways(tenantId: string): Promise<any[]> {
    return this.get(CONFIG.stores.pathways, tenantId)
  }

  // Clear all data (for logout or tenant switch)
  async clearAll(): Promise<void> {
    const db = await this.getDB()
    const storeNames = Object.values(CONFIG.stores)
    
    for (const storeName of storeNames) {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      await new Promise<void>((resolve, reject) => {
        const request = store.clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }
  }

  // Clear data for specific tenant
  async clearTenant(tenantId: string): Promise<void> {
    const db = await this.getDB()
    const storeNames = [
      CONFIG.stores.members,
      CONFIG.stores.events, 
      CONFIG.stores.lifegroups,
      CONFIG.stores.checkins,
      CONFIG.stores.pathways
    ]
    
    for (const storeName of storeNames) {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const index = store.index('tenantId')
      
      await new Promise<void>((resolve, reject) => {
        const request = index.getAllKeys(tenantId)
        request.onsuccess = () => {
          const keys = request.result
          const deletePromises = keys.map(key => 
            new Promise<void>((deleteResolve, deleteReject) => {
              const deleteRequest = store.delete(key)
              deleteRequest.onsuccess = () => deleteResolve()
              deleteRequest.onerror = () => deleteReject(deleteRequest.error)
            })
          )
          Promise.all(deletePromises).then(() => resolve()).catch(reject)
        }
        request.onerror = () => reject(request.error)
      })
    }
  }
}

// Singleton instance
let offlineStorage: OfflineStorage | null = null

export function getOfflineStorage(): OfflineStorage {
  if (!offlineStorage) {
    offlineStorage = new OfflineStorage()
  }
  return offlineStorage
}

// Utility functions for checking online status
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

export function onlineStatusChanged(callback: (online: boolean) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}