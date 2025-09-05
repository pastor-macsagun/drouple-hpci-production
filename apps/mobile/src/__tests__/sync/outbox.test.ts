/**
 * Outbox Manager Unit Tests
 */

import { database } from '../../data/db';
import { outboxManager } from '../../sync/outbox';

// Mock API client
const mockApiClient = {
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

jest.mock('../../lib/api/client', () => ({
  apiClient: mockApiClient,
}));

describe('OutboxManager', () => {
  beforeEach(async () => {
    // Initialize test database
    await database.initialize();
    await database.clearAll();
    
    // Reset mocks
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await database.close();
  });

  describe('enqueue', () => {
    it('should enqueue write operations', async () => {
      const payload = { name: 'Test Member', email: 'test@example.com' };
      
      const outboxId = await outboxManager.enqueue('members', 'CREATE', payload);
      
      expect(outboxId).toBeDefined();
      expect(typeof outboxId).toBe('string');
      
      // Verify it was stored in database
      const db = await database.getDb();
      const item = await db.getFirstAsync(
        'SELECT * FROM outbox WHERE id = ?',
        [outboxId]
      );
      
      expect(item).toBeTruthy();
      expect(item.entity_type).toBe('members');
      expect(item.operation).toBe('CREATE');
      expect(JSON.parse(item.payload)).toEqual(payload);
      expect(item.status).toBe('PENDING');
    });

    it('should generate unique idempotency keys', async () => {
      const payload = { name: 'Test' };
      
      const id1 = await outboxManager.enqueue('members', 'CREATE', payload);
      const id2 = await outboxManager.enqueue('members', 'CREATE', payload);
      
      const db = await database.getDb();
      const items = await db.getAllAsync(
        'SELECT idempotency_key FROM outbox WHERE id IN (?, ?)',
        [id1, id2]
      );
      
      expect(items[0].idempotency_key).not.toBe(items[1].idempotency_key);
    });
  });

  describe('processQueue', () => {
    it('should process pending items successfully', async () => {
      // Mock successful API response
      mockApiClient.post.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'server-id', name: 'Test Member' }),
      });

      // Enqueue an item
      const payload = { name: 'Test Member' };
      await outboxManager.enqueue('members', 'CREATE', payload);

      // Process queue
      await outboxManager.processQueue();

      // Verify API was called
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/api/v2/members',
        payload,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Idempotency-Key': expect.any(String),
          }),
        })
      );

      // Verify item was marked as synced
      const db = await database.getDb();
      const item = await db.getFirstAsync(
        'SELECT status FROM outbox ORDER BY created_at DESC LIMIT 1'
      );
      expect(item.status).toBe('SYNCED');
    });

    it('should handle API failures with retry logic', async () => {
      // Mock API failure
      mockApiClient.post.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
      });

      // Enqueue an item
      await outboxManager.enqueue('members', 'CREATE', { name: 'Test' });

      // Process queue
      await outboxManager.processQueue();

      // Verify item is marked as failed with retry scheduled
      const db = await database.getDb();
      const item = await db.getFirstAsync(
        'SELECT status, retry_count, next_retry_at FROM outbox ORDER BY created_at DESC LIMIT 1'
      );
      
      expect(item.status).toBe('FAILED');
      expect(item.retry_count).toBe(1);
      expect(item.next_retry_at).toBeTruthy();
    });

    it('should permanently fail after max retries', async () => {
      // Mock API failure
      mockApiClient.post.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
      });

      const db = await database.getDb();
      
      // Insert item with max retries already reached
      await db.runAsync(
        `INSERT INTO outbox (
          id, idempotency_key, entity_type, operation, payload, 
          status, retry_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'test-id',
          'test-key',
          'members',
          'CREATE',
          JSON.stringify({ name: 'Test' }),
          'FAILED',
          4, // One less than max (5)
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );

      // Process queue
      await outboxManager.processQueue();

      // Verify item is permanently failed
      const item = await db.getFirstAsync(
        'SELECT status, retry_count FROM outbox WHERE id = ?',
        ['test-id']
      );
      
      expect(item.status).toBe('FAILED');
      expect(item.retry_count).toBe(5);
    });
  });

  describe('getPendingCount', () => {
    it('should return correct pending count', async () => {
      expect(await outboxManager.getPendingCount()).toBe(0);

      // Add some items
      await outboxManager.enqueue('members', 'CREATE', { name: 'Test 1' });
      await outboxManager.enqueue('members', 'CREATE', { name: 'Test 2' });
      
      expect(await outboxManager.getPendingCount()).toBe(2);

      // Mark one as synced
      const db = await database.getDb();
      await db.runAsync(
        'UPDATE outbox SET status = ? WHERE id = (SELECT id FROM outbox LIMIT 1)',
        ['SYNCED']
      );

      expect(await outboxManager.getPendingCount()).toBe(1);
    });
  });

  describe('getEntitySyncStatus', () => {
    it('should return synced for non-existent entity', async () => {
      const status = await outboxManager.getEntitySyncStatus('members', 'non-existent');
      expect(status.status).toBe('synced');
    });

    it('should return correct status for existing entity', async () => {
      const entityId = 'test-entity-123';
      
      // Create outbox entry
      const db = await database.getDb();
      await db.runAsync(
        `INSERT INTO outbox (
          id, idempotency_key, entity_type, entity_id, operation, payload, 
          status, retry_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'test-id',
          'test-key',
          'members',
          entityId,
          'UPDATE',
          JSON.stringify({ name: 'Updated' }),
          'PENDING',
          0,
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );

      const status = await outboxManager.getEntitySyncStatus('members', entityId);
      expect(status.status).toBe('pending');
      expect(status.lastAttempt).toBeDefined();
    });
  });

  describe('clearSyncedItems', () => {
    it('should remove old synced items', async () => {
      const db = await database.getDb();
      
      // Insert old synced item
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);
      
      await db.runAsync(
        `INSERT INTO outbox (
          id, idempotency_key, entity_type, operation, payload, 
          status, retry_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'old-synced',
          'old-key',
          'members',
          'CREATE',
          JSON.stringify({ name: 'Old' }),
          'SYNCED',
          0,
          oldDate.toISOString(),
          oldDate.toISOString(),
        ]
      );

      // Insert recent synced item
      await db.runAsync(
        `INSERT INTO outbox (
          id, idempotency_key, entity_type, operation, payload, 
          status, retry_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'recent-synced',
          'recent-key',
          'members',
          'CREATE',
          JSON.stringify({ name: 'Recent' }),
          'SYNCED',
          0,
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );

      const deletedCount = await outboxManager.clearSyncedItems(7);
      expect(deletedCount).toBe(1);

      // Verify only old item was deleted
      const remaining = await db.getAllAsync('SELECT id FROM outbox');
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('recent-synced');
    });
  });

  describe('resetFailedItems', () => {
    it('should reset failed items to pending', async () => {
      const db = await database.getDb();
      
      // Insert failed item
      await db.runAsync(
        `INSERT INTO outbox (
          id, idempotency_key, entity_type, operation, payload, 
          status, retry_count, error_message, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'failed-item',
          'failed-key',
          'members',
          'CREATE',
          JSON.stringify({ name: 'Failed' }),
          'FAILED',
          3,
          'Network error',
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );

      const resetCount = await outboxManager.resetFailedItems();
      expect(resetCount).toBe(1);

      // Verify item was reset
      const item = await db.getFirstAsync(
        'SELECT status, retry_count, error_message FROM outbox WHERE id = ?',
        ['failed-item']
      );
      
      expect(item.status).toBe('PENDING');
      expect(item.retry_count).toBe(0);
      expect(item.error_message).toBeNull();
    });
  });
});