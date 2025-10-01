'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePWA } from '@/lib/pwa/use-pwa'
import { isPWAStandalone, getSafeAreaInsets, triggerHapticFeedback } from '@/lib/mobile-utils'

interface AppShellProps {
  children: React.ReactNode
  showLoadingIndicator?: boolean
  className?: string
}

export function AppShell({ children, showLoadingIndicator = false, className }: AppShellProps) {
  const { isOnline, syncStatus } = usePWA()
  const { data: session } = useSession()
  // session is used for authentication context in PWA shell
  const [isNavigating, setIsNavigating] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [safeAreaInsets, setSafeAreaInsets] = useState({ top: 0, right: 0, bottom: 0, left: 0 })
  const router = useRouter()

  // Initialize PWA shell features
  useEffect(() => {
    setIsStandalone(isPWAStandalone())
    setSafeAreaInsets(getSafeAreaInsets())
    
    // Add PWA-specific CSS variables
    const root = document.documentElement
    const insets = getSafeAreaInsets()
    root.style.setProperty('--safe-area-inset-top', `${insets.top}px`)
    root.style.setProperty('--safe-area-inset-right', `${insets.right}px`)
    root.style.setProperty('--safe-area-inset-bottom', `${insets.bottom}px`)
    root.style.setProperty('--safe-area-inset-left', `${insets.left}px`)
  }, [])

  useEffect(() => {
    const handleStart = () => {
      setIsNavigating(true)
      triggerHapticFeedback('tap')
    }
    const handleComplete = () => {
      setIsNavigating(false)
      triggerHapticFeedback('selection')
    }

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

  // PWA Shell styles
  const shellStyles: React.CSSProperties = {
    paddingTop: isStandalone ? safeAreaInsets.top : undefined,
    paddingBottom: isStandalone ? safeAreaInsets.bottom : undefined,
    paddingLeft: isStandalone ? safeAreaInsets.left : undefined,
    paddingRight: isStandalone ? safeAreaInsets.right : undefined,
  }

  return (
    <div 
      className={cn(
        'min-h-screen bg-canvas transition-colors duration-300',
        isStandalone && 'pwa-standalone',
        className
      )}
      style={shellStyles}
      data-pwa={isStandalone}
    >
      {/* Global loading indicator */}
      {(showLoadingIndicator || isNavigating) && (
        <div role="status" aria-label="Page loading">
          <GlobalLoadingIndicator isStandalone={isStandalone} />
        </div>
      )}

      {/* Connection status indicator */}
      <div role="status" aria-live="polite" aria-atomic="true">
        <ConnectionStatusIndicator isOnline={isOnline} isStandalone={isStandalone} />
      </div>

      {/* Sync status indicator */}
      {syncStatus.syncInProgress && (
        <div role="status" aria-live="polite" aria-label="Syncing data">
          <SyncStatusIndicator isStandalone={isStandalone} />
        </div>
      )}
      
      {/* Main app content */}
      <main className="relative app-content" id="app-content">
        {children}
      </main>

      {/* PWA-specific global styles */}
      <style jsx global>{`
        /* PWA Standalone Mode Styles */
        .pwa-standalone {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }

        .pwa-standalone .app-content {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }

        /* Safe Area Support */
        @supports (padding: max(0px)) {
          .pwa-standalone {
            padding-top: max(env(safe-area-inset-top), var(--safe-area-inset-top, 0px));
            padding-right: max(env(safe-area-inset-right), var(--safe-area-inset-right, 0px));
            padding-bottom: max(env(safe-area-inset-bottom), var(--safe-area-inset-bottom, 0px));
            padding-left: max(env(safe-area-inset-left), var(--safe-area-inset-left, 0px));
          }
        }

        /* iOS Specific Adjustments */
        @supports (-webkit-touch-callout: none) {
          .pwa-standalone {
            height: 100vh;
            height: -webkit-fill-available;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .pwa-standalone {
            filter: contrast(1.2);
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .pwa-standalone * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  )
}

function GlobalLoadingIndicator({ isStandalone }: { isStandalone: boolean }) {
  useEffect(() => {
    triggerHapticFeedback('tap')
  }, [])

  return (
    <div className={cn("fixed left-0 right-0 z-50", isStandalone ? "top-[var(--safe-area-inset-top,0px)]" : "top-0")}>
      <div className="h-1 bg-gradient-to-r from-accent to-secondary animate-pulse">
        <div className="h-full bg-gradient-to-r from-accent/80 to-secondary/80 animate-spring-in" 
             style={{ animation: 'spring-in 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }} />
      </div>
    </div>
  )
}

function ConnectionStatusIndicator({ isOnline, isStandalone }: { isOnline: boolean; isStandalone: boolean }) {
  const [showIndicator, setShowIndicator] = useState(false)
  const [justWentOnline, setJustWentOnline] = useState(false)
  // justWentOnline is used for connection status feedback

  useEffect(() => {
    if (!isOnline) {
      setShowIndicator(true)
      setJustWentOnline(false)
      triggerHapticFeedback('warning')
    } else if (showIndicator) {
      // User just came back online
      setJustWentOnline(true)
      triggerHapticFeedback('success')
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
        'fixed right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg transition-all backdrop-blur-sm',
        isStandalone ? 'top-[calc(var(--safe-area-inset-top,0px)+1rem)]' : 'top-4',
        isOnline 
          ? 'bg-success/20 text-success border border-success/30'
          : 'bg-warning/20 text-warning border border-warning/30'
      )}
      style={{ animation: 'spring-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span className="text-sm font-medium">Back online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">You&apos;re offline</span>
        </>
      )}
    </div>
  )
}

function SyncStatusIndicator({ isStandalone }: { isStandalone: boolean }) {
  useEffect(() => {
    triggerHapticFeedback('refresh')
  }, [])

  return (
    <div className={cn(
      "fixed right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg transition-all backdrop-blur-sm",
      "bg-accent/20 text-accent border border-accent/30",
      isStandalone ? 'bottom-[calc(var(--safe-area-inset-bottom,0px)+1rem)]' : 'bottom-4'
    )}>
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
  rootMargin = '50px', // eslint-disable-line @typescript-eslint/no-unused-vars
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