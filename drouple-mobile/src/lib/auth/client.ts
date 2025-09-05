/**
 * Mobile Auth Client - JWT token management
 * Implements secure token storage and refresh per PRD requirements
 */

import { setSecureItem, getSecureItem, deleteSecureItem } from './secure';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    tenantId: string;
    memberStatus: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceId?: string;
}

class MobileAuthClient {
  private static instance: MobileAuthClient | null = null;
  private baseUrl: string;
  private refreshTimer: NodeJS.Timeout | null = null;
  private authChangeListeners: ((isAuthenticated: boolean) => void)[] = [];

  private constructor() {
    this.baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  }

  public static getInstance(): MobileAuthClient {
    if (!MobileAuthClient.instance) {
      MobileAuthClient.instance = new MobileAuthClient();
    }
    return MobileAuthClient.instance;
  }

  /**
   * Login with email/password and get tokens
   */
  async login(credentials: LoginRequest): Promise<AuthTokens> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v2/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      const tokens: AuthTokens = {
        accessToken: data.accessToken || data.data?.access_token,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn || data.data?.expires_in || 3600,
        user: data.user || data.data?.user,
      };

      // Store tokens securely
      await this.storeTokens(tokens);
      
      // Schedule refresh
      this.scheduleTokenRefresh(tokens.expiresIn);
      
      // Notify listeners
      this.notifyAuthChange(true);

      return tokens;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Get current stored access token
   */
  async getAccessToken(): Promise<string | null> {
    return await getSecureItem('access_token');
  }

  /**
   * Check if user is currently authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    if (!token) return false;

    // TODO: Validate token expiration
    return true;
  }

  /**
   * Get current user info from stored tokens
   */
  async getCurrentUser(): Promise<AuthTokens['user'] | null> {
    const userJson = await getSecureItem('user_data');
    if (!userJson) return null;

    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  /**
   * Logout and clear all tokens
   */
  async logout(): Promise<void> {
    try {
      // Clear stored tokens
      await Promise.all([
        deleteSecureItem('access_token'),
        deleteSecureItem('refresh_token'),
        deleteSecureItem('user_data'),
      ]);

      // Cancel refresh timer
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
      }

      // Notify listeners
      this.notifyAuthChange(false);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Store tokens securely
   */
  private async storeTokens(tokens: AuthTokens): Promise<void> {
    await Promise.all([
      setSecureItem('access_token', tokens.accessToken),
      setSecureItem('user_data', JSON.stringify(tokens.user)),
      tokens.refreshToken ? setSecureItem('refresh_token', tokens.refreshToken) : Promise.resolve(),
    ]);
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleTokenRefresh(expiresIn: number): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Refresh 60 seconds before expiration
    const refreshTime = Math.max(0, (expiresIn - 60) * 1000);
    
    this.refreshTimer = setTimeout(async () => {
      try {
        await this.refreshTokens();
      } catch (error) {
        console.error('Auto token refresh failed:', error);
        // Force logout on refresh failure
        await this.logout();
      }
    }, refreshTime);
  }

  /**
   * Refresh tokens if refresh token exists
   */
  private async refreshTokens(): Promise<void> {
    const refreshToken = await getSecureItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // For now, redirect to login since we don't have refresh endpoint
    // TODO: Implement proper refresh endpoint in backend
    throw new Error('Token refresh not implemented - please login again');
  }

  /**
   * Add auth state change listener
   */
  onAuthChange(listener: (isAuthenticated: boolean) => void): () => void {
    this.authChangeListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.authChangeListeners.indexOf(listener);
      if (index > -1) {
        this.authChangeListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of auth state change
   */
  private notifyAuthChange(isAuthenticated: boolean): void {
    this.authChangeListeners.forEach(listener => {
      try {
        listener(isAuthenticated);
      } catch (error) {
        console.error('Auth change listener error:', error);
      }
    });
  }
}

export const authClient = MobileAuthClient.getInstance();