/**
 * Production-ready HTTP Client
 * Typed fetch wrapper with authentication, retries, and error handling
 */

import { API_CONFIG, ENDPOINTS, ENFORCE_HTTPS } from '../../config/endpoints';
import { APP_CONFIG } from '../../config/app';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import { z } from 'zod';

// Request/Response Types
export interface APIResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
  success: boolean;
}

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  skipAuth?: boolean;
  cache?: 'no-cache' | 'reload' | 'force-cache' | 'only-if-cached';
}

// Error Types
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network connection failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

// Token Management
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly TOKEN_EXPIRY_KEY = 'token_expiry';

  static async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  static async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  static async setTokens(accessToken: string, refreshToken: string, expiresIn?: number): Promise<void> {
    try {
      await Promise.all([
        SecureStore.setItemAsync(this.ACCESS_TOKEN_KEY, accessToken),
        SecureStore.setItemAsync(this.REFRESH_TOKEN_KEY, refreshToken),
        expiresIn ? SecureStore.setItemAsync(
          this.TOKEN_EXPIRY_KEY, 
          (Date.now() + expiresIn * 1000).toString()
        ) : Promise.resolve(),
      ]);
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw error;
    }
  }

  static async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(this.ACCESS_TOKEN_KEY),
        SecureStore.deleteItemAsync(this.REFRESH_TOKEN_KEY),
        SecureStore.deleteItemAsync(this.TOKEN_EXPIRY_KEY),
      ]);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  static async isTokenExpired(): Promise<boolean> {
    try {
      const expiry = await SecureStore.getItemAsync(this.TOKEN_EXPIRY_KEY);
      if (!expiry) return false;
      
      const expiryTime = parseInt(expiry, 10);
      const currentTime = Date.now();
      const threshold = APP_CONFIG.security.tokenRefreshThreshold;
      
      return (expiryTime - currentTime) < threshold;
    } catch (error) {
      console.error('Failed to check token expiry:', error);
      return true;
    }
  }
}

// Network Status Manager
class NetworkManager {
  private static isOnline: boolean = true;

  static async checkNetworkStatus(): Promise<boolean> {
    try {
      const netInfo = await NetInfo.fetch();
      this.isOnline = netInfo.isConnected ?? false;
      return this.isOnline;
    } catch (error) {
      console.error('Network status check failed:', error);
      return false;
    }
  }

  static getOnlineStatus(): boolean {
    return this.isOnline;
  }

  static async waitForNetwork(timeout: number = 10000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await this.checkNetworkStatus()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return false;
  }
}

// HTTP Client Implementation
class HTTPClient {
  private readonly baseURL: string;
  private readonly timeout: number;
  private readonly retries: number;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.timeout = API_CONFIG.timeout;
    this.retries = API_CONFIG.retries;

    // Validate HTTPS in production
    if (ENFORCE_HTTPS && !this.baseURL.startsWith('https://')) {
      throw new Error('HTTPS is required in production');
    }
  }

  /**
   * Main request method with authentication, retries, and error handling
   */
  async request<T = unknown>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<APIResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.timeout,
      retries = this.retries,
      skipAuth = false,
      cache = 'no-cache',
    } = config;

    // Check network status
    if (!(await NetworkManager.checkNetworkStatus())) {
      throw new NetworkError('No internet connection');
    }

    // Build URL
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;

    // Prepare headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': `Drouple-Mobile/${APP_CONFIG.version}`,
      ...headers,
    };

    // Add authentication if needed
    if (!skipAuth) {
      const token = await this.getValidAccessToken();
      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
      }
    }

    // Build request
    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
      cache,
    };

    if (body && method !== 'GET') {
      requestConfig.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    // Execute request with retries
    return this.executeWithRetries(url, requestConfig, timeout, retries);
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetries<T>(
    url: string,
    config: RequestInit,
    timeout: number,
    retries: number
  ): Promise<APIResponse<T>> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.executeRequest<T>(url, config, timeout);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry authentication errors or client errors (4xx)
        if (error instanceof AuthenticationError || 
            (error instanceof APIError && error.status >= 400 && error.status < 500)) {
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === retries) {
          break;
        }
        
        // Wait before retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Check network before retry
        await NetworkManager.waitForNetwork(5000);
      }
    }
    
    throw lastError!;
  }

  /**
   * Execute single request
   */
  private async executeRequest<T>(
    url: string,
    config: RequestInit,
    timeout: number
  ): Promise<APIResponse<T>> {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle response
      return await this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError('Request timeout');
      }
      
      if (error instanceof TypeError) {
        throw new NetworkError('Network request failed');
      }
      
      throw error;
    }
  }

  /**
   * Handle HTTP response
   */
  private async handleResponse<T>(response: Response): Promise<APIResponse<T>> {
    const { status, statusText } = response;

    try {
      // Parse response body
      const text = await response.text();
      let data: any = null;
      
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      // Handle success responses
      if (status >= 200 && status < 300) {
        return {
          data: data as T,
          status,
          success: true,
        };
      }

      // Handle authentication errors
      if (status === 401) {
        await TokenManager.clearTokens();
        throw new AuthenticationError(data?.error || 'Authentication required');
      }

      // Handle other errors
      const errorMessage = data?.error || data?.message || statusText || `Request failed with status ${status}`;
      throw new APIError(errorMessage, status, data);

    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof APIError) {
        throw error;
      }
      
      throw new APIError(`Failed to parse response: ${error}`, status);
    }
  }

  /**
   * Get valid access token, refresh if needed
   */
  private async getValidAccessToken(): Promise<string | null> {
    try {
      const accessToken = await TokenManager.getAccessToken();
      
      if (!accessToken) {
        return null;
      }

      // Check if token needs refresh
      if (await TokenManager.isTokenExpired()) {
        return await this.refreshAccessToken();
      }

      return accessToken;
    } catch (error) {
      console.error('Failed to get valid access token:', error);
      return null;
    }
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = await TokenManager.getRefreshToken();
      
      if (!refreshToken) {
        throw new AuthenticationError('No refresh token available');
      }

      const response = await this.request<{
        accessToken: string;
        refreshToken: string;
        expiresIn?: number;
      }>(ENDPOINTS.AUTH.REFRESH, {
        method: 'POST',
        body: { refreshToken },
        skipAuth: true,
      });

      if (response.success && response.data) {
        const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;
        await TokenManager.setTokens(accessToken, newRefreshToken, expiresIn);
        return accessToken;
      }

      throw new AuthenticationError('Token refresh failed');
    } catch (error) {
      console.error('Token refresh failed:', error);
      await TokenManager.clearTokens();
      throw new AuthenticationError('Token refresh failed');
    }
  }

  // Convenience methods
  async get<T = unknown>(endpoint: string, config: Omit<RequestConfig, 'method'> = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T = unknown>(endpoint: string, body?: any, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  async put<T = unknown>(endpoint: string, body?: any, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  async patch<T = unknown>(endpoint: string, body?: any, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body });
  }

  async delete<T = unknown>(endpoint: string, config: Omit<RequestConfig, 'method'> = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

// Export singleton instance
export const httpClient = new HTTPClient();

// Export token manager for auth service
export { TokenManager, NetworkManager };
export default httpClient;