const CACHE_VERSION = '3'
const APP_VERSION = '2025.01.05'
const STATIC_CACHE_NAME = `hpci-chms-static-v${CACHE_VERSION}`
const API_CACHE_NAME = `hpci-chms-api-v${CACHE_VERSION}`
const SYNC_QUEUE_NAME = 'hpci-chms-sync-queue'

// Release notes for this version
const RELEASE_NOTES = [
  'Enhanced offline capabilities with better sync',
  'Improved caching strategies for faster loading',
  'Better update management and notifications',
  'Enhanced security for offline data'
]

// Define cached assets
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon.svg',
  '/checkin',
  '/events',
  '/lifegroups',
  '/pathways',
  '/dashboard'
]

// API endpoints to cache
const API_CACHE_PATTERNS = [
  '/api/auth/session',
  '/api/events',
  '/api/lifegroups', 
  '/api/pathways',
  '/api/members',
  '/api/checkin'
]

// Background sync queue for offline actions
let syncQueue = []

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log(`Service Worker v${APP_VERSION} installing...`)
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        // Store version info
        return storeVersionInfo()
      })
      .then(() => {
        // Don't skip waiting automatically - let user choose when to update
        console.log(`Service Worker v${APP_VERSION} installed and waiting`)
        notifyClients({
          type: 'UPDATE_AVAILABLE',
          payload: {
            version: APP_VERSION,
            releaseNotes: RELEASE_NOTES
          }
        })
      })
  )
})

// Store version information
async function storeVersionInfo() {
  try {
    const db = await openDB()
    const transaction = db.transaction(['appMetadata'], 'readwrite')
    const store = transaction.objectStore('appMetadata')
    
    await promisifyRequest(store.put({
      id: 'version',
      version: APP_VERSION,
      cacheVersion: CACHE_VERSION,
      releaseNotes: RELEASE_NOTES,
      installedAt: Date.now()
    }))
  } catch (error) {
    console.error('Failed to store version info:', error)
  }
}

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log(`Service Worker v${APP_VERSION} activating...`)
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheName.startsWith('hpci-chms-') || 
                (!cacheName.includes(`v${CACHE_VERSION}`))) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
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

// Performance monitoring
let performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  syncQueueSize: 0,
  lastSync: null,
  preloadedRoutes: new Set()
}

// Listen for messages from clients
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
        cacheVersion: CACHE_VERSION,
        releaseNotes: RELEASE_NOTES
      })
      break
    
    case 'CHECK_UPDATE':
      // Force update check
      checkForUpdates().then(hasUpdate => {
        event.ports[0].postMessage({ hasUpdate })
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

    case 'PRELOAD_RESOURCES':
      preloadResources(payload.routes, payload.priority)
      break

    case 'PRELOAD_ROUTE':
      preloadSingleRoute(payload.route)
      break

    case 'OPTIMIZE_CACHE':
      optimizeCacheWithStrategy(payload)
      break

    case 'CLEANUP_CACHE':
      cleanupCacheStorage(payload.aggressive)
      break

    case 'REFRESH_CACHE':
      refreshCacheRoutes(payload.routes)
      break
  }
})

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag)
  
  if (event.tag === SYNC_QUEUE_NAME) {
    event.waitUntil(processSyncQueue())
  } else if (event.tag === 'church-data-sync') {
    event.waitUntil(processChurchDataSync())
  }
})

// Process queued sync operations
async function processSyncQueue() {
  try {
    // Get queued operations from IndexedDB
    const queuedOperations = await getQueuedOperations()
    
    for (const operation of queuedOperations) {
      try {
        // Attempt to replay the operation
        await replayOperation(operation)
        // Remove from queue on success
        await removeFromQueue(operation.id)
      } catch (error) {
        console.log('Failed to sync operation:', operation.id, error)
        // Keep in queue for next sync attempt
      }
    }
  } catch (error) {
    console.error('Error processing sync queue:', error)
  }
}

