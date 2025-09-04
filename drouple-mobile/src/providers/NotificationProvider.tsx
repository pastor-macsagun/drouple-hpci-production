/**
 * Notification Provider
 * Handles app-level notification initialization and management
 */

import React, { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuthStore } from '@/lib/store/authStore';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const { user } = useAuthStore();
  const { initialize, isInitialized } = useNotifications();

  useEffect(() => {
    // Initialize notifications when user is authenticated
    if (user && !isInitialized) {
      console.log('Initializing notifications for authenticated user');
      initialize().catch(error => {
        console.error('Failed to initialize notifications:', error);
      });
    }
  }, [user, isInitialized, initialize]);

  return <>{children}</>;
};

export default NotificationProvider;
