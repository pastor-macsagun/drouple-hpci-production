/**
 * Offline Queue Manager
 * Manages offline operations queue with retry logic and sync
 */

import * as SQLite from 'expo-sqlite';
import NetInfo from '@react-native-community/netinfo';
import { initializeDatabase, executeSQL, executeTransaction, QueueItem, SyncLog } from '../db/schema';
import { httpClient } from '../api/http';
import { APP_CONFIG } from '../../config/app';

interface QueueOperation {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  priority?: number;
  maxRetries?: number;
  scheduledFor?: Date;
}

interface QueueConfig {
  maxConcurrentOperations: number;
  processingIntervalMs: number;
  retryDelayMs: number;
  maxRetryDelayMs: number;
  cleanupIntervalMs: number;
}

export class OfflineQueue {
  private db: SQLite.SQLiteDatabase | null = null;
  private isProcessing = false;
  private processingTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isOnline = true;
  private listeners: Array<(isOnline: boolean) => void> = [];

  private readonly config: QueueConfig = {
    maxConcurrentOperations: 3,
    processingIntervalMs: 5000, // 5 seconds
    retryDelayMs: 1000, // 1 second
    maxRetryDelayMs: 60000, // 60 seconds
    cleanupIntervalMs: 60000, // 1 minute
  };

  constructor() {
    this.initializeNetworkListener();
  }

  /**
   * Initialize the offline queue system
   */
  async initialize(): Promise<void> {
    try {
      this.db = await initializeDatabase();
      console.log('Offline queue initialized');

      // Start processing and cleanup timers
      this.startProcessing();
      this.startCleanup();
    } catch (error) {
      console.error('Failed to initialize offline queue:', error);
      throw error;
    }
  }

  /**
   * Add operation to queue
   */
  async enqueue(operation: QueueOperation): Promise<string> {
    if (!this.db) {
      throw new Error('Queue not initialized');
    }

    const id = this.generateId();
    const now = new Date().toISOString();

    const queueItem: Omit<QueueItem, 'retryCount' | 'status'> = {
      id,
      endpoint: operation.endpoint,
      method: operation.method,
      body: operation.body ? JSON.stringify(operation.body) : undefined,
      headers: operation.headers ? JSON.stringify(operation.headers) : undefined,
      priority: operation.priority || 3,
      maxRetries: operation.maxRetries || 3,
      createdAt: now,
      scheduledFor: operation.scheduledFor?.toISOString(),
    };

    try {
      await executeSQL(this.db, `
        INSERT INTO queue (
          id, endpoint, method, body, headers, priority, max_retries,
          created_at, scheduled_for, retry_count, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'pending')
      `, [
        queueItem.id,
        queueItem.endpoint,
        queueItem.method,
        queueItem.body,
        queueItem.headers,
        queueItem.priority,
        queueItem.maxRetries,
        queueItem.createdAt,
        queueItem.scheduledFor,
      ]);

      console.log(`Operation queued: ${operation.method} ${operation.endpoint}`);

      // Trigger immediate processing if online
      if (this.isOnline && !this.isProcessing) {
        this.processQueue();
      }

      return id;
    } catch (error) {
      console.error('Failed to enqueue operation:', error);
      throw error;
    }
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<{
    pending: number;
    processing: number;
    failed: number;
    total: number;
  }> {
    if (!this.db) {
      return { pending: 0, processing: 0, failed: 0, total: 0 };
    }

    try {
      const result = await executeSQL(this.db, `
        SELECT 
          status,
          COUNT(*) as count
        FROM queue
        WHERE status != 'completed'
        GROUP BY status
      `);

      const counts = { pending: 0, processing: 0, failed: 0, total: 0 };

      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        counts[row.status as keyof typeof counts] = row.count;
        counts.total += row.count;
      }

      return counts;
    } catch (error) {
      console.error('Failed to get queue status:', error);
      return { pending: 0, processing: 0, failed: 0, total: 0 };
    }
  }

