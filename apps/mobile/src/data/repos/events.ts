/**
 * Events Repository with ETag caching and offline support
 */

import { database, DatabaseSchema, toISOString } from '../db';
import { apiClient } from '../../lib/api/client';
import { outboxManager } from '../../sync/outbox';

export interface Event {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  location?: string;
  capacity?: number;
  fee?: number;
  churchId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastSynced?: string;
}

export interface EventCreateInput {
  title: string;
  description?: string;
  date: string;
  time: string;
  location?: string;
  capacity?: number;
  fee?: number;
  churchId: string;
}

class EventsRepository {
  private readonly resourceKey = 'events';

  /**
   * List events with ETag caching
   */
  async list(params: {
    churchId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<Event[]> {
    try {
      const apiEvents = await this.fetchFromApi(params);
      if (apiEvents) {
        return apiEvents;
      }
    } catch (error) {
      console.warn('⚠️ API fetch failed, using cached data:', error);
    }

    return this.getFromCache(params);
  }

  /**
   * Get single event by ID
   */
  async getById(id: string): Promise<Event | null> {
    const db = await database.getDb();
    
    const cached = await db.getFirstAsync<DatabaseSchema['events']>(
      'SELECT * FROM events WHERE id = ?',
      [id]
    );

    if (cached) {
      return this.mapFromDb(cached);
    }

    try {
      const response = await apiClient.get(`/api/v2/events/${id}`);
      if (response.ok) {
        const event = await response.json();
        await this.updateCache([event]);
        return event;
      }
    } catch (error) {
      console.warn(`⚠️ Failed to fetch event ${id} from API:`, error);
    }

    return null;
  }

  /**
   * Create new event (queues to outbox)
   */
  async create(input: EventCreateInput): Promise<string> {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = toISOString();
    
    const event: Event = {
      id: tempId,
      tenantId: 'temp',
      title: input.title,
      description: input.description,
      date: input.date,
      time: input.time,
      location: input.location,
      capacity: input.capacity,
      fee: input.fee,
      churchId: input.churchId,
      createdBy: 'temp',
      createdAt: now,
      updatedAt: now,
    };

    // Add to local cache immediately
    const db = await database.getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO events (
        id, tenant_id, title, description, date, time, location, capacity, fee,
        church_id, created_by, created_at, updated_at, last_synced
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event.id, event.tenantId, event.title, event.description,
        event.date, event.time, event.location, event.capacity, event.fee,
        event.churchId, event.createdBy, event.createdAt, event.updatedAt, now,
      ]
    );

    // Queue for sync
    await outboxManager.enqueue('events', 'CREATE', input);
    return tempId;
  }

  /**
   * Get upcoming events
   */
  async getUpcoming(churchId?: string, limit: number = 10): Promise<Event[]> {
    const db = await database.getDb();
    const today = new Date().toISOString().split('T')[0];
    
    let query = `
      SELECT * FROM events 
      WHERE date >= ? 
    `;
    const params = [today];

    if (churchId) {
      query += ' AND church_id = ?';
      params.push(churchId);
    }

    query += ' ORDER BY date ASC, time ASC LIMIT ?';
    params.push(limit.toString());

    const rows = await db.getAllAsync<DatabaseSchema['events']>(query, params);
    return rows.map(this.mapFromDb);
  }

  /**
   * Search events
   */
  async search(query: string, churchId?: string): Promise<Event[]> {
    const db = await database.getDb();
    
    let sql = `
      SELECT * FROM events 
      WHERE (title LIKE ? OR description LIKE ? OR location LIKE ?)
    `;
    const params = [`%${query}%`, `%${query}%`, `%${query}%`];

    if (churchId) {
      sql += ' AND church_id = ?';
      params.push(churchId);
    }

    sql += ' ORDER BY date DESC LIMIT 50';

    const rows = await db.getAllAsync<DatabaseSchema['events']>(sql, params);
    return rows.map(this.mapFromDb);
  }

  /**
   * Fetch from API with ETag support
   */
  private async fetchFromApi(params: any): Promise<Event[] | null> {
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
    if (params.startDate) queryParams.set('startDate', params.startDate);
    if (params.endDate) queryParams.set('endDate', params.endDate);
    if (params.limit) queryParams.set('limit', String(params.limit));

    const url = `/api/v2/events?${queryParams.toString()}`;
    const response = await apiClient.get(url, { headers });

    if (response.status === 304) {
      return this.getFromCache(params);
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const events = data.events || data;

    await this.updateCache(events);

    const etag = response.headers.get('etag');
    if (etag) {
      await this.storeETag(etag);
    }

    return events;
  }

  /**
   * Get events from cache
   */
  private async getFromCache(params: any): Promise<Event[]> {
    const db = await database.getDb();
    
    let sql = 'SELECT * FROM events WHERE 1=1';
    const sqlParams: any[] = [];

    if (params.churchId) {
      sql += ' AND church_id = ?';
      sqlParams.push(params.churchId);
    }
    if (params.startDate) {
      sql += ' AND date >= ?';
      sqlParams.push(params.startDate);
    }
    if (params.endDate) {
      sql += ' AND date <= ?';
      sqlParams.push(params.endDate);
    }

    sql += ' ORDER BY date ASC, time ASC';

    if (params.limit) {
      sql += ' LIMIT ?';
      sqlParams.push(params.limit);
    }

    const rows = await db.getAllAsync<DatabaseSchema['events']>(sql, sqlParams);
    return rows.map(this.mapFromDb);
  }

  /**
   * Update cache with API data
   */
  private async updateCache(events: any[]): Promise<void> {
    const db = await database.getDb();
    const now = toISOString();

    await database.transaction(async (tx) => {
      for (const event of events) {
        await tx.runAsync(
          `INSERT OR REPLACE INTO events (
            id, tenant_id, title, description, date, time, location, capacity, fee,
            church_id, created_by, created_at, updated_at, last_synced
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            event.id, event.tenantId, event.title, event.description || null,
            event.date, event.time, event.location || null, event.capacity || null, 
            event.fee || null, event.churchId, event.createdBy, event.createdAt, 
            event.updatedAt, now,
          ]
        );
      }
    });

    console.log(`📅 Updated ${events.length} events in cache`);
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
   * Map database row to Event object
   */
  private mapFromDb(row: DatabaseSchema['events']): Event {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      title: row.title,
      description: row.description || undefined,
      date: row.date,
      time: row.time,
      location: row.location || undefined,
      capacity: row.capacity || undefined,
      fee: row.fee || undefined,
      churchId: row.church_id,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastSynced: row.last_synced,
    };
  }
}

export const eventsRepository = new EventsRepository();