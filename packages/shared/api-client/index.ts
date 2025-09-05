/**
 * HPCI-ChMS API Client
 * 
 * Typed API client for HPCI Church Management System.
 * Supports both web and mobile applications with:
 * - Bearer JWT authentication
 * - Multi-tenant isolation
 * - Cursor-based pagination
 * - ETag caching
 * - Idempotency for write operations
 * - Rate limiting awareness
 */

export {
  HpciApiClient,
  createApiClient,
  AttendanceCheckinRequestSchema,
  type ApiClient,
  type ApiClientConfig,
  type ETagOptions,
  type IdempotencyOptions,
} from './client.js';

export type * from './types.js';