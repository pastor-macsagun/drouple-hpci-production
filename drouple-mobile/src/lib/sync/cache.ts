/**
 * Cache Manager
 * Manages SQLite-based caching for API responses and offline data
 */

import * as SQLite from 'expo-sqlite';
import { initializeDatabase, executeSQL, CacheItem } from '../db/schema';
import { APP_CONFIG } from '../../config/app';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  forceRefresh?: boolean;
}

interface CacheStats {
  totalItems: number;
  totalSize: number; // Approximate size in bytes
  oldestItem?: string;
  newestItem?: string;
}

export class CacheManager {
  private db: SQLite.SQLiteDatabase | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;

  private readonly config = {
    defaultTTL: APP_CONFIG.cache.ttlDefault,
    maxSize: APP_CONFIG.cache.sizeLimit,
    cleanupIntervalMs: 10 * 60 * 1000, // 10 minutes
  };

  /**
   * Initialize the cache manager
   */
  async initialize(): Promise<void> {
    try {
      this.db = await initializeDatabase();
      console.log('Cache manager initialized');

      // Start cleanup timer
      this.startCleanup();
    } catch (error) {
      console.error('Failed to initialize cache manager:', error);
      throw error;
    }
  }

  /**
   * Get item from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.db) {
      throw new Error('Cache not initialized');
    }

    try {
      const result = await executeSQL(this.db, `
        SELECT data, expires_at
        FROM cache
        WHERE key = ?
      `, [key]);

      if (result.rows.length === 0) {
        return null;
      }

      const item = result.rows.item(0);
      const expiresAt = new Date(item.expires_at);
      const now = new Date();

      // Check if expired
      if (now > expiresAt) {
        // Remove expired item
        await this.delete(key);
        return null;
      }

      // Update access time
      await executeSQL(this.db, `
        UPDATE cache
        SET accessed_at = ?
        WHERE key = ?
      `, [now.toISOString(), key]);

      return JSON.parse(item.data);
    } catch (error) {
      console.error('Failed to get cache item:', key, error);
      return null;
    }
  }

  /**
   * Set item in cache
   */
  async set<T = any>(
    key: string,
    data: T,
    options: CacheOptions = {}
  ): Promise<void> {
    if (!this.db) {
      throw new Error('Cache not initialized');
    }

    const { ttl = this.config.defaultTTL } = options;

    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttl);
      const id = this.generateId();

      // Serialize data
      const serializedData = JSON.stringify(data);

      // Check if we need to make space
      await this.ensureSpace(serializedData.length);

