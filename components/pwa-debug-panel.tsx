'use client';

import { usePWADetection } from '@/hooks/use-pwa-detection';

export function PWADebugPanel() {
  const { isPWA, isLoading, debugInfo } = usePWADetection();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-xs">
      <div className="mb-2 font-bold">PWA Detection Debug</div>
      <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
      <div>Is PWA: {isPWA ? '✅ YES' : '❌ NO'}</div>
      {debugInfo && (
        <div className="mt-2 space-y-1">
          <div>Standalone: {debugInfo.isStandalone ? '✅' : '❌'}</div>
          <div>iOS: {debugInfo.isStandaloneIOS ? '✅' : '❌'}</div>
          <div>Fullscreen: {debugInfo.isFullscreen ? '✅' : '❌'}</div>
          <div>Browser: {debugInfo.isBrowser ? '✅' : '❌'}</div>
        </div>
      )}
    </div>
  );
}