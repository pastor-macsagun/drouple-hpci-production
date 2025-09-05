/**
 * Root Layout - App Router with navigation, auth, theme providers
 * Deep links, React Query, background sync initialization
 */

import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../theme/provider';
import { backgroundSync } from '../sync/background';
import { subscriptionsManager } from '../realtime/subscriptions';
import { db } from '../data/db';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Add custom fonts here if needed
  });

  useEffect(() => {
    async function initializeApp() {
      try {
        // Initialize database
        await db.initialize();
        
        // Initialize subscriptions manager
        subscriptionsManager.initialize(queryClient);
        
        // Initialize background sync
        await backgroundSync.initialize();
        
        console.log('App initialization complete');
      } catch (error) {
        console.error('App initialization failed:', error);
      }
    }

    initializeApp();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          {/* Auth screens */}
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          
          {/* Main app tabs */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          
          {/* Modal screens */}
          <Stack.Screen 
            name="(modals)" 
            options={{ 
              presentation: 'modal',
              headerShown: false 
            }} 
          />
          
          {/* Check-in modal */}
          <Stack.Screen
            name="checkin"
            options={{
              presentation: 'fullScreenModal',
              headerShown: false,
            }}
          />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}