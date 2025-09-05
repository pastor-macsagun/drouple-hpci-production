'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Progress } from '@/components/ui/progress'

export function NavigationLoader() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const pathname = usePathname()

  useEffect(() => {
    let progressInterval: NodeJS.Timeout

    const handleStart = () => {
      setIsLoading(true)
      setProgress(0)
      
      // Simulate progress during navigation
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev
          return prev + Math.random() * 10
        })
      }, 100)
    }

    // Listen for route changes
    const originalPush = window.history.pushState
    const originalReplace = window.history.replaceState

    window.history.pushState = function(...args) {
      handleStart()
      return originalPush.apply(window.history, args)
    }

    window.history.replaceState = function(...args) {
      handleStart()  
      return originalReplace.apply(window.history, args)
    }

    // Handle browser back/forward
    const handlePopState = () => handleStart()
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.history.pushState = originalPush
      window.history.replaceState = originalReplace
      window.removeEventListener('popstate', handlePopState)
      
      if (progressInterval) {
        clearInterval(progressInterval)
      }
    }
  }, [])

  // Complete loading when pathname changes
  useEffect(() => {
    setProgress(100)
    setTimeout(() => {
      setIsLoading(false)
      setProgress(0)
    }, 200)
  }, [pathname])

  if (!isLoading) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100]">
      <Progress 
        value={progress} 
        className="h-1 w-full rounded-none border-none bg-transparent"
      />
    </div>
  )
}