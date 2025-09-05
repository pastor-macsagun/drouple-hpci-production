/**
 * Outbox Manager - Reliable write operations with retry logic
 * Ensures critical operations (like check-ins) eventually reach the server
 */

import { db, DbOutboxItem } from '../data/db';
import { createApiClient } from '../lib/api/client';
import { generateId } from '../lib/utils/id';
import { attendanceRepo } from '../data/repos/attendance';

export interface OutboxWriteRequest {
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  payload: Record<string, any>;
  localRecordId?: string; // Link to local record for status updates
  resourceType?: 'attendance' | 'event' | 'member';
}

export interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

class OutboxManager {
  private apiClient = createApiClient();
  private isProcessing = false;
  private maxRetries = 5;
  private baseRetryDelay = 1000; // 1 second
  private maxRetryDelay = 300000; // 5 minutes

  async enqueueWrite(request: OutboxWriteRequest): Promise<string> {
    const database = db.getDatabase();
    const id = generateId();
    const idempotencyKey = `mobile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const outboxItem: DbOutboxItem = {
      id,
      endpoint: request.endpoint,
      method: request.method,
      payload: JSON.stringify({
        ...request.payload,
        localRecordId: request.localRecordId,
        resourceType: request.resourceType,
      }),
      idempotencyKey,
      status: 'pending',
      retryCount: 0,
      createdAt: now,
    };

    await database.runAsync(
      `INSERT INTO outbox 
       (id, endpoint, method, payload, idempotencyKey, status, retryCount, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        outboxItem.id,
        outboxItem.endpoint,
        outboxItem.method,
        outboxItem.payload,
        outboxItem.idempotencyKey,
        outboxItem.status,
        outboxItem.retryCount,
        outboxItem.createdAt,
      ]
    );

    // Trigger immediate processing if online
    this.processQueue().catch(console.error);

