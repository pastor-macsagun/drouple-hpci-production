/**
 * Enhanced API Client
 * Bearer token authentication, 401 refresh handling, idempotency support
 */

import {
  ENDPOINTS,
  API_BASE_URL,
  HEADERS,
  REQUEST_TIMEOUT,
} from '@/config/endpoints';
import type { ApiResponse } from './contracts';

export interface RequestConfig extends RequestInit {
  idempotencyKey?: string;
  localChurchId?: string;
  skipAuthRefresh?: boolean;
}

class EnhancedApiClient {
  private baseURL: string;
  private authToken: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Set Bearer token for authenticated requests
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Remove Bearer token
   */
  removeAuthToken(): void {
    this.authToken = null;
  }

  /**
   * Get current Bearer token
   */
  getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Build request headers
   */
  private buildHeaders(config: RequestConfig = {}): HeadersInit {
    const headers: HeadersInit = {
      [HEADERS.CONTENT_TYPE]: 'application/json',
    };

    // Add Bearer token if available
    if (this.authToken && !config.skipAuthRefresh) {
      headers[HEADERS.AUTHORIZATION] = `Bearer ${this.authToken}`;
    }

    // Add idempotency key if provided
    if (config.idempotencyKey) {
      headers[HEADERS.IDEMPOTENCY_KEY] = config.idempotencyKey;
    }

    // Add local church ID for tenant isolation
    if (config.localChurchId) {
      headers[HEADERS.LOCAL_CHURCH_ID] = config.localChurchId;
    }

    // Merge custom headers
    if (config.headers) {
      Object.assign(headers, config.headers);
    }

    return headers;
  }

  /**
   * Handle 401 responses with token refresh
   */
  private async handleAuthRefresh(): Promise<boolean> {
    // Prevent multiple concurrent refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    const success = await this.refreshPromise;
    this.refreshPromise = null;

    return success;
  }

  /**
   * Perform actual token refresh (override in auth store)
   */
  private async performTokenRefresh(): Promise<boolean> {
    // TODO: Implement token refresh logic
    // This should be connected to the auth store's refresh method
    console.warn('Token refresh not implemented - redirecting to login');
    return false;
  }

  /**
   * Set token refresh handler
   */
  setTokenRefreshHandler(handler: () => Promise<boolean>): void {
    this.performTokenRefresh = handler;
  }

  /**
   * Core request method with error handling and retry logic
   */
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.buildHeaders(config);

    const requestConfig: RequestInit = {
      ...config,
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    };

    try {
      const response = await fetch(url, requestConfig);
      const data = await response.json();

      // Handle 401 - Unauthorized (token expired/invalid)
      if (response.status === 401 && !config.skipAuthRefresh) {
        const refreshSuccess = await this.handleAuthRefresh();

        if (refreshSuccess) {
          // Retry original request with new token
          return this.request<T>(endpoint, {
            ...config,
            skipAuthRefresh: true,
          });
        } else {
          // Refresh failed - return error
          return {
            success: false,
            error: 'Authentication failed - please login again',
          };
        }
      }

      // Handle other HTTP errors
      if (!response.ok) {
        return {
          success: false,
          error:
            data.message ||
            data.error ||
            `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      // Handle network/timeout errors
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          return {
            success: false,
            error: 'Request timeout - please check your connection',
          };
        }
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Request was cancelled',
          };
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * POST request with optional body and idempotency
   */
  async post<T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const requestConfig: RequestConfig = {
      ...config,
      method: 'POST',
    };

    if (body) {
      requestConfig.body = JSON.stringify(body);
    }

    return this.request<T>(endpoint, requestConfig);
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const requestConfig: RequestConfig = {
      ...config,
      method: 'PUT',
    };

    if (body) {
      requestConfig.body = JSON.stringify(body);
    }

    return this.request<T>(endpoint, requestConfig);
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const requestConfig: RequestConfig = {
      ...config,
      method: 'PATCH',
    };

    if (body) {
      requestConfig.body = JSON.stringify(body);
    }

    return this.request<T>(endpoint, requestConfig);
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  /**
   * Generate idempotency key (UUID v4)
   */
  generateIdempotencyKey(): string {
    return 'xxxx-xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<
    ApiResponse<{ status: string; timestamp: string }>
  > {
    return this.get('/api/health', { skipAuthRefresh: true });
  }
}

// Create singleton instance
export const apiClient = new EnhancedApiClient();

// Export class for testing
export default EnhancedApiClient;
