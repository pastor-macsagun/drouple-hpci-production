// Optimized Modular Service Worker
const CACHE_VERSION = '4'
const APP_VERSION = '2025.09.06'

// Import modules
importScripts('/sw-modules/cache-manager.js')
importScripts('/sw-modules/sync-manager.js')
importScripts('/sw-modules/notification-manager.js')

// Initialize managers
const cacheManager = new CacheManager()
const syncManager = new SyncManager()
const notificationManager = new NotificationManager()

// Performance monitoring
let performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  syncQueueSize: 0,
  lastSync: null,
  preloadedRoutes: new Set()
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log(`Service Worker v${APP_VERSION} installing...`)

  event.waitUntil(
    cacheManager.cacheStaticAssets()
      .then(() => storeVersionInfo())
      .then(() => {
        console.log(`Service Worker v${APP_VERSION} installed and waiting`)
        notifyClients({
          type: 'UPDATE_AVAILABLE',
          payload: {
            version: APP_VERSION,
            releaseNotes: [
              'Optimized PWA performance with modular architecture',
              'Enhanced offline capabilities',
              'Improved notification system',
              'Better cache management'
            ]
          }
        })
      })
  )
})

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log(`Service Worker v${APP_VERSION} activating...`)

  event.waitUntil(
    cacheManager.cleanupOldCaches()
      .then(() => {
        console.log(`Service Worker v${APP_VERSION} activated`)
        notifyClients({
          type: 'UPDATE_INSTALLED',
          payload: { version: APP_VERSION }
        })
        return self.clients.claim()
      })
  )
})

// Fetch event with streamlined routing
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(cacheManager.handleNavigation(request))
    return
  }

  // Handle API requests
  if (cacheManager.isApiRequest(request)) {
    event.respondWith(handleApiWithSync(request))
    return
  }

  // Handle other requests (CSS, JS, images)
  event.respondWith(cacheManager.handleStaticAsset(request))
})

// Enhanced API handling with sync support
async function handleApiWithSync(request) {
  // Handle POST/PUT/DELETE requests with offline queue
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    try {
      const response = await fetch(request)
      return response
    } catch (error) {
      await syncManager.queueOperationForSync(request)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Request queued for sync when online',
          queued: true
        }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }

  // Handle GET requests with cache
  return cacheManager.handleApiRequest(request)
}

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag)

  if (event.tag === syncManager.SYNC_QUEUE_NAME) {
    event.waitUntil(syncManager.processSyncQueue())
  }
})

// Push notification events
self.addEventListener('push', (event) => {
  event.waitUntil(notificationManager.handlePushEvent(event))
})

self.addEventListener('notificationclick', (event) => {
  event.waitUntil(notificationManager.handleNotificationClick(event))
})

self.addEventListener('notificationclose', (event) => {
  notificationManager.handleNotificationClose(event)
})

// Message handling
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {}

  switch (type) {
    case 'SKIP_WAITING':
      console.log('Received SKIP_WAITING message, activating new service worker')
      notifyClients({
        type: 'UPDATE_INSTALLING',
        payload: { version: APP_VERSION }
      })
      self.skipWaiting()
      break

    case 'GET_VERSION':
      event.ports[0].postMessage({
        version: APP_VERSION,
        cacheVersion: CACHE_VERSION
      })
      break

    case 'GET_METRICS':
      const cacheHitRate = performanceMetrics.cacheHits + performanceMetrics.cacheMisses > 0
        ? (performanceMetrics.cacheHits / (performanceMetrics.cacheHits + performanceMetrics.cacheMisses) * 100)
        : 0

      event.ports[0].postMessage({
        cacheHitRate: Math.round(cacheHitRate),
        syncQueueSize: performanceMetrics.syncQueueSize,
        lastSync: performanceMetrics.lastSync,
        preloadedRoutes: Array.from(performanceMetrics.preloadedRoutes)
      })
      break
  }
})

// Utility functions
async function storeVersionInfo() {
  try {
    const db = await openDB()
    const transaction = db.transaction(['appMetadata'], 'readwrite')
    const store = transaction.objectStore('appMetadata')

    await promisifyRequest(store.put({
      id: 'version',
      version: APP_VERSION,
      cacheVersion: CACHE_VERSION,
      installedAt: Date.now()
    }))
  } catch (error) {
    console.error('Failed to store version info:', error)
  }
}

function notifyClients(message) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage(message)
    })
  })
}

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('drouple-offline-v1', 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      if (!db.objectStoreNames.contains('appMetadata')) {
        const store = db.createObjectStore('appMetadata', { keyPath: 'id' })
        store.createIndex('version', 'version', { unique: false })
        store.createIndex('installedAt', 'installedAt', { unique: false })
      }
    }
  })
}

function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}