import type { paths, components } from './openapi.js';

export type ApiResponse<T = unknown> = {
  ok: boolean;
  code?: string;
  message?: string;
  data?: T;
  meta?: {
    traceId?: string;
  };
};

export type ApiError = ApiResponse & {
  ok: false;
  code: string;
  message: string;
};

export type User = components['schemas']['User'];
export type Event = components['schemas']['Event'];
export type CheckIn = components['schemas']['CheckIn'];

export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
  getToken?: () => string | null;
}

export class ApiClient {
  private config: Required<ApiClientConfig>;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 30000,
      defaultHeaders: {},
      getToken: () => null,
      ...config,
    };
  }

  private async request<T = unknown>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${path}`;
    const token = this.config.getToken?.();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.defaultHeaders,
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data: any;
      try {
        data = await response.json();
      } catch {
        data = { ok: false, code: 'INVALID_JSON', message: 'Invalid JSON response' };
      }

      if (!response.ok) {
        return {
          ok: false,
          code: data.code || `HTTP_${response.status}`,
          message: data.message || `HTTP ${response.status}`,
          data: data.data,
          meta: data.meta,
        };
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            ok: false,
            code: 'TIMEOUT',
            message: 'Request timeout',
          };
        }
        
        return {
          ok: false,
          code: 'NETWORK_ERROR',
          message: error.message,
        };
      }

      return {
        ok: false,
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
      };
    }
  }

  // Authentication endpoints
  async login(email: string, password: string) {
    type LoginResponse = {
      user: User;
      accessToken: string;
      refreshToken: string;
    };

    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async refresh(refreshToken: string) {
    type RefreshResponse = {
      accessToken: string;
      refreshToken: string;
    };

    return this.request<RefreshResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // Members endpoints
  async searchMembers(query?: string, limit = 20, offset = 0) {
    type MembersResponse = {
      members: User[];
      total: number;
    };

    const params = new URLSearchParams();
    if (query) params.append('q', query);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    return this.request<MembersResponse>(`/members/search?${params}`);
  }

  // Events endpoints
  async getEvents(limit = 20, offset = 0) {
    type EventsResponse = {
      events: Event[];
      total: number;
    };

    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    return this.request<EventsResponse>(`/events?${params}`);
  }

  async getEvent(id: string) {
    type EventResponse = {
      event: Event;
    };

    return this.request<EventResponse>(`/events/${id}`);
  }

  async rsvpToEvent(id: string, status: 'ATTENDING' | 'NOT_ATTENDING') {
    return this.request(`/events/${id}/rsvp`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  // Check-ins endpoints
  async createCheckin(serviceId: string, newBeliever = false) {
    type CheckinResponse = {
      checkin: CheckIn;
    };

    return this.request<CheckinResponse>('/checkins', {
      method: 'POST',
      body: JSON.stringify({ serviceId, newBeliever }),
    });
  }

  async bulkCreateCheckins(checkins: Array<{
    serviceId: string;
    timestamp: string;
    newBeliever?: boolean;
  }>) {
    type BulkCheckinResponse = {
      created: number;
      failed: number;
    };

    return this.request<BulkCheckinResponse>('/checkins/bulk', {
      method: 'POST',
      body: JSON.stringify({ checkins }),
    });
  }

  // Sync endpoints
  async syncMembers(updatedAfter: string) {
    type MembersSyncResponse = {
      members: User[];
      lastSync: string;
    };

    return this.request<MembersSyncResponse>(
      `/sync/members?updatedAfter=${encodeURIComponent(updatedAfter)}`
    );
  }

  async syncEvents(updatedAfter: string) {
    type EventsSyncResponse = {
      events: Event[];
      lastSync: string;
    };

    return this.request<EventsSyncResponse>(
      `/sync/events?updatedAfter=${encodeURIComponent(updatedAfter)}`
    );
  }

  // Device registration
  async registerDevice(token: string, platform: 'ios' | 'android') {
    return this.request('/devices', {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    });
  }

  // Live service counts (fallback for realtime)
  async getLiveServiceCounts() {
    type ServiceCountsResponse = {
      counts: Record<string, number>;
      timestamp: string;
    };

    return this.request<ServiceCountsResponse>('/live/service-counts');
  }
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}