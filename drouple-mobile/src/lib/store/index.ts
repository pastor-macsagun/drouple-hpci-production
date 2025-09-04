/**
 * Zustand store configuration
 * Central state management for the app
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { User, AuthTokens } from '@/types';

// Auth store
interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    set => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: user =>
        set(state => ({
          ...state,
          user,
          isAuthenticated: !!user,
        })),

      setTokens: tokens =>
        set(state => ({
          ...state,
          tokens,
        })),

      setLoading: isLoading =>
        set(state => ({
          ...state,
          isLoading,
        })),

      clearAuth: () =>
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    { name: 'auth-store' }
  )
);

// App state store
interface AppState {
  isOnline: boolean;
  theme: 'light' | 'dark' | 'system';

  // Actions
  setOnlineStatus: (isOnline: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    set => ({
      isOnline: true,
      theme: 'system',

      setOnlineStatus: isOnline =>
        set(state => ({
          ...state,
          isOnline,
        })),

      setTheme: theme =>
        set(state => ({
          ...state,
          theme,
        })),
    }),
    { name: 'app-store' }
  )
);

export default {
  useAuthStore,
  useAppStore,
};
