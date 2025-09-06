'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'

interface PerformanceMetrics {
  loadTime: number
  cacheHitRate: number
  syncQueueSize: number
  storageUsed: number
  lastSync: number | null
}

interface PreloadConfig {
  enabled: boolean
  routes: string[]
  priority: 'high' | 'normal' | 'low'
}

export function PerformanceOptimizer() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    cacheHitRate: 0,
    syncQueueSize: 0,
    storageUsed: 0,
    lastSync: null
  })
  const { data: session } = useSession()
  const pathname = usePathname()

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      initializePerformanceOptimization()
    }
  }, [session, pathname])

  const initializePerformanceOptimization = async () => {
    try {
      // Get current performance metrics
      await updateMetrics()
      
      // Setup intelligent preloading
      await setupIntelligentPreloading()
      
      // Optimize cache based on user role and usage patterns
      await optimizeCacheStrategy()
      
      // Setup periodic performance monitoring
      setupPerformanceMonitoring()
      
    } catch (error) {
      console.error('Failed to initialize performance optimization:', error)
    }
  }

  const updateMetrics = async () => {
    try {
      const startTime = performance.now()
      
      // Get service worker metrics
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration?.active) {
        const channel = new MessageChannel()
        
        registration.active.postMessage(
          { type: 'GET_METRICS' },
          [channel.port2]
        )
        
        channel.port1.onmessage = (event) => {
          const swMetrics = event.data
          
          setMetrics({
            loadTime: performance.now() - startTime,
            cacheHitRate: swMetrics.cacheHitRate || 0,
            syncQueueSize: swMetrics.syncQueueSize || 0,
            storageUsed: swMetrics.storageUsed || 0,
            lastSync: swMetrics.lastSync || null
          })
        }
      }
      
      // Get storage usage
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const storageEstimate = await navigator.storage.estimate()
        const usedMB = Math.round((storageEstimate.usage || 0) / 1024 / 1024)
        
        setMetrics(prev => ({
          ...prev,
          storageUsed: usedMB
        }))
      }
    } catch (error) {
      console.error('Failed to update metrics:', error)
    }
  }

  const setupIntelligentPreloading = async () => {
    if (!session) return

    const preloadConfig = generatePreloadConfig()
    
    // Preload critical resources based on user role
    await preloadCriticalResources(preloadConfig)
    
    // Setup intersection observer for predictive preloading
    setupPredictivePreloading()
  }

  const generatePreloadConfig = (): PreloadConfig => {
    const role = session?.user?.role || 'MEMBER'
    
    const roleBasedRoutes = {
      SUPER_ADMIN: ['/super', '/admin', '/dashboard', '/reports'],
      CHURCH_ADMIN: ['/admin', '/dashboard', '/members', '/events', '/services'],
      VIP: ['/vip', '/dashboard', '/members', '/pathways'],
      LEADER: ['/dashboard', '/lifegroups', '/events', '/pathways'],
      MEMBER: ['/dashboard', '/checkin', '/events', '/lifegroups', '/pathways']
    }

    return {
      enabled: true,
      routes: roleBasedRoutes[role as keyof typeof roleBasedRoutes] || roleBasedRoutes.MEMBER,
      priority: role === 'SUPER_ADMIN' || role === 'ADMIN' ? 'high' : 'normal'
    }
  }

  const preloadCriticalResources = async (config: PreloadConfig) => {
    if (!config.enabled) return

    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration?.active) return

    // Send preload configuration to service worker
    registration.active.postMessage({
      type: 'PRELOAD_RESOURCES',
      payload: {
        routes: config.routes,
        priority: config.priority
      }
    })
  }

  const setupPredictivePreloading = () => {
    // Preload resources when user hovers over links
    const links = document.querySelectorAll('a[href^="/"]')
    
    links.forEach(link => {
      let timeoutId: NodeJS.Timeout
      
      link.addEventListener('mouseenter', () => {
        timeoutId = setTimeout(() => {
          const href = link.getAttribute('href')
          if (href && isValidPreloadRoute(href)) {
            preloadRoute(href)
          }
        }, 100) // Small delay to avoid preloading on accidental hovers
      })
      
      link.addEventListener('mouseleave', () => {
        clearTimeout(timeoutId)
      })
    })
  }

  const isValidPreloadRoute = (route: string): boolean => {
    const validRoutes = [
      '/dashboard', '/checkin', '/events', '/lifegroups', 
      '/pathways', '/admin', '/members', '/services', '/vip'
    ]
    
    return validRoutes.some(validRoute => route.startsWith(validRoute))
  }

  const preloadRoute = async (route: string) => {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration?.active) {
        registration.active.postMessage({
          type: 'PRELOAD_ROUTE',
          payload: { route }
        })
      }
    } catch (error) {
      console.error('Failed to preload route:', route, error)
    }
  }

  const optimizeCacheStrategy = async () => {
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration?.active) return

    const strategy = determineCacheStrategy()
    
    registration.active.postMessage({
      type: 'OPTIMIZE_CACHE',
      payload: strategy
    })
  }

  const determineCacheStrategy = () => {
    const role = session?.user?.role || 'MEMBER'
    const isAdmin = ['SUPER_ADMIN', 'CHURCH_ADMIN'].includes(role)
    const isOfflineUser = metrics.syncQueueSize > 0 || navigator.onLine === false

    return {
      aggressiveCache: isOfflineUser,
      priorityRoutes: isAdmin ? ['admin', 'members', 'reports'] : ['checkin', 'events'],
      maxCacheSize: isAdmin ? '50MB' : '25MB',
      cacheFirst: isOfflineUser,
      staleWhileRevalidate: !isOfflineUser
    }
  }

  const setupPerformanceMonitoring = () => {
    // Monitor performance metrics every 30 seconds
    const interval = setInterval(updateMetrics, 30000)
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval)
  }

  const cleanupCache = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration?.active) {
        registration.active.postMessage({
          type: 'CLEANUP_CACHE',
          payload: { aggressive: metrics.storageUsed > 100 } // Aggressive cleanup if over 100MB
        })
      }
    } catch (error) {
      console.error('Failed to cleanup cache:', error)
    }
  }

  const forceCacheRefresh = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration?.active) {
        registration.active.postMessage({
          type: 'REFRESH_CACHE',
          payload: { routes: [pathname] }
        })
      }
    } catch (error) {
      console.error('Failed to refresh cache:', error)
    }
  }

  // Expose methods for debugging or manual optimization
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    (window as any).__pwaOptimizer = {
      metrics,
      cleanupCache,
      forceCacheRefresh,
      updateMetrics
    }
  }

  // This component doesn't render anything - it's purely for side effects
  return null
}

export default PerformanceOptimizer