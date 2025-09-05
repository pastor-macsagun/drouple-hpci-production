/**
 * Attendance Repository - Offline-first check-ins with outbox pattern
 * Critical for Sunday service reliability - must work offline
 */

import { db, DbAttendance } from '../db';
import { outboxManager } from '../../sync/outbox';
import { generateId } from '../../lib/utils/id';

export interface CheckInData {
  memberId: string;
  eventId: string;
  scannedAt?: string;
  deviceId: string;
  isNewBeliever?: boolean;
  notes?: string;
}

export class AttendanceRepository {
  // Local operations (always work offline)
  async checkInLocally(data: CheckInData): Promise<{
    id: string;
    success: boolean;
    error?: string;
  }> {
    try {
      const database = db.getDatabase();
      const id = generateId();
      const now = new Date().toISOString();

      const attendanceRecord: DbAttendance = {
        id,
        memberId: data.memberId,
        eventId: data.eventId,
        scannedAt: data.scannedAt || now,
        deviceId: data.deviceId,
        isNewBeliever: data.isNewBeliever || false,
        notes: data.notes,
        createdAt: now,
        syncStatus: 'pending',
        retryCount: 0,
      };

      // Check for duplicate check-in (same member, same event)
      const existing = await database.getFirstAsync<DbAttendance>(
        'SELECT * FROM attendance WHERE memberId = ? AND eventId = ?',
        [data.memberId, data.eventId]
      );

      if (existing) {
        return {
          id: existing.id,
          success: false,
          error: 'Member already checked in for this event'
        };
      }

      // Store locally first (always succeeds for offline reliability)
      await database.runAsync(
        `INSERT INTO attendance 
         (id, memberId, eventId, scannedAt, deviceId, isNewBeliever, notes, 
          createdAt, syncStatus, retryCount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          attendanceRecord.id,
          attendanceRecord.memberId,
          attendanceRecord.eventId,
          attendanceRecord.scannedAt,
          attendanceRecord.deviceId,
          attendanceRecord.isNewBeliever ? 1 : 0,
          attendanceRecord.notes,
          attendanceRecord.createdAt,
          attendanceRecord.syncStatus,
          attendanceRecord.retryCount,
        ]
      );

      // Queue for sync to server
      await outboxManager.enqueueWrite({
        endpoint: '/attendance/checkin',
        method: 'POST',
        payload: {
          memberId: data.memberId,
          eventId: data.eventId,
          scannedAt: attendanceRecord.scannedAt,
          deviceId: data.deviceId,
          isNewBeliever: data.isNewBeliever,
          notes: data.notes,
        },
        localRecordId: id,
        resourceType: 'attendance',
      });

      return { id, success: true };

    } catch (error) {
      console.error('Local check-in failed:', error);
      return {
        id: '',
        success: false,
        error: error instanceof Error ? error.message : 'Check-in failed'
      };
    }
  }

  async getByEvent(eventId: string): Promise<DbAttendance[]> {
    const database = db.getDatabase();
    return database.getAllAsync<DbAttendance>(
      'SELECT * FROM attendance WHERE eventId = ? ORDER BY scannedAt DESC',
      [eventId]
    );
  }

  async getByMember(memberId: string): Promise<DbAttendance[]> {
    const database = db.getDatabase();
    return database.getAllAsync<DbAttendance>(
      'SELECT * FROM attendance WHERE memberId = ? ORDER BY scannedAt DESC',
      [memberId]
    );
  }

  async getPendingSync(): Promise<DbAttendance[]> {
    const database = db.getDatabase();
    return database.getAllAsync<DbAttendance>(
      'SELECT * FROM attendance WHERE syncStatus = "pending" ORDER BY createdAt ASC'
    );
  }

  async getSyncedCount(): Promise<number> {
    const database = db.getDatabase();
    const result = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM attendance WHERE syncStatus = "synced"'
    );
    return result?.count ?? 0;
  }

  async getPendingCount(): Promise<number> {
    const database = db.getDatabase();
    const result = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM attendance WHERE syncStatus = "pending"'
    );
    return result?.count ?? 0;
  }

  // Sync status management
  async markAsSynced(id: string): Promise<void> {
    const database = db.getDatabase();
    await database.runAsync(
      'UPDATE attendance SET syncStatus = "synced", syncedAt = ? WHERE id = ?',
      [new Date().toISOString(), id]
    );
  }

  async markAsFailed(id: string, retryCount: number): Promise<void> {
    const database = db.getDatabase();
    await database.runAsync(
      `UPDATE attendance 
       SET syncStatus = "failed", retryCount = ? 
       WHERE id = ?`,
      [retryCount, id]
    );
  }

  async retryFailed(id: string): Promise<void> {
    const database = db.getDatabase();
    await database.runAsync(
      'UPDATE attendance SET syncStatus = "pending" WHERE id = ?',
      [id]
    );
  }

  // Statistics for dashboard
  async getTodaysCheckIns(): Promise<{
    total: number;
    synced: number;
    pending: number;
    newBelievers: number;
  }> {
    const database = db.getDatabase();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const [total, synced, pending, newBelievers] = await Promise.all([
      database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM attendance WHERE scannedAt LIKE ?',
        [`${today}%`]
      ),
      database.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM attendance 
         WHERE scannedAt LIKE ? AND syncStatus = "synced"`,
        [`${today}%`]
      ),
      database.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM attendance 
         WHERE scannedAt LIKE ? AND syncStatus = "pending"`,
        [`${today}%`]
      ),
      database.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM attendance 
         WHERE scannedAt LIKE ? AND isNewBeliever = 1`,
        [`${today}%`]
      ),
    ]);

    return {
      total: total?.count ?? 0,
      synced: synced?.count ?? 0,
      pending: pending?.count ?? 0,
      newBelievers: newBelievers?.count ?? 0,
    };
  }

  async getRecentCheckIns(limit: number = 20): Promise<Array<DbAttendance & {
    memberName?: string;
    eventTitle?: string;
  }>> {
    const database = db.getDatabase();
    return database.getAllAsync(
      `SELECT 
         a.*,
         m.name as memberName,
         e.title as eventTitle
       FROM attendance a
       LEFT JOIN members m ON a.memberId = m.id
       LEFT JOIN events e ON a.eventId = e.id
       ORDER BY a.scannedAt DESC
       LIMIT ?`,
      [limit]
    );
  }

  // Data management
  async deleteLocal(id: string): Promise<void> {
    const database = db.getDatabase();
    await database.runAsync('DELETE FROM attendance WHERE id = ?', [id]);
  }

  async clearAll(): Promise<void> {
    const database = db.getDatabase();
    await database.runAsync('DELETE FROM attendance');
  }

  // Export for reports (offline capability)
  async exportToCsv(eventId?: string): Promise<string> {
    const database = db.getDatabase();
    
    let sql = `
      SELECT 
        a.scannedAt,
        m.name as memberName,
        m.email as memberEmail,
        e.title as eventTitle,
        a.isNewBeliever,
        a.syncStatus,
        a.notes
      FROM attendance a
      LEFT JOIN members m ON a.memberId = m.id
      LEFT JOIN events e ON a.eventId = e.id
    `;
    
    const params: any[] = [];
    if (eventId) {
      sql += ' WHERE a.eventId = ?';
      params.push(eventId);
    }
    
    sql += ' ORDER BY a.scannedAt DESC';

    const records = await database.getAllAsync(sql, params);

    // Generate CSV
    const headers = ['Scanned At', 'Member Name', 'Member Email', 'Event', 'New Believer', 'Sync Status', 'Notes'];
    const rows = records.map((record: any) => [
      record.scannedAt,
      record.memberName || 'Unknown',
      record.memberEmail || '',
      record.eventTitle || 'Unknown Event',
      record.isNewBeliever ? 'Yes' : 'No',
      record.syncStatus,
      record.notes || '',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }
}

export const attendanceRepo = new AttendanceRepository();