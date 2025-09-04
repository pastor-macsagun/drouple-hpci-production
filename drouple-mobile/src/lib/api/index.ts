/**
 * API Services Index
 * Centralized export for all API services and configurations
 *
 * 🔄 BACKEND SWITCH: Change USE_MOCK_APIS to false for production backend
 */

import { QueryClient } from '@tanstack/react-query';

import type { ApiResponse } from '@/types';

// 🔄 BACKEND INTEGRATION: Environment-based API switching
import { environmentManager } from '../config/environment';
import { backendServices } from './backendServices';
import { productionApiClient } from './productionClient';

// Determine which services to use based on environment configuration
const USE_MOCK_APIS = environmentManager.isFeatureEnabled('enableMockApis');

// Import auth implementations
import { mockAuthApi, authMockMethods } from './auth.mock';
import { productionAuthApi, authProductionMethods } from './auth';

// Export production-ready API client and backend services
export { backendServices };

// Legacy API services (conditionally exported based on environment)
const legacyServices = USE_MOCK_APIS
  ? {
      authService: require('./services/auth').authService,
      eventsService: require('./services/events').eventsService,
      checkInService: require('./services/checkin').checkInService,
      groupsService: require('./services/groups').groupsService,
      pathwaysService: require('./services/pathways').pathwaysService,
    }
  : {
      authService: backendServices.auth,
      eventsService: backendServices.events,
      checkInService: backendServices.checkIn,
      groupsService: backendServices.groups,
      pathwaysService: backendServices.pathways,
    };

export const {
  authService,
  eventsService,
  checkInService,
  groupsService,
  pathwaysService,
} = legacyServices;

// Export all types
export type * from './services/auth';
export type * from './services/events';
export type * from './services/checkin';
export type * from './services/groups';
export type * from './services/pathways';

// Export the selected auth implementation (legacy compatibility)
export const authApi = USE_MOCK_APIS ? mockAuthApi : backendServices.auth;
export const authMethods = USE_MOCK_APIS
  ? authMockMethods
  : authProductionMethods;

// Re-export auth contracts and types
export * from './contracts';

// Query client configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if ((error as any)?.status >= 400 && (error as any)?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// API client class
class ApiClient {
  private baseURL: string;
  private headers: HeadersInit;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  setAuthToken(token: string): void {
    this.headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  clearAuthToken(): void {
    const { Authorization, ...headersWithoutAuth } = this.headers as any;
    delete (headersWithoutAuth as any).Authorization;
    this.headers = headersWithoutAuth;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            data.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    const options: RequestInit = {
      method: 'POST',
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    return this.request<T>(endpoint, options);
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    const options: RequestInit = {
      method: 'PUT',
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    return this.request<T>(endpoint, options);
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    const options: RequestInit = {
      method: 'PATCH',
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    return this.request<T>(endpoint, options);
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Import enhanced API client
export { apiClient } from './client';

// Export enhanced client class for testing
export { default as EnhancedApiClient } from './client';

// Query keys for consistent caching
export const queryKeys = {
  auth: {
    profile: ['auth', 'profile'] as const,
  },
  checkin: {
    services: ['checkin', 'services'] as const,
    history: ['checkin', 'history'] as const,
  },
  events: {
    list: ['events', 'list'] as const,
    detail: (id: string) => ['events', 'detail', id] as const,
  },
  pathways: {
    list: ['pathways', 'list'] as const,
    detail: (id: string) => ['pathways', 'detail', id] as const,
    progress: (id: string) => ['pathways', 'progress', id] as const,
  },
  groups: {
    list: ['groups', 'list'] as const,
    detail: (id: string) => ['groups', 'detail', id] as const,
  },
  directory: {
    list: ['directory', 'list'] as const,
    detail: (id: string) => ['directory', 'detail', id] as const,
    search: (query: string) => ['directory', 'search', query] as const,
  },
  notifications: {
    list: ['notifications', 'list'] as const,
  },
  reports: {
    dashboard: ['reports', 'dashboard'] as const,
    attendance: ['reports', 'attendance'] as const,
  },
} as const;

// Auth configuration info  
export const AUTH_CONFIG = {
  useMockApis: USE_MOCK_APIS,
  environment: __DEV__ ? 'development' : 'production',
} as const;

export default {
  queryClient,
  apiClient,
  queryKeys,
  authApi,
  authMethods,
  AUTH_CONFIG,
};
