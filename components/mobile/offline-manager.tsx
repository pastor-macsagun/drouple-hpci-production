"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { WifiOff, Wifi, Cloud, CloudOff, RefreshCw, AlertCircle } from "lucide-react";
import { triggerHapticFeedback } from "@/lib/mobile-utils";

interface OfflineManagerProps {
  children: ReactNode;
  onOfflineAction?: (action: string, data: any) => void;
  enableQueueIndicator?: boolean;
}

interface QueuedAction {
  id: string;
  type: string;
  timestamp: number;
  data: any;
  retryCount: number;
}

export function OfflineManager({
  children,
  onOfflineAction,
  enableQueueIndicator = true,
}: OfflineManagerProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [queuedActions, setQueuedActions] = useState<QueuedAction[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerHapticFeedback('impact-light');
      // Trigger sync when coming back online
      if (queuedActions.length > 0) {
        processSyncQueue();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      triggerHapticFeedback('impact-medium');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial state
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queuedActions.length]);

  // Process queued actions when online
  const processSyncQueue = useCallback(async () => {
    if (!isOnline || queuedActions.length === 0) return;
    
    setSyncStatus('syncing');
    
    try {
      for (const action of queuedActions) {
        try {
          await onOfflineAction?.(action.type, action.data);
          // Remove successful action from queue
          setQueuedActions(prev => prev.filter(a => a.id !== action.id));
        } catch (error) {
          // Increment retry count
          setQueuedActions(prev => 
            prev.map(a => 
              a.id === action.id 
                ? { ...a, retryCount: a.retryCount + 1 }
                : a
            )
          );
          
          // Remove after 3 failed attempts
          if (action.retryCount >= 3) {
            setQueuedActions(prev => prev.filter(a => a.id !== action.id));
          }
        }
      }
      
      setLastSyncTime(new Date());
      setSyncStatus('idle');
    } catch (error) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [isOnline, queuedActions, onOfflineAction]);

  // Add action to queue when offline
  const queueAction = useCallback((type: string, data: any) => {
    if (isOnline) {
      onOfflineAction?.(type, data);
      return;
    }
    
    const action: QueuedAction = {
      id: Date.now().toString(),
      type,
      timestamp: Date.now(),
      data,
      retryCount: 0,
    };
    
    setQueuedActions(prev => [...prev, action]);
    triggerHapticFeedback('impact-light');
  }, [isOnline, onOfflineAction]);

  return (
    <div className="relative">
      {/* Offline/Sync Status Bar */}
      <div
        className={cn(
          "sticky top-0 z-40 transition-all duration-300 ease-out",
          !isOnline || syncStatus !== 'idle' || queuedActions.length > 0
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div
          className={cn(
            "px-4 py-2 text-sm font-medium flex items-center justify-between",
            !isOnline
              ? "bg-red-500 text-white"
              : syncStatus === 'syncing'
                ? "bg-blue-500 text-white"
                : syncStatus === 'error'
                  ? "bg-orange-500 text-white"
                  : queuedActions.length > 0
                    ? "bg-yellow-500 text-black"
                    : "bg-green-500 text-white"
          )}
        >
          <div className="flex items-center gap-2">
            {!isOnline ? (
              <>
                <WifiOff className="w-4 h-4" />
                <span>Offline - Changes saved locally</span>
              </>
            ) : syncStatus === 'syncing' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Syncing changes...</span>
              </>
            ) : syncStatus === 'error' ? (
              <>
                <AlertCircle className="w-4 h-4" />
                <span>Sync error - Will retry automatically</span>
              </>
            ) : queuedActions.length > 0 ? (
              <>
                <CloudOff className="w-4 h-4" />
                <span>{queuedActions.length} changes queued</span>
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4" />
                <span>All changes synced</span>
              </>
            )}
          </div>
          
          {queuedActions.length > 0 && isOnline && (
            <button
              onClick={processSyncQueue}
              className="text-xs px-2 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors"
              disabled={syncStatus === 'syncing'}
            >
              Sync Now
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={isOnline ? '' : 'opacity-90'}>
        {children}
      </div>

      {/* Offline Action Queue Indicator */}
      {enableQueueIndicator && queuedActions.length > 0 && (
        <div className="fixed bottom-20 right-4 z-50">
          <div className="bg-accent text-white px-3 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span>{queuedActions.length}</span>
          </div>
        </div>
      )}

      {/* Last Sync Indicator */}
      {lastSyncTime && isOnline && (
        <div className="fixed bottom-4 left-4 z-40 text-xs text-ink-muted bg-bg/80 backdrop-blur-sm px-2 py-1 rounded">
          Last synced: {lastSyncTime.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}