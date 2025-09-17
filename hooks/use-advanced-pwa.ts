'use client'

import { useCallback, useState, useEffect } from 'react'
import { useHaptic } from './use-haptic'

// Contact Picker API
interface ContactsSelectOptions {
  multiple?: boolean
}

interface ContactProperty {
  name?: string[]
  email?: string[]
  tel?: string[]
}

// Type declarations for experimental Web APIs
interface ContactsManager {
  select(properties: string[], options?: ContactsSelectOptions): Promise<ContactProperty[]>
  getProperties(): Promise<string[]>
}

interface AppBadgeAPI {
  setAppBadge?: (count?: number) => Promise<void>
  clearAppBadge?: () => Promise<void>
}

interface WakeLockAPI {
  request(type: 'screen'): Promise<WakeLockSentinel>
}

interface CustomWakeLockSentinel {
  type: string
  released: boolean
  release(): Promise<void>
  addEventListener(type: 'release', listener: () => void): void
  removeEventListener(type: 'release', listener: () => void): void
}

declare global {
  interface Navigator {
    contacts?: ContactsManager
    setAppBadge?: (count?: number) => Promise<void>
    clearAppBadge?: () => Promise<void>
  }
}

// Background Fetch API
interface BackgroundFetchManager {
  fetch(
    id: string,
    requests: RequestInfo | RequestInfo[],
    options?: BackgroundFetchOptions
  ): Promise<BackgroundFetchRegistration>
  get(id: string): Promise<BackgroundFetchRegistration | undefined>
  getIds(): Promise<string[]>
}

interface CustomServiceWorkerRegistration extends ServiceWorkerRegistration {
  backgroundFetch?: BackgroundFetchManager
}

interface BackgroundFetchOptions {
  icons?: ImageResource[]
  title?: string
  downloadTotal?: number
}

interface ImageResource {
  src: string
  sizes?: string
  type?: string
  purpose?: string
}

interface BackgroundFetchRegistration {
  id: string
  uploadTotal: number
  uploaded: number
  downloadTotal: number
  downloaded: number
  result: '' | 'success' | 'failure'
  failureReason: '' | 'aborted' | 'bad-status' | 'fetch-error' | 'quota-exceeded' | 'total-download-exceeded'
  recordsAvailable: boolean
  abort(): Promise<boolean>
  match(request: RequestInfo, options?: CacheQueryOptions): Promise<BackgroundFetchRecord | undefined>
  matchAll(request?: RequestInfo, options?: CacheQueryOptions): Promise<BackgroundFetchRecord[]>
}

interface BackgroundFetchRecord {
  request: Request
  responseReady: Promise<Response>
}

