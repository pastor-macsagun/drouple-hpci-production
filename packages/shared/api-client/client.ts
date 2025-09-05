import createClient, { type Client, type ClientOptions } from 'openapi-fetch';
import type { paths } from './types.js';
import { z } from 'zod';

export interface ApiClientConfig {
  baseUrl: string;
  getToken: () => string | Promise<string>;
  getETag?: (url: string) => string | null;
  setETag?: (url: string, etag: string) => void;
  onUnauthorized?: () => void | Promise<void>;
  onForbidden?: () => void | Promise<void>;
  onRateLimit?: (retryAfter?: number) => void | Promise<void>;
}

export interface ETagOptions {
  etag?: string;
}

export interface IdempotencyOptions {
  idempotencyKey: string;
}

export type ApiClient = Client<paths>;

export class HpciApiClient {
  private client: ApiClient;
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
    
    const clientOptions: ClientOptions = {
      baseUrl: config.baseUrl,
      headers: {},
    };

    this.client = createClient<paths>(clientOptions);

    // Add request interceptor for authentication and headers
    this.client.use({
      async onRequest({ request }) {
        // Add authorization header
        const token = await config.getToken();
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }

        return request;
      },
      
      async onResponse({ response, request }) {
        // Handle common error responses
        if (response.status === 401 && config.onUnauthorized) {
          await config.onUnauthorized();
        } else if (response.status === 403 && config.onForbidden) {
          await config.onForbidden();
        } else if (response.status === 429 && config.onRateLimit) {
          const retryAfter = response.headers.get('Retry-After');
          await config.onRateLimit(retryAfter ? parseInt(retryAfter, 10) : undefined);
        }

        return response;
      }
    });
  }

  /**
   * Raw client for direct access to openapi-fetch methods
   */
  get raw(): ApiClient {
    return this.client;
  }

  /**
   * Add ETag header to request for cache validation
   */
  withETag(etag: string) {
    return {
      headers: {
        'If-None-Match': etag,
      },
    };
  }

  /**
   * Add Idempotency-Key header for write operations
   */
  withIdempotencyKey(key: string) {
    return {
      headers: {
        'Idempotency-Key': key,
      },
    };
  }

  /**
   * Generate a UUID v4 for idempotency keys
   */
  generateIdempotencyKey(): string {
    return crypto.randomUUID();
  }

  /**
   * Health check endpoint
   */
  async getHealth() {
    const { data, error, response } = await this.client.GET('/healthz');
    return this.handleResponse(data, error, response);
  }

  /**
   * Authentication - exchange credentials for JWT
   */
  async createToken(credentials: {
    email: string;
    password: string;
    deviceId?: string;
  }) {
    const { data, error, response } = await this.client.POST('/auth/token', {
      body: credentials,
    });
    return this.handleResponse(data, error, response);
  }

  /**
   * Get current user profile
   */
  async getMe() {
    const { data, error, response } = await this.client.GET('/me');
    return this.handleResponse(data, error, response);
  }

  /**
   * List members with filtering and pagination
   */
  async getMembers(params?: {
    updatedSince?: string;
    q?: string;
    cursor?: string;
    limit?: number;
    etag?: string;
  }) {
    const headers = params?.etag ? this.withETag(params.etag).headers : {};
    
    const { data, error, response } = await this.client.GET('/members', {
      params: {
        query: {
          updatedSince: params?.updatedSince,
          q: params?.q,
          cursor: params?.cursor,
          limit: params?.limit,
        },
      },
      headers,
    });

    const result = this.handleResponse(data, error, response);
    
    // Store ETag if provided
    if (response.status === 200) {
      const etag = response.headers.get('ETag');
      if (etag && this.config.setETag) {
        this.config.setETag('/members', etag);
      }
    }

    return result;
  }

  /**
   * Get member by ID
   */
  async getMemberById(id: string) {
    const { data, error, response } = await this.client.GET('/members/{id}', {
      params: { path: { id } },
    });
    return this.handleResponse(data, error, response);
  }

  /**
   * List events with filtering and pagination
   */
  async getEvents(params?: {
    since?: string;
    q?: string;
    cursor?: string;
    limit?: number;
    etag?: string;
  }) {
    const headers = params?.etag ? this.withETag(params.etag).headers : {};
    
    const { data, error, response } = await this.client.GET('/events', {
      params: {
        query: {
          since: params?.since,
          q: params?.q,
          cursor: params?.cursor,
          limit: params?.limit,
        },
      },
      headers,
    });

    const result = this.handleResponse(data, error, response);
    
    // Store ETag if provided
    if (response.status === 200) {
      const etag = response.headers.get('ETag');
      if (etag && this.config.setETag) {
        this.config.setETag('/events', etag);
      }
    }

    return result;
  }

  /**
   * Get event by ID
   */
  async getEventById(id: string) {
    const { data, error, response } = await this.client.GET('/events/{id}', {
      params: { path: { id } },
    });
    return this.handleResponse(data, error, response);
  }

  /**
   * RSVP to an event
   */
  async createEventRsvp(
    eventId: string,
    rsvpData: { response: 'going' | 'interested' | 'not_going' },
    idempotencyKey?: string
  ) {
    const key = idempotencyKey || this.generateIdempotencyKey();
    
    const { data, error, response } = await this.client.POST('/events/{id}/rsvp', {
      params: { 
        path: { id: eventId },
        header: { "Idempotency-Key": key }
      },
      body: rsvpData,
      headers: this.withIdempotencyKey(key).headers,
    });
    return this.handleResponse(data, error, response);
  }

  /**
   * Check in member for attendance
   */
  async createAttendanceCheckin(
    checkinData: {
      memberId: string;
      eventId: string;
      scannedAt: string;
      deviceId: string;
    },
    idempotencyKey?: string
  ) {
    // Validate the request data
    const validatedData = AttendanceCheckinRequestSchema.parse(checkinData);
    const key = idempotencyKey || this.generateIdempotencyKey();
    
    const { data, error, response } = await this.client.POST('/attendance/checkin', {
      params: { 
        header: { "Idempotency-Key": key }
      },
      body: validatedData,
      headers: this.withIdempotencyKey(key).headers,
    });
    return this.handleResponse(data, error, response);
  }

  /**
   * List announcements with pagination
   */
  async getAnnouncements(params?: {
    since?: string;
    cursor?: string;
    limit?: number;
    etag?: string;
  }) {
    const headers = params?.etag ? this.withETag(params.etag).headers : {};
    
    const { data, error, response } = await this.client.GET('/announcements', {
      params: {
        query: {
          since: params?.since,
          cursor: params?.cursor,
          limit: params?.limit,
        },
      },
      headers,
    });

    const result = this.handleResponse(data, error, response);
    
    // Store ETag if provided
    if (response.status === 200) {
      const etag = response.headers.get('ETag');
      if (etag && this.config.setETag) {
        this.config.setETag('/announcements', etag);
      }
    }

    return result;
  }

  /**
   * Handle response and extract data/error consistently
   */
  private handleResponse<T>(data: T | undefined, error: unknown, response: Response) {
    if (response.status === 304) {
      return {
        data: null,
        error: null,
        response,
        isNotModified: true,
      };
    }

    if (error) {
      return {
        data: null,
        error: this.normalizeError(error),
        response,
        isNotModified: false,
      };
    }

    return {
      data,
      error: null,
      response,
      isNotModified: false,
    };
  }

  /**
   * Normalize error responses to consistent format
   */
  private normalizeError(error: unknown): { code: string; message: string; details?: any } {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const apiError = error as { error: { code: string; message: string; details?: any } };
      return apiError.error;
    }

    if (typeof error === 'string') {
      return { code: 'UNKNOWN_ERROR', message: error };
    }

    return { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred' };
  }
}

/**
 * Zod schema for attendance check-in validation
 */
export const AttendanceCheckinRequestSchema = z.object({
  memberId: z.string().regex(/^[a-z0-9]+$/, 'memberId must be a valid CUID'),
  eventId: z.string().regex(/^[a-z0-9]+$/, 'eventId must be a valid CUID'),
  scannedAt: z.string().datetime({ message: 'scannedAt must be a valid RFC3339 datetime' }),
  deviceId: z.string().min(1).max(100, 'deviceId must be 1-100 characters'),
});

/**
 * Factory function to create API client instance
 */
export function createApiClient(config: ApiClientConfig): HpciApiClient {
  return new HpciApiClient(config);
}

/**
 * Re-export types for consumer convenience
 */
export type * from './types.js';