  /**
   * Process queued operations
   */
  private async processQueue(): Promise<void> {
    if (!this.db || this.isProcessing || !this.isOnline) {
      return;
    }

    this.isProcessing = true;
    await this.logSync('queue_process', 'started', 'Processing queue');

    try {
      // Get pending operations, ordered by priority and creation time
      const result = await executeSQL(this.db, `
        SELECT * FROM queue
        WHERE status = 'pending'
        AND (scheduled_for IS NULL OR scheduled_for <= ?)
        ORDER BY priority ASC, created_at ASC
        LIMIT ?
      `, [
        new Date().toISOString(),
        this.config.maxConcurrentOperations,
      ]);

      const operations: QueueItem[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        operations.push(this.mapRowToQueueItem(result.rows.item(i)));
      }

      if (operations.length === 0) {
        await this.logSync('queue_process', 'completed', 'No pending operations');
        return;
      }

      // Process operations concurrently
      const promises = operations.map(operation => this.processOperation(operation));
      const results = await Promise.allSettled(promises);

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      await this.logSync(
        'queue_process',
        'completed',
        `Processed ${operations.length} operations`,
        operations.length,
        failed > 0 ? JSON.stringify({ failed }) : undefined
      );
    } catch (error) {
      console.error('Queue processing failed:', error);
      await this.logSync('queue_process', 'failed', `Queue processing error: ${error}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process single operation
   */
  private async processOperation(operation: QueueItem): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Mark as processing
      await executeSQL(this.db, `
        UPDATE queue
        SET status = 'processing', last_attempt_at = ?
        WHERE id = ?
      `, [new Date().toISOString(), operation.id]);

      // Parse headers and body
      const headers = operation.headers ? JSON.parse(operation.headers) : {};
      const body = operation.body ? JSON.parse(operation.body) : undefined;

      // Execute HTTP request
      const response = await httpClient.request(operation.endpoint, {
        method: operation.method,
        headers,
        body,
      });

      if (response.success) {
        // Mark as completed
        await executeSQL(this.db, `
          UPDATE queue
          SET status = 'completed'
          WHERE id = ?
        `, [operation.id]);

        console.log(`Operation completed: ${operation.method} ${operation.endpoint}`);
      } else {
        throw new Error(response.error || 'Operation failed');
      }
    } catch (error) {
      console.error(`Operation failed: ${operation.method} ${operation.endpoint}`, error);
      await this.handleOperationFailure(operation, error as Error);
    }
  }

  /**
   * Handle operation failure with retry logic
   */
  private async handleOperationFailure(operation: QueueItem, error: Error): Promise<void> {
    if (!this.db) {
      return;
    }

    const newRetryCount = operation.retryCount + 1;
    const shouldRetry = newRetryCount <= operation.maxRetries;

    if (shouldRetry) {
      // Calculate retry delay with exponential backoff
      const baseDelay = this.config.retryDelayMs * Math.pow(2, operation.retryCount);
      const delay = Math.min(baseDelay, this.config.maxRetryDelayMs);
      const scheduledFor = new Date(Date.now() + delay);

      await executeSQL(this.db, `
        UPDATE queue
        SET 
          status = 'pending',
          retry_count = ?,
          scheduled_for = ?,
          error = ?
        WHERE id = ?
      `, [newRetryCount, scheduledFor.toISOString(), error.message, operation.id]);

      console.log(`Operation scheduled for retry ${newRetryCount}/${operation.maxRetries}: ${operation.endpoint}`);
    } else {
      // Mark as permanently failed
      await executeSQL(this.db, `
        UPDATE queue
        SET 
          status = 'failed',
          retry_count = ?,
          error = ?
        WHERE id = ?
      `, [newRetryCount, error.message, operation.id]);

      console.warn(`Operation permanently failed: ${operation.endpoint}`);
    }
  }

  /**
   * Clear completed operations from queue
   */
  private async cleanupQueue(): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      // Remove completed operations older than 24 hours
      const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const result = await executeSQL(this.db, `
        DELETE FROM queue
        WHERE status = 'completed'
        AND created_at < ?
      `, [cutoffDate]);

      if (result.rowsAffected > 0) {
        console.log(`Cleaned up ${result.rowsAffected} completed operations`);
      }

      // Clean up old sync logs (keep last 100)
      await executeSQL(this.db, `
        DELETE FROM sync_log
        WHERE id NOT IN (
          SELECT id FROM sync_log
          ORDER BY created_at DESC
          LIMIT 100
        )
      `);
    } catch (error) {
      console.error('Queue cleanup failed:', error);
    }
  }

  /**
   * Network connectivity handling
   */
  private initializeNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (!wasOnline && this.isOnline) {
        console.log('Network reconnected, processing queue');
        this.processQueue();
      }

      this.listeners.forEach(listener => listener(this.isOnline));
    });
  }

  /**
   * Start processing timer
   */
  private startProcessing(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
    }

    this.processingTimer = setInterval(() => {
      if (this.isOnline) {
        this.processQueue();
      }
    }, this.config.processingIntervalMs);
  }

  /**
   * Start cleanup timer
   */
  private startCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanupQueue();
    }, this.config.cleanupIntervalMs);
  }

  /**
   * Add network status listener
   */
  addNetworkListener(listener: (isOnline: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Utility methods
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private mapRowToQueueItem(row: any): QueueItem {
    return {
      id: row.id,
      endpoint: row.endpoint,
      method: row.method,
      body: row.body,
      headers: row.headers,
      priority: row.priority,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      createdAt: row.created_at,
      scheduledFor: row.scheduled_for,
      lastAttemptAt: row.last_attempt_at,
      error: row.error,
      status: row.status,
    };
  }

  private async logSync(
    type: 'sync' | 'queue_process' | 'cache_clean',
    status: 'started' | 'completed' | 'failed',
    message: string,
    itemsProcessed?: number,
    errors?: string
  ): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      const id = this.generateId();
      const now = new Date().toISOString();

      await executeSQL(this.db, `
        INSERT INTO sync_log (
          id, type, status, message, created_at, completed_at, items_processed, errors
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        type,
        status,
        message,
        now,
        status !== 'started' ? now : null,
        itemsProcessed,
        errors,
      ]);
    } catch (error) {
      console.error('Failed to log sync operation:', error);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.listeners = [];
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueue();

export default offlineQueue;