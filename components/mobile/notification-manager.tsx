"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { X, Check, AlertCircle, Info } from "lucide-react";
import { triggerHapticFeedback } from "@/lib/mobile-utils";

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface MobileNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number; // ms, 0 for persistent
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
}

interface NotificationManagerProps {
  notifications: MobileNotification[];
  onRemove: (id: string) => void;
  position?: 'top' | 'bottom';
  maxVisible?: number;
}

export function NotificationManager({
  notifications,
  onRemove,
  position = 'top',
  maxVisible = 3,
}: NotificationManagerProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<MobileNotification[]>([]);

  useEffect(() => {
    // Show only the most recent notifications
    const recent = notifications.slice(-maxVisible);
    setVisibleNotifications(recent);

    // Auto-dismiss notifications with duration
    recent.forEach(notification => {
      if (notification.duration && notification.duration > 0) {
        setTimeout(() => {
          handleDismiss(notification.id);
        }, notification.duration);
      }
    });
  }, [notifications, maxVisible]);

  const handleDismiss = useCallback((id: string) => {
    const notification = notifications.find(n => n.id === id);
    notification?.onDismiss?.();
    onRemove(id);
    triggerHapticFeedback('impact-light');
  }, [notifications, onRemove]);

  const handleAction = useCallback((notification: MobileNotification) => {
    notification.action?.onClick();
    handleDismiss(notification.id);
    triggerHapticFeedback('impact-medium');
  }, [handleDismiss]);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800";
      case 'error':
        return "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800";
      case 'warning':
        return "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800";
      case 'info':
      default:
        return "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800";
    }
  };

  if (visibleNotifications.length === 0) return null;

  return (
    <div
      className={cn(
        "fixed left-4 right-4 z-50 space-y-2",
        position === 'top' ? "top-4" : "bottom-20"
      )}
    >
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className={cn(
            "transform transition-all duration-300 ease-out",
            "translate-y-0 opacity-100 scale-100",
            index > 0 && position === 'top' && "mt-2",
            index > 0 && position === 'bottom' && "mb-2"
          )}
          style={{
            transform: `translateY(${index * (position === 'top' ? 4 : -4)}px) scale(${1 - index * 0.02})`,
            zIndex: 50 - index,
          }}
        >
          <div
            className={cn(
              "border rounded-xl shadow-lg backdrop-blur-sm p-4 min-h-[44px]",
              getStyles(notification.type)
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-ink truncate">
                  {notification.title}
                </h4>
                <p className="text-sm text-ink-muted mt-1 line-clamp-2">
                  {notification.message}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {notification.action && (
                  <button
                    onClick={() => handleAction(notification)}
                    className="text-sm font-medium text-accent hover:text-accent/80 px-2 py-1 rounded hover:bg-white/20 transition-colors min-h-[32px]"
                  >
                    {notification.action.label}
                  </button>
                )}
                
                <button
                  onClick={() => handleDismiss(notification.id)}
                  className="p-1 rounded hover:bg-white/20 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Hook for managing notifications
export function useMobileNotifications() {
  const [notifications, setNotifications] = useState<MobileNotification[]>([]);

  const addNotification = useCallback((notification: Omit<MobileNotification, 'id'>) => {
    const id = Date.now().toString();
    const newNotification: MobileNotification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000, // Default 5 seconds
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Haptic feedback for new notifications
    triggerHapticFeedback(notification.type === 'error' ? 'impact-heavy' : 'impact-light');
    
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((title: string, message: string, options?: Partial<MobileNotification>) => {
    return addNotification({ ...options, type: 'success', title, message });
  }, [addNotification]);

  const showError = useCallback((title: string, message: string, options?: Partial<MobileNotification>) => {
    return addNotification({ ...options, type: 'error', title, message, duration: 0 }); // Errors persist
  }, [addNotification]);

  const showWarning = useCallback((title: string, message: string, options?: Partial<MobileNotification>) => {
    return addNotification({ ...options, type: 'warning', title, message });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message: string, options?: Partial<MobileNotification>) => {
    return addNotification({ ...options, type: 'info', title, message });
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}