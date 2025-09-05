export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    meta?: {
        pagination?: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        etag?: string;
        lastModified?: string;
    };
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface AuthToken {
    access_token: string;
    token_type: 'Bearer';
    expires_in: number;
    refresh_token?: string;
}
export interface TokenClaims {
    sub: string;
    tenantId: string;
    roles: string[];
    iat: number;
    exp: number;
}
export interface SyncMetadata {
    lastSync?: string;
    etag?: string;
    version: number;
}
export interface OutboxEntry {
    id: string;
    method: 'POST' | 'PUT' | 'DELETE';
    endpoint: string;
    data: any;
    idempotencyKey: string;
    createdAt: string;
    retryCount: number;
    lastError?: string;
}
export interface RealtimeEvent {
    type: string;
    payload: any;
    timestamp: string;
    tenantId: string;
    id: string;
}
