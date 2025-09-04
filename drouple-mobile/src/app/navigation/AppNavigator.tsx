/**
 * Main App Navigator
 * Handles authenticated vs unauthenticated navigation flows with role-based routing
 */

import React, { useEffect, useRef } from 'react';
import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';

import { useAuthStore } from '@/lib/store/authStore';
import { AuthStack } from './AuthStack';
import { AppTabs } from './AppTabs';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { syncManager } from '@/lib/sync/syncManager';
import { PushNotificationService } from '@/lib/notifications/pushNotificationService';
import { SentryService } from '@/lib/monitoring/sentryService';
import { useRoleCheck } from '@/components/navigation/RoleGuard';

const Stack = createNativeStackNavigator();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, hasCompletedOnboarding, user } = useAuthStore();
  const { canAccessAdmin, canAccessVip, canAccessLeader } = useRoleCheck();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  // Initialize services when app starts
  useEffect(() => {
    initializeServices();

    return () => {
      cleanupServices();
    };
  }, []);

  // Update Sentry context when auth state changes
  useEffect(() => {
    SentryService.updateAuthContext();
  }, [isAuthenticated, user]);

  // Initialize push notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      PushNotificationService.initialize().catch(error => {
        console.error('Failed to initialize push notifications:', error);
        SentryService.captureError(error, {
          feature: 'push_notifications',
          action: 'initialize',
        });
      });
    }
  }, [isAuthenticated, user]);

  const initializeServices = async () => {
    try {
      // Initialize Sentry monitoring
      SentryService.initialize();

      // Initialize sync manager
      await syncManager.initialize();

      console.log('App services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app services:', error);
      SentryService.captureError(error as Error, {
        feature: 'app_initialization',
        action: 'initialize_services',
      });
    }
  };

  const cleanupServices = async () => {
    try {
      await syncManager.shutdown();
      PushNotificationService.cleanup();
      await SentryService.close();

      console.log('App services cleaned up');
    } catch (error) {
      console.error('Error during service cleanup:', error);
    }
  };

  const handleNavigationReady = () => {
    // Add navigation reference to Sentry for crash reports
    if (Platform.OS === 'ios') {
      // iOS specific navigation tracking
      SentryService.addBreadcrumb('Navigation ready', 'navigation', 'info', {
        platform: 'ios',
      });
    } else {
      // Android specific navigation tracking
      SentryService.addBreadcrumb('Navigation ready', 'navigation', 'info', {
        platform: 'android',
      });
    }
  };

  const handleNavigationStateChange = (state: any) => {
    // Track screen changes for analytics
    const currentRouteName = getCurrentRouteName(state);
    if (currentRouteName) {
      SentryService.addBreadcrumb(
        `Navigated to ${currentRouteName}`,
        'navigation',
        'info',
        { screen: currentRouteName }
      );
    }
  };

  const getCurrentRouteName = (navigationState: any): string | undefined => {
    if (!navigationState || !navigationState.routes) {
      return undefined;
    }

    const route = navigationState.routes[navigationState.index];

    if (route.state) {
      return getCurrentRouteName(route.state);
    }

    return route.name;
  };

  const getInitialRouteName = (): string => {
    if (!isAuthenticated) {
      return 'Auth';
    }

    if (!hasCompletedOnboarding) {
      return 'Onboarding';
    }

    // Role-based initial screen determination
    if (canAccessAdmin()) {
      return 'AdminTabs';
    } else if (canAccessVip()) {
      return 'VipTabs';
    } else if (canAccessLeader()) {
      return 'LeaderTabs';
    } else {
      return 'MemberTabs';
    }
  };

  return (
    <ErrorBoundary>
      <NavigationContainer
        ref={navigationRef}
        onReady={handleNavigationReady}
        onStateChange={handleNavigationStateChange}
      >
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={getInitialRouteName()}
        >
          {!isAuthenticated ? (
            // Unauthenticated flow
            <Stack.Screen name='Auth' component={AuthStack} />
          ) : !hasCompletedOnboarding ? (
            // Authenticated but needs onboarding
            <Stack.Screen name='Onboarding' component={AuthStack} />
          ) : (
            // Role-based authenticated flows
            <>
              {canAccessAdmin() && (
                <Stack.Screen name='AdminTabs' component={AppTabs} />
              )}
              {canAccessVip() && (
                <Stack.Screen name='VipTabs' component={AppTabs} />
              )}
              {canAccessLeader() && (
                <Stack.Screen name='LeaderTabs' component={AppTabs} />
              )}
              {/* Default member access */}
              <Stack.Screen name='MemberTabs' component={AppTabs} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
};

export default AppNavigator;