// Replay a queued operation
async function replayOperation(operation) {
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

// Check if request is for API endpoint
function isApiRequest(request) {
  return API_CACHE_PATTERNS.some(pattern => 
    request.url.includes(pattern)
  )
}

// Check if request should be cached
function shouldCacheRequest(request, response) {
  return response && 
         response.status === 200 && 
         response.type === 'basic' &&
         request.method === 'GET'
}

// Fetch event with advanced caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-HTTP requests and Chrome extension requests
  if (!request.url.startsWith('http') || request.url.startsWith('chrome-extension://')) {
    return
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful responses
          if (shouldCacheRequest(request, response)) {
            caches.open(STATIC_CACHE_NAME).then(cache => {
              cache.put(request, response.clone())
            })
          }
          return response
        })
        .catch(() => {
          // Serve from cache when offline
          return caches.match(request)
            .then(cachedResponse => {
              return cachedResponse || caches.match('/')
            })
        })
    )
    return
  }

  // Handle API requests with stale-while-revalidate strategy
  if (isApiRequest(request)) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then(cache => {
        return cache.match(request).then(cachedResponse => {
          // Track cache performance
          if (cachedResponse) {
            performanceMetrics.cacheHits++
          } else {
            performanceMetrics.cacheMisses++
          }

          const fetchPromise = fetch(request).then(networkResponse => {
            // Update cache with fresh data
            if (shouldCacheRequest(request, networkResponse)) {
              cache.put(request, networkResponse.clone())
            }
            return networkResponse
          }).catch(error => {
            // If network fails and we have cached data, use it
            if (cachedResponse) {
              performanceMetrics.cacheHits++ // Count fallback to cache as hit
              return cachedResponse
            }
            throw error
          })

          // Return cached response immediately if available, otherwise wait for network
          return cachedResponse || fetchPromise
        })
      })
    )
    return
  }

  // Handle POST/PUT/DELETE requests (potentially queue for sync)
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    event.respondWith(
      fetch(request)
        .catch(async error => {
          // If offline, queue the request for background sync
          if (isApiRequest(request)) {
            await queueOperationForSync(request)
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
          throw error
        })
    )
    return
  }

  // Handle other requests (CSS, JS, images) with cache first strategy
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response
        }
        
        return fetch(request).then(response => {
          if (shouldCacheRequest(request, response)) {
            const responseToCache = response.clone()
            caches.open(STATIC_CACHE_NAME).then(cache => {
              cache.put(request, responseToCache)
            })
          }
          return response
        })
      })
  )
})

// Queue operation for background sync
async function queueOperationForSync(request) {
  try {
    const operation = {
      id: Date.now().toString(),
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: request.method !== 'GET' ? await request.text() : null,
      timestamp: Date.now()
    }

    await addToQueue(operation)
    
    // Register for background sync
    if (self.registration.sync) {
      await self.registration.sync.register(SYNC_QUEUE_NAME)
    }
  } catch (error) {
    console.error('Error queuing operation for sync:', error)
  }
}

// IndexedDB operations for sync queue
async function addToQueue(operation) {
  try {
    const db = await openDB()
    const transaction = db.transaction(['syncQueue'], 'readwrite')
    const store = transaction.objectStore('syncQueue')
    await promisifyRequest(store.put(operation))
  } catch (error) {
    console.error('Error adding to sync queue:', error)
    // Fallback to memory storage
    syncQueue.push(operation)
  }
}

async function getQueuedOperations() {
  try {
    const db = await openDB()
    const transaction = db.transaction(['syncQueue'], 'readonly')
    const store = transaction.objectStore('syncQueue')
    return await promisifyRequest(store.getAll()) || []
  } catch (error) {
    console.error('Error getting queued operations:', error)
    // Fallback to memory storage
    return syncQueue
  }
}

async function removeFromQueue(operationId) {
  try {
    const db = await openDB()
    const transaction = db.transaction(['syncQueue'], 'readwrite')
    const store = transaction.objectStore('syncQueue')
    await promisifyRequest(store.delete(operationId))
  } catch (error) {
    console.error('Error removing from sync queue:', error)
    // Fallback to memory storage
    syncQueue = syncQueue.filter(op => op.id !== operationId)
  }
}

