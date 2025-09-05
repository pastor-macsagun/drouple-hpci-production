'use client'

import { z } from 'zod'

// VAPID keys for push notifications (these would be env vars in production)
export const VAPID_PUBLIC_KEY = 'BFIBn4JHMoR-2Y8_9fVQ_Hm9lIJZZBM_u8LZRhcKiQO6BvSTIcHJY0rALAe9xkVkLKHJBFYnBPmJp6aNb4OXcCE'

// Push notification subscription schema
export const PushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string()
  })
})

// Notification types for church management
export enum NotificationType {
  SERVICE_REMINDER = 'service_reminder',
  EVENT_ANNOUNCEMENT = 'event_announcement', 
  LIFEGROUP_UPDATE = 'lifegroup_update',
  PATHWAY_MILESTONE = 'pathway_milestone',
  ADMIN_ALERT = 'admin_alert',
  URGENT_ANNOUNCEMENT = 'urgent_announcement'
}

// Notification payload schema
export const NotificationPayloadSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(NotificationType),
  title: z.string(),
  body: z.string(),
  icon: z.string().optional(),
  badge: z.string().optional(),
  image: z.string().optional(),
  url: z.string().optional(),
  churchId: z.string(),
  data: z.record(z.any()).optional(),
  timestamp: z.number()
})

export type NotificationPayload = z.infer<typeof NotificationPayloadSchema>
export type PushSubscriptionData = z.infer<typeof PushSubscriptionSchema>

export class PushNotificationManager {
  private static instance: PushNotificationManager
  private registration: ServiceWorkerRegistration | null = null
  private subscription: PushSubscription | null = null

  static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager()
    }
    return PushNotificationManager.instance
  }

  async initialize(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications are not supported')
    }

    try {
      // Get service worker registration
      this.registration = await navigator.serviceWorker.ready
      console.log('Service worker ready for push notifications')

      // Check existing subscription
      this.subscription = await this.registration.pushManager.getSubscription()
      
      if (this.subscription) {
        console.log('Existing push subscription found')
        // Verify subscription with server
        await this.syncSubscriptionWithServer()
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error)
      throw error
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications are not supported')
    }

    let permission = Notification.permission

    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }

    return permission
  }

  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      throw new Error('Service worker not registered')
    }

    try {
      // Request notification permission
      const permission = await this.requestPermission()
      if (permission !== 'granted') {
        console.warn('Notification permission denied')
        return null
      }

      // Create push subscription
      const applicationServerKey = this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      })

      console.log('Push subscription created:', this.subscription)

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription)

      return this.subscription
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      throw error
    }
  }

  async unsubscribe(): Promise<void> {
    if (!this.subscription) {
      console.log('No active subscription to unsubscribe')
      return
    }

    try {
      // Unsubscribe from push service
      const success = await this.subscription.unsubscribe()
      
      if (success) {
        // Remove subscription from server
        await this.removeSubscriptionFromServer(this.subscription)
        this.subscription = null
        console.log('Successfully unsubscribed from push notifications')
      } else {
        console.error('Failed to unsubscribe from push service')
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
      throw error
    }
  }

  async getSubscription(): Promise<PushSubscription | null> {
    if (this.subscription) {
      return this.subscription
    }

    if (this.registration) {
      this.subscription = await this.registration.pushManager.getSubscription()
      return this.subscription
    }

    return null
  }

  isSubscribed(): boolean {
    return this.subscription !== null
  }

  getPermissionStatus(): NotificationPermission {
    return Notification.permission
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const subscriptionData = PushSubscriptionSchema.parse({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      })

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscriptionData)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      console.log('Subscription sent to server successfully')
    } catch (error) {
      console.error('Error sending subscription to server:', error)
      throw error
    }
  }

  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      console.log('Subscription removed from server successfully')
    } catch (error) {
      console.error('Error removing subscription from server:', error)
      throw error
    }
  }

  private async syncSubscriptionWithServer(): Promise<void> {
    if (!this.subscription) return

    try {
      const response = await fetch('/api/push/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ endpoint: this.subscription.endpoint })
      })

      if (!response.ok && response.status === 404) {
        // Subscription not found on server, re-register it
        await this.sendSubscriptionToServer(this.subscription)
      }
    } catch (error) {
      console.error('Error syncing subscription with server:', error)
    }
  }

  private urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray.buffer
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }
}

// Utility functions for notification templates
export function createServiceReminderNotification(serviceName: string, serviceTime: string, churchName: string): Partial<NotificationPayload> {
  return {
    type: NotificationType.SERVICE_REMINDER,
    title: `${serviceName} Service Reminder`,
    body: `${serviceName} service starts in 30 minutes at ${churchName}`,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    url: '/checkin'
  }
}

export function createEventAnnouncementNotification(eventName: string, eventDate: string, churchName: string): Partial<NotificationPayload> {
  return {
    type: NotificationType.EVENT_ANNOUNCEMENT,
    title: `New Event: ${eventName}`,
    body: `Join us for ${eventName} on ${eventDate} at ${churchName}`,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    url: '/events'
  }
}

export function createLifeGroupUpdateNotification(groupName: string, message: string): Partial<NotificationPayload> {
  return {
    type: NotificationType.LIFEGROUP_UPDATE,
    title: `${groupName} Update`,
    body: message,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    url: '/lifegroups'
  }
}

export function createPathwayMilestoneNotification(pathwayName: string, milestone: string): Partial<NotificationPayload> {
  return {
    type: NotificationType.PATHWAY_MILESTONE,
    title: `Pathway Milestone Achieved!`,
    body: `Congratulations! You've completed ${milestone} in ${pathwayName}`,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    url: '/pathways'
  }
}

export function createAdminAlertNotification(title: string, message: string): Partial<NotificationPayload> {
  return {
    type: NotificationType.ADMIN_ALERT,
    title,
    body: message,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    url: '/admin'
  }
}

export function createUrgentAnnouncementNotification(title: string, message: string): Partial<NotificationPayload> {
  return {
    type: NotificationType.URGENT_ANNOUNCEMENT,
    title: `🚨 ${title}`,
    body: message,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    url: '/'
  }
}