/**
 * Authentication API Service
 * Handles login, token refresh, profile management
 */

import { httpClient, TokenManager, APIResponse } from '../http';
import { ENDPOINTS } from '../../../config/endpoints';
import { createApiClient, type ApiResponse } from '@drouple/contracts';
import type { UserDTO } from '@drouple/contracts';
import { z } from 'zod';

// Request/Response Schemas
const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    roles: z.array(z.string()),
    tenantId: z.string(),
    churchId: z.string(),
    isActive: z.boolean(),
    profileImage: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  bio: z.string().max(500).optional(),
});

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDTO;
}

export interface ProfileUpdateRequest {
  name?: string;
  phone?: string;
  bio?: string;
}

export interface ProfileResponse {
  user: UserDTO;
  profile: {
    phone?: string;
    bio?: string;
    joinedAt?: string;
    profileVisibility?: string;
    allowContact?: boolean;
  };
}

/**
 * Authentication Service Class
 */
export class AuthService {
  /**
   * Login user with email and password
   */
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Validate input
    const validatedCredentials = LoginRequestSchema.parse(credentials);
    
    try {
      const response = await httpClient.post<LoginResponse>(
        ENDPOINTS.AUTH.LOGIN,
        validatedCredentials,
        { skipAuth: true }
      );

      if (response.success && response.data) {
        const loginData = LoginResponseSchema.parse(response.data);
        
        // Store tokens securely
        await TokenManager.setTokens(
          loginData.accessToken,
          loginData.refreshToken
        );

        return loginData;
      }

      throw new Error(response.error || 'Login failed');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Refresh authentication token
   */
  static async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const refreshToken = await TokenManager.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await httpClient.post<{ accessToken: string; refreshToken: string }>(
        ENDPOINTS.AUTH.REFRESH,
        { refreshToken },
        { skipAuth: true }
      );

      if (response.success && response.data) {
        // Store new tokens
        await TokenManager.setTokens(
          response.data.accessToken,
          response.data.refreshToken
        );

        return response.data;
      }

      throw new Error(response.error || 'Token refresh failed');
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.logout();
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(): Promise<ProfileResponse> {
    try {
      const response = await httpClient.get<ProfileResponse>(ENDPOINTS.AUTH.PROFILE);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error || 'Failed to get profile');
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(updates: ProfileUpdateRequest): Promise<ProfileResponse> {
    // Validate input
    const validatedUpdates = UpdateProfileSchema.parse(updates);
    
    try {
      const response = await httpClient.put<ProfileResponse>(
        ENDPOINTS.AUTH.PROFILE,
        validatedUpdates
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error || 'Failed to update profile');
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const token = await TokenManager.getAccessToken();
      return !!token;
    } catch (error) {
      console.error('Authentication check error:', error);
      return false;
    }
  }

  /**
   * Get current user from stored token
   */
  static async getCurrentUser(): Promise<UserDTO | null> {
    try {
      const profile = await this.getProfile();
      return profile.user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      // Clear stored tokens
      await TokenManager.clearTokens();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Health check - test API connectivity
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await httpClient.get(ENDPOINTS.AUTH.HEALTH, { 
        skipAuth: true,
        timeout: 10000,
      });

      return response.success;
    } catch (error) {
      console.error('Health check error:', error);
      return false;
    }
  }
}

export default AuthService;