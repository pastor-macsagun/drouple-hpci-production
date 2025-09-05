'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, X, Check, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react'
import { useNotificationContext } from '@/components/providers/notification-provider'
import { AppNotification } from '@/hooks/use-notifications'

export function NotificationBanner() {
  const { notifications, markAsRead, removeNotification, requestPermission, permission } = useNotificationContext()
  const [showPermissionRequest, setShowPermissionRequest] = useState(false)
  const [currentNotification, setCurrentNotification] = useState<AppNotification | null>(null)

  // Get the latest unread notification
  const latestUnread = notifications.find(n => !n.read)

  useEffect(() => {
    if (latestUnread && currentNotification?.id !== latestUnread.id) {
      setCurrentNotification(latestUnread)
    }
  }, [latestUnread, currentNotification])

  useEffect(() => {
    // Show permission request if we haven't asked yet and there are notifications
    if (permission === 'default' && notifications.length > 0) {
      setShowPermissionRequest(true)
    }
  }, [permission, notifications.length])

  const handleRequestPermission = async () => {
    await requestPermission()
    setShowPermissionRequest(false)
  }

  const handleMarkAsRead = (notification: AppNotification) => {
    markAsRead(notification.id)
    setCurrentNotification(null)
  }

  const handleDismiss = (notification: AppNotification) => {
    removeNotification(notification.id)
    setCurrentNotification(null)
  }

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getBadgeVariant = (type: AppNotification['type']) => {
    switch (type) {
      case 'success':
        return 'default'
      case 'warning':
        return 'secondary'
      case 'error':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  // Show permission request banner
  if (showPermissionRequest) {
    return (
      <div className="fixed top-0 left-0 right-0 z-40 p-3">
        <Card className="mx-auto max-w-md border-blue-200 bg-blue-50/95 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-900">
                  Enable Notifications
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Get important updates about church events and announcements
                </p>
              </div>
              <div className="flex gap-1">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="h-8 px-2 text-xs"
                  onClick={handleRequestPermission}
                >
                  Enable
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => setShowPermissionRequest(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show current notification
  if (currentNotification) {
    return (
      <div className="fixed top-0 left-0 right-0 z-40 p-3">
        <Card className="mx-auto max-w-md border-accent/20 bg-surface/95 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {getIcon(currentNotification.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium truncate">
                    {currentNotification.title}
                  </p>
                  <Badge 
                    variant={getBadgeVariant(currentNotification.type)} 
                    className="text-xs"
                  >
                    {currentNotification.type}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {currentNotification.body}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentNotification.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
              <div className="flex gap-1">
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => handleMarkAsRead(currentNotification)}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => handleDismiss(currentNotification)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}