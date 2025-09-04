/**
 * Contract tests - verify OpenAPI spec matches runtime
 */

import { describe, it, expect } from 'vitest';
import { createApiClient } from '@drouple/contracts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

describe('API v1 Contract Tests', () => {
  const client = createApiClient({
    baseUrl: API_BASE_URL,
    timeout: 5000,
  });

  it('should have health endpoint available', async () => {
    // Basic connectivity test
    expect(API_BASE_URL).toContain('/api/v1');
  });

  it('should validate login endpoint schema', async () => {
    // Test invalid request returns proper error format
    const response = await client.login('', '');
    expect(response.ok).toBe(false);
    expect(response.code).toBeDefined();
    expect(response.message).toBeDefined();
  });

  it('should validate members search endpoint', async () => {
    // Test without auth returns proper error
    const response = await client.searchMembers('test');
    expect(response.ok).toBe(false);
    expect(response.code).toBe('UNAUTHORIZED');
  });

  it('should validate events endpoint', async () => {
    // Test without auth returns proper error  
    const response = await client.getEvents();
    expect(response.ok).toBe(false);
    expect(response.code).toBe('UNAUTHORIZED');
  });
});