/**
 * Mobile API Client - PRD-compliant with auth, caching, and error handling
 * Features: JWT auth, ETag caching, idempotency, proper error handling
 */

import { getSecureItem } from '../auth/secure';
import { authClient } from '../auth/client';

export interface ApiClientOptions {
  baseUrl?: string;
  timeout?: number;
}

export interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
  idempotencyKey?: string;
  etag?: string;
  timeout?: number;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  success: boolean;
}

class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:3000/api/v2';
    this.defaultTimeout = options.timeout || 10000;
  }

  async request<T = any>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const {
      skipAuth = false,
      idempotencyKey,
      etag,
      timeout = this.defaultTimeout,
      ...fetchOptions
    } = options;

    // Build headers
    const headers = new Headers(fetchOptions.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');

    // Add authorization header unless skipped
    if (!skipAuth) {
      const token = await getSecureItem('access_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    // Add idempotency key for write operations
    if (idempotencyKey) {
      headers.set('Idempotency-Key', idempotencyKey);
    }

    // Add ETag for cache validation
    if (etag) {
      headers.set('If-None-Match', etag);
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 304 Not Modified for ETag caching
      if (response.status === 304) {
        throw new NotModifiedError('Resource not modified', response);
      }

      // Handle authentication errors
      if (response.status === 401) {
        // Auto-logout on unauthorized
        await authClient.logout();
        throw new AuthError('Authentication required');
      }

      // Parse response body
      const contentType = response.headers.get('content-type');
      let responseData: any;
      
      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      // Handle error responses
      if (!response.ok) {
        throw new ApiError(
          responseData?.error?.message || responseData?.message || 'API request failed',
          response.status,
          responseData?.error || responseData
        );
      }

      // Return data directly for successful responses
      return responseData.data || responseData;

    } catch (error) {
      clearTimeout(timeoutId);
      
      // Re-throw custom errors
      if (error instanceof ApiError || error instanceof AuthError || error instanceof NotModifiedError) {
        throw error;
      }
      
      // Handle timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }
      
      // Handle network errors
      throw new ApiError('Network error', 0, error);
    }
  }

  /**
   * GET request with ETag support
   */
  async get<T = any>(
    endpoint: string, 
    params?: Record<string, string>, 
    options: Omit<ApiRequestOptions, 'method'> = {}
  ): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    return this.request<T>(url, { ...options, method: 'GET' });
  }

  /**
   * POST request with idempotency support
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request with idempotency support
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options: Omit<ApiRequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Health check endpoint (no auth required)
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/healthz', { skipAuth: true });
  }
}

// Custom error classes following PRD error format
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class NotModifiedError extends Error {
  constructor(message: string, public response: Response) {
    super(message);
    this.name = 'NotModifiedError';
  }
}

// Create singleton instance
export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  return new ApiClient(options);
}

// Default export for ease of use
export const apiClient = createApiClient();