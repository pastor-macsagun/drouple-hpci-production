'use client';

import { useEffect, useState } from 'react';

export function usePWADetection() {
  const [isPWA, setIsPWA] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    // Check if running as PWA
    const checkPWAMode = () => {
      try {
        // Method 1: Check display-mode media query (most reliable)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        
        // Method 2: Check navigator.standalone (iOS Safari specific)
        const isStandaloneIOS = (window.navigator as any).standalone === true;
        
        // Method 3: Check fullscreen mode (some Android browsers)
        const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
        
        // Method 4: Check minimal-ui mode (some browsers)
        const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
        
        // Method 5: Check browser mode (default web browser)
        const isBrowser = window.matchMedia('(display-mode: browser)').matches;
        
        // Determine PWA mode (prioritize standalone and iOS standalone)
        const pwaMode = isStandalone || isStandaloneIOS;
        
        // Debug information
        const debug = {
          isStandalone,
          isStandaloneIOS,
          isFullscreen,
          isMinimalUI,
          isBrowser,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        };
        
        // Log for debugging (only in development)
        if (process.env.NODE_ENV === 'development') {
          console.log('PWA Detection Debug:', debug);
          console.log('Final PWA Mode:', pwaMode);
        }
        
        setDebugInfo(debug);
        setIsPWA(pwaMode);
        setIsLoading(false);
      } catch (error) {
        console.error('PWA detection error:', error);
        setIsPWA(false);
        setIsLoading(false);
      }
    };

    // Small delay to ensure DOM is fully loaded
    const timer = setTimeout(() => {
      checkPWAMode();
    }, 100);

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => {
      setTimeout(checkPWAMode, 50);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      clearTimeout(timer);
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return { isPWA, isLoading, debugInfo };
}