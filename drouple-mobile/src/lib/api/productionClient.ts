/**
 * Production API Client
 * Enhanced API client with real backend integration capabilities
 */

import { certificatePinning } from '../security/certificatePinning';
import { secureStore } from '../security/storage';
import { crashReporting } from '../analytics/crashReporting';
import { analyticsService } from '../analytics/analyticsService';

export interface ApiRequest {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTTL?: number;
  offline?: boolean;
  idempotencyKey?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
  headers?: Record<string, string>;
  cached?: boolean;
  retryCount?: number;
}

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  enableCaching: boolean;
  enableOffline: boolean;
  enableCertificatePinning: boolean;
  enableAnalytics: boolean;
  rateLimitConfig: {
    maxRequests: number;
    windowMs: number;
  };
}

export interface OfflineRequest {
  id: string;
  request: ApiRequest;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export class ProductionApiClient {
  private config: ApiConfig;
  private authToken: string | null = null;
  private refreshToken: string | null = null;
  private requestQueue: OfflineRequest[] = [];
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> =
    new Map();
  private rateLimitTracker: Map<string, number[]> = new Map();
  private isOnline: boolean = true;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = {
      baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://api.drouple.com',
      timeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000', 10),
      retries: parseInt(process.env.EXPO_PUBLIC_API_RETRIES || '3', 10),
      enableCaching: true,
      enableOffline: true,
      enableCertificatePinning:
        process.env.EXPO_PUBLIC_CERTIFICATE_PINNING === 'true',
      enableAnalytics: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
      rateLimitConfig: {
        maxRequests: parseInt(
          process.env.EXPO_PUBLIC_RATE_LIMIT_MAX || '100',
          10
        ),
        windowMs:
          parseInt(process.env.EXPO_PUBLIC_RATE_LIMIT_WINDOW || '15', 10) *
          60 *
          1000,
      },
      ...config,
    };

    this.initialize();
  }

  /**
   * Initialize the API client
   */
  private async initialize(): Promise<void> {
    try {
      // Load stored tokens
      this.authToken = await secureStore.getAuthToken();
      this.refreshToken = await secureStore.getRefreshToken();

      // Initialize certificate pinning
      if (this.config.enableCertificatePinning) {
        await certificatePinning.initialize();
      }

      // Set up network monitoring
      this.setupNetworkMonitoring();

      // Process offline queue if we're back online
      if (this.isOnline && this.requestQueue.length > 0) {
        this.processOfflineQueue();
      }

      console.log('Production API client initialized');
    } catch (error) {
      console.error('Failed to initialize API client:', error);
      crashReporting.captureError(error as Error, 'api_client_init');
    }
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
    secureStore.storeAuthToken(token);
  }

  /**
   * Set refresh token
   */
  setRefreshToken(token: string): void {
    this.refreshToken = token;
    secureStore.storeRefreshToken(token);
  }

  /**
   * Clear authentication tokens
   */
  clearTokens(): void {
    this.authToken = null;
    this.refreshToken = null;
    secureStore.clearAuthToken();
    secureStore.clearRefreshToken();
  }

