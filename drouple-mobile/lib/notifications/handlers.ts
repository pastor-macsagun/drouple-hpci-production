import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';

export interface NotificationData {
  id: string;
  type: 'announcement' | 'event' | 'prayer_request' | 'pathway' | 'general';
  targetId?: string; // ID of the target resource (event, announcement, etc.)
  deepLink?: string; // Custom deep link
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Handle notification received while app is in foreground
 */
export async function handleNotificationReceived(
  notification: Notifications.Notification
) {
  console.log('Notification received:', notification);
  
  // Show in-app notification or custom UI
  // You can customize this based on your app's UX
  
  const data = notification.request.content.data as NotificationData;
  
  // Track CTR metric (notification displayed)
  await trackNotificationMetric(data.id, 'displayed');
}

/**
 * Handle notification response (user tapped notification or action)
 */
export async function handleNotificationResponse(
  response: Notifications.NotificationResponse
) {
  console.log('Notification response:', response);
  
  const data = response.notification.request.content.data as NotificationData;
  const actionIdentifier = response.actionIdentifier;
  
  // Track CTR metric (notification tapped)
  await trackNotificationMetric(data.id, 'tapped', actionIdentifier);
  
  // Handle action-specific responses (iOS categories)
  if (actionIdentifier && actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
    await handleNotificationAction(actionIdentifier, data);
    return;
  }
  
  // Handle default tap - deep link to correct screen
  await handleNotificationDeepLink(data);
}

/**
 * Handle notification action responses (iOS category actions)
 */
async function handleNotificationAction(actionIdentifier: string, data: NotificationData) {
  switch (actionIdentifier) {
    case 'rsvp_yes':
      if (data.targetId) {
        // Handle RSVP yes action
        await handleEventRsvp(data.targetId, 'GOING');
      }
      break;
      
    case 'rsvp_no':
      if (data.targetId) {
        // Handle RSVP no action  
        await handleEventRsvp(data.targetId, 'CANCELLED');
      }
      break;
      
    case 'mark_prayed':
      if (data.targetId) {
        // Handle mark as prayed action
        await handlePrayerPrayed(data.targetId);
      }
      break;
      
    case 'view_request':
      // Navigate to prayer request
      if (data.targetId) {
        router.push(`/prayer-requests/${data.targetId}`);
      }
      break;
      
    default:
      console.log('Unknown action identifier:', actionIdentifier);
  }
}

/**
 * Handle deep linking from notification tap
 * Route to correct screen based on notification type and data
 */
async function handleNotificationDeepLink(data: NotificationData) {
  switch (data.type) {
    case 'announcement':
      if (data.targetId) {
        router.push(`/announcements/${data.targetId}`);
      } else {
        router.push('/announcements');
      }
      break;
      
    case 'event':
      if (data.targetId) {
        router.push(`/events/${data.targetId}`);
      } else {
        router.push('/events');
      }
      break;
      
    case 'prayer_request':
      if (data.targetId) {
        router.push(`/prayer-requests/${data.targetId}`);
      } else {
        router.push('/prayer-requests');
      }
      break;
      
    case 'pathway':
      if (data.targetId) {
        router.push(`/pathways/${data.targetId}`);
      } else {
        router.push('/pathways');
      }
      break;
      
    case 'general':
    default:
      // Navigate to home/dashboard
      router.push('/dashboard');
      break;
  }
}

/**
 * Handle RSVP action from notification
 */
async function handleEventRsvp(eventId: string, status: 'GOING' | 'CANCELLED') {
  try {
    // This would call your API client
    // await apiClient.post(`/api/v2/events/${eventId}/rsvp`, { status });
    console.log(`RSVP ${status} for event ${eventId}`);
    
    // Optionally show success message
    // showToast(`RSVP updated to ${status.toLowerCase()}`);
  } catch (error) {
    console.error('RSVP action failed:', error);
    // Optionally show error message or navigate to event page
    router.push(`/events/${eventId}`);
  }
}

/**
 * Handle mark as prayed action
 */
async function handlePrayerPrayed(prayerRequestId: string) {
  try {
    // This would call your API client
    // await apiClient.post(`/api/v2/prayer-requests/${prayerRequestId}/prayed`);
    console.log(`Marked prayer request ${prayerRequestId} as prayed`);
    
    // Optionally show success message
    // showToast('Marked as prayed');
  } catch (error) {
    console.error('Mark as prayed failed:', error);
  }
}

/**
 * Track notification metrics for CTR analysis
 * Record push CTR metric (screen open from notification) as per PRD
 */
async function trackNotificationMetric(
  notificationId: string, 
  action: 'displayed' | 'tapped' | 'action',
  actionIdentifier?: string
) {
  try {
    const metric = {
      notificationId,
      action,
      actionIdentifier,
      timestamp: new Date().toISOString(),
    };
    
    console.log('Notification metric:', metric);
    
    // This would send to your analytics/API endpoint
    // await apiClient.post('/api/v2/analytics/notification-metrics', metric);
  } catch (error) {
    console.error('Failed to track notification metric:', error);
  }
}

/**
 * Set up notification handlers
 * Call this in your app's root component
 */
export function setupNotificationHandlers() {
  // Set notification handler for foreground notifications
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // Listen for notifications received while app is foregrounded
  const notificationListener = Notifications.addNotificationReceivedListener(
    handleNotificationReceived
  );

  // Listen for notification responses (user tapped notification)
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    handleNotificationResponse
  );

  // Listen for URL scheme deep links (in case of custom schemes)
  const urlListener = Linking.addEventListener('url', ({ url }) => {
    console.log('Deep link received:', url);
    handleDeepLink(url);
  });

  // Return cleanup function
  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
    urlListener?.remove();
  };
}

/**
 * Handle custom deep links
 */
function handleDeepLink(url: string) {
  // Parse the URL and route accordingly
  // Example: drouple://events/123
  try {
    const parsed = Linking.parse(url);
    
    if (parsed.path) {
      router.push(parsed.path as any);
    } else if (parsed.queryParams?.screen) {
      router.push(parsed.queryParams.screen as any);
    }
  } catch (error) {
    console.error('Failed to handle deep link:', error);
  }
}

/**
 * Initialize notification system on app start
 * Handles initial notification if app was opened by notification
 */
export async function initializeNotifications() {
  // Check if app was opened by a notification
  const initialNotification = await Notifications.getLastNotificationResponseAsync();
  
  if (initialNotification) {
    console.log('App opened by notification:', initialNotification);
    await handleNotificationResponse(initialNotification);
  }
  
  // Set up handlers
  return setupNotificationHandlers();
}