// Simple IndexedDB wrapper for service worker
let dbPromise = null

async function openDB() {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('drouple-offline-v1', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      if (!db.objectStoreNames.contains('syncQueue')) {
        const store = db.createObjectStore('syncQueue', { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('entity', 'entity', { unique: false })
      }

      if (!db.objectStoreNames.contains('analytics')) {
        const store = db.createObjectStore('analytics', { keyPath: 'id' })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }

      if (!db.objectStoreNames.contains('appMetadata')) {
        const store = db.createObjectStore('appMetadata', { keyPath: 'id' })
        store.createIndex('version', 'version', { unique: false })
        store.createIndex('installedAt', 'installedAt', { unique: false })
      }

      if (!db.objectStoreNames.contains('encryptedData')) {
        const store = db.createObjectStore('encryptedData', { keyPath: 'id' })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('tenantId', 'tenantId', { unique: false })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })

  return dbPromise
}

function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Push notification event handler
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Push event received without data')
    return
  }

  try {
    const payload = event.data.json()
    console.log('Push notification received:', payload)

    const notificationOptions = {
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/icon-192x192.png',
      image: payload.image,
      data: {
        url: payload.url,
        timestamp: payload.timestamp,
        type: payload.type,
        ...payload.data
      },
      actions: getNotificationActions(payload.type),
      requireInteraction: isHighPriority(payload.type),
      renotify: true,
      tag: `${payload.type}_${payload.churchId}`,
      vibrate: getVibrationPattern(payload.type)
    }

    event.waitUntil(
      self.registration.showNotification(payload.title, notificationOptions)
    )
  } catch (error) {
    console.error('Error handling push notification:', error)
    
    // Show generic notification if parsing fails
    event.waitUntil(
      self.registration.showNotification('New Church Notification', {
        body: 'You have a new notification from your church.',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png'
      })
    )
  }
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)

  const notification = event.notification
  const action = event.action
  const data = notification.data || {}

  notification.close()

  if (action === 'dismiss') {
    return
  }

  // Determine the URL to open
  let url = data.url || '/'
  if (action === 'view_details') {
    url = data.url || '/'
  }

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      // Check if there's already a window/tab open for this origin
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url.indexOf(url) >= 0 && 'focus' in client) {
          return client.focus()
        }
      }

      // If no existing window, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )

  // Track notification interaction
  trackNotificationInteraction(data.type, action || 'click')
})

// Notification close handler (when user dismisses without clicking)
self.addEventListener('notificationclose', (event) => {
  const data = event.notification.data || {}
  trackNotificationInteraction(data.type, 'dismiss')
})

