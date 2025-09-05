/**
 * Announcements Repository - Offline-first with sync
 */

import { db, DbAnnouncement } from '../db';
import { createApiClient } from '../../lib/api/client';

export class AnnouncementsRepository {
  private apiClient = createApiClient();

  async getAll(): Promise<DbAnnouncement[]> {
    const database = db.getDatabase();
    return database.getAllAsync<DbAnnouncement>(
      'SELECT * FROM announcements ORDER BY publishedAt DESC'
    );
  }

  async markAsRead(id: string): Promise<void> {
    const database = db.getDatabase();
    await database.runAsync(
      'UPDATE announcements SET readAt = ? WHERE id = ?',
      [new Date().toISOString(), id]
    );
  }

  async syncFromServer(): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const response = await this.apiClient.GET('/announcements');
      if (!response.data?.success) {
        return { success: false, error: 'Failed to sync announcements' };
      }

      const announcements = response.data.data.map((announcement: any) => ({
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        publishedAt: announcement.publishedAt,
        expiresAt: announcement.expiresAt,
        createdAt: announcement.createdAt,
        updatedAt: announcement.updatedAt,
        syncedAt: new Date().toISOString(),
      }));

      await this.batchUpsertLocal(announcements);
      return { success: true, count: announcements.length };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Sync failed' };
    }
  }

  private async batchUpsertLocal(announcements: DbAnnouncement[]): Promise<void> {
    const database = db.getDatabase();
    await database.withTransactionAsync(async () => {
      for (const announcement of announcements) {
        await database.runAsync(
          `INSERT OR REPLACE INTO announcements 
           (id, title, content, priority, publishedAt, expiresAt, createdAt, updatedAt, syncedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            announcement.id, announcement.title, announcement.content, announcement.priority,
            announcement.publishedAt, announcement.expiresAt,
            announcement.createdAt, announcement.updatedAt, announcement.syncedAt
          ]
        );
      }
    });
  }
}

export const announcementsRepo = new AnnouncementsRepository();