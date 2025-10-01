// Cache Management Module
class CacheManager {
  constructor() {
    this.CACHE_VERSION = '4'
    this.APP_VERSION = '2025.09.06'
    this.STATIC_CACHE_NAME = `hpci-chms-static-v${this.CACHE_VERSION}`
    this.API_CACHE_NAME = `hpci-chms-api-v${this.CACHE_VERSION}`

    this.STATIC_ASSETS = [
      '/',
      '/manifest.json',
      '/icon.svg',
      '/checkin',
      '/events',
      '/lifegroups',
      '/pathways',
      '/dashboard'
    ]

    this.API_CACHE_PATTERNS = [
      '/api/auth/session',
      '/api/events',
      '/api/lifegroups',
      '/api/pathways',
      '/api/members',
      '/api/checkin'
    ]
  }

  async cacheStaticAssets() {
    const cache = await caches.open(this.STATIC_CACHE_NAME)
    return cache.addAll(this.STATIC_ASSETS)
  }

  async cleanupOldCaches() {
    const cacheNames = await caches.keys()
    return Promise.all(
      cacheNames.map((cacheName) => {
        if (!cacheName.startsWith('hpci-chms-') ||
            (!cacheName.includes(`v${this.CACHE_VERSION}`))) {
          console.log('Deleting old cache:', cacheName)
          return caches.delete(cacheName)
        }
      })
    )
  }

  isApiRequest(request) {
    return this.API_CACHE_PATTERNS.some(pattern =>
      request.url.includes(pattern)
    )
  }

  shouldCacheRequest(request, response) {
    return response &&
           response.status === 200 &&
           response.type === 'basic' &&
           request.method === 'GET'
  }

  async handleNavigation(request) {
    try {
      const response = await fetch(request)
      if (this.shouldCacheRequest(request, response)) {
        const cache = await caches.open(this.STATIC_CACHE_NAME)
        cache.put(request, response.clone())
      }
      return response
    } catch (error) {
      const cached = await caches.match(request)
      return cached || caches.match('/')
    }
  }

  async handleApiRequest(request) {
    const cache = await caches.open(this.API_CACHE_NAME)
    const cachedResponse = await cache.match(request)

    const fetchPromise = fetch(request).then(networkResponse => {
      if (this.shouldCacheRequest(request, networkResponse)) {
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    }).catch(error => {
      if (cachedResponse) {
        return cachedResponse
      }
      throw error
    })

    return cachedResponse || fetchPromise
  }

  async handleStaticAsset(request) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    const response = await fetch(request)
    if (this.shouldCacheRequest(request, response)) {
      const cache = await caches.open(this.STATIC_CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  }
}

// Export for use in main service worker
self.CacheManager = CacheManager