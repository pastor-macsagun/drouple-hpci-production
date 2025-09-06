"use client";

import { useState, useCallback, useEffect } from "react";
import { Bell, BellOff, Settings } from "lucide-react";
import { MobileButton } from "./mobile-button";
import { useMobileNotifications } from "./notification-manager";
import { triggerHapticFeedback } from "@/lib/mobile-utils";

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPermissionState {
  permission: NotificationPermission;
  supported: boolean;
  subscribed: boolean;
}

interface PushNotificationsProps {
  className?: string;
  variant?: "button" | "settings" | "icon";
  onSubscriptionChange?: (subscribed: boolean) => void;
}

export function PushNotifications({
  className,
  variant = "button",
  onSubscriptionChange,
}: PushNotificationsProps) {
  const [state, setState] = useState<NotificationPermissionState>({
    permission: "default",
    supported: false,
    subscribed: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError } = useMobileNotifications();

  // Check notification support and permission on mount
  useEffect(() => {
    checkNotificationSupport();
  }, []);

  const checkNotificationSupport = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) {
      setState(prev => ({ ...prev, supported: false }));
      return;
    }

    const permission = Notification.permission;
    let subscribed = false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      subscribed = !!subscription;
    } catch (error) {
      console.warn('Failed to check push subscription:', error);
    }

    setState({
      permission,
      supported: true,
      subscribed,
    });
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (!state.supported) {
      showError("Not Supported", "Push notifications are not supported on this device");
      return false;
    }

    if (state.permission === "denied") {
      showError("Permission Denied", "Please enable notifications in your browser settings");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));

      if (permission === "granted") {
        triggerHapticFeedback('success');
        return true;
      } else if (permission === "denied") {
        showError("Permission Denied", "Notifications have been blocked");
        return false;
      }

      return false;
    } catch (error) {
      showError("Permission Error", "Failed to request notification permission");
      return false;
    }
  }, [state.supported, state.permission, showError]);

  const subscribeToPushNotifications = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Request permission first
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) return;

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Subscribe to push notifications
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicKey) {
          showError("Configuration Error", "Push notifications not properly configured");
          return;
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        });
      }

      // Send subscription to server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
        }),
      });

      setState(prev => ({ ...prev, subscribed: true }));
      onSubscriptionChange?.(true);
      
      triggerHapticFeedback('success');
      showSuccess("Notifications Enabled", "You'll receive updates about church events");

    } catch (error) {
      triggerHapticFeedback('error');
      console.error('Failed to subscribe to push notifications:', error);
      showError("Subscription Failed", "Unable to enable push notifications");
    } finally {
      setIsLoading(false);
    }
  }, [requestNotificationPermission, onSubscriptionChange, showSuccess, showError]);

  const unsubscribeFromPushNotifications = useCallback(async () => {
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Notify server
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        });
      }

      setState(prev => ({ ...prev, subscribed: false }));
      onSubscriptionChange?.(false);

      triggerHapticFeedback('success');
      showSuccess("Notifications Disabled", "You won't receive push notifications");

    } catch (error) {
      triggerHapticFeedback('error');
      console.error('Failed to unsubscribe from push notifications:', error);
      showError("Unsubscribe Failed", "Unable to disable push notifications");
    } finally {
      setIsLoading(false);
    }
  }, [onSubscriptionChange, showSuccess, showError]);

  const handleToggle = useCallback(() => {
    if (state.subscribed) {
      unsubscribeFromPushNotifications();
    } else {
      subscribeToPushNotifications();
    }
  }, [state.subscribed, subscribeToPushNotifications, unsubscribeFromPushNotifications]);

  if (!state.supported) {
    return null;
  }

  if (variant === "icon") {
    return (
      <MobileButton
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        disabled={isLoading}
        className={className}
        hapticFeedback={false}
        title={state.subscribed ? "Disable notifications" : "Enable notifications"}
      >
        {state.subscribed ? (
          <Bell className="w-5 h-5 text-accent" />
        ) : (
          <BellOff className="w-5 h-5" />
        )}
      </MobileButton>
    );
  }

  if (variant === "settings") {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-elevated rounded-lg">
              <Bell className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-medium text-ink">Push Notifications</h3>
              <p className="text-sm text-ink-muted">
                Get updates about events and activities
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <MobileButton
              variant="ghost"
              size="icon"
              onClick={handleToggle}
              disabled={isLoading}
              hapticFeedback={false}
            >
              <Settings className="w-4 h-4" />
            </MobileButton>
          </div>
        </div>

        {state.permission === "denied" && (
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <p className="text-sm text-warning">
              Notifications are blocked. Enable them in your browser settings.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <MobileButton
      onClick={handleToggle}
      disabled={isLoading || !state.supported}
      variant={state.subscribed ? "outline" : "default"}
      className={className}
      hapticFeedback={false}
    >
      {isLoading ? (
        "Processing..."
      ) : (
        <>
          {state.subscribed ? (
            <BellOff className="w-4 h-4 mr-2" />
          ) : (
            <Bell className="w-4 h-4 mr-2" />
          )}
          {state.subscribed ? "Disable Notifications" : "Enable Notifications"}
        </>
      )}
    </MobileButton>
  );
}

// Hook for programmatic notification management
export function usePushNotifications() {
  const { showSuccess, showError } = useMobileNotifications();
  const [isSubscribed, setIsSubscribed] = useState(false);

  const checkSubscription = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      const subscribed = !!subscription;
      setIsSubscribed(subscribed);
      return subscribed;
    } catch (error) {
      return false;
    }
  }, []);

  const sendTestNotification = useCallback(async () => {
    try {
      await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      showSuccess("Test Sent", "Check your notifications");
      triggerHapticFeedback('success');
    } catch (error) {
      showError("Test Failed", "Unable to send test notification");
      triggerHapticFeedback('error');
    }
  }, [showSuccess, showError]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  return {
    isSubscribed,
    checkSubscription,
    sendTestNotification,
  };
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Rich notification content builder
export interface NotificationContent {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: any;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number | number[];
}

export function createRichNotification(content: NotificationContent): NotificationContent {
  return {
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    ...content,
    data: {
      url: '/',
      timestamp: Date.now(),
      ...content.data,
    },
  };
}