// Get notification actions based on type
function getNotificationActions(type) {
  switch (type) {
    case 'service_reminder':
      return [
        { action: 'view_details', title: 'Check In', icon: '/icon-192x192.png' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    case 'event_announcement':
      return [
        { action: 'view_details', title: 'View Event', icon: '/icon-192x192.png' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    case 'lifegroup_update':
      return [
        { action: 'view_details', title: 'View Group', icon: '/icon-192x192.png' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    case 'pathway_milestone':
      return [
        { action: 'view_details', title: 'Continue', icon: '/icon-192x192.png' },
        { action: 'dismiss', title: 'Later' }
      ]
    case 'admin_alert':
    case 'urgent_announcement':
      return [
        { action: 'view_details', title: 'View Details', icon: '/icon-192x192.png' }
      ]
    default:
      return [
        { action: 'view_details', title: 'View', icon: '/icon-192x192.png' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
  }
}

// Check if notification should require interaction
function isHighPriority(type) {
  return type === 'urgent_announcement' || type === 'admin_alert'
}

// Get vibration pattern based on notification type
function getVibrationPattern(type) {
  switch (type) {
    case 'urgent_announcement':
      return [200, 100, 200, 100, 200] // Urgent pattern
    case 'admin_alert':
      return [300, 200, 300] // Alert pattern
    case 'service_reminder':
      return [100, 50, 100] // Gentle reminder
    default:
      return [100] // Single vibration
  }
}

// Track notification interactions for analytics
function trackNotificationInteraction(type, action) {
  // Store interaction in IndexedDB for later analytics
  openDB().then(db => {
    const transaction = db.transaction(['analytics'], 'readwrite')
    const store = transaction.objectStore('analytics')
    
    const interaction = {
      id: Date.now().toString(),
      type: 'notification_interaction',
      notificationType: type,
      action: action,
      timestamp: Date.now()
    }
    
    return promisifyRequest(store.put(interaction))
  }).catch(error => {
    console.error('Failed to track notification interaction:', error)
  })
}

// Process church data sync queue (from BackgroundSyncManager)
async function processChurchDataSync() {
  try {
    console.log('Processing church data background sync')
    
    // Open the background sync database
    const db = await openBackgroundSyncDB()
    const transaction = db.transaction(['syncQueue'], 'readonly')
    const store = transaction.objectStore('syncQueue')
    const operations = await promisifyRequest(store.getAll())
    
    let processed = 0
    let failed = 0
    
    // Sort by priority and creation time
    operations.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      return a.createdAt - b.createdAt
    })
    
    for (const operation of operations) {
      try {
        await executeBackgroundSyncOperation(operation)
        await removeBackgroundSyncOperation(db, operation.id)
        processed++
        
        // Notify clients about successful sync
        notifyClients({
          type: 'sync_success',
          operationType: operation.type,
          operationId: operation.id
        })
      } catch (error) {
        console.error('Background sync operation failed:', operation.id, error)
        
        // Update retry count
        operation.retryCount++
        operation.lastAttempt = Date.now()
        operation.error = error.message
        
        if (operation.retryCount >= operation.maxRetries) {
          // Max retries reached, remove from queue
          await removeBackgroundSyncOperation(db, operation.id)
          failed++
          
          notifyClients({
            type: 'sync_failed',
            operationType: operation.type,
            operationId: operation.id,
            error: operation.error
          })
        } else {
          // Update operation with new retry count
          await updateBackgroundSyncOperation(db, operation)
        }
      }
    }
    
    console.log(`Background sync completed: ${processed} processed, ${failed} failed`)
    
    // Notify clients about sync completion
    notifyClients({
      type: 'sync_complete',
      processed,
      failed
    })
    
  } catch (error) {
    console.error('Error processing church data background sync:', error)
    notifyClients({
      type: 'sync_error',
      error: error.message
    })
  }
}

// Execute a background sync operation
async function executeBackgroundSyncOperation(operation) {
  const { endpoint, method, data, headers } = operation
  
  const fetchOptions = {
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

// Open background sync database
async function openBackgroundSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('drouple-offline-v1', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      if (!db.objectStoreNames.contains('syncQueue')) {
        const store = db.createObjectStore('syncQueue', { keyPath: 'id' })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('priority', 'priority', { unique: false })
        store.createIndex('tenantId', 'tenantId', { unique: false })
        store.createIndex('userId', 'userId', { unique: false })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }
  })
}

// Remove background sync operation
async function removeBackgroundSyncOperation(db, operationId) {
  const transaction = db.transaction(['syncQueue'], 'readwrite')
  const store = transaction.objectStore('syncQueue')
  return promisifyRequest(store.delete(operationId))
}

// Update background sync operation
async function updateBackgroundSyncOperation(db, operation) {
  const transaction = db.transaction(['syncQueue'], 'readwrite')
  const store = transaction.objectStore('syncQueue')
  return promisifyRequest(store.put(operation))
}

// Notify clients about sync status
function notifyClients(message) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage(message)
    })
  })
}

// Check for updates from the server
async function checkForUpdates() {
  try {
    const response = await fetch('/api/pwa/version', {
      cache: 'no-cache',
      headers: { 'Cache-Control': 'no-cache' }
    })
    
    if (response.ok) {
      const serverVersion = await response.json()
      return serverVersion.version !== APP_VERSION
    }
  } catch (error) {
    console.error('Failed to check for updates:', error)
  }
  return false
}

// Enhanced cache management with encryption support
class SecureCacheManager {
  constructor() {
    this.encryptionKey = null
  }

  async initializeEncryption() {
    try {
      // Generate or retrieve encryption key
      this.encryptionKey = await this.getOrCreateEncryptionKey()
    } catch (error) {
      console.error('Failed to initialize encryption:', error)
    }
  }

  async getOrCreateEncryptionKey() {
    try {
      const db = await openDB()
      const transaction = db.transaction(['appMetadata'], 'readwrite')
      const store = transaction.objectStore('appMetadata')
      
      let keyData = await promisifyRequest(store.get('encryptionKey'))
      
      if (!keyData) {
        // Generate new encryption key
        const key = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        )
        
        const exportedKey = await crypto.subtle.exportKey('raw', key)
        keyData = {
          id: 'encryptionKey',
          key: Array.from(new Uint8Array(exportedKey)),
          createdAt: Date.now()
        }
        
        await promisifyRequest(store.put(keyData))
      }
      
      return await crypto.subtle.importKey(
        'raw',
        new Uint8Array(keyData.key),
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
      )
    } catch (error) {
      console.error('Failed to get or create encryption key:', error)
      return null
    }
  }

  async encryptData(data) {
    if (!this.encryptionKey) {
      await this.initializeEncryption()
    }
    
    if (!this.encryptionKey) {
      return JSON.stringify(data) // Fallback to plain text
    }

    try {
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(JSON.stringify(data))
      
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        dataBuffer
      )
      
      return {
        encrypted: Array.from(new Uint8Array(encryptedData)),
        iv: Array.from(iv)
      }
    } catch (error) {
      console.error('Encryption failed:', error)
      return JSON.stringify(data) // Fallback to plain text
    }
  }

  async decryptData(encryptedData) {
    if (!this.encryptionKey) {
      await this.initializeEncryption()
    }
    
    if (!this.encryptionKey || typeof encryptedData === 'string') {
      return typeof encryptedData === 'string' ? JSON.parse(encryptedData) : encryptedData
    }

    try {
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(encryptedData.iv) },
        this.encryptionKey,
        new Uint8Array(encryptedData.encrypted)
      )
      
      const decoder = new TextDecoder()
      return JSON.parse(decoder.decode(decryptedData))
    } catch (error) {
      console.error('Decryption failed:', error)
      return null
    }
  }

  async storeSecureData(id, data, type, tenantId = null) {
    try {
      const encryptedData = await this.encryptData(data)
      
      const db = await openDB()
      const transaction = db.transaction(['encryptedData'], 'readwrite')
      const store = transaction.objectStore('encryptedData')
      
      await promisifyRequest(store.put({
        id,
        data: encryptedData,
        type,
        tenantId,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.error('Failed to store secure data:', error)
    }
  }

  async getSecureData(id) {
    try {
      const db = await openDB()
      const transaction = db.transaction(['encryptedData'], 'readonly')
      const store = transaction.objectStore('encryptedData')
      
      const record = await promisifyRequest(store.get(id))
      if (!record) return null
      
      return await this.decryptData(record.data)
    } catch (error) {
      console.error('Failed to get secure data:', error)
      return null
    }
  }
}

// Initialize secure cache manager
const secureCacheManager = new SecureCacheManager()

// Performance optimization functions
async function preloadResources(routes, priority) {
  console.log(`Preloading ${routes.length} routes with ${priority} priority`)
  
  for (const route of routes) {
    try {
      await preloadSingleRoute(route)
      performanceMetrics.preloadedRoutes.add(route)
      
      // Add small delay for low priority preloading to avoid overwhelming
      if (priority === 'low') {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error) {
      console.error(`Failed to preload route ${route}:`, error)
    }
  }
}

async function preloadSingleRoute(route) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME)
    const response = await fetch(route, { credentials: 'include' })
    
    if (response.ok) {
      await cache.put(route, response.clone())
      console.log(`Preloaded route: ${route}`)
    }
  } catch (error) {
    console.error(`Failed to preload single route ${route}:`, error)
  }
}

