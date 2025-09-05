/**
 * Attendance Repository with offline check-in support
 */

import { database, DatabaseSchema, generateId, toISOString } from '../db';
import { apiClient } from '../../lib/api/client';
import { outboxManager } from '../../sync/outbox';

export interface AttendanceRecord {
  id: string;
  tenantId: string;
  memberId: string;
  serviceId?: string;
  eventId?: string;
  checkedInAt: string;
  checkedInBy: string;
  notes?: string;
  createdAt: string;
  lastSynced?: string;
}

export interface CheckInInput {
  memberId: string;
  serviceId?: string;
  eventId?: string;
  notes?: string;
}

export interface AttendanceStats {
  totalToday: number;
  totalThisWeek: number;
  recentCheckIns: AttendanceRecord[];
}

class AttendanceRepository {
  private readonly resourceKey = 'attendance';

  /**
   * Record check-in (offline-first)
   */
  async checkIn(input: CheckInInput, checkedInBy: string): Promise<string> {
    const db = await database.getDb();
    const attendanceId = generateId();
    const now = toISOString();

    const record: AttendanceRecord = {
      id: attendanceId,
      tenantId: 'temp', // Will be set by server
      memberId: input.memberId,
      serviceId: input.serviceId,
      eventId: input.eventId,
      checkedInAt: now,
      checkedInBy,
      notes: input.notes,
      createdAt: now,
    };

    // Store locally first (optimistic)
    await db.runAsync(
      `INSERT INTO attendance (
        id, tenant_id, member_id, service_id, event_id,
        checked_in_at, checked_in_by, notes, created_at, last_synced
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.tenantId,
        record.memberId,
        record.serviceId || null,
        record.eventId || null,
        record.checkedInAt,
        record.checkedInBy,
        record.notes || null,
        record.createdAt,
        now,
      ]
    );

    // Queue for sync
    await outboxManager.enqueue('attendance', 'CREATE', {
      memberId: input.memberId,
      serviceId: input.serviceId,
      eventId: input.eventId,
      notes: input.notes,
    });

    console.log(`✅ Check-in recorded offline: ${attendanceId}`);
    return attendanceId;
  }

  /**
   * Get attendance records for a date range
   */
  async getAttendance(params: {
    serviceId?: string;
    eventId?: string;
    memberId?: string;
    churchId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<AttendanceRecord[]> {
    const db = await database.getDb();
    
    try {
      // Try to fetch fresh data from API
      const apiRecords = await this.fetchFromApi(params);
      if (apiRecords) {
        return apiRecords;
      }
    } catch (error) {
      console.warn('⚠️ API fetch failed, using cached data:', error);
    }

    // Fallback to cached data
    return this.getFromCache(params);
  }

  /**
   * Get today's attendance stats
   */
  async getTodayStats(churchId?: string): Promise<AttendanceStats> {
    const db = await database.getDb();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    let todayQuery = `
      SELECT COUNT(*) as count 
      FROM attendance a
      WHERE date(a.checked_in_at) = ?
    `;
    let weekQuery = `
      SELECT COUNT(*) as count 
      FROM attendance a
      WHERE date(a.checked_in_at) >= ?
    `;
    let recentQuery = `
      SELECT a.*, m.name as member_name
      FROM attendance a
      LEFT JOIN members m ON a.member_id = m.id
      WHERE date(a.checked_in_at) = ?
    `;

    const params = [today];
    const weekParams = [weekAgoStr];
    const recentParams = [today];

    if (churchId) {
      todayQuery += ' AND EXISTS (SELECT 1 FROM members WHERE id = a.member_id AND church_id = ?)';
      weekQuery += ' AND EXISTS (SELECT 1 FROM members WHERE id = a.member_id AND church_id = ?)';
      recentQuery += ' AND m.church_id = ?';
      params.push(churchId);
      weekParams.push(churchId);
      recentParams.push(churchId);
    }

    recentQuery += ' ORDER BY a.checked_in_at DESC LIMIT 10';

    const [todayResult, weekResult, recentResults] = await Promise.all([
      db.getFirstAsync<{ count: number }>(todayQuery, params),
      db.getFirstAsync<{ count: number }>(weekQuery, weekParams),
      db.getAllAsync<DatabaseSchema['attendance'] & { member_name: string }>(recentQuery, recentParams),
    ]);

    return {
      totalToday: todayResult?.count || 0,
      totalThisWeek: weekResult?.count || 0,
      recentCheckIns: recentResults.map(row => ({
        id: row.id,
        tenantId: row.tenant_id,
        memberId: row.member_id,
        serviceId: row.service_id || undefined,
        eventId: row.event_id || undefined,
        checkedInAt: row.checked_in_at,
        checkedInBy: row.checked_in_by,
        notes: row.notes || undefined,
        createdAt: row.created_at,
        lastSynced: row.last_synced,
      })),
    };
  }

  /**
   * Check if member already checked in today
   */
  async isCheckedInToday(memberId: string, serviceId?: string, eventId?: string): Promise<boolean> {
    const db = await database.getDb();
    const today = new Date().toISOString().split('T')[0];

    let query = `
      SELECT COUNT(*) as count 
      FROM attendance 
      WHERE member_id = ? AND date(checked_in_at) = ?
    `;
    const params = [memberId, today];

    if (serviceId) {
      query += ' AND service_id = ?';
      params.push(serviceId);
    }
    if (eventId) {
      query += ' AND event_id = ?';
      params.push(eventId);
    }

    const result = await db.getFirstAsync<{ count: number }>(query, params);
    return (result?.count || 0) > 0;
  }

  /**
   * Get pending check-ins count
   */
  async getPendingCheckInsCount(): Promise<number> {
    return outboxManager.getPendingCount();
  }

  /**
   * Get sync status for UI badges
   */
  async getSyncStatus(): Promise<{
    pending: number;
    lastSync?: string;
  }> {
    const db = await database.getDb();
    
    const pendingResult = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM outbox 
       WHERE entity_type = 'attendance' AND status IN ('PENDING', 'FAILED')`
    );

    const metaResult = await db.getFirstAsync<DatabaseSchema['meta']>(
      'SELECT last_fetch FROM meta WHERE resource_key = ?',
      [this.resourceKey]
    );

    return {
      pending: pendingResult?.count || 0,
      lastSync: metaResult?.last_fetch,
    };
  }

