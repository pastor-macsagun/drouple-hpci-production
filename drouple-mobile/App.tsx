/**
 * Main App Component
 * Entry point for the Drouple Mobile application
 */

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';

import { queryClient } from '@/lib/api';
import { AppNavigator } from '@/app/navigation/AppNavigator';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { NotificationProvider } from '@/providers/NotificationProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <NotificationProvider>
            <AppNavigator />
            <StatusBar style='auto' />
          </NotificationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