export function useAdvancedPWA() {
  const { triggerHaptic } = useHaptic()
  
  // Contact Picker API
  const [contactsSupported] = useState(() => 
    typeof navigator !== 'undefined' && 'contacts' in navigator
  )

  const selectContacts = useCallback(async (options?: {
    multiple?: boolean
    properties?: ('name' | 'email' | 'tel')[]
  }): Promise<ContactProperty[]> => {
    if (!contactsSupported || !navigator.contacts) {
      throw new Error('Contacts API not supported')
    }

    try {
      triggerHaptic('light')
      const properties = options?.properties || ['name', 'email', 'tel']
      const contacts = await navigator.contacts.select(properties, {
        multiple: options?.multiple || false
      })
      triggerHaptic('success')
      return contacts
    } catch (error) {
      triggerHaptic('error')
      throw error
    }
  }, [contactsSupported, triggerHaptic])

  // App Badge API
  const [badgeSupported] = useState(() =>
    typeof navigator !== 'undefined' && 'setAppBadge' in navigator
  )

  const setBadge = useCallback(async (count?: number): Promise<void> => {
    if (!badgeSupported || !navigator.setAppBadge) {
      return
    }

    try {
      await navigator.setAppBadge(count)
    } catch (error) {
      console.warn('Failed to set app badge:', error)
    }
  }, [badgeSupported])

  const clearBadge = useCallback(async (): Promise<void> => {
    if (!badgeSupported || !navigator.clearAppBadge) {
      return
    }

    try {
      await navigator.clearAppBadge()
    } catch (error) {
      console.warn('Failed to clear app badge:', error)
    }
  }, [badgeSupported])

  // Screen Wake Lock API
  const [wakeLockSupported] = useState(() =>
    typeof navigator !== 'undefined' && 'wakeLock' in navigator
  )
  
  const [wakeLock, setWakeLock] = useState<CustomWakeLockSentinel | null>(null)

  const requestWakeLock = useCallback(async (): Promise<boolean> => {
    if (!wakeLockSupported || !(navigator as any).wakeLock) {
      return false
    }

    try {
      const sentinel = await (navigator as any).wakeLock.request('screen')
      setWakeLock(sentinel as CustomWakeLockSentinel)
      
      // Handle wake lock release
      sentinel.addEventListener('release', () => {
        setWakeLock(null)
      })
      
      return true
    } catch (error) {
      console.warn('Failed to request wake lock:', error)
      return false
    }
  }, [wakeLockSupported])

  const releaseWakeLock = useCallback(async (): Promise<void> => {
    if (wakeLock && !wakeLock.released) {
      try {
        await wakeLock.release()
        setWakeLock(null)
      } catch (error) {
        console.warn('Failed to release wake lock:', error)
      }
    }
  }, [wakeLock])

  // Background Fetch API
  const [backgroundFetchSupported] = useState(() => {
    if (typeof navigator === 'undefined') return false
    return 'serviceWorker' in navigator && 'backgroundFetch' in ServiceWorkerRegistration.prototype
  })

  const startBackgroundFetch = useCallback(async (
    id: string,
    requests: string | string[],
    options?: {
      title?: string
      icons?: Array<{ src: string; sizes?: string; type?: string }>
      downloadTotal?: number
    }
  ): Promise<boolean> => {
    if (!backgroundFetchSupported) {
      return false
    }

    try {
      const registration = await navigator.serviceWorker.ready as CustomServiceWorkerRegistration
      if (!registration.backgroundFetch) {
        return false
      }

      await registration.backgroundFetch.fetch(id, requests, {
        title: options?.title || 'Downloading...',
        icons: options?.icons || [],
        downloadTotal: options?.downloadTotal || 0
      })
      
      return true
    } catch (error) {
      console.warn('Failed to start background fetch:', error)
      return false
    }
  }, [backgroundFetchSupported])

  const getBackgroundFetch = useCallback(async (id: string) => {
    if (!backgroundFetchSupported) {
      return null
    }

    try {
      const registration = await navigator.serviceWorker.ready as CustomServiceWorkerRegistration
      if (!registration.backgroundFetch) {
        return null
      }

      return await registration.backgroundFetch.get(id)
    } catch (error) {
      console.warn('Failed to get background fetch:', error)
      return null
    }
  }, [backgroundFetchSupported])

  // Web Share Target API support detection
  const [shareTargetSupported] = useState(() => {
    if (typeof navigator === 'undefined') return false
    // This is detected through the manifest.json configuration
    return 'serviceWorker' in navigator
  })

  // Utility functions for common PWA patterns
  const notifyWithBadge = useCallback(async (count: number, title: string, body: string) => {
    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body })
    }
    
    // Update badge
    await setBadge(count)
    
    // Haptic feedback
    triggerHaptic('medium')
  }, [setBadge, triggerHaptic])

  const downloadWithProgress = useCallback(async (
    url: string,
    filename: string,
    onProgress?: (progress: number) => void
  ): Promise<boolean> => {
    try {
      // Try background fetch first for large downloads
      if (backgroundFetchSupported) {
        const success = await startBackgroundFetch(
          `download-${Date.now()}`,
          url,
          { title: `Downloading ${filename}` }
        )
        if (success) return true
      }

      // Fallback to fetch with progress tracking
      const response = await fetch(url)
      if (!response.ok) throw new Error('Download failed')

      const contentLength = response.headers.get('content-length')
      const total = contentLength ? parseInt(contentLength, 10) : 0

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const chunks: Uint8Array[] = []
      let receivedLength = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        chunks.push(value)
        receivedLength += value.length

        if (total && onProgress) {
          onProgress(receivedLength / total)
        }
      }

      const blob = new Blob(chunks as BlobPart[])
      const downloadUrl = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      URL.revokeObjectURL(downloadUrl)
      triggerHaptic('success')
      return true

    } catch (error) {
      triggerHaptic('error')
      console.error('Download failed:', error)
      return false
    }
  }, [backgroundFetchSupported, startBackgroundFetch, triggerHaptic])

  // Cleanup wake lock on unmount
  useEffect(() => {
    return () => {
      if (wakeLock && !wakeLock.released) {
        wakeLock.release().catch(console.warn)
      }
    }
  }, [wakeLock])

  return {
    // Contact Picker API
    contactsSupported,
    selectContacts,
    
    // App Badge API
    badgeSupported,
    setBadge,
    clearBadge,
    
    // Screen Wake Lock API
    wakeLockSupported,
    wakeLock: wakeLock?.released === false ? wakeLock : null,
    requestWakeLock,
    releaseWakeLock,
    
    // Background Fetch API
    backgroundFetchSupported,
    startBackgroundFetch,
    getBackgroundFetch,
    
    // Share Target API
    shareTargetSupported,
    
    // Utility functions
    notifyWithBadge,
    downloadWithProgress
  }
}