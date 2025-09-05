'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePWA } from '@/lib/pwa/use-pwa'

interface AppShellProps {
  children: React.ReactNode
  showLoadingIndicator?: boolean
  className?: string
}

export function AppShell({ children, showLoadingIndicator = false, className }: AppShellProps) {
  const { isOnline, syncStatus } = usePWA()
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleStart = () => setIsNavigating(true)
    const handleComplete = () => setIsNavigating(false)

    // Listen for navigation events
    const originalPush = router.push
    router.push = (...args) => {
      handleStart()
      const result = originalPush.apply(router, args)
      // Note: This is a simplified approach. In real implementation,
      // you'd want to listen to actual navigation events
      setTimeout(handleComplete, 1000)
      return result
    }

    return () => {
      router.push = originalPush
    }
  }, [router])

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Global loading indicator */}
      {(showLoadingIndicator || isNavigating) && <GlobalLoadingIndicator />}
      
      {/* Connection status indicator */}
      <ConnectionStatusIndicator isOnline={isOnline} />
      
      {/* Sync status indicator */}
      {syncStatus.syncInProgress && <SyncStatusIndicator />}
      
      {/* Main app content */}
      <main className="relative">
        {children}
      </main>
    </div>
  )
}

function GlobalLoadingIndicator() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse">
        <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 animate-bounce" />
      </div>
    </div>
  )
}

function ConnectionStatusIndicator({ isOnline }: { isOnline: boolean }) {
  const [showIndicator, setShowIndicator] = useState(false)
  const [justWentOnline, setJustWentOnline] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setShowIndicator(true)
      setJustWentOnline(false)
    } else if (showIndicator) {
      // User just came back online
      setJustWentOnline(true)
      setTimeout(() => {
        setShowIndicator(false)
        setJustWentOnline(false)
      }, 3000) // Show "back online" message for 3 seconds
    }
  }, [isOnline, showIndicator])

  if (!showIndicator) return null

  return (
    <div 
      className={cn(
        'fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg transition-all',
        isOnline 
          ? 'bg-green-100 text-green-800 border border-green-200'
          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span className="text-sm font-medium">Back online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">You're offline</span>
        </>
      )}
    </div>
  )
}

function SyncStatusIndicator() {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 border border-blue-200 rounded-lg shadow-lg">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm font-medium">Syncing data...</span>
    </div>
  )
}

// Progressive loading wrapper for page content
interface ProgressiveLoaderProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  delay?: number
  showSkeleton?: boolean
}

export function ProgressiveLoader({ 
  children, 
  fallback, 
  delay = 200,
  showSkeleton = true 
}: ProgressiveLoaderProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  if (!isVisible) {
    return (
      <div className={cn('animate-pulse', showSkeleton && 'opacity-60')}>
        {fallback || children}
      </div>
    )
  }

  return <>{children}</>
}

// Intersection observer hook for progressive loading
export function useProgressiveLoading(threshold = 0.1) {
  const [isInView, setIsInView] = useState(false)
  const [ref, setRef] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    observer.observe(ref)

    return () => {
      observer.disconnect()
    }
  }, [ref, threshold])

  return [setRef, isInView] as const
}

// Lazy loading component for images and other assets
interface LazyLoadProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  rootMargin?: string
  threshold?: number
  className?: string
}

export function LazyLoad({ 
  children, 
  fallback, 
  rootMargin = '50px',
  threshold = 0,
  className 
}: LazyLoadProps) {
  const [elementRef, isInView] = useProgressiveLoading(threshold)

  return (
    <div ref={elementRef} className={className}>
      {isInView ? children : (fallback || <div className="animate-pulse bg-muted h-48 rounded" />)}
    </div>
  )
}

// Critical CSS loading component
export function CriticalCSSLoader() {
  useEffect(() => {
    // Load non-critical CSS after initial paint
    const loadNonCriticalCSS = () => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = '/css/non-critical.css'
      link.onload = () => {
        console.log('Non-critical CSS loaded')
      }
      document.head.appendChild(link)
    }

    if (document.readyState === 'complete') {
      loadNonCriticalCSS()
    } else {
      window.addEventListener('load', loadNonCriticalCSS)
      return () => window.removeEventListener('load', loadNonCriticalCSS)
    }
  }, [])

  return null
}

// Resource hints component
export function ResourceHints() {
  useEffect(() => {
    // Add resource hints for performance
    const addResourceHint = (href: string, rel: 'prefetch' | 'preload' | 'dns-prefetch', as?: string) => {
      const link = document.createElement('link')
      link.rel = rel
      link.href = href
      if (as) link.as = as
      document.head.appendChild(link)
    }

    // Prefetch likely next pages
    addResourceHint('/events', 'prefetch')
    addResourceHint('/lifegroups', 'prefetch')
    addResourceHint('/pathways', 'prefetch')

    // DNS prefetch for external resources
    addResourceHint('https://fonts.googleapis.com', 'dns-prefetch')
    
    // Preload critical fonts
    addResourceHint('/fonts/inter-var.woff2', 'preload', 'font')
  }, [])

  return null
}