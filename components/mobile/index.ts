/**
 * Drouple Mobile PWA Components
 * 
 * Native-like mobile components for enhanced PWA experience
 * 
 * Features:
 * - Touch-first interactions with haptic feedback
 * - Pull-to-refresh and swipe gestures
 * - Bottom sheet modals and mobile navigation
 * - Offline-first architecture
 * - Smart caching and performance optimization
 */

// Core mobile interactions
export { PullToRefresh } from './pull-to-refresh';
export { SwipeToDelete } from './swipe-to-delete';
export { MobileList } from './mobile-list';

// Enhanced UI components  
export { MobileButton } from './mobile-button';
export { BottomSheet } from './bottom-sheet';
export { MobileTabs } from './mobile-tabs';

// Form components
export { MobileStepperForm, MobileInput } from './mobile-form';

// Loading states
export {
  Skeleton,
  MobileListSkeleton,
  MobileCardSkeleton,
  MobileSpinner,
  MobileProgressBar,
} from './mobile-loading';

// Offline and notifications
export { OfflineManager } from './offline-manager';
export {
  NotificationManager,
  useMobileNotifications,
  type NotificationType,
  type MobileNotification,
} from './notification-manager';

// Lazy loading utilities
export {
  LazyPullToRefresh,
  LazySwipeToDelete,
  LazyBottomSheet,
  LazyMobileTabs,
  LazyMobileStepperForm,
  LazyOfflineManager,
  LazyNotificationManager,
  MobileLazyWrapper,
  createMobileLazyRoute,
  preloadMobileComponents,
  measureMobileComponentPerformance,
} from '../../lib/mobile-lazy-loading';

// Utilities and hooks
export {
  triggerHapticFeedback,
  supportsHapticFeedback,
  getSafeAreaInsets,
  isPWAStandalone,
  validateTouchTarget,
  addRippleEffect,
  debounce,
  throttle,
} from '../../lib/mobile-utils';

// Caching strategies
export {
  quickCache,
  dataCache,
  imageCache,
  cacheWithFallback,
  prefetchData,
  SmartMobileCache,
  smartCache,
} from '../../lib/mobile-cache-strategies';

/**
 * Quick Setup Guide:
 * 
 * 1. Replace existing modals with BottomSheet
 * 2. Wrap lists with PullToRefresh
 * 3. Add SwipeToDelete to list items
 * 4. Use MobileButton for touch-friendly interactions
 * 5. Implement OfflineManager for offline support
 * 6. Use NotificationManager for mobile alerts
 * 
 * Example:
 * ```tsx
 * import { PullToRefresh, MobileList, BottomSheet } from '@/components/mobile';
 * 
 * function MobileEventsList() {
 *   return (
 *     <PullToRefresh onRefresh={refetchEvents}>
 *       <MobileList 
 *         items={events.map(event => ({
 *           id: event.id,
 *           content: <EventCard event={event} />,
 *           onDelete: () => deleteEvent(event.id),
 *           canDelete: canDeleteEvent(event)
 *         }))}
 *       />
 *     </PullToRefresh>
 *   );
 * }
 * ```
 */