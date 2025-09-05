/**
 * Members Repository with ETag caching and offline support
 */

import { database, DatabaseSchema, toISOString } from '../db';
import { apiClient } from '../../lib/api/client';
import { outboxManager } from '../../sync/outbox';

export interface Member {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  churchId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastSynced?: string;
}

export interface MemberCreateInput {
  name: string;
  email: string;
  phone?: string;
  role: string;
  churchId: string;
}

export interface MemberUpdateInput {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  churchId?: string;
  active?: boolean;
}

class MembersRepository {
  private readonly resourceKey = 'members';

  /**
   * List members with ETag caching
   */
  async list(params: {
    churchId?: string;
    search?: string;
    active?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<Member[]> {
    const db = await database.getDb();
    
    try {
      // Try to fetch from API with ETag
      const apiMembers = await this.fetchFromApi(params);
      if (apiMembers) {
        return apiMembers;
      }
    } catch (error) {
      console.warn('⚠️ API fetch failed, using cached data:', error);
    }

    // Fallback to cached data
    return this.getFromCache(params);
  }

  /**
   * Get single member by ID
   */
  async getById(id: string): Promise<Member | null> {
    const db = await database.getDb();
    
    // First check cache
    const cached = await db.getFirstAsync<DatabaseSchema['members']>(
      'SELECT * FROM members WHERE id = ?',
      [id]
    );

    if (cached) {
      return this.mapFromDb(cached);
    }

    // Try API if not in cache
    try {
      const response = await apiClient.get(`/api/v2/members/${id}`);
      if (response.ok) {
        const member = await response.json();
        await this.updateCache([member]);
        return member;
      }
    } catch (error) {
      console.warn(`⚠️ Failed to fetch member ${id} from API:`, error);
    }

    return null;
  }

  /**
   * Create new member (queues to outbox)
   */
  async create(input: MemberCreateInput): Promise<string> {
    // Generate temporary ID for optimistic UI
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = toISOString();
    
    const member: Member = {
      id: tempId,
      tenantId: 'temp', // Will be set by server
      name: input.name,
      email: input.email,
      phone: input.phone,
      role: input.role,
      churchId: input.churchId,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    // Add to local cache immediately for optimistic UI
    const db = await database.getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO members (
        id, tenant_id, name, email, phone, role, church_id, active,
        created_at, updated_at, last_synced
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        member.id,
        member.tenantId,
        member.name,
        member.email,
        member.phone || null,
        member.role,
        member.churchId,
        member.active ? 1 : 0,
        member.createdAt,
        member.updatedAt,
        now,
      ]
    );

    // Queue for sync
    await outboxManager.enqueue('members', 'CREATE', input);

    return tempId;
  }

  /**
   * Update member (queues to outbox)
   */
  async update(id: string, input: MemberUpdateInput): Promise<void> {
    const db = await database.getDb();
    const now = toISOString();

    // Update local cache optimistically
    const updateFields = [];
    const values = [];

    if (input.name !== undefined) {
      updateFields.push('name = ?');
      values.push(input.name);
    }
    if (input.email !== undefined) {
      updateFields.push('email = ?');
      values.push(input.email);
    }
    if (input.phone !== undefined) {
      updateFields.push('phone = ?');
      values.push(input.phone);
    }
    if (input.role !== undefined) {
      updateFields.push('role = ?');
      values.push(input.role);
    }
    if (input.churchId !== undefined) {
      updateFields.push('church_id = ?');
      values.push(input.churchId);
    }
    if (input.active !== undefined) {
      updateFields.push('active = ?');
      values.push(input.active ? 1 : 0);
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = ?');
      updateFields.push('last_synced = ?');
      values.push(now, now);

      await db.runAsync(
        `UPDATE members SET ${updateFields.join(', ')} WHERE id = ?`,
        [...values, id]
      );
    }

    // Queue for sync
    await outboxManager.enqueue('members', 'UPDATE', input, id);
  }

  /**
   * Delete member (queues to outbox)
   */
  async delete(id: string): Promise<void> {
    // Queue for sync first
    await outboxManager.enqueue('members', 'DELETE', { id }, id);

    // Remove from local cache
    const db = await database.getDb();
    await db.runAsync('DELETE FROM members WHERE id = ?', [id]);
  }

  /**
   * Search members in cache
   */
  async search(query: string, churchId?: string): Promise<Member[]> {
    const db = await database.getDb();
    
    let sql = `SELECT * FROM members 
               WHERE active = 1 
               AND (name LIKE ? OR email LIKE ?)`;
    const params = [`%${query}%`, `%${query}%`];

    if (churchId) {
      sql += ' AND church_id = ?';
      params.push(churchId);
    }

    sql += ' ORDER BY name ASC LIMIT 50';

    const rows = await db.getAllAsync<DatabaseSchema['members']>(sql, params);
    return rows.map(this.mapFromDb);
  }

  /**
   * Fetch from API with ETag support
   */
  private async fetchFromApi(params: any): Promise<Member[] | null> {
    const db = await database.getDb();
    
    // Get stored ETag
    const meta = await db.getFirstAsync<DatabaseSchema['meta']>(
      'SELECT etag, last_fetch FROM meta WHERE resource_key = ?',
      [this.resourceKey]
    );

    const headers: Record<string, string> = {};
    if (meta?.etag) {
      headers['If-None-Match'] = meta.etag;
    }

    // Build query params
    const queryParams = new URLSearchParams();
    if (params.churchId) queryParams.set('churchId', params.churchId);
    if (params.search) queryParams.set('search', params.search);
    if (params.active !== undefined) queryParams.set('active', String(params.active));
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.offset) queryParams.set('offset', String(params.offset));

    const url = `/api/v2/members?${queryParams.toString()}`;
    const response = await apiClient.get(url, { headers });

    if (response.status === 304) {
      // Not modified - return cached data
      console.log('📋 Members not modified, using cache');
      return this.getFromCache(params);
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const members = data.members || data;

    // Update cache
    await this.updateCache(members);

    // Store ETag
    const etag = response.headers.get('etag');
    if (etag) {
      await this.storeETag(etag);
    }

    return members;
  }

  /**
   * Get members from local cache
   */
  private async getFromCache(params: any): Promise<Member[]> {
    const db = await database.getDb();
    
    let sql = 'SELECT * FROM members WHERE 1=1';
    const sqlParams: any[] = [];

    if (params.churchId) {
      sql += ' AND church_id = ?';
      sqlParams.push(params.churchId);
    }
    if (params.active !== undefined) {
      sql += ' AND active = ?';
      sqlParams.push(params.active ? 1 : 0);
    }
    if (params.search) {
      sql += ' AND (name LIKE ? OR email LIKE ?)';
      sqlParams.push(`%${params.search}%`, `%${params.search}%`);
    }

    sql += ' ORDER BY name ASC';

    if (params.limit) {
      sql += ' LIMIT ?';
      sqlParams.push(params.limit);
      
      if (params.offset) {
        sql += ' OFFSET ?';
        sqlParams.push(params.offset);
      }
    }

    const rows = await db.getAllAsync<DatabaseSchema['members']>(sql, sqlParams);
    return rows.map(this.mapFromDb);
  }

  /**
   * Update local cache with API data
   */
  private async updateCache(members: any[]): Promise<void> {
    const db = await database.getDb();
    const now = toISOString();

    await database.transaction(async (tx) => {
      for (const member of members) {
        await tx.runAsync(
          `INSERT OR REPLACE INTO members (
            id, tenant_id, name, email, phone, role, church_id, active,
            created_at, updated_at, last_synced
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            member.id,
            member.tenantId,
            member.name,
            member.email,
            member.phone || null,
            member.role,
            member.churchId,
            member.active ? 1 : 0,
            member.createdAt,
            member.updatedAt,
            now,
          ]
        );
      }
    });

    console.log(`📋 Updated ${members.length} members in cache`);
  }

  /**
   * Store ETag for future requests
   */
  private async storeETag(etag: string): Promise<void> {
    const db = await database.getDb();
    const now = toISOString();

    await db.runAsync(
      `INSERT OR REPLACE INTO meta (resource_key, etag, last_fetch) 
       VALUES (?, ?, ?)`,
      [this.resourceKey, etag, now]
    );
  }

  /**
   * Map database row to Member object
   */
  private mapFromDb(row: DatabaseSchema['members']): Member {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      email: row.email,
      phone: row.phone || undefined,
      role: row.role,
      churchId: row.church_id,
      active: Boolean(row.active),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastSynced: row.last_synced,
    };
  }

  /**
   * Force refresh from API (ignores ETag)
   */
  async forceRefresh(params: any = {}): Promise<Member[]> {
    const db = await database.getDb();
    
    // Clear ETag to force fresh fetch
    await db.runAsync(
      'DELETE FROM meta WHERE resource_key = ?',
      [this.resourceKey]
    );

    return this.list(params);
  }

  /**
   * Get sync stats for debugging
   */
  async getSyncStats(): Promise<{
    totalCached: number;
    lastFetch?: string;
    etag?: string;
    pendingSync: number;
  }> {
    const db = await database.getDb();

    const totalResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM members'
    );

    const metaResult = await db.getFirstAsync<DatabaseSchema['meta']>(
      'SELECT * FROM meta WHERE resource_key = ?',
      [this.resourceKey]
    );

    const pendingResult = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM outbox 
       WHERE entity_type = 'members' AND status != 'SYNCED'`
    );

    return {
      totalCached: totalResult?.count || 0,
      lastFetch: metaResult?.last_fetch,
      etag: metaResult?.etag,
      pendingSync: pendingResult?.count || 0,
    };
  }
}

export const membersRepository = new MembersRepository();