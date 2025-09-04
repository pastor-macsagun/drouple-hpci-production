/**
 * Authentication Store
 * Zustand store for authentication state management
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '../api/services/auth';
import type { UserDTO } from '@drouple/contracts';
import type { LoginRequest, LoginResponse } from '../api/services/auth';

interface AuthState {
  // State
  user: UserDTO | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastLogin: string | null;
  
  // Actions
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  getCurrentUser: () => Promise<UserDTO | null>;
  clearError: () => void;
  setUser: (user: UserDTO) => void;
  
  // Computed
  getUserRole: () => string | null;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
  isLeader: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      lastLogin: null,

      // Actions
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await AuthService.login(credentials);
          
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            lastLogin: new Date().toISOString(),
          });
          
          return response;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          await AuthService.logout();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            lastLogin: null,
          });
        } catch (error) {
          console.error('Logout error:', error);
          // Always clear state on logout attempt
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            lastLogin: null,
          });
        }
      },

      refreshToken: async () => {
        try {
          await AuthService.refreshToken();
        } catch (error) {
          console.error('Token refresh error:', error);
          // Clear auth state on refresh failure
          set({
            user: null,
            isAuthenticated: false,
            error: 'Session expired',
          });
          throw error;
        }
      },

      getCurrentUser: async () => {
        const { user } = get();
        
        if (user) {
          return user;
        }
        
        try {
          const currentUser = await AuthService.getCurrentUser();
          if (currentUser) {
            set({ 
              user: currentUser,
              isAuthenticated: true,
            });
          }
          return currentUser;
        } catch (error) {
          console.error('Get current user error:', error);
          return null;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setUser: (user: UserDTO) => {
        set({ 
          user,
          isAuthenticated: true,
          error: null,
        });
      },

      // Computed getters
      getUserRole: () => {
        const { user } = get();
        return user?.roles[0] || null;
      },

      hasRole: (role: string) => {
        const { user } = get();
        return user?.roles.includes(role as any) || false;
      },

      isAdmin: () => {
        const { hasRole } = get();
        return hasRole('SUPER_ADMIN') || hasRole('ADMIN');
      },

      isLeader: () => {
        const { hasRole } = get();
        return hasRole('SUPER_ADMIN') || hasRole('ADMIN') || hasRole('LEADER') || hasRole('VIP');
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        lastLogin: state.lastLogin,
      }),
    }
  )
);

// Selectors for optimized re-renders
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectError = (state: AuthState) => state.error;
export const selectUserRole = (state: AuthState) => state.getUserRole();

export default useAuthStore;