// Push Notification Management Module
class NotificationManager {
  constructor() {
    this.notificationActions = {
      service_reminder: [
        { action: 'view_details', title: 'Check In', icon: '/icon-192x192.png' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      event_announcement: [
        { action: 'view_details', title: 'View Event', icon: '/icon-192x192.png' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      lifegroup_update: [
        { action: 'view_details', title: 'View Group', icon: '/icon-192x192.png' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      pathway_milestone: [
        { action: 'view_details', title: 'Continue', icon: '/icon-192x192.png' },
        { action: 'dismiss', title: 'Later' }
      ],
      admin_alert: [
        { action: 'view_details', title: 'View Details', icon: '/icon-192x192.png' }
      ],
      urgent_announcement: [
        { action: 'view_details', title: 'View Details', icon: '/icon-192x192.png' }
      ]
    }

    this.vibrationPatterns = {
      urgent_announcement: [200, 100, 200, 100, 200],
      admin_alert: [300, 200, 300],
      service_reminder: [100, 50, 100],
      default: [100]
    }
  }

  async handlePushEvent(event) {
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
        badge: payload.badge || '/icon-72x72.png',
        image: payload.image,
        data: {
          url: payload.url || '/',
          timestamp: payload.timestamp || Date.now(),
          type: payload.type || 'general',
          churchId: payload.churchId,
          userId: payload.userId,
          ...payload.data
        },
        actions: this.getNotificationActions(payload.type),
        requireInteraction: this.isHighPriority(payload.type),
        renotify: payload.renotify || true,
        tag: payload.tag || `${payload.type}_${payload.churchId || 'general'}`,
        vibrate: payload.vibrate || this.getVibrationPattern(payload.type),
        silent: payload.silent || false,
        dir: 'auto',
        lang: 'en'
      }

      await self.registration.showNotification(payload.title, notificationOptions)
      this.trackNotificationInteraction(payload.type, 'displayed')

    } catch (error) {
      console.error('Error handling push notification:', error)

      // Show generic notification if parsing fails
      await self.registration.showNotification('New Church Update', {
        body: 'You have a new update from Drouple Church Management.',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        data: { url: '/', type: 'generic' },
        actions: [
          { action: 'view', title: 'View', icon: '/icon-72x72.png' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      })
    }
  }

  async handleNotificationClick(event) {
    console.log('Notification clicked:', event)

    const notification = event.notification
    const action = event.action
    const data = notification.data || {}

    notification.close()

    if (action === 'dismiss') {
      return
    }

    let url = data.url || '/'
    if (action === 'view_details') {
      url = data.url || '/'
    }

    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })

    // Check if there's already a window/tab open for this origin
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i]
      if (client.url.indexOf(url) >= 0 && 'focus' in client) {
        return client.focus()
      }
    }

    // If no existing window, open a new one
    if (self.clients.openWindow) {
      return self.clients.openWindow(url)
    }

    this.trackNotificationInteraction(data.type, action || 'click')
  }

  handleNotificationClose(event) {
    const data = event.notification.data || {}
    this.trackNotificationInteraction(data.type, 'dismiss')
  }

  getNotificationActions(type) {
    return this.notificationActions[type] || [
      { action: 'view_details', title: 'View', icon: '/icon-192x192.png' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  }

  isHighPriority(type) {
    return type === 'urgent_announcement' || type === 'admin_alert'
  }

  getVibrationPattern(type) {
    return this.vibrationPatterns[type] || this.vibrationPatterns.default
  }

  async trackNotificationInteraction(type, action) {
    try {
      const db = await this.openDB()
      const transaction = db.transaction(['analytics'], 'readwrite')
      const store = transaction.objectStore('analytics')

      const interaction = {
        id: Date.now().toString(),
        type: 'notification_interaction',
        notificationType: type,
        action: action,
        timestamp: Date.now()
      }

      await this.promisifyRequest(store.put(interaction))
    } catch (error) {
      console.error('Failed to track notification interaction:', error)
    }
  }

  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('drouple-offline-v1', 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        if (!db.objectStoreNames.contains('analytics')) {
          const store = db.createObjectStore('analytics', { keyPath: 'id' })
          store.createIndex('type', 'type', { unique: false })
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
self.NotificationManager = NotificationManager