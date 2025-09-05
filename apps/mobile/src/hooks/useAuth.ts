import { useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useQueryClient } from '@tanstack/react-query';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  user: any | null; // Replace with actual user type
}

interface AuthActions {
  signIn: (token: string, user: any) => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const TOKEN_EXPIRY_KEY = 'auth_token_expiry';

export const useAuth = (): AuthState & AuthActions => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    token: null,
    user: null,
  });

  // Check if token is expired
  const isTokenExpired = useCallback(async (): Promise<boolean> => {
    try {
      const expiryStr = await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);
      if (!expiryStr) return true;

      const expiry = parseInt(expiryStr, 10);
      const now = Math.floor(Date.now() / 1000);
      
      // Consider token expired if less than 5 minutes remaining
      return expiry <= (now + 300);
    } catch {
      return true;
    }
  }, []);

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      const [token, userStr] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);

      if (!token || !userStr) {
        setState({
          isAuthenticated: false,
          isLoading: false,
          token: null,
          user: null,
        });
        return;
      }

      // Check if token is expired
      const expired = await isTokenExpired();
      if (expired) {
        // Try to refresh token
        await refreshToken();
        return;
      }

      const user = JSON.parse(userStr);
      setState({
        isAuthenticated: true,
        isLoading: false,
        token,
        user,
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      setState({
        isAuthenticated: false,
        isLoading: false,
        token: null,
        user: null,
      });
    }
  }, [isTokenExpired]);

  // Sign in
  const signIn = useCallback(async (token: string, user: any) => {
    try {
      // Calculate expiry (assuming token is valid for 15 minutes)
      const expiry = Math.floor(Date.now() / 1000) + (15 * 60);
      
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, token),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
        SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, expiry.toString()),
      ]);

      setState({
        isAuthenticated: true,
        isLoading: false,
        token,
        user,
      });
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY),
        SecureStore.deleteItemAsync(USER_KEY),
        SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY),
      ]);

      // Clear React Query cache
      queryClient.clear();

      setState({
        isAuthenticated: false,
        isLoading: false,
        token: null,
        user: null,
      });
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }, [queryClient]);

  // Refresh token
  const refreshToken = useCallback(async () => {
    // This would make an API call to refresh the token
    // For now, just sign out if refresh fails
    console.log('Token refresh needed - redirecting to sign in');
    await signOut();
  }, [signOut]);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Set up automatic token refresh
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const checkTokenExpiry = async () => {
      const expired = await isTokenExpired();
      if (expired) {
        await refreshToken();
      }
    };

    // Check token expiry every 5 minutes
    const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [state.isAuthenticated, isTokenExpired, refreshToken]);

  return {
    ...state,
    signIn,
    signOut,
    refreshToken,
    checkAuth,
  };
};