  /**
   * Fetch from API with ETag support
   */
  private async fetchFromApi(params: any): Promise<AttendanceRecord[] | null> {
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
    if (params.serviceId) queryParams.set('serviceId', params.serviceId);
    if (params.eventId) queryParams.set('eventId', params.eventId);
    if (params.memberId) queryParams.set('memberId', params.memberId);
    if (params.churchId) queryParams.set('churchId', params.churchId);
    if (params.startDate) queryParams.set('startDate', params.startDate);
    if (params.endDate) queryParams.set('endDate', params.endDate);
    if (params.limit) queryParams.set('limit', String(params.limit));

    const url = `/api/v2/attendance?${queryParams.toString()}`;
    const response = await apiClient.get(url, { headers });

    if (response.status === 304) {
      // Not modified - return cached data
      console.log('📋 Attendance not modified, using cache');
      return this.getFromCache(params);
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const records = data.attendance || data;

    // Update cache
    await this.updateCache(records);

    // Store ETag
    const etag = response.headers.get('etag');
    if (etag) {
      await this.storeETag(etag);
    }

    return records;
  }

  /**
   * Get attendance from local cache
   */
  private async getFromCache(params: any): Promise<AttendanceRecord[]> {
    const db = await database.getDb();
    
    let query = 'SELECT * FROM attendance WHERE 1=1';
    const queryParams: any[] = [];

    if (params.serviceId) {
      query += ' AND service_id = ?';
      queryParams.push(params.serviceId);
    }
    if (params.eventId) {
      query += ' AND event_id = ?';
      queryParams.push(params.eventId);
    }
    if (params.memberId) {
      query += ' AND member_id = ?';
      queryParams.push(params.memberId);
    }
    if (params.startDate) {
      query += ' AND date(checked_in_at) >= ?';
      queryParams.push(params.startDate);
    }
    if (params.endDate) {
      query += ' AND date(checked_in_at) <= ?';
      queryParams.push(params.endDate);
    }

    // Join with members for church filtering
    if (params.churchId) {
      query = query.replace('FROM attendance', 
        'FROM attendance a JOIN members m ON a.member_id = m.id');
      query += ' AND m.church_id = ?';
      queryParams.push(params.churchId);
    }

    query += ' ORDER BY checked_in_at DESC';

    if (params.limit) {
      query += ' LIMIT ?';
      queryParams.push(params.limit);
    }

    const rows = await db.getAllAsync<DatabaseSchema['attendance']>(query, queryParams);
    return rows.map(this.mapFromDb);
  }

  /**
   * Update local cache with API data
   */
  private async updateCache(records: any[]): Promise<void> {
    const db = await database.getDb();
    const now = toISOString();

    await database.transaction(async (tx) => {
      for (const record of records) {
        await tx.runAsync(
          `INSERT OR REPLACE INTO attendance (
            id, tenant_id, member_id, service_id, event_id,
            checked_in_at, checked_in_by, notes, created_at, last_synced
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            record.id,
            record.tenantId,
            record.memberId,
            record.serviceId || null,
            record.eventId || null,
            record.checkedInAt,
            record.checkedInBy,
            record.notes || null,
            record.createdAt,
            now,
          ]
        );
      }
    });

    console.log(`📋 Updated ${records.length} attendance records in cache`);
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
   * Map database row to AttendanceRecord object
   */
  private mapFromDb(row: DatabaseSchema['attendance']): AttendanceRecord {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      memberId: row.member_id,
      serviceId: row.service_id || undefined,
      eventId: row.event_id || undefined,
      checkedInAt: row.checked_in_at,
      checkedInBy: row.checked_in_by,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      lastSynced: row.last_synced,
    };
  }

  /**
   * Export attendance data for reports
   */
  async exportAttendance(params: {
    startDate: string;
    endDate: string;
    churchId?: string;
  }): Promise<Array<AttendanceRecord & { memberName: string; memberEmail: string }>> {
    const db = await database.getDb();

    let query = `
      SELECT a.*, m.name as member_name, m.email as member_email
      FROM attendance a
      JOIN members m ON a.member_id = m.id
      WHERE date(a.checked_in_at) BETWEEN ? AND ?
    `;
    const queryParams = [params.startDate, params.endDate];

    if (params.churchId) {
      query += ' AND m.church_id = ?';
      queryParams.push(params.churchId);
    }

    query += ' ORDER BY a.checked_in_at DESC';

    const rows = await db.getAllAsync<DatabaseSchema['attendance'] & {
      member_name: string;
      member_email: string;
    }>(query, queryParams);

    return rows.map(row => ({
      ...this.mapFromDb(row),
      memberName: row.member_name,
      memberEmail: row.member_email,
    }));
  }
}

export const attendanceRepository = new AttendanceRepository();