  /**
   * Make authenticated API request
   */
  async request<T = any>(requestConfig: ApiRequest): Promise<ApiResponse<T>> {
    const startTime = Date.now();

    try {
      // Check rate limiting
      if (!this.checkRateLimit(requestConfig.url)) {
        throw new Error('Rate limit exceeded');
      }

      // Check cache first for GET requests
      if (requestConfig.method === 'GET' && requestConfig.cache !== false) {
        const cached = this.getCachedResponse<T>(requestConfig.url);
        if (cached) {
          return cached;
        }
      }

      // Handle offline requests
      if (!this.isOnline && requestConfig.offline !== false) {
        return this.queueOfflineRequest<T>(requestConfig);
      }

      // Build request
      const request = await this.buildRequest(requestConfig);

      // Execute request with retries
      const response = await this.executeRequest<T>(
        request,
        requestConfig.retries || this.config.retries
      );

      // Cache successful GET responses
      if (
        response.success &&
        requestConfig.method === 'GET' &&
        requestConfig.cache !== false
      ) {
        this.cacheResponse(requestConfig.url, response, requestConfig.cacheTTL);
      }

      // Track analytics
      if (this.config.enableAnalytics) {
        this.trackApiRequest(requestConfig, response, Date.now() - startTime);
      }

      return response;
    } catch (error) {
      console.error('API request failed:', error);

      const errorResponse: ApiResponse<T> = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: (error as any)?.status || 0,
      };

      // Track error
      if (this.config.enableAnalytics) {
        crashReporting.captureError(error as Error, 'api_request_failed', {
          url: requestConfig.url,
          method: requestConfig.method,
        });
      }

      return errorResponse;
    }
  }

  /**
   * Build HTTP request
   */
  private async buildRequest(config: ApiRequest): Promise<Request> {
    const url = config.url.startsWith('http')
      ? config.url
      : `${this.config.baseURL}${config.url}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'Drouple Mobile/1.0.0',
      ...config.headers,
    };

    // Add authentication header
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    // Add idempotency key for mutations
    if (
      config.idempotencyKey &&
      ['POST', 'PUT', 'PATCH'].includes(config.method)
    ) {
      headers['Idempotency-Key'] = config.idempotencyKey;
    }

    // Add request ID for tracking
    headers['X-Request-ID'] = this.generateRequestId();

    const requestInit: RequestInit = {
      method: config.method,
      headers,
      signal: AbortSignal.timeout(config.timeout || this.config.timeout),
    };

    if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
      requestInit.body = JSON.stringify(config.body);
    }

    return new Request(url, requestInit);
  }

  /**
   * Execute request with retries and token refresh
   */
  private async executeRequest<T>(
    request: Request,
    maxRetries: number,
    retryCount: number = 0
  ): Promise<ApiResponse<T>> {
    try {
      // Use certificate pinning if enabled
      const fetchFn = this.config.enableCertificatePinning
        ? certificatePinning.createSecureFetch()
        : fetch;

      const response = await fetchFn(request);
      const responseData = await this.parseResponse(response);

      // Handle 401 - token refresh
      if (response.status === 401 && this.refreshToken && retryCount === 0) {
        const refreshSuccess = await this.refreshAuthToken();
        if (refreshSuccess) {
          // Update request with new token
          const newRequest = request.clone();
          newRequest.headers.set('Authorization', `Bearer ${this.authToken}`);
          return this.executeRequest<T>(newRequest, maxRetries, retryCount + 1);
        } else {
          // Refresh failed, clear tokens and redirect to login
          this.clearTokens();
          throw new Error('Authentication failed');
        }
      }

      // Handle other 4xx/5xx errors
      if (!response.ok) {
        throw new Error(
          responseData.message ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return {
        success: true,
        data: responseData,
        status: response.status,
        headers: this.parseHeaders(response.headers),
        retryCount,
      };
    } catch (error) {
      // Retry on network errors (not 4xx/5xx)
      if (retryCount < maxRetries && this.isRetryableError(error)) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeRequest<T>(request, maxRetries, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Parse response body
   */
  private async parseResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      return response.json();
    } else if (contentType?.includes('text/')) {
      return response.text();
    } else {
      return response.blob();
    }
  }

  /**
   * Parse response headers
   */
  private parseHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Refresh authentication token
   */
  private async refreshAuthToken(): Promise<boolean> {
    try {
      if (!this.refreshToken) {
        return false;
      }

      const response = await this.request({
        url: '/auth/refresh',
        method: 'POST',
        body: { refreshToken: this.refreshToken },
        cache: false,
        offline: false,
      });

      if (response.success && response.data) {
        this.setAuthToken(response.data.accessToken);
        this.setRefreshToken(response.data.refreshToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.name === 'TypeError' || // Network error
      error.name === 'TimeoutError' ||
      error.message.includes('fetch') ||
      (error.status && error.status >= 500)
    );
  }

  /**
   * Check rate limiting
   */
  private checkRateLimit(url: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.rateLimitConfig.windowMs;

    const requests = this.rateLimitTracker.get(url) || [];
    const recentRequests = requests.filter(
      timestamp => timestamp > windowStart
    );

    if (recentRequests.length >= this.config.rateLimitConfig.maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.rateLimitTracker.set(url, recentRequests);
    return true;
  }

  /**
   * Cache response
   */
  private cacheResponse<T>(
    url: string,
    response: ApiResponse<T>,
    ttl?: number
  ): void {
    if (!this.config.enableCaching) return;

    const cacheTTL = ttl || 5 * 60 * 1000; // 5 minutes default
    this.cache.set(url, {
      data: response,
      timestamp: Date.now(),
      ttl: cacheTTL,
    });
  }

  /**
   * Get cached response
   */
  private getCachedResponse<T>(url: string): ApiResponse<T> | null {
    if (!this.config.enableCaching) return null;

    const cached = this.cache.get(url);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(url);
      return null;
    }

    return {
      ...cached.data,
      cached: true,
    };
  }

  /**
   * Queue offline request
   */
  private queueOfflineRequest<T>(config: ApiRequest): ApiResponse<T> {
    const offlineRequest: OfflineRequest = {
      id: this.generateRequestId(),
      request: config,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
    };

    this.requestQueue.push(offlineRequest);

    return {
      success: false,
      error: 'Request queued for offline processing',
      status: 0,
    };
  }

  /**
   * Process offline queue
   */
  private async processOfflineQueue(): Promise<void> {
    if (!this.isOnline || this.requestQueue.length === 0) return;

    console.log(`Processing ${this.requestQueue.length} offline requests...`);

    const queue = [...this.requestQueue];
    this.requestQueue = [];

    for (const offlineRequest of queue) {
      try {
        await this.request(offlineRequest.request);
      } catch (error) {
        offlineRequest.retryCount++;
        if (offlineRequest.retryCount < offlineRequest.maxRetries) {
          this.requestQueue.push(offlineRequest);
        } else {
          console.error('Offline request failed permanently:', error);
        }
      }
    }
  }

  /**
   * Set up network monitoring
   */
  private setupNetworkMonitoring(): void {
    // In a real app, you'd use NetInfo from @react-native-community/netinfo
    // For now, we'll simulate network monitoring

    const checkOnlineStatus = () => {
      const wasOnline = this.isOnline;
      this.isOnline = navigator.onLine;

      if (!wasOnline && this.isOnline) {
        // Just came back online
        this.processOfflineQueue();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', checkOnlineStatus);
      window.addEventListener('offline', checkOnlineStatus);
    }
  }

  /**
   * Track API request analytics
   */
  private trackApiRequest<T>(
    config: ApiRequest,
    response: ApiResponse<T>,
    duration: number
  ): void {
    if (!this.config.enableAnalytics) return;

    analyticsService.track('api_request', {
      method: config.method,
      url: config.url,
      success: response.success,
      status: response.status,
      duration,
      cached: response.cached,
      retryCount: response.retryCount,
    });
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Get offline queue statistics
   */
  getOfflineStats(): { queueSize: number; isOnline: boolean } {
    return {
      queueSize: this.requestQueue.length,
      isOnline: this.isOnline,
    };
  }

  // Convenience methods
  async get<T>(
    url: string,
    config?: Partial<ApiRequest>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'GET', ...config });
  }

  async post<T>(
    url: string,
    body?: any,
    config?: Partial<ApiRequest>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'POST', body, ...config });
  }

  async put<T>(
    url: string,
    body?: any,
    config?: Partial<ApiRequest>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'PUT', body, ...config });
  }

  async patch<T>(
    url: string,
    body?: any,
    config?: Partial<ApiRequest>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'PATCH', body, ...config });
  }

  async delete<T>(
    url: string,
    config?: Partial<ApiRequest>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'DELETE', ...config });
  }
}

// Create and export singleton instance
export const productionApiClient = new ProductionApiClient();