async function optimizeCacheWithStrategy(strategy) {
  console.log('Optimizing cache with strategy:', strategy)
  
  try {
    const cacheNames = await caches.keys()
    
    for (const cacheName of cacheNames) {
      if (cacheName.startsWith('hpci-chms-')) {
        const cache = await caches.open(cacheName)
        
        if (strategy.aggressiveCache) {
          // More aggressive caching for offline users
          await enableAggressiveCaching(cache, strategy.priorityRoutes)
        }
        
        if (strategy.maxCacheSize) {
          await enforceMaxCacheSize(cache, strategy.maxCacheSize)
        }
      }
    }
  } catch (error) {
    console.error('Failed to optimize cache:', error)
  }
}

async function enableAggressiveCaching(cache, priorityRoutes) {
  // Pre-cache priority routes more aggressively
  for (const route of priorityRoutes) {
    try {
      const fullRoute = `/${route}`
      const response = await fetch(fullRoute, { credentials: 'include' })
      if (response.ok) {
        await cache.put(fullRoute, response.clone())
      }
    } catch (error) {
      console.error(`Failed to aggressively cache route ${route}:`, error)
    }
  }
}

async function enforceMaxCacheSize(cache, maxSize) {
  try {
    const keys = await cache.keys()
    const sizeInMB = keys.length * 0.1 // Rough estimate
    
    if (sizeInMB > parseInt(maxSize)) {
      // Remove oldest entries (simple FIFO approach)
      const entriesToRemove = Math.ceil(keys.length * 0.2) // Remove 20%
      
      for (let i = 0; i < entriesToRemove; i++) {
        await cache.delete(keys[i])
      }
      
      console.log(`Removed ${entriesToRemove} entries to enforce cache size limit`)
    }
  } catch (error) {
    console.error('Failed to enforce cache size:', error)
  }
}

