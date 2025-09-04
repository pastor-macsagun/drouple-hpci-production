/**
 * Authentication API Hooks
 * React Query hooks for authentication operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthService } from '../../lib/api/services/auth';
import { queryKeys, invalidateQueries, handleQueryError } from '../../lib/api/react-query';
import { useAuthStore } from '../../lib/store/authStore';
import type { LoginRequest, ProfileUpdateRequest } from '../../lib/api/services/auth';

/**
 * Hook for user profile query
 */
export const useProfile = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  return useQuery({
    queryKey: queryKeys.auth.profile(),
    queryFn: AuthService.getProfile,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error) => handleQueryError(error, queryKeys.auth.profile()),
  });
};

/**
 * Hook for login mutation
 */
export const useLogin = () => {
  const queryClient = useQueryClient();
  const authStore = useAuthStore();
  
  return useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: (credentials: LoginRequest) => authStore.login(credentials),
    onSuccess: (data) => {
      // Invalidate and refetch auth-related queries
      invalidateQueries.auth();
      
      // Set user in store (already done in store but keeping for consistency)
      authStore.setUser(data.user);
      
      // Prefetch user profile
      queryClient.prefetchQuery({
        queryKey: queryKeys.auth.profile(),
        queryFn: AuthService.getProfile,
      });
    },
    onError: (error) => {
      console.error('Login mutation error:', error);
      authStore.clearError();
    },
  });
};

/**
 * Hook for logout mutation
 */
export const useLogout = () => {
  const queryClient = useQueryClient();
  const authStore = useAuthStore();
  
  return useMutation({
    mutationKey: ['auth', 'logout'],
    mutationFn: () => authStore.logout(),
    onSuccess: () => {
      // Clear all cached data on logout
      queryClient.clear();
    },
    onError: (error) => {
      console.error('Logout mutation error:', error);
      // Still clear cache even if logout fails
      queryClient.clear();
    },
  });
};

/**
 * Hook for token refresh mutation
 */
export const useRefreshToken = () => {
  const authStore = useAuthStore();
  
  return useMutation({
    mutationKey: ['auth', 'refresh'],
    mutationFn: () => authStore.refreshToken(),
    onError: (error) => {
      console.error('Token refresh error:', error);
      // Auth store already handles clearing state on refresh failure
    },
  });
};

/**
 * Hook for profile update mutation
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: ['auth', 'update-profile'],
    mutationFn: (updates: ProfileUpdateRequest) => AuthService.updateProfile(updates),
    onSuccess: (data) => {
      // Update cached profile data
      queryClient.setQueryData(queryKeys.auth.profile(), data);
      
      // Update user in auth store
      useAuthStore.getState().setUser(data.user);
    },
    onError: (error) => {
      console.error('Update profile mutation error:', error);
    },
  });
};

/**
 * Hook for health check query
 */
export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['auth', 'health'],
    queryFn: AuthService.healthCheck,
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 60 * 1000, // 1 minute
    retry: 2,
    refetchOnMount: true,
    refetchOnReconnect: true,
    onError: (error) => handleQueryError(error, ['auth', 'health']),
  });
};

/**
 * Hook to get current auth status from store
 */
export const useAuthStatus = () => {
  return useAuthStore(state => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    getUserRole: state.getUserRole,
    hasRole: state.hasRole,
    isAdmin: state.isAdmin,
    isLeader: state.isLeader,
  }));
};

/**
 * Hook to get current user with optimistic updates
 */
export const useCurrentUser = () => {
  const { user, isAuthenticated } = useAuthStatus();
  const { data: profileData, isLoading, error } = useProfile();
  
  // Return user from store if available, otherwise from query
  const currentUser = user || profileData?.user;
  
  return {
    user: currentUser,
    isLoading: isLoading && isAuthenticated,
    error,
    isAuthenticated,
  };
};

/**
 * Hook for checking authentication on app start
 */
export const useAuthCheck = () => {
  const authStore = useAuthStore();
  
  return useQuery({
    queryKey: ['auth', 'check'],
    queryFn: () => authStore.getCurrentUser(),
    staleTime: Infinity, // Only run once per session
    cacheTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
  });
};