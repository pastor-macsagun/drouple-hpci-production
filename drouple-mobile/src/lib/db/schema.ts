/**
 * SQLite Database Schema
 * Offline storage schema for queue management and caching
 */

import * as SQLite from 'expo-sqlite';

export interface QueueItem {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: string; // JSON stringified body
  headers?: string; // JSON stringified headers
  priority: number; // 1 = highest, 5 = lowest
  retryCount: number;
  maxRetries: number;
  createdAt: string; // ISO string
  scheduledFor?: string; // ISO string for delayed execution
  lastAttemptAt?: string; // ISO string
  error?: string; // Last error message
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface CacheItem {
  id: string;
  key: string; // Cache key (e.g., 'events-list', 'user-profile')
  data: string; // JSON stringified data
  expiresAt: string; // ISO string
  createdAt: string; // ISO string
  accessedAt: string; // ISO string
}

export interface SyncLog {
  id: string;
  type: 'sync' | 'queue_process' | 'cache_clean';
  status: 'started' | 'completed' | 'failed';
  message: string;
  createdAt: string; // ISO string
  completedAt?: string; // ISO string
  itemsProcessed?: number;
  errors?: string; // JSON stringified error details
}

// Database initialization SQL
export const SCHEMA_SQL = `
  -- Queue table for offline operations
  CREATE TABLE IF NOT EXISTS queue (
    id TEXT PRIMARY KEY,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL CHECK(method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
    body TEXT,
    headers TEXT,
    priority INTEGER NOT NULL DEFAULT 3 CHECK(priority BETWEEN 1 AND 5),
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    created_at TEXT NOT NULL,
    scheduled_for TEXT,
    last_attempt_at TEXT,
    error TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed'))
  );

  -- Cache table for API response caching
  CREATE TABLE IF NOT EXISTS cache (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    data TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    accessed_at TEXT NOT NULL
  );

  -- Sync log table for debugging and monitoring
  CREATE TABLE IF NOT EXISTS sync_log (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('sync', 'queue_process', 'cache_clean')),
    status TEXT NOT NULL CHECK(status IN ('started', 'completed', 'failed')),
    message TEXT NOT NULL,
    created_at TEXT NOT NULL,
    completed_at TEXT,
    items_processed INTEGER,
    errors TEXT
  );

  -- Indexes for better performance
  CREATE INDEX IF NOT EXISTS idx_queue_status_priority ON queue(status, priority);
  CREATE INDEX IF NOT EXISTS idx_queue_scheduled_for ON queue(scheduled_for);
  CREATE INDEX IF NOT EXISTS idx_cache_key ON cache(key);
  CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON cache(expires_at);
  CREATE INDEX IF NOT EXISTS idx_sync_log_created_at ON sync_log(created_at);
`;

// Database version for migrations
export const DATABASE_VERSION = 1;
export const DATABASE_NAME = 'drouple-mobile.db';

/**
 * Initialize database with schema
 */
export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  try {
    const db = SQLite.openDatabase(DATABASE_NAME);

    return new Promise((resolve, reject) => {
      db.transaction(
        tx => {
          // Execute schema SQL
          tx.executeSql(SCHEMA_SQL, [], () => {
            console.log('Database schema initialized successfully');
          });
        },
        error => {
          console.error('Database initialization failed:', error);
          reject(error);
        },
        () => {
          resolve(db);
        }
      );
    });
  } catch (error) {
    console.error('Failed to open database:', error);
    throw error;
  }
}

/**
 * Helper to execute SQL with promise interface
 */
export function executeSQL(
  db: SQLite.SQLiteDatabase,
  sql: string,
  params: any[] = []
): Promise<SQLite.SQLResultSet> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        sql,
        params,
        (_, result) => resolve(result),
        (_, error) => {
          console.error('SQL execution failed:', error, { sql, params });
          reject(error);
          return false;
        }
      );
    });
  });
}

/**
 * Helper to run multiple SQL statements in a transaction
 */
export function executeTransaction(
  db: SQLite.SQLiteDatabase,
  operations: Array<{ sql: string; params?: any[] }>
): Promise<SQLite.SQLResultSet[]> {
  return new Promise((resolve, reject) => {
    const results: SQLite.SQLResultSet[] = [];
    
    db.transaction(
      tx => {
        operations.forEach(({ sql, params = [] }) => {
          tx.executeSql(
            sql,
            params,
            (_, result) => {
              results.push(result);
            },
            (_, error) => {
              console.error('Transaction operation failed:', error, { sql, params });
              reject(error);
              return false;
            }
          );
        });
      },
      error => {
        console.error('Transaction failed:', error);
        reject(error);
      },
      () => {
        resolve(results);
      }
    );
  });
}