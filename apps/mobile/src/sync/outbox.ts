/**
 * Outbox Pattern Implementation
 * Queues writes with idempotency keys and background retry logic
 */

import { database, generateId, toISOString, DatabaseSchema, SyncError } from '../data/db';
import { apiClient } from '../lib/api/client';

export interface OutboxItem {
  id: string;
  idempotencyKey: string;
  entityType: 'members' | 'events' | 'attendance' | 'announcements';
  entityId?: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  retryCount: number;
  nextRetryAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncResult {
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
}

class OutboxManager {
  private isProcessing = false;
  private readonly maxRetries = 5;
  private readonly backoffMultiplier = 2;
  private readonly baseDelayMs = 1000; // 1 second

  /**
   * Enqueue a write operation to the outbox
   */
  async enqueue(
    entityType: OutboxItem['entityType'],
    operation: OutboxItem['operation'],
    payload: any,
    entityId?: string
  ): Promise<string> {
    const db = await database.getDb();
    const outboxId = generateId();
    const idempotencyKey = generateId();
    const now = toISOString();

    await db.runAsync(
      `INSERT INTO outbox (
        id, idempotency_key, entity_type, entity_id, operation, 
        payload, status, retry_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        outboxId,
        idempotencyKey,
        entityType,
        entityId || null,
        operation,
        JSON.stringify(payload),
        'PENDING',
        0,
        now,
        now,
      ]
    );

    console.log(`📤 Enqueued ${operation} ${entityType} to outbox:`, outboxId);
    
    // Trigger immediate processing attempt
    this.processQueue().catch(console.error);
    
    return outboxId;
  }

  /**
   * Process all pending outbox items
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    
    try {
      const db = await database.getDb();
      
      // Get items ready for processing
      const pendingItems = await db.getAllAsync<DatabaseSchema['outbox']>(
        `SELECT * FROM outbox 
         WHERE status IN ('PENDING', 'FAILED') 
         AND (next_retry_at IS NULL OR next_retry_at <= datetime('now'))
         ORDER BY created_at ASC
         LIMIT 10`
      );

      console.log(`📤 Processing ${pendingItems.length} outbox items`);

      for (const item of pendingItems) {
        await this.processItem(item);
      }
    } catch (error) {
      console.error('❌ Error processing outbox queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single outbox item
   */
  private async processItem(item: DatabaseSchema['outbox']): Promise<void> {
    const db = await database.getDb();
    
    try {
      // Mark as syncing
      await db.runAsync(
        `UPDATE outbox SET status = 'SYNCING', updated_at = ? WHERE id = ?`,
        [toISOString(), item.id]
      );

      // Parse payload
      const payload = JSON.parse(item.payload);
      
      // Execute API call
      const result = await this.executeApiCall(
        item.entity_type,
        item.operation,
        payload,
        item.entity_id,
        item.idempotency_key
      );

      if (result.success) {
        // Mark as synced
        await db.runAsync(
          `UPDATE outbox SET status = 'SYNCED', updated_at = ? WHERE id = ?`,
          [toISOString(), item.id]
        );
        
        console.log(`✅ Synced ${item.operation} ${item.entity_type}:`, item.id);
        
        // Update local cache with server response if applicable
        if (result.data && item.operation !== 'DELETE') {
          await this.updateLocalCache(item.entity_type, result.data);
        }
      } else {
        await this.handleFailure(item, result.error || 'Unknown error');
      }
    } catch (error) {
      await this.handleFailure(item, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Execute the actual API call
   */
  private async executeApiCall(
    entityType: string,
    operation: string,
    payload: any,
    entityId?: string,
    idempotencyKey?: string
  ): Promise<SyncResult> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    try {
      let response: Response;
      const endpoint = this.getEndpoint(entityType, entityId);

      switch (operation) {
        case 'CREATE':
          response = await apiClient.post(endpoint, payload, { headers });
          break;
        case 'UPDATE':
          response = await apiClient.put(endpoint, payload, { headers });
          break;
        case 'DELETE':
          response = await apiClient.delete(endpoint, { headers });
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Get API endpoint for entity type
   */
  private getEndpoint(entityType: string, entityId?: string): string {
    const baseEndpoints = {
      members: '/api/v2/members',
      events: '/api/v2/events',
      attendance: '/api/v2/attendance',
      announcements: '/api/v2/announcements',
    };

    const base = baseEndpoints[entityType as keyof typeof baseEndpoints];
    if (!base) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    return entityId ? `${base}/${entityId}` : base;
  }

  /**
   * Update local cache with server response
   */
  private async updateLocalCache(entityType: string, data: any): Promise<void> {
    if (!data.id) return;

    const db = await database.getDb();
    const now = toISOString();

    try {
      switch (entityType) {
        case 'members':
          await db.runAsync(
            `INSERT OR REPLACE INTO members (
              id, tenant_id, name, email, phone, role, church_id, active,
              created_at, updated_at, last_synced
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              data.id, data.tenantId, data.name, data.email, data.phone,
              data.role, data.churchId, data.active ? 1 : 0,
              data.createdAt, data.updatedAt, now
            ]
          );
          break;
        case 'attendance':
          await db.runAsync(
            `INSERT OR REPLACE INTO attendance (
              id, tenant_id, member_id, service_id, event_id,
              checked_in_at, checked_in_by, notes, created_at, last_synced
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              data.id, data.tenantId, data.memberId, data.serviceId, data.eventId,
              data.checkedInAt, data.checkedInBy, data.notes, data.createdAt, now
            ]
          );
          break;
        // Add other entities as needed
      }
    } catch (error) {
      console.warn(`⚠️ Failed to update local cache for ${entityType}:`, error);
    }
  }

  /**
   * Handle failed sync attempt
   */
  private async handleFailure(item: DatabaseSchema['outbox'], error: string): Promise<void> {
    const db = await database.getDb();
    const newRetryCount = item.retry_count + 1;

    if (newRetryCount >= this.maxRetries) {
      // Max retries exceeded - mark as permanently failed
      await db.runAsync(
        `UPDATE outbox SET 
         status = 'FAILED', 
         retry_count = ?, 
         error_message = ?,
         updated_at = ?
         WHERE id = ?`,
        [newRetryCount, error, toISOString(), item.id]
      );
      
      console.error(`❌ Permanent failure for ${item.entity_type} ${item.operation}:`, error);
    } else {
      // Schedule retry with exponential backoff
      const delayMs = this.baseDelayMs * Math.pow(this.backoffMultiplier, newRetryCount - 1);
      const nextRetryAt = new Date(Date.now() + delayMs).toISOString();

      await db.runAsync(
        `UPDATE outbox SET 
         status = 'FAILED',
         retry_count = ?,
         next_retry_at = ?,
         error_message = ?,
         updated_at = ?
         WHERE id = ?`,
        [newRetryCount, nextRetryAt, error, toISOString(), item.id]
      );

      console.warn(`⏰ Retry ${newRetryCount}/${this.maxRetries} scheduled for ${item.entity_type}:`, nextRetryAt);
    }
  }

  /**
   * Get pending items count for UI
   */
  async getPendingCount(): Promise<number> {
    const db = await database.getDb();
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM outbox WHERE status IN ('PENDING', 'FAILED')`
    );
    return result?.count || 0;
  }

