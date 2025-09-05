'use client'

import { Button } from '@/components/ui/button'
import { X, Download, Smartphone } from 'lucide-react'
import { usePWA } from '@/lib/pwa/use-pwa'
import { useState, useEffect } from 'react'

export function LandingInstallBanner() {
  const { isInstalled, canInstall, installApp } = usePWA()
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const dismissed = localStorage.getItem('landing-pwa-banner-dismissed')
    if (dismissed) {
      const dismissedDate = new Date(dismissed)
      const now = new Date()
      
      // Show banner again after 3 days
      const shouldShow = now.getTime() - dismissedDate.getTime() > 3 * 24 * 60 * 60 * 1000
      setIsDismissed(!shouldShow)
    }
    
    // Show banner after user scrolls or after 3 seconds
    const timer = setTimeout(() => setIsVisible(true), 3000)
    
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsVisible(true)
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleInstallClick = async () => {
    try {
      await installApp()
    } catch (error) {
      console.error('Install failed:', error)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('landing-pwa-banner-dismissed', new Date().toISOString())
    setIsDismissed(true)
    setIsVisible(false)
  }

  if (isInstalled || !canInstall || isDismissed || !isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-500">
      <div className="mx-auto max-w-md">
        <div className="bg-gradient-to-r from-accent to-accent-secondary rounded-2xl shadow-2xl border border-accent/20 backdrop-blur-sm">
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Smartphone className="h-6 w-6 text-white" />
                </div>
                <div className="text-white">
                  <h3 className="font-semibold text-sm">Install Drouple</h3>
                  <p className="text-xs text-white/80">Get the app experience</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-6 w-6 text-white/80 hover:text-white hover:bg-white/10 -mt-1 -mr-1"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleInstallClick} 
                size="sm" 
                className="flex-1 bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm"
              >
                <Download className="mr-2 h-3 w-3" />
                Install
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDismiss}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                Not Now
              </Button>
            </div>
            
            <p className="text-xs text-white/70 mt-2 text-center">
              ✓ Works offline ✓ App-like experience ✓ No app store needed
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}