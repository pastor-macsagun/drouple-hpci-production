/**
 * Announcements Repository with ETag caching and offline support
 */

import { database, DatabaseSchema, toISOString } from '../db';
import { apiClient } from '../../lib/api/client';

export interface Announcement {
  id: string;
  tenantId: string;
  title: string;
  content: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  published: boolean;
  publishedAt?: string;
  churchId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastSynced?: string;
}

class AnnouncementsRepository {
  private readonly resourceKey = 'announcements';

  /**
   * List announcements with ETag caching
   */
  async list(params: {
    churchId?: string;
    published?: boolean;
    priority?: string;
    limit?: number;
  } = {}): Promise<Announcement[]> {
    try {
      const apiAnnouncements = await this.fetchFromApi(params);
      if (apiAnnouncements) {
        return apiAnnouncements;
      }
    } catch (error) {
      console.warn('⚠️ API fetch failed, using cached data:', error);
    }

    return this.getFromCache(params);
  }

  /**
   * Get published announcements only
   */
  async getPublished(churchId?: string, limit: number = 20): Promise<Announcement[]> {
    return this.list({
      churchId,
      published: true,
      limit,
    });
  }

  /**
   * Get urgent announcements
   */
  async getUrgent(churchId?: string): Promise<Announcement[]> {
    return this.list({
      churchId,
      published: true,
      priority: 'URGENT',
    });
  }

  /**
   * Get single announcement by ID
   */
  async getById(id: string): Promise<Announcement | null> {
    const db = await database.getDb();
    
    const cached = await db.getFirstAsync<DatabaseSchema['announcements']>(
      'SELECT * FROM announcements WHERE id = ?',
      [id]
    );

    if (cached) {
      return this.mapFromDb(cached);
    }

    try {
      const response = await apiClient.get(`/api/v2/announcements/${id}`);
      if (response.ok) {
        const announcement = await response.json();
        await this.updateCache([announcement]);
        return announcement;
      }
    } catch (error) {
      console.warn(`⚠️ Failed to fetch announcement ${id} from API:`, error);
    }

    return null;
  }

  /**
   * Mark announcement as read (local only)
   */
  async markAsRead(id: string): Promise<void> {
    // This would typically update a separate read_announcements table
    // For now, we'll just log it
    console.log(`📖 Marked announcement ${id} as read`);
  }

  /**
   * Get recent announcements (last 7 days)
   */
  async getRecent(churchId?: string): Promise<Announcement[]> {
    const db = await database.getDb();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    let query = `
      SELECT * FROM announcements 
      WHERE published = 1 
      AND published_at >= ?
    `;
    const params = [weekAgo.toISOString()];

    if (churchId) {
      query += ' AND church_id = ?';
      params.push(churchId);
    }

    query += ' ORDER BY published_at DESC, priority DESC LIMIT 10';

    const rows = await db.getAllAsync<DatabaseSchema['announcements']>(query, params);
    return rows.map(this.mapFromDb);
  }

  /**
   * Search announcements
   */
  async search(query: string, churchId?: string): Promise<Announcement[]> {
    const db = await database.getDb();
    
    let sql = `
      SELECT * FROM announcements 
      WHERE published = 1 
      AND (title LIKE ? OR content LIKE ?)
    `;
    const params = [`%${query}%`, `%${query}%`];

    if (churchId) {
      sql += ' AND church_id = ?';
      params.push(churchId);
    }

    sql += ' ORDER BY published_at DESC LIMIT 30';

    const rows = await db.getAllAsync<DatabaseSchema['announcements']>(sql, params);
    return rows.map(this.mapFromDb);
  }

  /**
   * Get announcements by priority
   */
  async getByPriority(priority: 'HIGH' | 'URGENT', churchId?: string): Promise<Announcement[]> {
    const db = await database.getDb();
    
    let query = `
      SELECT * FROM announcements 
      WHERE published = 1 
      AND priority = ?
    `;
    const params = [priority];

    if (churchId) {
      query += ' AND church_id = ?';
      params.push(churchId);
    }

    query += ' ORDER BY published_at DESC';

    const rows = await db.getAllAsync<DatabaseSchema['announcements']>(query, params);
    return rows.map(this.mapFromDb);
  }

