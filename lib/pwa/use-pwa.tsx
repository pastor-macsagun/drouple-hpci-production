'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { getSyncManager } from './sync-manager'
import { getOfflineStorage, onlineStatusChanged } from './offline-storage'
import { BackgroundSyncManager } from './background-sync'
import { PushNotificationManager } from './push-notifications'

export interface PWAState {
  isOnline: boolean
  isInstalled: boolean
  canInstall: boolean
  syncStatus: {
    queuedOperations: number
    lastSync: number | null
    lastSuccessfulSync: number | null
    syncInProgress: boolean
  }
  offlineData: {
    members: any[]
    events: any[]
    lifegroups: any[]
    checkins: any[]
    pathways: any[]
  }
}

export interface PWAActions {
  installApp: () => Promise<void>
  triggerSync: () => Promise<void>
  clearOfflineData: () => Promise<void>
  storeOfflineData: (entity: string, data: any[]) => Promise<void>
  getOfflineData: (entity: string) => Promise<any[]>
  // Background sync actions
  queueCheckin: (serviceId: string) => Promise<string>
  queueEventRSVP: (eventId: string, status: string) => Promise<string>
  queueLifeGroupJoin: (lifeGroupId: string) => Promise<string>
  queuePathwayProgress: (pathwayId: string, stepId: string) => Promise<string>
  // Push notification actions
  subscribeToPushNotifications: () => Promise<boolean>
  unsubscribeFromPushNotifications: () => Promise<void>
  getPushNotificationStatus: () => { isSubscribed: boolean, permission: NotificationPermission }
}

