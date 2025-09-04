/**
 * React Query Configuration
 * Query client setup with offline support and error handling
 */

import { QueryClient } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { APP_CONFIG } from '../../config/app';

// Network-aware focus manager
const focusManager = {
  setEventListener: (setFocused: (focused: boolean) => void) => {
    return NetInfo.addEventListener(state => {
      setFocused(state.isConnected ?? false);
    });
  },
};

// Query client configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - data considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      
      // Cache time - data kept in cache for 10 minutes after last reference
      cacheTime: 10 * 60 * 1000,
      
      // Retry configuration
      retry: (failureCount, error: any) => {
        // Don't retry 4xx errors (except 408, 429)
        if (error?.status >= 400 && error?.status < 500) {
          if (error.status === 408 || error.status === 429) {
            return failureCount < 2; // Retry timeout and rate limit errors
          }
          return false; // Don't retry other 4xx errors
        }
        
        // Retry other errors up to 3 times
        return failureCount < 3;
      },
      
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Network mode - online by default, allow offline queries for cached data
      networkMode: 'online',
      
      // Refetch on reconnect
      refetchOnReconnect: 'always',
      
      // Refetch on window focus
      refetchOnWindowFocus: false,
      
      // Enable background updates
      refetchOnMount: true,
    },
    mutations: {
      // Retry mutations on network errors only
      retry: (failureCount, error: any) => {
        if (error?.name === 'NetworkError' && failureCount < 3) {
          return true;
        }
        return false;
      },
      
      // Network mode for mutations
      networkMode: 'online',
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  // Authentication
  auth: {
    all: ['auth'] as const,
    profile: () => [...queryKeys.auth.all, 'profile'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
  },
  
  // Check-ins
  checkin: {
    all: ['checkin'] as const,
    services: () => [...queryKeys.checkin.all, 'services'] as const,
    history: (userId?: string) => [...queryKeys.checkin.all, 'history', userId] as const,
  },
  
  // Events
  events: {
    all: ['events'] as const,
    list: (filter?: string) => [...queryKeys.events.all, 'list', filter] as const,
    detail: (id: string) => [...queryKeys.events.all, 'detail', id] as const,
    userRsvps: (userId?: string) => [...queryKeys.events.all, 'rsvps', userId] as const,
  },
  
  // Life Groups
  groups: {
    all: ['groups'] as const,
    list: () => [...queryKeys.groups.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.groups.all, 'detail', id] as const,
    userGroups: (userId?: string) => [...queryKeys.groups.all, 'userGroups', userId] as const,
  },
  
  // Pathways
  pathways: {
    all: ['pathways'] as const,
    list: () => [...queryKeys.pathways.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.pathways.all, 'detail', id] as const,
    progress: (userId?: string) => [...queryKeys.pathways.all, 'progress', userId] as const,
  },
  
  // Directory
  directory: {
    all: ['directory'] as const,
    search: (query?: string) => [...queryKeys.directory.all, 'search', query] as const,
  },
} as const;

// Mutation keys for optimistic updates
export const mutationKeys = {
  auth: {
    login: 'auth-login',
    logout: 'auth-logout',
    refreshToken: 'auth-refresh',
    updateProfile: 'auth-update-profile',
  },
  checkin: {
    checkIn: 'checkin-check-in',
  },
  events: {
    rsvp: 'events-rsvp',
    cancelRsvp: 'events-cancel-rsvp',
  },
} as const;

// Error handling utilities
export const handleQueryError = (error: any, queryKey: string[]) => {
  console.error(`Query error [${queryKey.join('.')}]:`, error);
  
  // Log to crash reporting service if enabled
  if (APP_CONFIG.features.enableCrashReporting && error.status >= 500) {
    // Could integrate with Sentry here
    console.error('Server error logged for crash reporting');
  }
};

// Optimistic update helpers
export const optimisticUpdate = {
  // Add item to list
  addToList: <T extends { id: string }>(
    queryKey: readonly unknown[],
    newItem: T
  ) => {
    queryClient.setQueryData<T[]>(queryKey, (old) => {
      if (!old) return [newItem];
      return [...old, newItem];
    });
  },
  
  // Remove item from list
  removeFromList: <T extends { id: string }>(
    queryKey: readonly unknown[],
    itemId: string
  ) => {
    queryClient.setQueryData<T[]>(queryKey, (old) => {
      if (!old) return [];
      return old.filter(item => item.id !== itemId);
    });
  },
  
  // Update item in list
  updateInList: <T extends { id: string }>(
    queryKey: readonly unknown[],
    itemId: string,
    updates: Partial<T>
  ) => {
    queryClient.setQueryData<T[]>(queryKey, (old) => {
      if (!old) return [];
      return old.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      );
    });
  },
};

// Cache invalidation helpers
export const invalidateQueries = {
  // Invalidate all auth-related queries
  auth: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.all }),
  
  // Invalidate all checkin-related queries
  checkin: () => queryClient.invalidateQueries({ queryKey: queryKeys.checkin.all }),
  
  // Invalidate all events-related queries
  events: () => queryClient.invalidateQueries({ queryKey: queryKeys.events.all }),
  
  // Invalidate specific event
  event: (eventId: string) => 
    queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) }),
  
  // Invalidate all data (useful after auth state changes)
  all: () => queryClient.invalidateQueries(),
};

// Prefetch helpers
export const prefetchQueries = {
  // Prefetch user profile
  profile: () => queryClient.prefetchQuery({
    queryKey: queryKeys.auth.profile(),
    staleTime: 30000, // 30 seconds
  }),
  
  // Prefetch upcoming events
  upcomingEvents: () => queryClient.prefetchQuery({
    queryKey: queryKeys.events.list('upcoming'),
    staleTime: 60000, // 1 minute
  }),
};

export default queryClient;