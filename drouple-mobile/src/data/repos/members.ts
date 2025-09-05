/**
 * Members Repository - Offline-first with sync
 * Handles local storage, caching, and server synchronization
 */

import { db, DbMember } from '../db';
import { createApiClient } from '../../lib/api/client';
import type { Member } from '../../../shared/types/api';

export class MembersRepository {
  private apiClient = createApiClient();

  // Local operations (always work offline)
  async getAll(options: {
    query?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<DbMember[]> {
    const database = db.getDatabase();
    const { query = '', limit = 25, offset = 0 } = options;

    let sql = 'SELECT * FROM members WHERE isActive = 1';
    const params: any[] = [];

    if (query) {
      sql += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${query}%`, `%${query}%`);
    }

    sql += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return database.getAllAsync<DbMember>(sql, params);
  }

  async getById(id: string): Promise<DbMember | null> {
    const database = db.getDatabase();
    return database.getFirstAsync<DbMember>(
      'SELECT * FROM members WHERE id = ?',
      [id]
    );
  }

  async search(query: string, limit: number = 25): Promise<DbMember[]> {
    const database = db.getDatabase();
    return database.getAllAsync<DbMember>(
      `SELECT * FROM members 
       WHERE isActive = 1 
       AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)
       ORDER BY 
         CASE 
           WHEN name LIKE ? THEN 1 
           WHEN email LIKE ? THEN 2 
           ELSE 3 
         END,
         name ASC
       LIMIT ?`,
      [
        `%${query}%`, `%${query}%`, `%${query}%`,
        `${query}%`, `${query}%`, // Prioritize prefix matches
        limit
      ]
    );
  }

  async upsertLocal(member: DbMember): Promise<void> {
    const database = db.getDatabase();
    await database.runAsync(
      `INSERT OR REPLACE INTO members 
       (id, name, email, phone, role, church, isActive, createdAt, updatedAt, syncedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        member.id,
        member.name,
        member.email,
        member.phone,
        member.role,
        member.church,
        member.isActive ? 1 : 0,
        member.createdAt,
        member.updatedAt,
        member.syncedAt
      ]
    );
  }

  async batchUpsertLocal(members: DbMember[]): Promise<void> {
    const database = db.getDatabase();
    
    await database.withTransactionAsync(async () => {
      for (const member of members) {
        await this.upsertLocal(member);
      }
    });
  }

  // Server sync operations
  async syncFromServer(options: {
    force?: boolean;
    updatedSince?: string;
  } = {}): Promise<{
    success: boolean;
    count?: number;
    error?: string;
    nextCursor?: string;
  }> {
    try {
      const database = db.getDatabase();
      const { force = false } = options;

      // Get last sync metadata
      const syncMeta = await database.getFirstAsync<{
        lastETag?: string;
        lastCursor?: string;
        lastSyncAt: string;
      }>('SELECT * FROM sync_meta WHERE resource = ?', ['members']);

      // Build request parameters
      const params: Record<string, string> = {
        limit: '100',
      };

      if (!force && options.updatedSince) {
        params.updatedSince = options.updatedSince;
      }

      if (!force && syncMeta?.lastCursor) {
        params.cursor = syncMeta.lastCursor;
      }

      // Request headers
      const headers: Record<string, string> = {};
      if (!force && syncMeta?.lastETag) {
        headers['If-None-Match'] = syncMeta.lastETag;
      }

      // Make API request
      const response = await this.apiClient.GET('/members', {
        params: { query: params },
        headers,
      });

      // Handle 304 Not Modified
      if (response.response.status === 304) {
        return { success: true, count: 0 };
      }

      if (!response.data || !response.data.success) {
        return {
          success: false,
          error: response.data?.error || 'Failed to sync members'
        };
      }

      const { data: members, meta } = response.data;

      // Store members locally
      const dbMembers: DbMember[] = members.map((member: Member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        role: member.role,
        church: member.churchName || '',
        isActive: member.isActive ?? true,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
        syncedAt: new Date().toISOString(),
      }));

      await this.batchUpsertLocal(dbMembers);

      // Update sync metadata
      const newETag = response.response.headers.get('etag');
      await database.runAsync(
        `INSERT OR REPLACE INTO sync_meta 
         (resource, lastETag, lastCursor, lastSyncAt)
         VALUES (?, ?, ?, ?)`,
        [
          'members',
          newETag || syncMeta?.lastETag,
          meta?.nextCursor || syncMeta?.lastCursor,
          new Date().toISOString()
        ]
      );

      return {
        success: true,
        count: dbMembers.length,
        nextCursor: meta?.nextCursor
      };

    } catch (error) {
      console.error('Members sync failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      };
    }
  }

  async getLastSyncTime(): Promise<string | null> {
    const database = db.getDatabase();
    const syncMeta = await database.getFirstAsync<{ lastSyncAt: string }>(
      'SELECT lastSyncAt FROM sync_meta WHERE resource = ?',
      ['members']
    );
    return syncMeta?.lastSyncAt || null;
  }

  async markAsRead(memberId: string): Promise<void> {
    // For future use - mark member profile as viewed
    const database = db.getDatabase();
    await database.runAsync(
      'UPDATE members SET syncedAt = ? WHERE id = ?',
      [new Date().toISOString(), memberId]
    );
  }

  // Statistics and utilities
  async getCount(): Promise<number> {
    const database = db.getDatabase();
    const result = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM members WHERE isActive = 1'
    );
    return result?.count ?? 0;
  }

  async getRecentlyUpdated(limit: number = 10): Promise<DbMember[]> {
    const database = db.getDatabase();
    return database.getAllAsync<DbMember>(
      'SELECT * FROM members WHERE isActive = 1 ORDER BY updatedAt DESC LIMIT ?',
      [limit]
    );
  }

  async clearAll(): Promise<void> {
    const database = db.getDatabase();
    await database.runAsync('DELETE FROM members');
    await database.runAsync(
      'DELETE FROM sync_meta WHERE resource = ?',
      ['members']
    );
  }
}

export const membersRepo = new MembersRepository();