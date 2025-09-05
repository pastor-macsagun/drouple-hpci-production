/**
 * SQLite Database Setup & Schema
 * Offline storage for members, events, attendance, announcements with sync metadata
 */

import * as SQLite from 'expo-sqlite';

export interface DbMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  church: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

export interface DbEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  capacity?: number;
  fee?: number;
  status: 'draft' | 'published' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

export interface DbAnnouncement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  publishedAt?: string;
  expiresAt?: string;
  readAt?: string; // Client-side read timestamp
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

export interface DbAttendance {
  id: string;
  memberId: string;
  eventId: string;
  scannedAt: string;
  deviceId: string;
  isNewBeliever?: boolean;
  notes?: string;
  createdAt: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  syncedAt?: string;
  retryCount: number;
}

export interface DbOutboxItem {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  payload: string; // JSON serialized
  idempotencyKey: string;
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
  createdAt: string;
  lastAttemptAt?: string;
  errorMessage?: string;
}

export interface DbSyncMeta {
  resource: string; // 'members' | 'events' | 'announcements'
  lastETag?: string;
  lastCursor?: string;
  lastSyncAt: string;
}

// Database schema version for migrations
const SCHEMA_VERSION = 1;

class DatabaseManager {
  private static instance: DatabaseManager;
  private db: SQLite.SQLiteDatabase | null = null;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.db) return;

    this.db = await SQLite.openDatabaseAsync('drouple.db');
    await this.setupSchema();
  }

  private async setupSchema(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
    `);

    // Members table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL,
        church TEXT NOT NULL,
        isActive INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        syncedAt TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
      CREATE INDEX IF NOT EXISTS idx_members_church ON members(church);
      CREATE INDEX IF NOT EXISTS idx_members_updated ON members(updatedAt);
    `);

    // Events table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        startDate TEXT NOT NULL,
        endDate TEXT,
        location TEXT,
        capacity INTEGER,
        fee REAL,
        status TEXT NOT NULL DEFAULT 'published',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        syncedAt TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(startDate);
      CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
      CREATE INDEX IF NOT EXISTS idx_events_updated ON events(updatedAt);
    `);

    // Announcements table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'normal',
        publishedAt TEXT,
        expiresAt TEXT,
        readAt TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        syncedAt TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(publishedAt);
      CREATE INDEX IF NOT EXISTS idx_announcements_expires ON announcements(expiresAt);
      CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);
    `);

    // Attendance table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY,
        memberId TEXT NOT NULL,
        eventId TEXT NOT NULL,
        scannedAt TEXT NOT NULL,
        deviceId TEXT NOT NULL,
        isNewBeliever INTEGER DEFAULT 0,
        notes TEXT,
        createdAt TEXT NOT NULL,
        syncStatus TEXT NOT NULL DEFAULT 'pending',
        syncedAt TEXT,
        retryCount INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (memberId) REFERENCES members(id),
        FOREIGN KEY (eventId) REFERENCES events(id)
      );
      CREATE INDEX IF NOT EXISTS idx_attendance_member ON attendance(memberId);
      CREATE INDEX IF NOT EXISTS idx_attendance_event ON attendance(eventId);
      CREATE INDEX IF NOT EXISTS idx_attendance_sync_status ON attendance(syncStatus);
      CREATE INDEX IF NOT EXISTS idx_attendance_scanned ON attendance(scannedAt);
    `);

    // Outbox table for queued writes
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS outbox (
        id TEXT PRIMARY KEY,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        payload TEXT NOT NULL,
        idempotencyKey TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'pending',
        retryCount INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        lastAttemptAt TEXT,
        errorMessage TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox(status);
      CREATE INDEX IF NOT EXISTS idx_outbox_created ON outbox(createdAt);
      CREATE INDEX IF NOT EXISTS idx_outbox_idempotency ON outbox(idempotencyKey);
    `);

    // Sync metadata table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_meta (
        resource TEXT PRIMARY KEY,
        lastETag TEXT,
        lastCursor TEXT,
        lastSyncAt TEXT NOT NULL
      );
    `);

    // Schema version tracking
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS schema_info (
        version INTEGER PRIMARY KEY,
        appliedAt TEXT NOT NULL
      );
      INSERT OR REPLACE INTO schema_info (version, appliedAt) 
      VALUES (${SCHEMA_VERSION}, datetime('now'));
    `);
  }

  getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  async clearAllData(): Promise<void> {
    if (!this.db) return;

    await this.db.execAsync(`
      DELETE FROM attendance;
      DELETE FROM announcements;
      DELETE FROM events;
      DELETE FROM members;
      DELETE FROM outbox;
      DELETE FROM sync_meta;
    `);
  }

  async getStats(): Promise<{
    members: number;
    events: number;
    announcements: number;
    attendance: number;
    pendingSync: number;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const [members, events, announcements, attendance, pendingSync] = await Promise.all([
      this.db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM members'),
      this.db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM events'),
      this.db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM announcements'),
      this.db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM attendance'),
      this.db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM outbox WHERE status = "pending"'),
    ]);

    return {
      members: members?.count ?? 0,
      events: events?.count ?? 0,
      announcements: announcements?.count ?? 0,
      attendance: attendance?.count ?? 0,
      pendingSync: pendingSync?.count ?? 0,
    };
  }
}

// Export singleton instance
export const db = DatabaseManager.getInstance();

// Initialize database on import
db.initialize().catch(console.error);

export default db;