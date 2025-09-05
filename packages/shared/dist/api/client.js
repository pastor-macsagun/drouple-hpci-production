export class ApiClient {
    constructor(config) {
        this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.timeout = config.timeout || 30000; // 30 seconds default
        this.defaultHeaders = config.headers || {};
        this.onError = config.onError;
    }
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const { timeout = this.timeout, idempotencyKey, ...fetchOptions } = options;
        const headers = {
            'Content-Type': 'application/json',
            ...this.defaultHeaders,
            ...(fetchOptions.headers || {}),
        };
        if (idempotencyKey) {
            headers['Idempotency-Key'] = idempotencyKey;
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, {
                ...fetchOptions,
                headers,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            const data = await response.json();
            if (!response.ok) {
                const error = new Error(data.error || `HTTP ${response.status}`);
                error.status = response.status;
                error.response = data;
                throw error;
            }
            return data;
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (this.onError) {
                this.onError(error);
            }
            // Re-throw for caller to handle
            throw error;
        }
    }
    async get(endpoint, params) {
        let url = endpoint;
        if (params) {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, String(value));
                }
            });
            if (searchParams.toString()) {
                url += `?${searchParams.toString()}`;
            }
        }
        return this.request(url, { method: 'GET' });
    }
    async post(endpoint, data, idempotencyKey) {
        return this.request(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
            idempotencyKey,
        });
    }
    async put(endpoint, data, idempotencyKey) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
            idempotencyKey,
        });
    }
    async patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
    setAuthToken(token) {
        this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    removeAuthToken() {
        delete this.defaultHeaders['Authorization'];
    }
    setHeader(key, value) {
        this.defaultHeaders[key] = value;
    }
    removeHeader(key) {
        delete this.defaultHeaders[key];
    }
}
