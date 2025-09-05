'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { WifiOff, Wifi } from 'lucide-react'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineBanner, setShowOfflineBanner] = useState(false)

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineBanner(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineBanner(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showOfflineBanner) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <Card className="mx-auto max-w-md border-orange-200 bg-orange-50/95 backdrop-blur">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <WifiOff className="h-4 w-4 text-orange-600" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-orange-900">
                You&apos;re offline
              </p>
              <p className="text-xs text-orange-700">
                Some features may not work. Check your connection.
              </p>
            </div>
            {isOnline && (
              <div className="flex items-center gap-1 text-green-600">
                <Wifi className="h-4 w-4" />
                <span className="text-xs font-medium">Back online!</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}