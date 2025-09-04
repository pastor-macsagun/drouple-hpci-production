// src/client.ts
var ApiClient = class {
  config;
  constructor(config) {
    this.config = {
      timeout: 3e4,
      defaultHeaders: {},
      getToken: () => null,
      ...config
    };
  }
  async request(path, options = {}) {
    const url = `${this.config.baseUrl}${path}`;
    const token = this.config.getToken?.();
    const headers = {
      "Content-Type": "application/json",
      ...this.config.defaultHeaders,
      ...options.headers
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
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      let data;
      try {
        data = await response.json();
      } catch {
        data = { ok: false, code: "INVALID_JSON", message: "Invalid JSON response" };
      }
      if (!response.ok) {
        return {
          ok: false,
          code: data.code || `HTTP_${response.status}`,
          message: data.message || `HTTP ${response.status}`,
          data: data.data,
          meta: data.meta
        };
      }
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          return {
            ok: false,
            code: "TIMEOUT",
            message: "Request timeout"
          };
        }
        return {
          ok: false,
          code: "NETWORK_ERROR",
          message: error.message
        };
      }
      return {
        ok: false,
        code: "UNKNOWN_ERROR",
        message: "An unknown error occurred"
      };
    }
  }
  // Authentication endpoints
  async login(email, password) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  }
  async refresh(refreshToken) {
    return this.request("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken })
    });
  }
  async logout() {
    return this.request("/auth/logout", {
      method: "POST"
    });
  }
  // Members endpoints
  async searchMembers(query, limit = 20, offset = 0) {
    const params = new URLSearchParams();
    if (query) params.append("q", query);
    params.append("limit", limit.toString());
    params.append("offset", offset.toString());
    return this.request(`/members/search?${params}`);
  }
  // Events endpoints
  async getEvents(limit = 20, offset = 0) {
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    params.append("offset", offset.toString());
    return this.request(`/events?${params}`);
  }
  async getEvent(id) {
    return this.request(`/events/${id}`);
  }
  async rsvpToEvent(id, status) {
    return this.request(`/events/${id}/rsvp`, {
      method: "POST",
      body: JSON.stringify({ status })
    });
  }
  // Check-ins endpoints
  async createCheckin(serviceId, newBeliever = false) {
    return this.request("/checkins", {
      method: "POST",
      body: JSON.stringify({ serviceId, newBeliever })
    });
  }
  async bulkCreateCheckins(checkins) {
    return this.request("/checkins/bulk", {
      method: "POST",
      body: JSON.stringify({ checkins })
    });
  }
  // Sync endpoints
  async syncMembers(updatedAfter) {
    return this.request(
      `/sync/members?updatedAfter=${encodeURIComponent(updatedAfter)}`
    );
  }
  async syncEvents(updatedAfter) {
    return this.request(
      `/sync/events?updatedAfter=${encodeURIComponent(updatedAfter)}`
    );
  }
  // Device registration
  async registerDevice(token, platform) {
    return this.request("/devices", {
      method: "POST",
      body: JSON.stringify({ token, platform })
    });
  }
  // Live service counts (fallback for realtime)
  async getLiveServiceCounts() {
    return this.request("/live/service-counts");
  }
};
function createApiClient(config) {
  return new ApiClient(config);
}
export {
  ApiClient,
  createApiClient
};
//# sourceMappingURL=index.js.map