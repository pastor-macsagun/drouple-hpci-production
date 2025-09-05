'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Database,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react'
import { usePWA } from '@/lib/pwa/use-pwa'
import { formatDistanceToNow } from 'date-fns'

export function OfflineIndicator() {
  const { 
    isOnline, 
    syncStatus, 
    triggerSync,
    offlineData
  } = usePWA()

  const totalOfflineRecords = Object.values(offlineData).reduce(
    (sum, records) => sum + records.length, 
    0
  )

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return 'Never'
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  }

  const getSyncStatusColor = () => {
    if (!isOnline) return 'text-orange-600'
    if (syncStatus.syncInProgress) return 'text-blue-600'
    if (syncStatus.queuedOperations > 0) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getSyncStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />
    if (syncStatus.syncInProgress) return <RefreshCw className="h-4 w-4 animate-spin" />
    if (syncStatus.queuedOperations > 0) return <AlertCircle className="h-4 w-4" />
    return <CheckCircle2 className="h-4 w-4" />
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`flex items-center gap-2 ${getSyncStatusColor()}`}
        >
          {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          {!isOnline && (
            <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">
              Offline
            </Badge>
          )}
          {syncStatus.queuedOperations > 0 && (
            <Badge variant="outline" className="px-1.5 py-0.5 text-xs">
              {syncStatus.queuedOperations}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Offline</span>
                </>
              )}
            </div>
            {isOnline && (
              <Button
                variant="outline"
                size="sm"
                onClick={triggerSync}
                disabled={syncStatus.syncInProgress}
                className="h-7"
              >
                {syncStatus.syncInProgress ? (
                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1 h-3 w-3" />
                )}
                Sync
              </Button>
            )}
          </div>

          {/* Sync Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              {getSyncStatusIcon()}
              <span className="font-medium">
                {syncStatus.syncInProgress ? 'Syncing...' : 
                 syncStatus.queuedOperations > 0 ? 'Pending sync' : 
                 'Synced'}
              </span>
            </div>
            
            {syncStatus.queuedOperations > 0 && (
              <div className="text-xs text-muted-foreground">
                {syncStatus.queuedOperations} operation{syncStatus.queuedOperations > 1 ? 's' : ''} queued
              </div>
            )}
            
            <div className="text-xs text-muted-foreground">
              Last sync: {formatLastSync(syncStatus.lastSuccessfulSync)}
            </div>
          </div>

          {/* Offline Data Info */}
          {totalOfflineRecords > 0 && (
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-sm mb-2">
                <Database className="h-4 w-4" />
                <span className="font-medium">Offline Data</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(offlineData).map(([key, records]) => {
                  if (records.length === 0) return null
                  return (
                    <div key={key} className="flex justify-between">
                      <span className="capitalize">{key}:</span>
                      <span className="font-mono">{records.length}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Offline Help */}
          {!isOnline && (
            <div className="pt-2 border-t">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Working offline</p>
                  <p>
                    You can still check in, RSVP to events, and view cached data. 
                    Changes will sync when you&apos;re back online.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}