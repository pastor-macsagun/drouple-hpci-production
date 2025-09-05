import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { MMKV } from 'react-native-mmkv';

// Create MMKV storage instance
const storage = new MMKV({
  id: 'react-query-cache',
});

// MMKV persister for React Query
const mmkvPersister = {
  persistClient: async (client: any) => {
    storage.set('react-query-cache', JSON.stringify(client));
  },
  restoreClient: () => {
    const cached = storage.getString('react-query-cache');
    return cached ? JSON.parse(cached) : undefined;
  },
  removeClient: async () => {
    storage.delete('react-query-cache');
  },
};

// Create query client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 5 minutes by default
      staleTime: 1000 * 60 * 5,
      // Garbage collect after 10 minutes
      gcTime: 1000 * 60 * 10,
      // Retry failed requests
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus in dev only
      refetchOnWindowFocus: __DEV__,
      // Always refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
});

// Persister configuration
export const persisterOptions = {
  persister: mmkvPersister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
  hydrateOptions: {
    // Only hydrate successful queries
    shouldDehydrateQuery: (query: any) => {
      return query.state.status === 'success';
    },
  },
};

// Clear cache utility
export const clearQueryCache = () => {
  queryClient.clear();
  storage.clearAll();
};