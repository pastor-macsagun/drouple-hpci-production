/**
 * SQLite Database Manager
 * Offline queue and key-value storage for sync management
 */

import * as SQLite from 'expo-sqlite';

export type QueueActionType =
  | 'CHECKIN'
  | 'RSVP'
  | 'GROUP_REQUEST'
  | 'PATHWAY_STEP';

export interface QueuedAction {
  id: number;
  type: QueueActionType;
  payload: string; // JSON stringified data
  createdAt: string; // ISO timestamp
  retryCount?: number;
}

export interface KeyValuePair {
  key: string;
  value: string;
}

class DatabaseManager {
  private db: SQLite.SQLiteDatabase | null = null;

  /**
   * Initialize database and create tables
   */
  async initialize(): Promise<void> {
    try {
      // Open database
      this.db = await SQLite.openDatabaseAsync('drouple_mobile.db');

      // Create tables
      await this.db.execAsync(`
        PRAGMA journal_mode = WAL;
        
        CREATE TABLE IF NOT EXISTS queued_actions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          payload TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          retryCount INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS kv (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_queued_actions_type ON queued_actions(type);
        CREATE INDEX IF NOT EXISTS idx_queued_actions_created ON queued_actions(createdAt);
      `);

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Ensure database is initialized
   */
  private ensureInitialized(): void {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
  }

  // ==================== QUEUE OPERATIONS ====================

  /**
   * Add action to offline queue
   */
  async enqueue(type: QueueActionType, payload: any): Promise<number> {
    this.ensureInitialized();

    const result = await this.db!.runAsync(
      'INSERT INTO queued_actions (type, payload, createdAt) VALUES (?, ?, ?)',
      [type, JSON.stringify(payload), new Date().toISOString()]
    );

    console.log(`Enqueued ${type} action with ID ${result.lastInsertRowId}`);
    return result.lastInsertRowId!;
  }

  /**
   * Get all queued actions
   */
  async listQueue(): Promise<QueuedAction[]> {
    this.ensureInitialized();

    const result = await this.db!.getAllAsync(
      'SELECT * FROM queued_actions ORDER BY createdAt ASC'
    );

    return result as QueuedAction[];
  }

  /**
   * Get queued actions by type
   */
  async getQueueByType(type: QueueActionType): Promise<QueuedAction[]> {
    this.ensureInitialized();

    const result = await this.db!.getAllAsync(
      'SELECT * FROM queued_actions WHERE type = ? ORDER BY createdAt ASC',
      [type]
    );

    return result as QueuedAction[];
  }

  /**
   * Remove action from queue
   */
  async removeFromQueue(id: number): Promise<void> {
    this.ensureInitialized();

    await this.db!.runAsync('DELETE FROM queued_actions WHERE id = ?', [id]);

    console.log(`Removed action ${id} from queue`);
  }

  /**
   * Clear entire queue
   */
  async clearQueue(): Promise<void> {
    this.ensureInitialized();

    const result = await this.db!.runAsync('DELETE FROM queued_actions');
    console.log(`Cleared ${result.changes} actions from queue`);
  }

  /**
   * Update retry count for action
   */
  async updateRetryCount(id: number, retryCount: number): Promise<void> {
    this.ensureInitialized();

    await this.db!.runAsync(
      'UPDATE queued_actions SET retryCount = ? WHERE id = ?',
      [retryCount, id]
    );
  }

  // ==================== KEY-VALUE OPERATIONS ====================

  /**
   * Set key-value pair
   */
  async setKV(key: string, value: any): Promise<void> {
    this.ensureInitialized();

    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);

    await this.db!.runAsync(
      `INSERT OR REPLACE INTO kv (key, value, updatedAt) VALUES (?, ?, ?)`,
      [key, valueStr, new Date().toISOString()]
    );

    console.log(`Set KV: ${key}`);
  }

  /**
   * Get value by key
   */
  async getKV(key: string): Promise<string | null> {
    this.ensureInitialized();

    const result = (await this.db!.getFirstAsync(
      'SELECT value FROM kv WHERE key = ?',
      [key]
    )) as { value: string } | null;

    return result?.value || null;
  }

  /**
   * Get parsed JSON value by key
   */
  async getKVJson<T = any>(key: string): Promise<T | null> {
    const value = await this.getKV(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Failed to parse JSON for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete key-value pair
   */
  async deleteKV(key: string): Promise<void> {
    this.ensureInitialized();

    await this.db!.runAsync('DELETE FROM kv WHERE key = ?', [key]);
    console.log(`Deleted KV: ${key}`);
  }

  /**
   * Get all keys with optional prefix filter
   */
  async getKVKeys(prefix?: string): Promise<string[]> {
    this.ensureInitialized();

    let query = 'SELECT key FROM kv';
    const params: any[] = [];

    if (prefix) {
      query += ' WHERE key LIKE ?';
      params.push(`${prefix}%`);
    }

    query += ' ORDER BY key';

    const result = await this.db!.getAllAsync(query, params);
    return result.map((row: any) => row.key);
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get queue count
   */
  async getQueueCount(): Promise<number> {
    this.ensureInitialized();

    const result = (await this.db!.getFirstAsync(
      'SELECT COUNT(*) as count FROM queued_actions'
    )) as { count: number };

    return result.count;
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    queueCount: number;
    kvCount: number;
    queueByType: Record<QueueActionType, number>;
  }> {
    this.ensureInitialized();

    const [queueCount, kvCount, queueStats] = await Promise.all([
      this.getQueueCount(),
      this.db!.getFirstAsync('SELECT COUNT(*) as count FROM kv'),
      this.db!.getAllAsync(`
        SELECT type, COUNT(*) as count 
        FROM queued_actions 
        GROUP BY type
      `),
    ]);

    const queueByType: Record<QueueActionType, number> = {
      CHECKIN: 0,
      RSVP: 0,
      GROUP_REQUEST: 0,
      PATHWAY_STEP: 0,
    };

    (queueStats as any[]).forEach(stat => {
      queueByType[stat.type as QueueActionType] = stat.count;
    });

    return {
      queueCount,
      kvCount: (kvCount as any).count,
      queueByType,
    };
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      console.log('Database connection closed');
    }
  }
}

// Create singleton instance
export const database = new DatabaseManager();

// Export types
export type { QueueActionType, QueuedAction, KeyValuePair };

export default database;
