'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, X } from 'lucide-react'
import { usePWA } from '@/lib/pwa/use-pwa'
import { useState } from 'react'

export function InstallPrompt() {
  const { isInstalled, canInstall, installApp } = usePWA()
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (!dismissed) return false
    
    const dismissedDate = new Date(dismissed)
    const now = new Date()
    
    // Show prompt again after 7 days
    return now.getTime() - dismissedDate.getTime() < 7 * 24 * 60 * 60 * 1000
  })

  const handleInstallClick = async () => {
    try {
      await installApp()
    } catch (error) {
      console.error('Install failed:', error)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString())
    setIsDismissed(true)
  }

  if (isInstalled || !canInstall || isDismissed) {
    return null
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 p-4"
      role="dialog"
      aria-labelledby="install-prompt-title"
      aria-describedby="install-prompt-description"
    >
      <Card className="mx-auto max-w-md border-primary/20 bg-gradient-to-r from-primary/5 to-accent-secondary/5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              <CardTitle id="install-prompt-title" className="text-base">Install Drouple</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-6 w-6 -mt-1 -mr-1"
              onClick={handleDismiss}
              aria-label="Dismiss install prompt"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription id="install-prompt-description" className="text-sm">
            Add to your home screen for quick access like a native app. Works offline with sync when back online!
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Button onClick={handleInstallClick} size="sm" className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Install
            </Button>
            <Button variant="outline" size="sm" onClick={handleDismiss}>
              Maybe Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}