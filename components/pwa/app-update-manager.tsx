'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface UpdateStatus {
  hasUpdate: boolean
  isInstalling: boolean
  isWaiting: boolean
  error: string | null
  version: string | null
  releaseNotes?: string[]
}

export function AppUpdateManager() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    hasUpdate: false,
    isInstalling: false,
    isWaiting: false,
    error: null,
    version: null
  })
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Check for existing registration
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          setupUpdateHandlers(registration)
          checkForUpdate(registration)
        }
      })

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage)
      }
    }
  }, [])

  const setupUpdateHandlers = (registration: ServiceWorkerRegistration) => {
    // Handle service worker updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (!newWorker) return

      setUpdateStatus(prev => ({ 
        ...prev, 
        isWaiting: true, 
        hasUpdate: true,
        version: generateVersionString()
      }))

      newWorker.addEventListener('statechange', () => {
        switch (newWorker.state) {
          case 'installed':
            if (navigator.serviceWorker.controller) {
              // New update available
              setUpdateStatus(prev => ({ ...prev, isWaiting: true, isInstalling: false }))
              setShowUpdatePrompt(true)
              
              toast({
                title: "App Update Available",
                description: "A new version of Drouple is ready to install.",
                action: (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => installUpdate()}
                  >
                    Update Now
                  </Button>
                )
              })
            } else {
              // App is being served from cache, no update needed
              setUpdateStatus(prev => ({ ...prev, hasUpdate: false }))
            }
            break
          case 'activated':
            setUpdateStatus(prev => ({ ...prev, isInstalling: false, isWaiting: false, hasUpdate: false }))
            setShowUpdatePrompt(false)
            window.location.reload()
            break
          case 'redundant':
            setUpdateStatus(prev => ({ ...prev, error: 'Update failed' }))
            break
        }
      })
    })
  }

  const handleServiceWorkerMessage = (event: MessageEvent) => {
    const { type, payload } = event.data

    switch (type) {
      case 'UPDATE_AVAILABLE':
        setUpdateStatus(prev => ({
          ...prev,
          hasUpdate: true,
          version: payload.version,
          releaseNotes: payload.releaseNotes
        }))
        setShowUpdatePrompt(true)
        break
      case 'UPDATE_INSTALLING':
        setUpdateStatus(prev => ({ ...prev, isInstalling: true }))
        break
      case 'UPDATE_INSTALLED':
        setUpdateStatus(prev => ({ 
          ...prev, 
          isInstalling: false, 
          isWaiting: true 
        }))
        break
      case 'UPDATE_ERROR':
        setUpdateStatus(prev => ({ 
          ...prev, 
          error: payload.error,
          isInstalling: false 
        }))
        toast({
          title: "Update Error",
          description: payload.error,
          variant: "destructive"
        })
        break
    }
  }

  const checkForUpdate = async (registration: ServiceWorkerRegistration) => {
    try {
      await registration.update()
    } catch (error) {
      console.error('Failed to check for updates:', error)
    }
  }

  const installUpdate = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration?.waiting) {
        setUpdateStatus(prev => ({ ...prev, isInstalling: true }))
        
        // Tell the waiting service worker to skip waiting and become active
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        
        toast({
          title: "Installing Update",
          description: "The app will reload automatically when ready.",
        })
      }
    }
  }

  const dismissUpdate = () => {
    setShowUpdatePrompt(false)
    setUpdateStatus(prev => ({ ...prev, hasUpdate: false }))
  }

  const generateVersionString = (): string => {
    const date = new Date()
    return `v${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`
  }

  const getStatusIcon = () => {
    if (updateStatus.isInstalling) return <RefreshCw className="h-4 w-4 animate-spin" />
    if (updateStatus.isWaiting) return <Clock className="h-4 w-4" />
    if (updateStatus.error) return <XCircle className="h-4 w-4 text-destructive" />
    if (updateStatus.hasUpdate) return <Download className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4 text-green-500" />
  }

  const getStatusText = () => {
    if (updateStatus.isInstalling) return "Installing update..."
    if (updateStatus.isWaiting) return "Update ready to install"
    if (updateStatus.error) return `Update error: ${updateStatus.error}`
    if (updateStatus.hasUpdate) return "Update available"
    return "App is up to date"
  }

  const getStatusVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    if (updateStatus.error) return "destructive"
    if (updateStatus.hasUpdate || updateStatus.isWaiting) return "default"
    return "secondary"
  }

  // Only show update prompt for significant updates
  if (!showUpdatePrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <CardTitle className="text-sm">App Update</CardTitle>
            </div>
            <Badge variant={getStatusVariant()}>
              {updateStatus.version}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            {getStatusText()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-0">
          {updateStatus.releaseNotes && updateStatus.releaseNotes.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                What's New:
              </p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                {updateStatus.releaseNotes.map((note, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              onClick={installUpdate}
              disabled={updateStatus.isInstalling}
              className="flex-1"
            >
              {updateStatus.isInstalling ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Installing...
                </>
              ) : (
                <>
                  <Download className="h-3 w-3 mr-1" />
                  Update Now
                </>
              )}
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={dismissUpdate}
              disabled={updateStatus.isInstalling}
            >
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AppUpdateManager