  /**
   * Fetch from API with ETag support
   */
  private async fetchFromApi(params: any): Promise<Announcement[] | null> {
    const db = await database.getDb();
    
    const meta = await db.getFirstAsync<DatabaseSchema['meta']>(
      'SELECT etag FROM meta WHERE resource_key = ?',
      [this.resourceKey]
    );

    const headers: Record<string, string> = {};
    if (meta?.etag) {
      headers['If-None-Match'] = meta.etag;
    }

    const queryParams = new URLSearchParams();
    if (params.churchId) queryParams.set('churchId', params.churchId);
    if (params.published !== undefined) queryParams.set('published', String(params.published));
    if (params.priority) queryParams.set('priority', params.priority);
    if (params.limit) queryParams.set('limit', String(params.limit));

    const url = `/api/v2/announcements?${queryParams.toString()}`;
    const response = await apiClient.get(url, { headers });

    if (response.status === 304) {
      return this.getFromCache(params);
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const announcements = data.announcements || data;

    await this.updateCache(announcements);

    const etag = response.headers.get('etag');
    if (etag) {
      await this.storeETag(etag);
    }

    return announcements;
  }

  /**
   * Get announcements from cache
   */
  private async getFromCache(params: any): Promise<Announcement[]> {
    const db = await database.getDb();
    
    let sql = 'SELECT * FROM announcements WHERE 1=1';
    const sqlParams: any[] = [];

    if (params.churchId) {
      sql += ' AND church_id = ?';
      sqlParams.push(params.churchId);
    }
    if (params.published !== undefined) {
      sql += ' AND published = ?';
      sqlParams.push(params.published ? 1 : 0);
    }
    if (params.priority) {
      sql += ' AND priority = ?';
      sqlParams.push(params.priority);
    }

    // Sort by priority (URGENT > HIGH > NORMAL > LOW) and date
    sql += ` ORDER BY 
      CASE priority 
        WHEN 'URGENT' THEN 4 
        WHEN 'HIGH' THEN 3 
        WHEN 'NORMAL' THEN 2 
        ELSE 1 
      END DESC, 
      published_at DESC`;

    if (params.limit) {
      sql += ' LIMIT ?';
      sqlParams.push(params.limit);
    }

    const rows = await db.getAllAsync<DatabaseSchema['announcements']>(sql, sqlParams);
    return rows.map(this.mapFromDb);
  }

  /**
   * Update cache with API data
   */
  private async updateCache(announcements: any[]): Promise<void> {
    const db = await database.getDb();
    const now = toISOString();

    await database.transaction(async (tx) => {
      for (const announcement of announcements) {
        await tx.runAsync(
          `INSERT OR REPLACE INTO announcements (
            id, tenant_id, title, content, priority, published, published_at,
            church_id, created_by, created_at, updated_at, last_synced
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            announcement.id,
            announcement.tenantId,
            announcement.title,
            announcement.content,
            announcement.priority,
            announcement.published ? 1 : 0,
            announcement.publishedAt || null,
            announcement.churchId,
            announcement.createdBy,
            announcement.createdAt,
            announcement.updatedAt,
            now,
          ]
        );
      }
    });

    console.log(`📢 Updated ${announcements.length} announcements in cache`);
  }

  /**
   * Store ETag
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
   * Map database row to Announcement object
   */
  private mapFromDb(row: DatabaseSchema['announcements']): Announcement {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      title: row.title,
      content: row.content,
      priority: row.priority as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
      published: Boolean(row.published),
      publishedAt: row.published_at || undefined,
      churchId: row.church_id,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastSynced: row.last_synced,
    };
  }

  /**
   * Get sync stats
   */
  async getSyncStats(): Promise<{
    totalCached: number;
    publishedCount: number;
    urgentCount: number;
    lastFetch?: string;
  }> {
    const db = await database.getDb();

    const [totalResult, publishedResult, urgentResult, metaResult] = await Promise.all([
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM announcements'),
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM announcements WHERE published = 1'),
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM announcements WHERE published = 1 AND priority = "URGENT"'),
      db.getFirstAsync<DatabaseSchema['meta']>('SELECT * FROM meta WHERE resource_key = ?', [this.resourceKey]),
    ]);

    return {
      totalCached: totalResult?.count || 0,
      publishedCount: publishedResult?.count || 0,
      urgentCount: urgentResult?.count || 0,
      lastFetch: metaResult?.last_fetch,
    };
  }
}

export const announcementsRepository = new AnnouncementsRepository();