async function cleanupCacheStorage(aggressive = false) {
  console.log(`Performing ${aggressive ? 'aggressive' : 'normal'} cache cleanup`)
  
  try {
    const cacheNames = await caches.keys()
    const cleanupPromises = []
    
    for (const cacheName of cacheNames) {
      if (cacheName.startsWith('hpci-chms-')) {
        const cache = await caches.open(cacheName)
        const keys = await cache.keys()
        
        const cutoffTime = Date.now() - (aggressive ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000) // 1 day or 1 week
        
        for (const request of keys) {
          const response = await cache.match(request)
          if (response) {
            const dateHeader = response.headers.get('date')
            if (dateHeader) {
              const responseDate = new Date(dateHeader).getTime()
              if (responseDate < cutoffTime) {
                cleanupPromises.push(cache.delete(request))
              }
            }
          }
        }
      }
    }
    
    await Promise.all(cleanupPromises)
    console.log(`Cache cleanup completed: ${cleanupPromises.length} entries removed`)
  } catch (error) {
    console.error('Failed to cleanup cache:', error)
  }
}

async function refreshCacheRoutes(routes) {
  console.log(`Refreshing cache for routes:`, routes)
  
  try {
    const cache = await caches.open(STATIC_CACHE_NAME)
    
    for (const route of routes) {
      try {
        // Delete existing cache entry
        await cache.delete(route)
        
        // Fetch fresh content
        const response = await fetch(route, { 
          credentials: 'include',
          cache: 'no-cache'
        })
        
        if (response.ok) {
          await cache.put(route, response.clone())
          console.log(`Refreshed cache for route: ${route}`)
        }
      } catch (error) {
        console.error(`Failed to refresh cache for route ${route}:`, error)
      }
    }
  } catch (error) {
    console.error('Failed to refresh cache routes:', error)
  }
}