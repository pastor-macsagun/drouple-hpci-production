# Mobile Component Library

## Overview

Drouple's mobile component library provides 11+ native-like mobile components designed for touch-optimized interactions, haptic feedback, and seamless PWA experiences. All components follow iOS Human Interface Guidelines and Android Material Design principles.

## Table of Contents

1. [Core Components](#core-components)
2. [Touch Interaction Components](#touch-interaction-components)
3. [Navigation Components](#navigation-components)
4. [Media Components](#media-components)
5. [Utility Components](#utility-components)
6. [Hooks and Utilities](#hooks-and-utilities)
7. [Styling Guidelines](#styling-guidelines)
8. [Accessibility Features](#accessibility-features)
9. [Testing Components](#testing-components)

## Core Components

### 1. MobileButton

Touch-optimized button with automatic haptic feedback and native styling.

**Location**: `/components/mobile/mobile-button.tsx`

**Features**:
- 16+ haptic feedback patterns
- Touch target validation (44px minimum)
- Ripple effect animation
- Loading states with spinner
- Multiple variants and sizes

**Usage**:
```typescript
import { MobileButton } from '@/components/mobile/mobile-button'

// Basic button
<MobileButton onClick={handleClick}>
  Submit
</MobileButton>

// With custom haptic feedback
<MobileButton 
  hapticFeedback="success"
  variant="primary"
  size="large"
  disabled={isLoading}
>
  {isLoading ? 'Processing...' : 'Save Changes'}
</MobileButton>

// Icon button
<MobileButton variant="ghost" size="icon">
  <Heart className="w-5 h-5" />
</MobileButton>
```

**Props**:
```typescript
interface MobileButtonProps {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'default' | 'lg' | 'icon'
  hapticFeedback?: HapticType | false
  disabled?: boolean
  loading?: boolean
  children: React.ReactNode
  onClick?: () => void
  className?: string
}
```

### 2. MobileForm

Native-style form components with enhanced touch interactions.

**Location**: `/components/mobile/mobile-form.tsx`

**Features**:
- Touch-optimized inputs
- Native-style focus states
- Automatic validation feedback
- Keyboard type optimization
- Label animations

**Usage**:
```typescript
import { MobileForm, MobileInput, MobileTextarea } from '@/components/mobile/mobile-form'

<MobileForm onSubmit={handleSubmit}>
  <MobileInput
    label="Full Name"
    value={name}
    onChange={setName}
    placeholder="Enter your name"
    required
  />
  
  <MobileInput
    label="Email"
    type="email"
    value={email}
    onChange={setEmail}
    keyboardType="email"
    autoComplete="email"
  />
  
  <MobileTextarea
    label="Message"
    value={message}
    onChange={setMessage}
    rows={4}
    maxLength={500}
    showCounter
  />
</MobileForm>
```

### 3. BottomSheet

Native-style modal presentation with gesture support and multiple snap points.

**Location**: `/components/mobile/bottom-sheet.tsx`

**Features**:
- Gesture-based dismissal
- Multiple snap points
- Spring animations
- Backdrop blur
- Safe area handling

**Usage**:
```typescript
import { BottomSheet } from '@/components/mobile/bottom-sheet'

<BottomSheet
  isOpen={isOpen}
  onClose={handleClose}
  title="Event Actions"
  subtitle="Choose an action"
  snapPoints={[0.3, 0.6, 0.9]}
  defaultSnapPoint={0.6}
  enableGestures
>
  <div className="p-4 space-y-4">
    <MobileButton variant="outline" onClick={handleEdit}>
      Edit Event
    </MobileButton>
    <MobileButton variant="destructive" onClick={handleDelete}>
      Delete Event
    </MobileButton>
  </div>
</BottomSheet>
```

## Touch Interaction Components

### 4. PullToRefresh

Native pull-to-refresh implementation with haptic feedback.

**Location**: `/components/mobile/pull-to-refresh.tsx`

**Usage**:
```typescript
import { PullToRefresh } from '@/components/mobile/pull-to-refresh'

<PullToRefresh onRefresh={handleRefresh} isRefreshing={isLoading}>
  <div className="space-y-4">
    {/* Your content */}
  </div>
</PullToRefresh>
```

### 5. MobileTabs

Touch-optimized tab navigation with swipe gestures.

**Location**: `/components/mobile/mobile-tabs.tsx`

**Usage**:
```typescript
import { MobileTabs } from '@/components/mobile/mobile-tabs'

const tabs = [
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'groups', label: 'Groups', icon: Users },
  { id: 'pathways', label: 'Pathways', icon: BookOpen }
]

<MobileTabs
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  enableSwipe
  showIcons
/>
```

## Navigation Components

### 6. MobileLoading

Progressive loading states with skeleton screens and native animations.

**Location**: `/components/mobile/mobile-loading.tsx`

**Usage**:
```typescript
import { MobileLoading, MobileSkeleton } from '@/components/mobile/mobile-loading'

// Full screen loading
<MobileLoading 
  message="Loading events..."
  showSpinner
  showProgress
  progress={loadingProgress}
/>

// Skeleton loading
<MobileSkeleton variant="card" count={3} />
<MobileSkeleton variant="list" count={5} />
<MobileSkeleton variant="text" lines={3} />
```

## Media Components

### 7. CameraCapture

Native camera integration with gallery selection and file validation.

**Location**: `/components/mobile/camera-capture.tsx`

**Features**:
- Camera capture with environment facing
- Gallery photo selection
- File size and type validation
- Image preview with metadata
- Permission handling

**Usage**:
```typescript
import { CameraCapture, ImagePreview } from '@/components/mobile/camera-capture'

const [selectedFile, setSelectedFile] = useState<File | null>(null)

<CameraCapture
  variant="both" // 'camera' | 'gallery' | 'both'
  onCapture={setSelectedFile}
  accept="image/*"
  maxSizeMB={5}
  onError={handleError}
/>

{selectedFile && (
  <ImagePreview
    file={selectedFile}
    onRemove={() => setSelectedFile(null)}
  />
)}
```

### 8. NativeShare

Native Web Share API integration with clipboard fallback.

**Location**: `/components/mobile/native-share.tsx`

**Features**:
- Native sharing with Web Share API
- File sharing support (when available)
- Clipboard fallback for unsupported devices
- Multiple display variants
- Share analytics

**Usage**:
```typescript
import { NativeShare, useNativeShare } from '@/components/mobile/native-share'

// Component usage
<NativeShare
  data={{
    title: "Sunday Service",
    text: "Join us this Sunday at 10 AM",
    url: "https://church.com/events/sunday-service",
    files: [imageFile] // optional
  }}
  variant="icon"
  fallbackText="Share Event"
/>

// Hook usage
const { share, canShare } = useNativeShare()

const handleShare = async () => {
  if (canShare()) {
    await share({
      title: "Church Event",
      text: "You're invited!",
      url: window.location.href
    })
  }
}
```

## Utility Components

### 9. NotificationManager

Toast notification system with haptic feedback and stacking.

**Location**: `/components/mobile/notification-manager.tsx`

**Usage**:
```typescript
import { useMobileNotifications } from '@/components/mobile/notification-manager'

const { showSuccess, showError, showWarning, showInfo } = useMobileNotifications()

// Success notification
showSuccess("Saved!", "Your changes have been saved successfully")

// Error notification
showError("Failed to save", "Please check your connection and try again")

// Warning with action
showWarning("Unsaved changes", "Do you want to save before leaving?", {
  action: {
    label: "Save",
    handler: handleSave
  }
})

// Custom notification
showInfo("New feature!", "Check out our new mobile interface", {
  duration: 5000,
  persistent: true,
  icon: '🎉'
})
```

### 10. OfflineManager

Offline state management with sync queue and connectivity monitoring.

**Location**: `/components/mobile/offline-manager.tsx`

**Usage**:
```typescript
import { OfflineManager, useOfflineStatus } from '@/components/mobile/offline-manager'

// Component usage
<OfflineManager>
  {/* Your app content */}
</OfflineManager>

// Hook usage
const { isOnline, isOffline, syncQueue } = useOfflineStatus()

if (isOffline && syncQueue.length > 0) {
  return (
    <div className="offline-banner">
      {syncQueue.length} actions queued for sync
    </div>
  )
}
```

## Hooks and Utilities

### Mobile Utilities

**Location**: `/lib/mobile-utils.ts`

#### Haptic Feedback

```typescript
import { triggerHapticFeedback, supportsHapticFeedback } from '@/lib/mobile-utils'

// Check support
if (supportsHapticFeedback()) {
  triggerHapticFeedback('success')
}

// Available patterns
type HapticType = 
  | 'selection' | 'impact-light' | 'impact-medium' | 'impact-heavy'
  | 'success' | 'warning' | 'error' | 'notification'
  | 'tap' | 'double-tap' | 'long-press' | 'swipe'
  | 'refresh' | 'delete' | 'toggle' | 'scroll-end'
```

#### PWA Detection

```typescript
import { isPWAStandalone, getSafeAreaInsets } from '@/lib/mobile-utils'

// PWA detection
const isStandalone = isPWAStandalone()

// Safe area handling
const insets = getSafeAreaInsets()
```

#### Touch Validation

```typescript
import { validateTouchTarget } from '@/lib/mobile-utils'

// Validate 44px minimum touch target
const button = document.getElementById('my-button')
const isValidTouchTarget = validateTouchTarget(button)
```

#### Performance Utilities

```typescript
import { debounce, throttle } from '@/lib/mobile-utils'

// Debounce user input
const debouncedSearch = debounce(handleSearch, 300)

// Throttle scroll events
const throttledScroll = throttle(handleScroll, 16)
```

### PWA Hooks

```typescript
import { usePWA } from '@/lib/pwa/use-pwa'

const { 
  isOnline, 
  isInstalled, 
  canInstall, 
  install, 
  syncStatus 
} = usePWA()

// Install PWA
if (canInstall) {
  await install()
}
```

## Styling Guidelines

### Design Tokens

Mobile components use CSS custom properties for consistent theming:

```css
/* Touch targets */
.touch-target-44 {
  min-height: 44px;
  min-width: 44px;
}

/* Safe area support */
.safe-area-top {
  padding-top: max(env(safe-area-inset-top), 1rem);
}

/* Spring animations */
.spring-animation {
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Haptic feedback states */
.haptic-feedback:active {
  transform: scale(0.95);
  transition: transform 0.1s ease-out;
}
```

### Responsive Breakpoints

```css
/* Mobile first approach */
.mobile-component {
  /* Mobile styles (default) */
}

@media (min-width: 768px) {
  .mobile-component {
    /* Tablet adaptations */
  }
}

@media (min-width: 1024px) {
  .mobile-component {
    /* Desktop adaptations */
  }
}
```

### Dark Mode Support

```css
/* Automatic dark mode support */
.mobile-component {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}

/* iOS-style dark mode */
@media (prefers-color-scheme: dark) {
  .ios-style {
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(20px);
  }
}
```

## Accessibility Features

### Touch Accessibility

- **Minimum Touch Targets**: 44px minimum as per WCAG AA
- **Focus Indicators**: High-contrast focus rings
- **Screen Reader Support**: ARIA labels and descriptions
- **Keyboard Navigation**: Full keyboard navigation support

### Implementation

```typescript
// Touch target validation
<MobileButton
  className="min-h-[44px] min-w-[44px]"
  aria-label="Save changes"
  title="Save your changes"
>
  Save
</MobileButton>

// Screen reader support
<div 
  role="button"
  tabIndex={0}
  aria-pressed={isPressed}
  aria-describedby="button-help"
  onKeyDown={handleKeyDown}
>
  <span id="button-help" className="sr-only">
    Press Enter or Space to activate
  </span>
</div>
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .mobile-component {
    animation: none !important;
    transition: none !important;
  }
  
  .spring-animation {
    transition: opacity 0.2s ease;
  }
}
```

## Testing Components

### Unit Testing

```typescript
import { render, fireEvent } from '@testing-library/react'
import { MobileButton } from '@/components/mobile/mobile-button'

describe('MobileButton', () => {
  it('triggers haptic feedback on click', () => {
    const mockVibrate = jest.fn()
    Object.defineProperty(navigator, 'vibrate', { value: mockVibrate })

    const { getByRole } = render(
      <MobileButton hapticFeedback="tap">Test</MobileButton>
    )

    fireEvent.click(getByRole('button'))
    expect(mockVibrate).toHaveBeenCalledWith(15)
  })

  it('meets touch target requirements', () => {
    const { getByRole } = render(<MobileButton>Test</MobileButton>)
    const button = getByRole('button')
    
    const styles = window.getComputedStyle(button)
    expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44)
    expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44)
  })
})
```

### Integration Testing

```typescript
import { test, expect } from '@playwright/test'

test('mobile component interactions', async ({ page }) => {
  await page.goto('/mobile-test')
  
  // Test touch interactions
  await page.locator('[data-testid="mobile-button"]').tap()
  await expect(page.locator('.success-message')).toBeVisible()
  
  // Test bottom sheet
  await page.locator('[data-testid="open-sheet"]').tap()
  await expect(page.locator('.bottom-sheet')).toBeVisible()
  
  // Test gesture dismissal
  await page.locator('.bottom-sheet').swipeDown()
  await expect(page.locator('.bottom-sheet')).not.toBeVisible()
})
```

## Component Development Guidelines

### Creating New Mobile Components

1. **Follow naming convention**: `Mobile[ComponentName]`
2. **Include haptic feedback**: Use appropriate haptic patterns
3. **Support touch targets**: Minimum 44px touch areas
4. **Handle loading states**: Show appropriate loading feedback
5. **Include accessibility**: ARIA labels, keyboard navigation
6. **Add documentation**: Include usage examples and props
7. **Write tests**: Unit and integration tests

### Template

```typescript
'use client'

import { useState, useCallback } from 'react'
import { triggerHapticFeedback } from '@/lib/mobile-utils'
import { cn } from '@/lib/utils'

interface MobileComponentProps {
  // Props interface
}

export function MobileComponent({ ...props }: MobileComponentProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleInteraction = useCallback(async () => {
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
  }, [])

  return (
    <div
      className={cn(
        'touch-target-44 transition-all duration-200',
        'active:scale-95 focus:outline-none focus:ring-2',
        props.className
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleInteraction()
        }
      }}
    >
      {/* Component JSX */}
    </div>
  )
}
```

## Performance Considerations

### Lazy Loading

```typescript
import { lazy, Suspense } from 'react'
import { MobileLoading } from '@/components/mobile/mobile-loading'

const HeavyMobileComponent = lazy(() => import('./heavy-mobile-component'))

<Suspense fallback={<MobileLoading message="Loading component..." />}>
  <HeavyMobileComponent />
</Suspense>
```

### Virtualization

```typescript
import { FixedSizeList as List } from 'react-window'

<List
  height={400}
  itemCount={items.length}
  itemSize={60}
  itemData={items}
>
  {({ index, style, data }) => (
    <div style={style}>
      <MobileListItem item={data[index]} />
    </div>
  )}
</List>
```

## Resources

- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Guidelines](https://material.io/design)
- [WCAG 2.1 Touch Target Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [PWA Documentation](./pwa.md)
- [PWA Testing Guide](./pwa-testing.md)

---

*This documentation covers the complete mobile component library as of September 2025. Components are production-ready and extensively tested across iOS and Android devices.*