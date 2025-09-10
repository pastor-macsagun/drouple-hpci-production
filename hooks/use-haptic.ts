'use client'

import { useCallback } from 'react'

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection'

export function useHaptic() {
  const triggerHaptic = useCallback((pattern: HapticPattern = 'light') => {
    // Simple haptic feedback using vibration API
    if (navigator && 'vibrate' in navigator) {
      try {
        const duration = pattern === 'heavy' ? 50 : pattern === 'medium' ? 20 : 10
        navigator.vibrate(duration)
        return true
      } catch {
        return false
      }
    }
    return false
  }, [])
  
  return {
    triggerHaptic,
    isSupported: typeof navigator !== 'undefined' && 'vibrate' in navigator
  }
}