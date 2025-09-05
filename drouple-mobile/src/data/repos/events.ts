/**
 * Events Repository - Offline-first with sync
 */

import { db, DbEvent } from '../db';
import { createApiClient } from '../../lib/api/client';

export class EventsRepository {
  private apiClient = createApiClient();

  async getAll(): Promise<DbEvent[]> {
    const database = db.getDatabase();
    return database.getAllAsync<DbEvent>(
      'SELECT * FROM events WHERE status != "cancelled" ORDER BY startDate ASC'
    );
  }

  async getById(id: string): Promise<DbEvent | null> {
    const database = db.getDatabase();
    return database.getFirstAsync<DbEvent>('SELECT * FROM events WHERE id = ?', [id]);
  }

  async syncFromServer(): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const response = await this.apiClient.GET('/events');
      if (!response.data?.success) {
        return { success: false, error: 'Failed to sync events' };
      }

      const events = response.data.data.map((event: any) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        capacity: event.capacity,
        fee: event.fee,
        status: event.status,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        syncedAt: new Date().toISOString(),
      }));

      await this.batchUpsertLocal(events);
      return { success: true, count: events.length };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Sync failed' };
    }
  }

  private async batchUpsertLocal(events: DbEvent[]): Promise<void> {
    const database = db.getDatabase();
    await database.withTransactionAsync(async () => {
      for (const event of events) {
        await database.runAsync(
          `INSERT OR REPLACE INTO events 
           (id, title, description, startDate, endDate, location, capacity, fee, status, createdAt, updatedAt, syncedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            event.id, event.title, event.description, event.startDate, event.endDate,
            event.location, event.capacity, event.fee, event.status,
            event.createdAt, event.updatedAt, event.syncedAt
          ]
        );
      }
    });
  }
}

export const eventsRepo = new EventsRepository();