export function usePWA(): PWAState & PWAActions {
  const { data: session } = useSession()
  const [isOnline, setIsOnline] = useState(true)
  const [isInstalled, setIsInstalled] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [syncStatus, setSyncStatus] = useState({
    queuedOperations: 0,
    lastSync: null as number | null,
    lastSuccessfulSync: null as number | null,
    syncInProgress: false
  })
  const [offlineData, setOfflineData] = useState({
    members: [] as any[],
    events: [] as any[],
    lifegroups: [] as any[],
    checkins: [] as any[],
    pathways: [] as any[]
  })

  const [syncManager, setSyncManager] = useState<ReturnType<typeof getSyncManager> | null>(null)
  const [storage, setStorage] = useState<ReturnType<typeof getOfflineStorage> | null>(null)
  const [backgroundSyncManager] = useState(() => typeof window !== 'undefined' ? BackgroundSyncManager.getInstance() : null)
  const [pushNotificationManager] = useState(() => typeof window !== 'undefined' ? PushNotificationManager.getInstance() : null)

  // Initialize client-side only components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        setSyncManager(getSyncManager())
        setStorage(getOfflineStorage())
      } catch (error) {
        console.warn('Failed to initialize PWA components:', error)
      }
    }
  }, [])

  // Check if app is installed (PWA mode)
  const checkInstallStatus = useCallback(() => {
    if (typeof window === 'undefined') return
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInWebAppiOS = (window.navigator as any).standalone === true
    setIsInstalled(isStandalone || isInWebAppiOS)
  }, [])

  // Update sync status
  const updateSyncStatus = useCallback(async () => {
    if (!syncManager) return
    try {
      const status = await syncManager.getSyncStatus()
      setSyncStatus(status)
    } catch (error) {
      console.error('Error updating sync status:', error)
    }
  }, [syncManager])

  // Load offline data for current tenant
  const loadOfflineData = useCallback(async () => {
    if (!session?.user?.tenantId || !storage) return

    try {
      const [members, events, lifegroups, checkins, pathways] = await Promise.all([
        storage.getMembers(session.user.tenantId),
        storage.getEvents(session.user.tenantId),
        storage.getLifeGroups(session.user.tenantId),
        storage.getCheckins(session.user.tenantId),
        storage.getPathways(session.user.tenantId)
      ])

      setOfflineData({
        members,
        events,
        lifegroups,
        checkins,
        pathways
      })
    } catch (error) {
      console.error('Error loading offline data:', error)
    }
  }, [session?.user?.tenantId, storage])

  // Setup effects
  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine)
    
    const cleanup = onlineStatusChanged((online) => {
      setIsOnline(online)
      if (online) {
        updateSyncStatus()
      }
    })

    return cleanup
  }, [updateSyncStatus])

  useEffect(() => {
    // Check install status
    checkInstallStatus()
    
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setInstallPrompt(e)
      setCanInstall(true)
    }

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setCanInstall(false)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [checkInstallStatus])

  useEffect(() => {
    // Update sync status periodically
    updateSyncStatus()
    const interval = setInterval(updateSyncStatus, 30000) // Every 30 seconds
    return () => clearInterval(interval)
  }, [updateSyncStatus])

  useEffect(() => {
    // Load offline data when session changes
    loadOfflineData()
  }, [loadOfflineData])

  useEffect(() => {
    // Listen for sync events
    const handleSyncSuccess = (_event: CustomEvent) => {
      updateSyncStatus()
      loadOfflineData() // Refresh offline data after sync
    }

    const handleSyncFailed = (event: CustomEvent) => {
      updateSyncStatus()
      console.warn('Sync failed:', event.detail)
    }

    const handleSyncError = (event: CustomEvent) => {
      updateSyncStatus()
      console.error('Sync error:', event.detail)
    }

    window.addEventListener('pwa-sync-success', handleSyncSuccess as EventListener)
    window.addEventListener('pwa-sync-failed', handleSyncFailed as EventListener)
    window.addEventListener('pwa-sync-error', handleSyncError as EventListener)

    return () => {
      window.removeEventListener('pwa-sync-success', handleSyncSuccess as EventListener)
      window.removeEventListener('pwa-sync-failed', handleSyncFailed as EventListener)
      window.removeEventListener('pwa-sync-error', handleSyncError as EventListener)
    }
  }, [updateSyncStatus, loadOfflineData])

  // Actions
  const installApp = useCallback(async () => {
    if (!installPrompt) return

    try {
      await installPrompt.prompt()
      const result = await installPrompt.userChoice
      
      if (result.outcome === 'accepted') {
        console.log('PWA installation accepted')
      } else {
        console.log('PWA installation dismissed')
      }
    } catch (error) {
      console.error('Error installing PWA:', error)
    } finally {
      setInstallPrompt(null)
      setCanInstall(false)
    }
  }, [installPrompt])

  const triggerSync = useCallback(async () => {
    if (!syncManager) return
    try {
      await syncManager.forceSync()
      await updateSyncStatus()
    } catch (error) {
      console.error('Error triggering sync:', error)
    }
  }, [syncManager, updateSyncStatus])

  const clearOfflineData = useCallback(async () => {
    if (!storage) return
    try {
      if (session?.user?.tenantId) {
        await storage.clearTenant(session.user.tenantId)
      } else {
        await storage.clearAll()
      }
      await loadOfflineData()
    } catch (error) {
      console.error('Error clearing offline data:', error)
    }
  }, [session?.user?.tenantId, storage, loadOfflineData])

  const storeOfflineData = useCallback(async (entity: string, data: any[]) => {
    if (!session?.user?.tenantId || !storage) return

    try {
      switch (entity) {
        case 'members':
          await storage.storeMembers(data, session.user.tenantId)
          break
        case 'events':
          await storage.storeEvents(data, session.user.tenantId)
          break
        case 'lifegroups':
          await storage.storeLifeGroups(data, session.user.tenantId)
          break
        case 'checkins':
          await storage.storeCheckins(data, session.user.tenantId)
          break
        case 'pathways':
          await storage.storePathways(data, session.user.tenantId)
          break
        default:
          throw new Error(`Unknown entity: ${entity}`)
      }
      await loadOfflineData()
    } catch (error) {
      console.error('Error storing offline data:', error)
      throw error
    }
  }, [session?.user?.tenantId, storage, loadOfflineData])

  const getOfflineData = useCallback(async (entity: string): Promise<any[]> => {
    if (!session?.user?.tenantId || !storage) return []

    try {
      switch (entity) {
        case 'members':
          return await storage.getMembers(session.user.tenantId)
        case 'events':
          return await storage.getEvents(session.user.tenantId)
        case 'lifegroups':
          return await storage.getLifeGroups(session.user.tenantId)
        case 'checkins':
          return await storage.getCheckins(session.user.tenantId)
        case 'pathways':
          return await storage.getPathways(session.user.tenantId)
        default:
          throw new Error(`Unknown entity: ${entity}`)
      }
    } catch (error) {
      console.error('Error getting offline data:', error)
      return []
    }
  }, [session?.user?.tenantId, storage])

  // Background sync actions
  const queueCheckin = useCallback(async (serviceId: string): Promise<string> => {
    if (!session?.user?.id || !session?.user?.tenantId) {
      throw new Error('User not authenticated')
    }
    
    return await backgroundSyncManager.queueCheckin(
      serviceId,
      session.user.id,
      session.user.tenantId
    )
  }, [session?.user?.id, session?.user?.tenantId, backgroundSyncManager])

  const queueEventRSVP = useCallback(async (eventId: string, status: string): Promise<string> => {
    if (!session?.user?.id || !session?.user?.tenantId) {
      throw new Error('User not authenticated')
    }
    
    return await backgroundSyncManager.queueEventRSVP(
      eventId,
      session.user.id,
      status,
      session.user.tenantId
    )
  }, [session?.user?.id, session?.user?.tenantId, backgroundSyncManager])

  const queueLifeGroupJoin = useCallback(async (lifeGroupId: string): Promise<string> => {
    if (!session?.user?.id || !session?.user?.tenantId) {
      throw new Error('User not authenticated')
    }
    
    return await backgroundSyncManager.queueLifeGroupJoin(
      lifeGroupId,
      session.user.id,
      session.user.tenantId
    )
  }, [session?.user?.id, session?.user?.tenantId, backgroundSyncManager])

  const queuePathwayProgress = useCallback(async (pathwayId: string, stepId: string): Promise<string> => {
    if (!session?.user?.id || !session?.user?.tenantId) {
      throw new Error('User not authenticated')
    }
    
    return await backgroundSyncManager.queuePathwayProgress(
      pathwayId,
      stepId,
      session.user.id,
      session.user.tenantId
    )
  }, [session?.user?.id, session?.user?.tenantId, backgroundSyncManager])

  // Push notification actions
  const subscribeToPushNotifications = useCallback(async (): Promise<boolean> => {
    try {
      await pushNotificationManager.initialize()
      const subscription = await pushNotificationManager.subscribe()
      return subscription !== null
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return false
    }
  }, [pushNotificationManager])

  const unsubscribeFromPushNotifications = useCallback(async (): Promise<void> => {
    try {
      await pushNotificationManager.unsubscribe()
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      throw error
    }
  }, [pushNotificationManager])

  const getPushNotificationStatus = useCallback(() => {
    return {
      isSubscribed: pushNotificationManager.isSubscribed(),
      permission: pushNotificationManager.getPermissionStatus()
    }
  }, [pushNotificationManager])

  return {
    // State
    isOnline,
    isInstalled,
    canInstall,
    syncStatus,
    offlineData,
    
    // Actions
    installApp,
    triggerSync,
    clearOfflineData,
    storeOfflineData,
    getOfflineData,
    
    // Background sync actions
    queueCheckin,
    queueEventRSVP,
    queueLifeGroupJoin,
    queuePathwayProgress,
    
    // Push notification actions
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    getPushNotificationStatus
  }
}

// Utility hook for specific PWA features
export function useOfflineFirst(entity: string, fetchFn: () => Promise<any[]>) {
  const { isOnline, offlineData, storeOfflineData, getOfflineData } = usePWA()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const entityKey = entity as keyof typeof offlineData

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        if (isOnline) {
          // Try to fetch fresh data
          try {
            const freshData = await fetchFn()
            setData(freshData)
            
            // Store in offline cache
            await storeOfflineData(entity, freshData)
          } catch (fetchError) {
            console.warn('Failed to fetch fresh data, using offline cache:', fetchError)
            
            // Fall back to offline data
            const cachedData = await getOfflineData(entity)
            setData(cachedData)
            
            if (cachedData.length === 0) {
              setError('No data available offline')
            }
          }
        } else {
          // Use offline data
          const cachedData = offlineData[entityKey] || await getOfflineData(entity)
          setData(cachedData)
          
          if (cachedData.length === 0) {
            setError('No data available offline')
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setData([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [entity, entityKey, isOnline, fetchFn, offlineData, storeOfflineData, getOfflineData])

  return { data, loading, error, isOnline }
}