      // Insert or replace cache item
      await executeSQL(this.db, `
        INSERT OR REPLACE INTO cache (
          id, key, data, expires_at, created_at, accessed_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        id,
        key,
        serializedData,
        expiresAt.toISOString(),
        now.toISOString(),
        now.toISOString(),
      ]);

      console.log(`Cache item set: ${key} (expires: ${expiresAt.toISOString()})`);
    } catch (error) {
      console.error('Failed to set cache item:', key, error);
      throw error;
    }
  }

  /**
   * Delete item from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.db) {
      throw new Error('Cache not initialized');
    }

    try {
      const result = await executeSQL(this.db, `
        DELETE FROM cache WHERE key = ?
      `, [key]);

      return result.rowsAffected > 0;
    } catch (error) {
      console.error('Failed to delete cache item:', key, error);
      return false;
    }
  }

  /**
   * Check if key exists in cache and is not expired
   */
  async has(key: string): Promise<boolean> {
    if (!this.db) {
      return false;
    }

    try {
      const result = await executeSQL(this.db, `
        SELECT expires_at
        FROM cache
        WHERE key = ?
      `, [key]);

      if (result.rows.length === 0) {
        return false;
      }

      const expiresAt = new Date(result.rows.item(0).expires_at);
      const now = new Date();

      return now <= expiresAt;
    } catch (error) {
      console.error('Failed to check cache item:', key, error);
      return false;
    }
  }

  /**
   * Clear all cache items
   */
  async clear(): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      await executeSQL(this.db, 'DELETE FROM cache');
      console.log('Cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Clear expired items
   */
  async clearExpired(): Promise<number> {
    if (!this.db) {
      return 0;
    }

    try {
      const now = new Date().toISOString();
      const result = await executeSQL(this.db, `
        DELETE FROM cache
        WHERE expires_at < ?
      `, [now]);

      if (result.rowsAffected > 0) {
        console.log(`Cleared ${result.rowsAffected} expired cache items`);
      }

      return result.rowsAffected;
    } catch (error) {
      console.error('Failed to clear expired cache items:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    if (!this.db) {
      return { totalItems: 0, totalSize: 0 };
    }

    try {
      const result = await executeSQL(this.db, `
        SELECT 
          COUNT(*) as total_items,
          SUM(LENGTH(data)) as total_size,
          MIN(created_at) as oldest_item,
          MAX(created_at) as newest_item
        FROM cache
      `);

      const row = result.rows.item(0);

      return {
        totalItems: row.total_items || 0,
        totalSize: row.total_size || 0,
        oldestItem: row.oldest_item || undefined,
        newestItem: row.newest_item || undefined,
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { totalItems: 0, totalSize: 0 };
    }
  }

  /**
   * Get cached data with automatic refresh if needed
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { forceRefresh = false } = options;

    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
    }

    // Fetch fresh data
    const data = await fetcher();

    // Cache the result
    await this.set(key, data, options);

    return data;
  }

  /**
   * Batch operations for multiple cache items
   */
  async batchSet<T>(
    items: Array<{ key: string; data: T; options?: CacheOptions }>,
  ): Promise<void> {
    if (!this.db) {
      throw new Error('Cache not initialized');
    }

    try {
      const now = new Date();
      const operations = items.map(item => {
        const { key, data, options = {} } = item;
        const { ttl = this.config.defaultTTL } = options;
        const expiresAt = new Date(now.getTime() + ttl);
        const id = this.generateId();

        return {
          sql: `
            INSERT OR REPLACE INTO cache (
              id, key, data, expires_at, created_at, accessed_at
            ) VALUES (?, ?, ?, ?, ?, ?)
          `,
          params: [
            id,
            key,
            JSON.stringify(data),
            expiresAt.toISOString(),
            now.toISOString(),
            now.toISOString(),
          ],
        };
      });

      // Execute all operations in a transaction
      const { executeTransaction } = await import('../db/schema');
      await executeTransaction(this.db, operations);

      console.log(`Batch cached ${items.length} items`);
    } catch (error) {
      console.error('Failed to batch set cache items:', error);
      throw error;
    }
  }

  /**
   * Ensure we have enough space for new data
   */
  private async ensureSpace(requiredSize: number): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      const stats = await this.getStats();
      const availableSpace = this.config.maxSize - stats.totalSize;

      if (requiredSize <= availableSpace) {
        return; // Enough space available
      }

      // Need to free up space - remove least recently accessed items
      const targetSize = requiredSize * 2; // Free up twice what we need
      
      await executeSQL(this.db, `
        DELETE FROM cache
        WHERE id IN (
          SELECT id FROM cache
          ORDER BY accessed_at ASC
          LIMIT (
            SELECT COUNT(*) FROM cache WHERE (
              SELECT SUM(LENGTH(data)) FROM cache c2
              WHERE c2.accessed_at <= cache.accessed_at
            ) <= ?
          )
        )
      `, [targetSize]);

      console.log(`Freed up cache space for ${requiredSize} bytes`);
    } catch (error) {
      console.error('Failed to ensure cache space:', error);
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.clearExpired();
    }, this.config.cleanupIntervalMs);
  }

  /**
   * Generate unique ID for cache items
   */
  private generateId(): string {
    return `cache-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// Singleton instance
export const cacheManager = new CacheManager();

export default cacheManager;