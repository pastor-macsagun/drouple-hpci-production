/**
 * React Query Provider
 * Wraps the app with QueryClient and provides error boundaries
 */

import React, { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/api/react-query';
import { APP_CONFIG } from '../config/app';

// Development tools - only in dev mode
let ReactQueryDevtools: React.ComponentType | null = null;
if (__DEV__) {
  try {
    const { ReactQueryDevtools: DevTools } = require('@tanstack/react-query-devtools');
    ReactQueryDevtools = DevTools;
  } catch {
    // Devtools not available
  }
}

interface QueryProviderProps extends PropsWithChildren {}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {ReactQueryDevtools && APP_CONFIG.isDevelopment && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
};

export default QueryProvider;