  /**
   * Get sync status for a specific entity
   */
  async getEntitySyncStatus(entityType: string, entityId: string): Promise<{
    status: 'synced' | 'pending' | 'failed';
    lastAttempt?: Date;
  }> {
    const db = await database.getDb();
    const result = await db.getFirstAsync<DatabaseSchema['outbox']>(
      `SELECT status, updated_at FROM outbox 
       WHERE entity_type = ? AND entity_id = ?
       ORDER BY created_at DESC LIMIT 1`,
      [entityType, entityId]
    );

    if (!result) {
      return { status: 'synced' };
    }

    return {
      status: result.status === 'SYNCED' ? 'synced' : 
              result.status === 'FAILED' ? 'failed' : 'pending',
      lastAttempt: new Date(result.updated_at),
    };
  }

  /**
   * Clear synced items (housekeeping)
   */
  async clearSyncedItems(olderThanDays: number = 7): Promise<number> {
    const db = await database.getDb();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await db.runAsync(
      `DELETE FROM outbox 
       WHERE status = 'SYNCED' AND updated_at < ?`,
      [cutoffDate.toISOString()]
    );

    const deletedCount = result.changes || 0;
    if (deletedCount > 0) {
      console.log(`🧹 Cleared ${deletedCount} synced outbox items`);
    }

    return deletedCount;
  }

  /**
   * Reset failed items for retry (debugging/manual intervention)
   */
  async resetFailedItems(): Promise<number> {
    const db = await database.getDb();
    const result = await db.runAsync(
      `UPDATE outbox SET 
       status = 'PENDING',
       retry_count = 0,
       next_retry_at = NULL,
       error_message = NULL,
       updated_at = ?
       WHERE status = 'FAILED'`,
      [toISOString()]
    );

    const resetCount = result.changes || 0;
    if (resetCount > 0) {
      console.log(`🔄 Reset ${resetCount} failed outbox items`);
      // Trigger immediate processing
      this.processQueue().catch(console.error);
    }

    return resetCount;
  }
}

export const outboxManager = new OutboxManager();