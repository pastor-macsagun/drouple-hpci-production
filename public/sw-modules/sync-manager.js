// Background Sync Management Module
class SyncManager {
  constructor() {
    this.SYNC_QUEUE_NAME = 'hpci-chms-sync-queue'
    this.syncQueue = []
  }

  async queueOperationForSync(request) {
    try {
      const operation = {
        id: Date.now().toString(),
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: request.method !== 'GET' ? await request.text() : null,
        timestamp: Date.now()
      }

      await this.addToQueue(operation)

      if (self.registration.sync) {
        await self.registration.sync.register(this.SYNC_QUEUE_NAME)
      }
    } catch (error) {
      console.error('Error queuing operation for sync:', error)
    }
  }

  async processSyncQueue() {
    try {
      const queuedOperations = await this.getQueuedOperations()

      for (const operation of queuedOperations) {
        try {
          await this.replayOperation(operation)
          await this.removeFromQueue(operation.id)
        } catch (error) {
          console.log('Failed to sync operation:', operation.id, error)
        }
      }
    } catch (error) {
      console.error('Error processing sync queue:', error)
    }
  }

  async replayOperation(operation) {
    const response = await fetch(operation.url, {
      method: operation.method,
      headers: operation.headers,
      body: operation.body
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return response
  }

  async addToQueue(operation) {
    try {
      const db = await this.openDB()
      const transaction = db.transaction(['syncQueue'], 'readwrite')
      const store = transaction.objectStore('syncQueue')
      await this.promisifyRequest(store.put(operation))
    } catch (error) {
      console.error('Error adding to sync queue:', error)
      this.syncQueue.push(operation)
    }
  }

  async getQueuedOperations() {
    try {
      const db = await this.openDB()
      const transaction = db.transaction(['syncQueue'], 'readonly')
      const store = transaction.objectStore('syncQueue')
      return await this.promisifyRequest(store.getAll()) || []
    } catch (error) {
      console.error('Error getting queued operations:', error)
      return this.syncQueue
    }
  }

  async removeFromQueue(operationId) {
    try {
      const db = await this.openDB()
      const transaction = db.transaction(['syncQueue'], 'readwrite')
      const store = transaction.objectStore('syncQueue')
      await this.promisifyRequest(store.delete(operationId))
    } catch (error) {
      console.error('Error removing from sync queue:', error)
      this.syncQueue = this.syncQueue.filter(op => op.id !== operationId)
    }
  }

  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('drouple-offline-v1', 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        if (!db.objectStoreNames.contains('syncQueue')) {
          const store = db.createObjectStore('syncQueue', { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
}

// Export for use in main service worker
self.SyncManager = SyncManager