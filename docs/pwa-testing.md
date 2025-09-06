# PWA Testing Guide

## Overview

This comprehensive guide covers testing procedures for Progressive Web Application (PWA) features, mobile components, and native-like functionality in Drouple. The guide includes both manual testing procedures and automated testing strategies.

## Table of Contents

1. [Quick Start Testing](#quick-start-testing)
2. [PWA Installation Testing](#pwa-installation-testing)
3. [Mobile Component Testing](#mobile-component-testing)
4. [Service Worker Testing](#service-worker-testing)
5. [Offline Functionality Testing](#offline-functionality-testing)
6. [Performance Testing](#performance-testing)
7. [Cross-Platform Testing](#cross-platform-testing)
8. [Automated Testing](#automated-testing)
9. [Debugging and Troubleshooting](#debugging-and-troubleshooting)

## Quick Start Testing

### Local Development Setup

- **Local URL**: `http://localhost:3000`
- **Network URL**: `http://192.168.0.53:3000` (adjust IP as needed)
- **HTTPS Required**: Use `https://localhost:3000` for full PWA features
- **Mobile Testing**: Use network URL for testing on mobile devices

### Essential Test Checklist

Quick validation of core PWA functionality:

| Feature | Expected Behavior | Status |
|---------|------------------|--------|
| PWA Install Prompt | Shows on supported browsers | ☐ |
| Standalone Mode | Launches without browser UI | ☐ |
| Service Worker | Registers and activates | ☐ |
| Offline Mode | Basic functionality when offline | ☐ |
| Push Notifications | Displays with actions | ☐ |
| Haptic Feedback | Vibrates on supported devices | ☐ |

## PWA Installation Testing

### Desktop PWA Testing

#### Chrome/Edge Desktop
```bash
# Test sequence
1. Open Chrome/Edge browser
2. Navigate to http://localhost:3000
3. Look for install icon in address bar
4. Click install prompt or address bar icon
5. Verify PWA installs to desktop/taskbar
6. Launch installed PWA
7. Verify standalone mode (no browser UI)
```

**Expected Results**:
- ✅ Install prompt appears
- ✅ PWA installs successfully
- ✅ Launches in standalone mode
- ✅ App shortcuts work in right-click menu

#### PWA Detection (Desktop)
```javascript
// Run in browser console
console.log('Display mode:', window.matchMedia('(display-mode: standalone)').matches);
console.log('Is PWA:', window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone);
```

### Mobile PWA Testing

#### iOS Safari PWA
```bash
# Test sequence for iOS
1. Open Safari on iPhone/iPad
2. Navigate to http://[network-ip]:3000
3. Tap Share button (square with up arrow)
4. Scroll down and tap "Add to Home Screen"
5. Customize name if desired, tap "Add"
6. Close Safari completely
7. Tap PWA icon on home screen
8. Verify full-screen launch (no Safari UI)
```

**Expected Results**:
- ✅ "Add to Home Screen" option appears
- ✅ PWA installs with custom icon
- ✅ Launches in full-screen mode
- ✅ Splash screen appears (Drouple-specific)
- ✅ Status bar respects theme color

#### Android Chrome PWA
```bash
# Test sequence for Android
1. Open Chrome on Android device
2. Navigate to http://[network-ip]:3000
3. Tap menu (three dots) → "Add to Home screen"
   OR wait for automatic install banner
4. Confirm installation
5. Close Chrome completely
6. Tap PWA icon on home screen
7. Verify app-like launch
```

**Expected Results**:
- ✅ Install banner appears automatically
- ✅ Manual install option available
- ✅ PWA installs with proper icon
- ✅ Launches without Chrome UI
- ✅ Splash screen displays

### Installation Edge Cases

#### Test Scenarios
1. **Poor Network**: Install during slow connection
2. **Storage Full**: Install when device storage is low  
3. **Already Installed**: Attempt to reinstall PWA
4. **Different Origins**: Install from different domains
5. **Update Available**: Install when app update is pending

## Mobile Component Testing

### Touch Interaction Testing

#### Haptic Feedback Testing
```javascript
// Test haptic feedback patterns
const testHaptics = () => {
  // Test different patterns
  triggerHapticFeedback('tap')        // Quick tap
  triggerHapticFeedback('success')    // Success pattern
  triggerHapticFeedback('error')      // Error pattern
  triggerHapticFeedback('warning')    // Warning pattern
}

// Check haptic support
console.log('Haptics supported:', 'vibrate' in navigator)
```

#### Touch Target Validation
```javascript
// Validate minimum 44px touch targets
const validateTouchTargets = () => {
  const buttons = document.querySelectorAll('button, [role="button"]')
  buttons.forEach(button => {
    const rect = button.getBoundingClientRect()
    const isValid = rect.width >= 44 && rect.height >= 44
    console.log(`Button: ${button.textContent}, Valid: ${isValid}`)
  })
}
```

### Component-Specific Testing

#### MobileButton Component
```bash
# Test checklist
☐ Triggers appropriate haptic feedback on tap
☐ Shows loading state during async operations
☐ Respects disabled state
☐ Meets 44px minimum touch target
☐ Keyboard accessible (Enter/Space keys)
☐ Screen reader announces properly
☐ Ripple effect animation works
```

#### Camera Capture Component
```bash
# Test scenarios
☐ Camera permission request works
☐ Environment-facing camera activates
☐ Gallery selection works
☐ File size validation enforced
☐ File type validation works
☐ Image preview displays correctly
☐ Error handling for no camera/permission denied
```

#### Bottom Sheet Component
```bash
# Interactive testing
☐ Opens with smooth animation
☐ Responds to swipe gestures
☐ Snaps to defined points (30%, 60%, 90%)
☐ Dismisses on backdrop tap
☐ Handles safe area insets properly
☐ Keyboard doesn't interfere with sheet
```

#### Native Share Component
```bash
# Sharing functionality
☐ Native share dialog opens (when supported)
☐ Fallback to clipboard works
☐ File sharing works (when supported)
☐ Success feedback provided
☐ Error handling for failed shares
☐ Social media apps appear in share menu
```

### Form Component Testing

```bash
# MobileForm testing checklist
☐ Input focus shows proper keyboard type
☐ Form validation provides immediate feedback  
☐ Submit button disabled during submission
☐ Loading states displayed properly
☐ Error messages are accessible
☐ Auto-complete works for supported fields
☐ Password fields toggle visibility correctly
```

## Service Worker Testing

### Service Worker Registration

```javascript
// Check service worker status
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('SW Registrations:', registrations.length)
  registrations.forEach(reg => {
    console.log('SW State:', reg.active?.state)
    console.log('SW Scope:', reg.scope)
  })
})

// Test update mechanism
navigator.serviceWorker.addEventListener('message', event => {
  console.log('SW Message:', event.data)
})
```

### Cache Testing

#### Cache Validation
```javascript
// Check cache contents
caches.keys().then(cacheNames => {
  console.log('Available caches:', cacheNames)
  cacheNames.forEach(name => {
    caches.open(name).then(cache => {
      cache.keys().then(keys => {
        console.log(`${name} contains ${keys.length} entries`)
      })
    })
  })
})
```

#### Cache Performance
```bash
# Manual cache testing
1. Load app with DevTools Network tab open
2. Note initial load sizes and times
3. Refresh page (should load from cache)
4. Check "from ServiceWorker" or "from disk cache"
5. Verify reduced load times on subsequent visits
```

### Background Sync Testing

```javascript
// Test background sync registration
if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
  navigator.serviceWorker.ready.then(registration => {
    return registration.sync.register('test-sync')
  })
}

// Monitor sync events
navigator.serviceWorker.addEventListener('message', event => {
  if (event.data.type === 'sync_complete') {
    console.log('Background sync completed:', event.data)
  }
})
```

## Offline Functionality Testing

### Offline Mode Simulation

#### Chrome DevTools Method
```bash
1. Open Chrome DevTools
2. Go to Network tab
3. Change throttling to "Offline"
4. Reload page
5. Test core functionality
6. Verify offline indicators appear
7. Test data queuing for sync
```

#### Real Network Disconnection
```bash
1. Disconnect device from WiFi/cellular
2. Attempt to use app features
3. Verify graceful degradation
4. Check offline notification appears
5. Test queued operations
6. Reconnect and verify sync
```

### Offline Feature Testing

#### Offline Indicators
```bash
☐ Connection status indicator appears
☐ Offline mode clearly communicated
☐ App functions with cached data
☐ Forms queue submissions properly
☐ Sync queue shows pending operations
☐ "Back online" notification appears when reconnected
```

#### Data Synchronization
```bash
# Test sync queue
1. Go offline
2. Perform data operations (check-ins, form submissions)
3. Verify operations are queued
4. Return online
5. Check operations sync automatically
6. Verify data consistency
```

## Performance Testing

### Core Web Vitals Testing

#### Lighthouse PWA Audit
```bash
# Run Lighthouse audit
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select "Progressive Web App"
4. Run audit
5. Aim for 90+ PWA score
```

**Target Metrics**:
- PWA Score: 90+
- Performance: 90+
- Accessibility: 95+
- Best Practices: 90+
- SEO: 90+

#### Real Device Testing
```bash
# Performance checklist
☐ App loads in under 3 seconds
☐ Animations are smooth (60fps)
☐ No layout shift during loading
☐ Touch responses are immediate (<100ms)
☐ Scroll performance is smooth
☐ Memory usage stays reasonable
```

### Bundle Size Testing

```bash
# Check bundle sizes
npm run build
npm run analyze

# Target sizes (example)
- Main bundle: <200KB gzipped
- Service worker: <50KB
- Mobile components: <100KB
- Total initial load: <300KB
```

## Cross-Platform Testing

### Device Matrix

| Platform | Browser | PWA Support | Install Method | Notes |
|----------|---------|-------------|----------------|-------|
| iOS 16+ | Safari | ✅ | Add to Home Screen | Full PWA support |
| iOS 16+ | Chrome | ⚠️ | Limited | Uses Safari WebKit |
| Android | Chrome | ✅ | Install Banner | Full PWA support |
| Android | Firefox | ✅ | Add to Home Screen | Good support |
| Windows | Chrome/Edge | ✅ | Install Icon | Desktop integration |
| macOS | Safari | ✅ | Add to Dock | macOS integration |

### Platform-Specific Testing

#### iOS Specific
```bash
# iOS unique features to test
☐ Splash screen displays correctly
☐ Status bar color matches theme
☐ Safe area insets handled properly
☐ Keyboard doesn't break layout
☐ Notch/Dynamic Island compatibility
☐ Haptic feedback works (iPhone only)
```

#### Android Specific
```bash
# Android unique features to test
☐ App shortcuts work (long press icon)
☐ Back button behavior correct
☐ Notification badges work
☐ WebAPK installation (Chrome)
☐ Adaptive icon displays properly
☐ Share target functionality
```

#### Desktop Specific
```bash
# Desktop PWA features
☐ Window management works
☐ Keyboard shortcuts function
☐ Right-click context menus
☐ Window resizing handled gracefully
☐ Multiple windows support
☐ System integration (taskbar, dock)
```

## Automated Testing

### Unit Testing for PWA Components

```typescript
// Mobile component testing
import { render, fireEvent, waitFor } from '@testing-library/react'
import { MobileButton } from '@/components/mobile/mobile-button'

describe('MobileButton PWA Features', () => {
  beforeEach(() => {
    // Mock navigator.vibrate
    Object.defineProperty(navigator, 'vibrate', {
      value: jest.fn(),
      writable: true
    })
  })

  it('triggers haptic feedback on interaction', () => {
    const { getByRole } = render(
      <MobileButton hapticFeedback="tap">Test Button</MobileButton>
    )
    
    fireEvent.click(getByRole('button'))
    expect(navigator.vibrate).toHaveBeenCalledWith(15)
  })

  it('meets minimum touch target requirements', () => {
    const { getByRole } = render(<MobileButton>Test</MobileButton>)
    const button = getByRole('button')
    
    const styles = window.getComputedStyle(button)
    expect(parseFloat(styles.minWidth)).toBeGreaterThanOrEqual(44)
    expect(parseFloat(styles.minHeight)).toBeGreaterThanOrEqual(44)
  })

  it('handles loading state correctly', async () => {
    const mockClick = jest.fn().mockResolvedValue(undefined)
    const { getByRole, getByText } = render(
      <MobileButton onClick={mockClick} loading>
        Submit
      </MobileButton>
    )
    
    expect(getByText(/loading/i)).toBeInTheDocument()
    expect(getByRole('button')).toBeDisabled()
  })
})
```

### Service Worker Testing

```typescript
// Service worker testing utilities
describe('Service Worker', () => {
  beforeEach(async () => {
    // Mock service worker registration
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: jest.fn().mockResolvedValue({}),
        ready: Promise.resolve({}),
        addEventListener: jest.fn()
      }
    })
  })

  it('registers service worker successfully', async () => {
    const registration = await navigator.serviceWorker.register('/sw.js')
    expect(registration).toBeDefined()
  })

  it('handles offline sync queue', async () => {
    // Mock IndexedDB for sync queue testing
    // Test sync queue functionality
  })
})
```

### E2E PWA Testing with Playwright

```typescript
import { test, expect, devices } from '@playwright/test'

// Configure for mobile testing
test.use({ ...devices['iPhone 13'] })

test('PWA installation and basic functionality', async ({ page }) => {
  await page.goto('http://localhost:3000')
  
  // Test PWA installation
  await expect(page).toHaveTitle(/Drouple/)
  
  // Simulate PWA install
  await page.evaluate(() => {
    // Trigger install prompt
    window.dispatchEvent(new Event('beforeinstallprompt'))
  })
  
  // Test offline functionality
  await page.context().setOffline(true)
  await page.reload()
  await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
  
  // Test service worker registration
  const swRegistered = await page.evaluate(async () => {
    return 'serviceWorker' in navigator
  })
  expect(swRegistered).toBe(true)
})

test('mobile component interactions', async ({ page }) => {
  await page.goto('http://localhost:3000/test-components')
  
  // Test mobile button
  await page.locator('[data-testid="mobile-button"]').tap()
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  
  // Test bottom sheet
  await page.locator('[data-testid="open-sheet"]').tap()
  await expect(page.locator('[data-testid="bottom-sheet"]')).toBeVisible()
  
  // Test sheet gesture dismissal
  const sheet = page.locator('[data-testid="bottom-sheet"]')
  await sheet.dragTo(page.locator('body'), { targetPosition: { x: 0, y: 1000 } })
  await expect(sheet).not.toBeVisible()
})
```

### Performance Testing Automation

```typescript
import { test } from '@playwright/test'

test('PWA performance metrics', async ({ page }) => {
  await page.goto('http://localhost:3000')
  
  // Measure Core Web Vitals
  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        resolve(entries.map(entry => ({
          name: entry.name,
          value: entry.value,
          startTime: entry.startTime
        })))
      }).observe({ entryTypes: ['measure', 'navigation'] })
    })
  })
  
  // Assert performance thresholds
  // LCP should be < 2.5s, FID < 100ms, CLS < 0.1
})
```

## Debugging and Troubleshooting

### Common PWA Issues

#### 1. Service Worker Not Registering
```bash
# Debug steps
1. Check browser console for errors
2. Verify service worker file exists at /sw.js
3. Check HTTPS requirement (localhost works)
4. Verify service worker registration code
5. Clear browser cache and try again
```

#### 2. PWA Install Prompt Not Showing
```bash
# Debug checklist
☐ Manifest.json is valid and accessible
☐ Service worker is registered and active
☐ Site is served over HTTPS
☐ PWA criteria met (Lighthouse audit)
☐ User hasn't previously dismissed prompt
☐ Browser supports PWA installation
```

#### 3. Haptic Feedback Not Working
```bash
# Troubleshooting
1. Check device vibration settings
2. Verify navigator.vibrate API support
3. Test with different haptic patterns
4. Check browser console for errors
5. Test on different devices/browsers
```

#### 4. Offline Mode Issues
```bash
# Debug offline functionality
1. Check service worker cache strategy
2. Verify network request interception
3. Test background sync registration
4. Check IndexedDB for queued operations
5. Monitor service worker lifecycle events
```

### Debugging Tools

#### Chrome DevTools PWA Panel
```bash
1. Open DevTools → Application tab
2. Check "Manifest" for manifest.json issues
3. Check "Service Workers" for SW status
4. Use "Storage" to inspect caches
5. Test "Offline" mode simulation
```

#### Service Worker Debugging
```javascript
// Add to service worker for debugging
console.log('SW: Install event')
console.log('SW: Activate event')
console.log('SW: Fetch event for:', event.request.url)

// Performance monitoring
let performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  syncQueueSize: 0
}
```

#### Mobile Device Debugging

##### iOS Safari
```bash
1. Enable Safari Web Inspector (Settings → Safari → Advanced)
2. Connect device to Mac
3. Open Safari → Develop → [Device] → [Page]
4. Use remote inspector for debugging
```

##### Android Chrome
```bash
1. Enable Developer Options on Android
2. Enable USB Debugging
3. Connect to computer
4. Open chrome://inspect in desktop Chrome
5. Select device and page to debug
```

### Performance Debugging

#### Lighthouse CI Integration
```bash
# Add to CI/CD pipeline
npm install -g @lhci/cli

# Run Lighthouse CI
lhci autorun
```

#### Bundle Analysis
```bash
# Analyze bundle sizes
npm run build
npm run analyze

# Check for large dependencies
npx webpack-bundle-analyzer build/static/js/*.js
```

## Testing Checklist Summary

### Pre-Release PWA Testing

#### Core Functionality ✓
- [ ] PWA installs on all target platforms
- [ ] Service worker registers and caches correctly  
- [ ] Offline mode works with graceful degradation
- [ ] Background sync queues and processes operations
- [ ] Push notifications display and handle actions
- [ ] Performance meets Core Web Vitals thresholds

#### Mobile Components ✓
- [ ] All components meet 44px touch target minimum
- [ ] Haptic feedback works on supported devices
- [ ] Camera integration functions properly
- [ ] Native share API works with fallbacks
- [ ] Bottom sheets respond to gestures
- [ ] Form inputs show appropriate keyboards

#### Cross-Platform ✓
- [ ] iOS PWA installation and functionality
- [ ] Android PWA installation and functionality  
- [ ] Desktop PWA works in Chrome/Edge
- [ ] Safe area handling for notched devices
- [ ] Accessibility compliance across platforms

#### Performance ✓
- [ ] Lighthouse PWA score > 90
- [ ] App loads within 3 seconds
- [ ] Smooth animations (60fps)
- [ ] Bundle sizes within targets
- [ ] Cache hit rate > 80%

## Resources

- [PWA Documentation](./pwa.md) - Complete PWA implementation guide
- [Mobile Components](./mobile-components.md) - Mobile component library
- [Chrome DevTools PWA Guide](https://developers.google.com/web/tools/chrome-devtools/progressive-web-apps)
- [Lighthouse PWA Audit](https://developers.google.com/web/tools/lighthouse/audits/pwa)
- [Web App Manifest Testing](https://web.dev/add-manifest/)

---

*This comprehensive testing guide ensures all PWA features are thoroughly validated before production deployment. Regular testing across the device matrix is recommended for optimal user experience.*