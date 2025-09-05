/**
 * Attendance Repository Unit Tests
 */

import { database } from '../../../data/db';
import { attendanceRepository } from '../../../data/repos/attendance';
import { outboxManager } from '../../../sync/outbox';

// Mock dependencies
jest.mock('../../../lib/api/client');
jest.mock('../../../sync/outbox');

const mockOutboxManager = outboxManager as jest.Mocked<typeof outboxManager>;

describe('AttendanceRepository', () => {
  beforeEach(async () => {
    await database.initialize();
    await database.clearAll();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await database.close();
  });

  describe('checkIn', () => {
    it('should record check-in locally and queue for sync', async () => {
      const input = {
        memberId: 'member-123',
        serviceId: 'service-456',
        notes: 'Regular attendance',
      };

      const attendanceId = await attendanceRepository.checkIn(input, 'admin-789');

      expect(attendanceId).toBeDefined();
      expect(typeof attendanceId).toBe('string');

      // Verify stored in local database
      const db = await database.getDb();
      const record = await db.getFirstAsync(
        'SELECT * FROM attendance WHERE id = ?',
        [attendanceId]
      );

      expect(record).toBeTruthy();
      expect(record.member_id).toBe(input.memberId);
      expect(record.service_id).toBe(input.serviceId);
      expect(record.checked_in_by).toBe('admin-789');
      expect(record.notes).toBe(input.notes);

      // Verify queued for sync
      expect(mockOutboxManager.enqueue).toHaveBeenCalledWith(
        'attendance',
        'CREATE',
        {
          memberId: input.memberId,
          serviceId: input.serviceId,
          eventId: input.eventId,
          notes: input.notes,
        }
      );
    });

    it('should handle check-in without optional fields', async () => {
      const input = {
        memberId: 'member-123',
      };

      const attendanceId = await attendanceRepository.checkIn(input, 'admin-789');

      const db = await database.getDb();
      const record = await db.getFirstAsync(
        'SELECT * FROM attendance WHERE id = ?',
        [attendanceId]
      );

      expect(record.member_id).toBe(input.memberId);
      expect(record.service_id).toBeNull();
      expect(record.event_id).toBeNull();
      expect(record.notes).toBeNull();
    });
  });

  describe('isCheckedInToday', () => {
    beforeEach(async () => {
      const db = await database.getDb();
      
      // Insert test data
      const today = new Date().toISOString();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await db.runAsync(
        `INSERT INTO attendance (
          id, tenant_id, member_id, service_id, checked_in_at, 
          checked_in_by, created_at, last_synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'today-checkin',
          'tenant-1',
          'member-123',
          'service-456',
          today,
          'admin-789',
          today,
          today,
        ]
      );

      await db.runAsync(
        `INSERT INTO attendance (
          id, tenant_id, member_id, checked_in_at, 
          checked_in_by, created_at, last_synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          'yesterday-checkin',
          'tenant-1',
          'member-123',
          yesterday.toISOString(),
          'admin-789',
          yesterday.toISOString(),
          yesterday.toISOString(),
        ]
      );
    });

    it('should return true for member checked in today', async () => {
      const isCheckedIn = await attendanceRepository.isCheckedInToday('member-123');
      expect(isCheckedIn).toBe(true);
    });

    it('should return false for member not checked in today', async () => {
      const isCheckedIn = await attendanceRepository.isCheckedInToday('member-999');
      expect(isCheckedIn).toBe(false);
    });

    it('should check specific service', async () => {
      const isCheckedIn = await attendanceRepository.isCheckedInToday(
        'member-123',
        'service-456'
      );
      expect(isCheckedIn).toBe(true);

      const notCheckedIn = await attendanceRepository.isCheckedInToday(
        'member-123',
        'different-service'
      );
      expect(notCheckedIn).toBe(false);
    });
  });

  describe('getTodayStats', () => {
    beforeEach(async () => {
      const db = await database.getDb();
      
      // Insert members
      await db.runAsync(
        `INSERT INTO members (
          id, tenant_id, name, email, role, church_id, active,
          created_at, updated_at, last_synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'member-1',
          'tenant-1',
          'John Doe',
          'john@example.com',
          'MEMBER',
          'church-1',
          1,
          new Date().toISOString(),
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );

      await db.runAsync(
        `INSERT INTO members (
          id, tenant_id, name, email, role, church_id, active,
          created_at, updated_at, last_synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'member-2',
          'tenant-1',
          'Jane Doe',
          'jane@example.com',
          'MEMBER',
          'church-2',
          1,
          new Date().toISOString(),
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );

      // Insert attendance records
      const today = new Date().toISOString();
      const thisWeek = new Date();
      thisWeek.setDate(thisWeek.getDate() - 3);
      
      // Today's attendance
      await db.runAsync(
        `INSERT INTO attendance (
          id, tenant_id, member_id, checked_in_at, 
          checked_in_by, created_at, last_synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          'today-1',
          'tenant-1',
          'member-1',
          today,
          'admin-1',
          today,
          today,
        ]
      );

      // This week's attendance
      await db.runAsync(
        `INSERT INTO attendance (
          id, tenant_id, member_id, checked_in_at, 
          checked_in_by, created_at, last_synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          'week-1',
          'tenant-1',
          'member-2',
          thisWeek.toISOString(),
          'admin-1',
          thisWeek.toISOString(),
          thisWeek.toISOString(),
        ]
      );
    });

    it('should return correct stats for all churches', async () => {
      const stats = await attendanceRepository.getTodayStats();
      
      expect(stats.totalToday).toBe(1);
      expect(stats.totalThisWeek).toBe(2);
      expect(stats.recentCheckIns).toHaveLength(1);
      expect(stats.recentCheckIns[0].memberId).toBe('member-1');
    });

    it('should filter by church ID', async () => {
      const stats = await attendanceRepository.getTodayStats('church-1');
      
      expect(stats.totalToday).toBe(1);
      expect(stats.totalThisWeek).toBe(1); // Only member-1 is in church-1
    });
  });

  describe('getFromCache', () => {
    beforeEach(async () => {
      const db = await database.getDb();
      
      // Insert test attendance data
      const records = [
        {
          id: 'att-1',
          tenant_id: 'tenant-1',
          member_id: 'member-1',
          service_id: 'service-1',
          checked_in_at: '2024-01-15T09:30:00Z',
          checked_in_by: 'admin-1',
          created_at: '2024-01-15T09:30:00Z',
          last_synced: '2024-01-15T09:30:00Z',
        },
        {
          id: 'att-2',
          tenant_id: 'tenant-1',
          member_id: 'member-2',
          event_id: 'event-1',
          checked_in_at: '2024-01-16T10:00:00Z',
          checked_in_by: 'admin-1',
          created_at: '2024-01-16T10:00:00Z',
          last_synced: '2024-01-16T10:00:00Z',
        },
      ];

      for (const record of records) {
        await db.runAsync(
          `INSERT INTO attendance (
            id, tenant_id, member_id, service_id, event_id,
            checked_in_at, checked_in_by, created_at, last_synced
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            record.id,
            record.tenant_id,
            record.member_id,
            record.service_id || null,
            record.event_id || null,
            record.checked_in_at,
            record.checked_in_by,
            record.created_at,
            record.last_synced,
          ]
        );
      }

      // Insert members for church filtering
      await db.runAsync(
        `INSERT INTO members (
          id, tenant_id, name, email, role, church_id, active,
          created_at, updated_at, last_synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'member-1',
          'tenant-1',
          'John Doe',
          'john@example.com',
          'MEMBER',
          'church-1',
          1,
          new Date().toISOString(),
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );
    });

    it('should retrieve all attendance records', async () => {
      const records = await attendanceRepository.getAttendance({});
      expect(records).toHaveLength(2);
    });

    it('should filter by service ID', async () => {
      const records = await attendanceRepository.getAttendance({
        serviceId: 'service-1',
      });
      expect(records).toHaveLength(1);
      expect(records[0].serviceId).toBe('service-1');
    });

    it('should filter by event ID', async () => {
      const records = await attendanceRepository.getAttendance({
        eventId: 'event-1',
      });
      expect(records).toHaveLength(1);
      expect(records[0].eventId).toBe('event-1');
    });

    it('should filter by member ID', async () => {
      const records = await attendanceRepository.getAttendance({
        memberId: 'member-1',
      });
      expect(records).toHaveLength(1);
      expect(records[0].memberId).toBe('member-1');
    });

    it('should filter by date range', async () => {
      const records = await attendanceRepository.getAttendance({
        startDate: '2024-01-15',
        endDate: '2024-01-15',
      });
      expect(records).toHaveLength(1);
      expect(records[0].id).toBe('att-1');
    });

    it('should limit results', async () => {
      const records = await attendanceRepository.getAttendance({
        limit: 1,
      });
      expect(records).toHaveLength(1);
    });
  });

  describe('exportAttendance', () => {
    beforeEach(async () => {
      const db = await database.getDb();
      
      // Insert member
      await db.runAsync(
        `INSERT INTO members (
          id, tenant_id, name, email, role, church_id, active,
          created_at, updated_at, last_synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'member-1',
          'tenant-1',
          'John Doe',
          'john@example.com',
          'MEMBER',
          'church-1',
          1,
          new Date().toISOString(),
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );

      // Insert attendance
      await db.runAsync(
        `INSERT INTO attendance (
          id, tenant_id, member_id, checked_in_at, 
          checked_in_by, created_at, last_synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          'att-1',
          'tenant-1',
          'member-1',
          '2024-01-15T09:30:00Z',
          'admin-1',
          '2024-01-15T09:30:00Z',
          '2024-01-15T09:30:00Z',
        ]
      );
    });

    it('should export attendance with member details', async () => {
      const exported = await attendanceRepository.exportAttendance({
        startDate: '2024-01-15',
        endDate: '2024-01-15',
      });

      expect(exported).toHaveLength(1);
      expect(exported[0].id).toBe('att-1');
      expect(exported[0].memberName).toBe('John Doe');
      expect(exported[0].memberEmail).toBe('john@example.com');
    });

    it('should filter by church ID', async () => {
      const exported = await attendanceRepository.exportAttendance({
        startDate: '2024-01-15',
        endDate: '2024-01-15',
        churchId: 'church-1',
      });

      expect(exported).toHaveLength(1);
      expect(exported[0].memberName).toBe('John Doe');
    });
  });

  describe('getSyncStatus', () => {
    it('should return sync status', async () => {
      mockOutboxManager.getPendingCount.mockResolvedValue(0);

      const status = await attendanceRepository.getSyncStatus();
      
      expect(status.pending).toBe(0);
      expect(status.lastSync).toBeUndefined();
    });
  });
});