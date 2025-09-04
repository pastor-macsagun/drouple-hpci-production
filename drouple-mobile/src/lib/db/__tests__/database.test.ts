/**
 * Database Manager Tests
 * Unit tests for SQLite queue and key-value operations
 */

import { database, QueueActionType } from '../database';

describe('DatabaseManager', () => {
  beforeAll(async () => {
    await database.initialize();
  });

  beforeEach(async () => {
    await database.clearQueue();
    // Clear KV store
    const keys = await database.getKVKeys();
    for (const key of keys) {
      await database.deleteKV(key);
    }
  });

  describe('Queue Operations', () => {
    it('should enqueue and retrieve actions', async () => {
      const payload = { memberId: '123', serviceId: '456' };
      const id = await database.enqueue('CHECKIN', payload);

      expect(id).toBeGreaterThan(0);

      const actions = await database.listQueue();
      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe('CHECKIN');
      expect(JSON.parse(actions[0].payload)).toEqual(payload);
    });

    it('should filter actions by type', async () => {
      await database.enqueue('CHECKIN', { test: 1 });
      await database.enqueue('RSVP', { test: 2 });
      await database.enqueue('CHECKIN', { test: 3 });

      const checkinActions = await database.getQueueByType('CHECKIN');
      expect(checkinActions).toHaveLength(2);
      checkinActions.forEach(action => {
        expect(action.type).toBe('CHECKIN');
      });

      const rsvpActions = await database.getQueueByType('RSVP');
      expect(rsvpActions).toHaveLength(1);
      expect(rsvpActions[0].type).toBe('RSVP');
    });

    it('should remove actions from queue', async () => {
      const id = await database.enqueue('CHECKIN', { test: 1 });

      let actions = await database.listQueue();
      expect(actions).toHaveLength(1);

      await database.removeFromQueue(id);

      actions = await database.listQueue();
      expect(actions).toHaveLength(0);
    });

    it('should get queue count', async () => {
      expect(await database.getQueueCount()).toBe(0);

      await database.enqueue('CHECKIN', { test: 1 });
      await database.enqueue('RSVP', { test: 2 });

      expect(await database.getQueueCount()).toBe(2);
    });

    it('should update retry count', async () => {
      const id = await database.enqueue('CHECKIN', { test: 1 });

      await database.updateRetryCount(id, 2);

      const actions = await database.listQueue();
      expect(actions[0].retryCount).toBe(2);
    });
  });

  describe('Key-Value Operations', () => {
    it('should set and get string values', async () => {
      await database.setKV('test-key', 'test-value');

      const value = await database.getKV('test-key');
      expect(value).toBe('test-value');
    });

    it('should set and get JSON values', async () => {
      const testObject = { name: 'John', age: 30, active: true };
      await database.setKV('test-json', testObject);

      const retrieved = await database.getKVJson('test-json');
      expect(retrieved).toEqual(testObject);
    });

    it('should return null for non-existent keys', async () => {
      const value = await database.getKV('non-existent');
      expect(value).toBeNull();

      const jsonValue = await database.getKVJson('non-existent');
      expect(jsonValue).toBeNull();
    });

    it('should delete key-value pairs', async () => {
      await database.setKV('test-delete', 'value');

      let value = await database.getKV('test-delete');
      expect(value).toBe('value');

      await database.deleteKV('test-delete');

      value = await database.getKV('test-delete');
      expect(value).toBeNull();
    });

    it('should get keys with prefix filter', async () => {
      await database.setKV('cache:events', 'events data');
      await database.setKV('cache:users', 'users data');
      await database.setKV('settings:theme', 'dark');

      const cacheKeys = await database.getKVKeys('cache:');
      expect(cacheKeys).toHaveLength(2);
      expect(cacheKeys.sort()).toEqual(['cache:events', 'cache:users']);

      const allKeys = await database.getKVKeys();
      expect(allKeys).toHaveLength(3);
    });
  });

  describe('Statistics', () => {
    it('should return database statistics', async () => {
      // Add some test data
      await database.enqueue('CHECKIN', { test: 1 });
      await database.enqueue('CHECKIN', { test: 2 });
      await database.enqueue('RSVP', { test: 3 });
      await database.setKV('key1', 'value1');
      await database.setKV('key2', 'value2');

      const stats = await database.getStats();

      expect(stats.queueCount).toBe(3);
      expect(stats.kvCount).toBe(2);
      expect(stats.queueByType.CHECKIN).toBe(2);
      expect(stats.queueByType.RSVP).toBe(1);
      expect(stats.queueByType.GROUP_REQUEST).toBe(0);
      expect(stats.queueByType.PATHWAY_STEP).toBe(0);
    });
  });
});
