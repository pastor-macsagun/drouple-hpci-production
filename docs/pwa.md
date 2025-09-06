# Progressive Web Application (PWA) Documentation

## Overview

Drouple implements a comprehensive Progressive Web Application (PWA) with native-like mobile features, offline capabilities, and advanced service worker functionality. The PWA provides an app-like experience while maintaining web accessibility and deployment simplicity.

## Table of Contents

1. [PWA Architecture](#pwa-architecture)
2. [Mobile Component Library](#mobile-component-library)
3. [Haptic Feedback System](#haptic-feedback-system)
4. [Service Worker Features](#service-worker-features)
5. [Offline Capabilities](#offline-capabilities)
6. [Native APIs Integration](#native-apis-integration)
7. [Installation & Manifest](#installation--manifest)
8. [Performance Optimization](#performance-optimization)
9. [Development Workflow](#development-workflow)
10. [Testing PWA Features](#testing-pwa-features)

## PWA Architecture

### App Shell Pattern

The PWA follows the app shell architecture pattern with:

- **App Shell Component** (`/components/pwa/app-shell.tsx`): Main PWA wrapper with native features
- **PWA Detection**: Automatic detection of standalone mode vs browser mode
- **Safe Area Handling**: Support for notched devices with proper padding
- **Loading States**: Native-like loading indicators and progress feedback

```typescript
import { AppShell } from '@/components/pwa/app-shell'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell showLoadingIndicator>
      {children}
    </AppShell>
  )
}
```

### PWA Detection Utilities

```typescript
import { isPWAStandalone, getSafeAreaInsets } from '@/lib/mobile-utils'

// Check if running in PWA mode
const isStandalone = isPWAStandalone()

// Get safe area insets for notched devices
const insets = getSafeAreaInsets()
```

## Mobile Component Library

### Core Components (11+ Components)

1. **MobileButton** - Touch-optimized button with haptic feedback
2. **MobileForm** - Native-style form components with validation
3. **MobileTabs** - Touch-friendly tab navigation
4. **BottomSheet** - Native-style modal presentations
5. **PullToRefresh** - Native refresh patterns
6. **MobileLoading** - Progressive loading states
7. **NotificationManager** - Toast notifications with haptics
8. **NativeShare** - Native sharing with clipboard fallback
9. **CameraCapture** - Camera integration with gallery selection
10. **OfflineManager** - Offline state handling
11. **AppShell** - Main PWA shell component

### Component Usage Examples

#### MobileButton with Haptic Feedback

```typescript
import { MobileButton } from '@/components/mobile/mobile-button'

<MobileButton
  variant="default"
  hapticFeedback="tap"
  onClick={handleSubmit}
>
  Submit Form
</MobileButton>
```

#### Camera Capture Component

```typescript
import { CameraCapture } from '@/components/mobile/camera-capture'

<CameraCapture
  variant="both" // camera | gallery | both
  onCapture={handleFileCapture}
  maxSizeMB={5}
  accept="image/*"
/>
```

#### Native Share Integration

```typescript
import { NativeShare } from '@/components/mobile/native-share'

<NativeShare
  data={{
    title: "Event Details",
    text: "Join us for Sunday service",
    url: window.location.href
  }}
  variant="icon"
/>
```

#### Bottom Sheet Modal

```typescript
import { BottomSheet } from '@/components/mobile/bottom-sheet'

<BottomSheet
  isOpen={isOpen}
  onClose={handleClose}
  title="Event Options"
  snapPoints={[0.3, 0.8]}
>
  <div className="p-4">
    Sheet content here
  </div>
</BottomSheet>
```

## Haptic Feedback System

### Available Haptic Patterns

The PWA includes 16+ haptic feedback patterns for enhanced user experience:

```typescript
import { triggerHapticFeedback, HapticType } from '@/lib/mobile-utils'

// Basic impacts
triggerHapticFeedback('selection')     // 10ms
triggerHapticFeedback('impact-light')  // 10ms
triggerHapticFeedback('impact-medium') // 20ms
triggerHapticFeedback('impact-heavy')  // 30ms

// Contextual feedback
triggerHapticFeedback('success')       // [50, 30, 100]
triggerHapticFeedback('warning')       // [100, 50, 100, 50, 100]
triggerHapticFeedback('error')         // [200, 100, 200]
triggerHapticFeedback('notification')  // [50, 50, 50]

// Interaction patterns
triggerHapticFeedback('tap')           // 15ms
triggerHapticFeedback('double-tap')    // [15, 30, 15]
triggerHapticFeedback('long-press')    // [30, 20, 50]
triggerHapticFeedback('swipe')         // [20, 10, 20]

// Action feedback
triggerHapticFeedback('refresh')       // [30, 20, 30, 20, 60]
triggerHapticFeedback('delete')        // [50, 30, 100, 30, 50]
triggerHapticFeedback('toggle')        // [15, 10, 25]
triggerHapticFeedback('scroll-end')    // 40ms
```

### Haptic Feedback Guidelines

- **Use sparingly**: Only for meaningful interactions
- **Context appropriate**: Match pattern to action type
- **User preference**: Respect system vibration settings
- **Progressive enhancement**: Graceful fallback when not supported

## Service Worker Features

### Advanced Caching Strategies

The service worker (`/public/sw.js`) implements multiple caching strategies:

1. **Static Cache**: App shell, manifest, and core assets
2. **API Cache**: Stale-while-revalidate for API responses
3. **Navigation Cache**: Network-first with fallback
4. **Resource Cache**: Cache-first for images and fonts

### Background Sync

```typescript
// Queue operations for background sync when offline
await queueOperationForSync({
  url: '/api/checkin',
  method: 'POST',
  data: checkinData
})
```

### Push Notifications

```typescript
// Rich notification system with contextual actions
const notificationOptions = {
  body: 'Sunday service starts in 30 minutes',
  icon: '/icon-192x192.png',
  badge: '/icon-72x72.png',
  actions: [
    { action: 'checkin', title: 'Check In Now' },
    { action: 'dismiss', title: 'Dismiss' }
  ],
  vibrate: [100, 50, 100],
  requireInteraction: true
}
```

### Version Management

```typescript
// Check for app updates
const hasUpdate = await checkForUpdates()
if (hasUpdate) {
  // Show update notification to user
  showUpdateNotification()
}
```

## Offline Capabilities

### Offline-First Design

- **Queue Operations**: Failed requests are queued for retry when online
- **Cached Data**: Critical app data cached for offline viewing
- **Sync Status**: Visual indicators for sync progress and queue status
- **Graceful Degradation**: Progressive enhancement based on connectivity

### Background Sync Implementation

```typescript
// Register background sync
if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
  registration.sync.register('church-data-sync')
}

// Process sync queue when online
self.addEventListener('sync', (event) => {
  if (event.tag === 'church-data-sync') {
    event.waitUntil(processChurchDataSync())
  }
})
```

## Native APIs Integration

### Web Share API

```typescript
import { useNativeShare } from '@/components/mobile/native-share'

const { share, canShare } = useNativeShare()

const handleShare = async () => {
  const success = await share({
    title: 'Church Event',
    text: 'Join us this Sunday!',
    url: window.location.href
  })
}
```

### Camera API

```typescript
import { useCameraCapture } from '@/components/mobile/camera-capture'

const { checkCameraSupport, requestCameraPermission } = useCameraCapture()

const initCamera = async () => {
  if (checkCameraSupport()) {
    const hasPermission = await requestCameraPermission()
    if (hasPermission) {
      // Camera ready to use
    }
  }
}
```

### Clipboard API

```typescript
// Modern clipboard API with fallback
try {
  await navigator.clipboard.writeText(text)
} catch (error) {
  // Fallback for older browsers
  document.execCommand('copy')
}
```

## Installation & Manifest

### Web App Manifest

Location: `/app/manifest.json`

Key features:
- **Maskable Icons**: iOS-compatible icons with safe zones
- **App Shortcuts**: Quick actions for common features
- **Display Mode**: Standalone for native app experience
- **Theme Colors**: Consistent with app branding

```json
{
  "name": "Drouple - Church Management System",
  "short_name": "Drouple",
  "display": "standalone",
  "theme_color": "#1e7ce8",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icon-192x192-maskable.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Check In",
      "url": "/checkin",
      "description": "Sunday service check-in"
    }
  ]
}
```

### Installation Prompts

```typescript
// Handle install prompt
let deferredPrompt: any

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt = e
  showInstallButton()
})

const handleInstall = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      trackInstallation()
    }
  }
}
```

## Performance Optimization

### Loading Strategies

1. **Progressive Loading**: Lazy loading with intersection observer
2. **Resource Hints**: Prefetch likely navigation routes
3. **Critical CSS**: Inline critical styles, lazy load non-critical
4. **Image Optimization**: WebP with fallbacks, responsive images

### Bundle Optimization

- **Code Splitting**: Route-based and component-based splitting
- **Tree Shaking**: Eliminate unused code
- **Compression**: Gzip/Brotli compression
- **Caching**: Long-term caching with versioned assets

### Performance Monitoring

```typescript
// Service worker performance metrics
const metrics = await getServiceWorkerMetrics()
console.log(`Cache hit rate: ${metrics.cacheHitRate}%`)
console.log(`Sync queue size: ${metrics.syncQueueSize}`)
```

## Development Workflow

### PWA Development Setup

1. **Enable Service Workers**: Ensure service worker registration
2. **HTTPS Requirement**: Use HTTPS for testing (localhost works)
3. **DevTools**: Use Chrome/Edge DevTools PWA panel
4. **Testing**: Test on actual mobile devices

### Service Worker Development

```typescript
// Service worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('SW registered:', registration)
    })
    .catch(error => {
      console.log('SW registration failed:', error)
    })
}
```

### Mobile Component Development

```typescript
// Mobile component template
'use client'

import { useState } from 'react'
import { triggerHapticFeedback } from '@/lib/mobile-utils'

export function MobileComponent() {
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = async () => {
    triggerHapticFeedback('tap')
    setIsLoading(true)
    
    try {
      // Component logic
      triggerHapticFeedback('success')
    } catch (error) {
      triggerHapticFeedback('error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="touch-target-44">
      {/* Component JSX */}
    </div>
  )
}
```

## Testing PWA Features

### Manual Testing Checklist

1. **Installation Testing**
   - [ ] PWA install prompt appears
   - [ ] App installs successfully on iOS/Android
   - [ ] Standalone mode launches properly
   - [ ] App shortcuts work correctly

2. **Service Worker Testing**
   - [ ] Service worker registers successfully
   - [ ] Offline mode works as expected
   - [ ] Background sync queues operations
   - [ ] Push notifications display correctly

3. **Mobile Component Testing**
   - [ ] Haptic feedback triggers appropriately
   - [ ] Touch targets meet 44px minimum
   - [ ] Camera capture works on mobile devices
   - [ ] Native sharing functions properly

4. **Performance Testing**
   - [ ] App loads within 3 seconds
   - [ ] Smooth animations and transitions
   - [ ] No layout shift issues
   - [ ] Cache hit rate above 80%

### Automated Testing

```typescript
// Component testing with PWA features
import { render, fireEvent } from '@testing-library/react'
import { MobileButton } from '@/components/mobile/mobile-button'

test('mobile button triggers haptic feedback', () => {
  const mockVibrate = jest.fn()
  Object.defineProperty(navigator, 'vibrate', {
    value: mockVibrate,
    writable: true
  })

  const { getByRole } = render(
    <MobileButton hapticFeedback="tap">Test</MobileButton>
  )

  fireEvent.click(getByRole('button'))
  expect(mockVibrate).toHaveBeenCalledWith(15)
})
```

## Known Issues & Troubleshooting

### Common PWA Issues

1. **Service Worker Not Updating**
   - Solution: Implement proper version management and skip waiting logic

2. **iOS Installation Issues**
   - Solution: Ensure maskable icons are properly sized and formatted

3. **Haptic Feedback Not Working**
   - Solution: Check device vibration settings and API support

4. **Offline Sync Failing**
   - Solution: Verify background sync registration and queue implementation

### Debugging Tools

- **Chrome DevTools**: Application tab for PWA debugging
- **Lighthouse**: PWA audit and performance testing
- **Browser Console**: Service worker and PWA logs
- **Device Testing**: Real device testing essential

## Future Enhancements

### Planned Features

1. **Web Bluetooth**: For proximity-based check-ins
2. **WebRTC**: For video calling integration
3. **File System Access**: For enhanced file management
4. **Badging API**: For unread notification counts
5. **Web Locks**: For better offline conflict resolution

### Performance Improvements

1. **Advanced Caching**: Implement more sophisticated cache strategies
2. **Predictive Prefetching**: ML-based route prefetching
3. **Service Worker Optimization**: Reduce service worker bundle size
4. **IndexedDB Optimization**: Better offline data management

## Resources & References

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Mobile Web Best Practices](https://developers.google.com/web/fundamentals/design-and-ux/principles)
- [PWA Testing Guide](./pwa-testing.md)

---

*This documentation covers the comprehensive PWA implementation in Drouple as of September 2025. For testing procedures, see the [PWA Testing Guide](./pwa-testing.md).*