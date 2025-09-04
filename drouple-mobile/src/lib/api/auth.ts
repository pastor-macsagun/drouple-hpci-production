/**
 * Production Authentication API
 * Real implementation for production/staging environments
 * Connects to actual Drouple backend (NextAuth.js) endpoints
 */

import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  SessionRequest,
  SessionResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  BiometricSetupRequest,
  BiometricSetupResponse,
  LogoutRequest,
  LogoutResponse,
} from './contracts';
import { ENDPOINTS } from '@/config/endpoints';

// HTTP Client configuration
interface FetchConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string | undefined;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = ENDPOINTS.AUTH.LOGIN.replace(
      '/api/auth/signin/credentials',
      ''
    );
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    config: FetchConfig
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const fetchOptions: RequestInit = {
        method: config.method,
        headers: {
          ...this.defaultHeaders,
          ...config.headers,
        },
      };

      // Only add body if it's defined
      if (config.body !== undefined) {
        fetchOptions.body = config.body;
      }

      const response = await fetch(url, fetchOptions);

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
          message: data.message || response.statusText,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message:
          error instanceof Error ? error.message : 'Network request failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  setAuthToken(token: string) {
    this.defaultHeaders.Authorization = `Bearer ${token}`;
  }

  removeAuthToken() {
    delete this.defaultHeaders.Authorization;
  }

  // Public API methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Production Authentication API Class
export class ProductionAuthApi {
  private client: ApiClient;

  constructor() {
    this.client = new ApiClient();
  }

  /**
   * Login with email and password
   * Uses the web dashboard's existing API route for authentication
   */
  async login(request: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    // Check if there's a dedicated mobile auth endpoint, otherwise use session approach
    try {
      // First, try to get CSRF token
      const csrfResponse = await this.client.get<{ csrfToken: string }>(
        '/api/auth/csrf'
      );

      if (!csrfResponse.success) {
        return {
          success: false,
          error: csrfResponse.error || 'CSRF_FAILED',
          message: csrfResponse.message || 'Failed to get CSRF token',
          timestamp: new Date().toISOString(),
        };
      }

      // Attempt login via NextAuth.js callback
      const loginData = {
        email: request.email,
        password: request.password,
        csrf: csrfResponse.data?.csrfToken || '',
        callbackUrl: '/',
        json: true,
      };

      const response = await this.client.post<LoginResponse>(
        '/api/auth/callback/credentials',
        loginData
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error: 'LOGIN_FAILED',
        message: error instanceof Error ? error.message : 'Login failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get current session (replaces refresh token in NextAuth.js)
   */
  async getSession(
    request?: SessionRequest
  ): Promise<ApiResponse<SessionResponse>> {
    return this.client.get<SessionResponse>('/api/auth/session');
  }

  /**
   * Legacy refresh token method for compatibility
   */
  async refreshToken(
    request: RefreshTokenRequest
  ): Promise<ApiResponse<RefreshTokenResponse>> {
    // In NextAuth.js, we just check the current session
    const sessionResponse = await this.getSession();

    if (!sessionResponse.success || !sessionResponse.data) {
      return {
        success: false,
        error: 'SESSION_EXPIRED',
        message: 'Session expired, please login again',
        timestamp: new Date().toISOString(),
      };
    }

    // Convert session to refresh token response format
    return {
      success: true,
      data: {
        accessToken: sessionResponse.data.accessToken || '',
        refreshToken: request.refreshToken, // Keep the same refresh token
        expiresAt: sessionResponse.data.expires,
        user: sessionResponse.data.user,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(
    request: UpdateProfileRequest
  ): Promise<ApiResponse<UpdateProfileResponse>> {
    return this.client.put<UpdateProfileResponse>('/api/v1/users', request);
  }

  /**
   * Setup biometric authentication
   */
  async setupBiometric(
    request: BiometricSetupRequest
  ): Promise<ApiResponse<BiometricSetupResponse>> {
    return this.client.post<BiometricSetupResponse>(
      '/api/v1/auth/biometric',
      request
    );
  }

  /**
   * Logout (NextAuth.js signout)
   */
  async logout(request: LogoutRequest): Promise<ApiResponse<LogoutResponse>> {
    return this.client.post<LogoutResponse>('/api/auth/signout', request);
  }

  /**
   * Set authentication token for subsequent requests
   */
  setAuthToken(token: string) {
    this.client.setAuthToken(token);
  }

  /**
   * Remove authentication token
   */
  removeAuthToken() {
    this.client.removeAuthToken();
  }
}

// Export singleton instance
export const productionAuthApi = new ProductionAuthApi();

// Export individual methods for easier testing
export const authProductionMethods = {
  login: productionAuthApi.login.bind(productionAuthApi),
  getSession: productionAuthApi.getSession.bind(productionAuthApi),
  refreshToken: productionAuthApi.refreshToken.bind(productionAuthApi),
  updateProfile: productionAuthApi.updateProfile.bind(productionAuthApi),
  setupBiometric: productionAuthApi.setupBiometric.bind(productionAuthApi),
  logout: productionAuthApi.logout.bind(productionAuthApi),
  setAuthToken: productionAuthApi.setAuthToken.bind(productionAuthApi),
  removeAuthToken: productionAuthApi.removeAuthToken.bind(productionAuthApi),
};

export default productionAuthApi;