    return id;
  }

  async processQueue(): Promise<SyncResult> {
    if (this.isProcessing) {
      return { success: true, processed: 0, failed: 0, errors: [] };
    }

    this.isProcessing = true;
    const result: SyncResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
    };

    try {
      const database = db.getDatabase();
      const pendingItems = await database.getAllAsync<DbOutboxItem>(
        `SELECT * FROM outbox 
         WHERE status = 'pending' AND retryCount < ?
         ORDER BY createdAt ASC
         LIMIT 50`,
        [this.maxRetries]
      );

      console.log(`Processing ${pendingItems.length} outbox items`);

      for (const item of pendingItems) {
        const itemResult = await this.processItem(item);
        if (itemResult.success) {
          result.processed++;
        } else {
          result.failed++;
          result.errors.push({ id: item.id, error: itemResult.error || 'Unknown error' });
        }
      }

      result.success = result.failed === 0;

    } catch (error) {
      console.error('Outbox processing failed:', error);
      result.success = false;
      result.errors.push({
        id: 'outbox',
        error: error instanceof Error ? error.message : 'Processing failed'
      });
    } finally {
      this.isProcessing = false;
    }

    return result;
  }

  private async processItem(item: DbOutboxItem): Promise<{
    success: boolean;
    error?: string;
  }> {
    const database = db.getDatabase();
    const now = new Date().toISOString();

    try {
      // Update attempt timestamp
      await database.runAsync(
        'UPDATE outbox SET lastAttemptAt = ? WHERE id = ?',
        [now, item.id]
      );

      const payload = JSON.parse(item.payload);

      // Make API request with idempotency key
      const response = await this.apiClient.request(item.endpoint, {
        method: item.method,
        headers: {
          'Idempotency-Key': item.idempotencyKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok || response.status === 409) {
        // Success or duplicate (409) - both are acceptable
        await this.markAsCompleted(item, payload);
        return { success: true };
      } else if (response.status >= 400 && response.status < 500) {
        // Client error - don't retry
        await this.markAsFailed(item, `HTTP ${response.status}: Client error`);
        return { success: false, error: `Client error: ${response.status}` };
      } else {
        // Server error - retry with backoff
        await this.scheduleRetry(item, `HTTP ${response.status}: Server error`);
        return { success: false, error: `Server error: ${response.status}` };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      
      // Network errors should be retried
      await this.scheduleRetry(item, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  private async markAsCompleted(item: DbOutboxItem, payload: any): Promise<void> {
    const database = db.getDatabase();
    
    await database.withTransactionAsync(async () => {
      // Mark outbox item as completed
      await database.runAsync(
        'UPDATE outbox SET status = "synced" WHERE id = ?',
        [item.id]
      );

      // Update local resource status if applicable
      if (payload.localRecordId && payload.resourceType === 'attendance') {
        await attendanceRepo.markAsSynced(payload.localRecordId);
      }
    });
  }

  private async markAsFailed(item: DbOutboxItem, error: string): Promise<void> {
    const database = db.getDatabase();
    await database.runAsync(
      `UPDATE outbox 
       SET status = "failed", errorMessage = ?, retryCount = retryCount + 1
       WHERE id = ?`,
      [error, item.id]
    );
  }

  private async scheduleRetry(item: DbOutboxItem, error: string): Promise<void> {
    const database = db.getDatabase();
    const newRetryCount = item.retryCount + 1;

    if (newRetryCount >= this.maxRetries) {
      await this.markAsFailed(item, `Max retries exceeded: ${error}`);
      return;
    }

    await database.runAsync(
      `UPDATE outbox 
       SET retryCount = ?, errorMessage = ?
       WHERE id = ?`,
      [newRetryCount, error, item.id]
    );

    // Schedule exponential backoff retry
    const delay = Math.min(
      this.baseRetryDelay * Math.pow(2, newRetryCount),
      this.maxRetryDelay
    );

    setTimeout(() => {
      this.processQueue().catch(console.error);
    }, delay);
  }

  // Statistics and management
  async getQueueStatus(): Promise<{
    pending: number;
    synced: number;
    failed: number;
    oldestPending?: string;
  }> {
    const database = db.getDatabase();

    const [pending, synced, failed, oldest] = await Promise.all([
      database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM outbox WHERE status = "pending"'
      ),
      database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM outbox WHERE status = "synced"'
      ),
      database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM outbox WHERE status = "failed"'
      ),
      database.getFirstAsync<{ createdAt: string }>(
        'SELECT createdAt FROM outbox WHERE status = "pending" ORDER BY createdAt ASC LIMIT 1'
      ),
    ]);

    return {
      pending: pending?.count ?? 0,
      synced: synced?.count ?? 0,
      failed: failed?.count ?? 0,
      oldestPending: oldest?.createdAt,
    };
  }

  async getPendingItems(): Promise<DbOutboxItem[]> {
    const database = db.getDatabase();
    return database.getAllAsync<DbOutboxItem>(
      'SELECT * FROM outbox WHERE status = "pending" ORDER BY createdAt ASC'
    );
  }

  async getFailedItems(): Promise<DbOutboxItem[]> {
    const database = db.getDatabase();
    return database.getAllAsync<DbOutboxItem>(
      'SELECT * FROM outbox WHERE status = "failed" ORDER BY createdAt ASC'
    );
  }

  async retryFailed(id?: string): Promise<void> {
    const database = db.getDatabase();
    
    if (id) {
      // Retry specific item
      await database.runAsync(
        'UPDATE outbox SET status = "pending", errorMessage = NULL WHERE id = ?',
        [id]
      );
    } else {
      // Retry all failed items
      await database.runAsync(
        'UPDATE outbox SET status = "pending", errorMessage = NULL WHERE status = "failed"'
      );
    }

    // Trigger processing
    this.processQueue().catch(console.error);
  }

  async clearCompleted(): Promise<number> {
    const database = db.getDatabase();
    const result = await database.runAsync(
      'DELETE FROM outbox WHERE status = "synced" AND createdAt < datetime("now", "-7 days")'
    );
    return result.changes;
  }

  async clearAll(): Promise<void> {
    const database = db.getDatabase();
    await database.runAsync('DELETE FROM outbox');
  }

  // Force immediate sync (for manual triggers)
  async forcSync(): Promise<SyncResult> {
    return this.processQueue();
  }
}

export const outboxManager = new OutboxManager();