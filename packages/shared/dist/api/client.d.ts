import { ApiResponse, PaginationParams } from '../types/api';
export interface ApiClientConfig {
    baseUrl: string;
    timeout?: number;
    headers?: Record<string, string>;
    onError?: (error: any) => void;
}
export declare class ApiClient {
    private baseUrl;
    private timeout;
    private defaultHeaders;
    private onError?;
    constructor(config: ApiClientConfig);
    request<T = any>(endpoint: string, options?: RequestInit & {
        timeout?: number;
        idempotencyKey?: string;
    }): Promise<ApiResponse<T>>;
    get<T = any>(endpoint: string, params?: PaginationParams): Promise<ApiResponse<T>>;
    post<T = any>(endpoint: string, data?: any, idempotencyKey?: string): Promise<ApiResponse<T>>;
    put<T = any>(endpoint: string, data?: any, idempotencyKey?: string): Promise<ApiResponse<T>>;
    patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>>;
    delete<T = any>(endpoint: string): Promise<ApiResponse<T>>;
    setAuthToken(token: string): void;
    removeAuthToken(): void;
    setHeader(key: string, value: string): void;
    removeHeader(key: string): void;
}
