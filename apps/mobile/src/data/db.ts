/**
 * SQLite Database Schema & Bootstrap
 * Implements offline-first sync architecture with ETag tracking
 */

import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// Database version for migrations
const DB_VERSION = 1;
const DB_NAME = 'drouple_mobile.db';

export interface DatabaseSchema {
  // Core entities (cached from API)
  members: {
    id: string;
    tenant_id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    church_id: string;
    active: boolean;
    created_at: string;
    updated_at: string;
    // Sync metadata
    last_synced: string;
  };

  events: {
    id: string;
    tenant_id: string;
    title: string;
    description?: string;
    date: string;
    time: string;
    location?: string;
    capacity?: number;
    fee?: number;
    church_id: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    last_synced: string;
  };

  attendance: {
    id: string;
    tenant_id: string;
    member_id: string;
    service_id?: string;
    event_id?: string;
    checked_in_at: string;
    checked_in_by: string;
    notes?: string;
    created_at: string;
    last_synced: string;
  };

  announcements: {
    id: string;
    tenant_id: string;
    title: string;
    content: string;
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    published: boolean;
    published_at?: string;
    church_id: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    last_synced: string;
  };

  // Outbox for queued writes
  outbox: {
    id: string; // UUID
    idempotency_key: string; // UUID for server deduplication
    entity_type: 'members' | 'events' | 'attendance' | 'announcements';
    entity_id?: string; // null for creates
    operation: 'CREATE' | 'UPDATE' | 'DELETE';
    payload: string; // JSON
    status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
    retry_count: number;
    next_retry_at?: string;
    error_message?: string;
    created_at: string;
    updated_at: string;
  };

  // Sync metadata tracking
  meta: {
    resource_key: string; // e.g., "members", "events:church_id"
    etag?: string; // Last known ETag
    next_cursor?: string; // For paginated resources
    last_fetch: string;
    last_full_sync?: string;
  };
}

// Type helpers for database operations
export type TableName = keyof DatabaseSchema;
export type TableRow<T extends TableName> = DatabaseSchema[T];

class Database {
  private db: SQLite.SQLiteDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initialize();
    return this.initPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      // Open database
      this.db = await SQLite.openDatabaseAsync(DB_NAME, {
        enableChangeListener: true,
        enableCRSQLite: false, // Keep simple for now
      });

      // Enable foreign key constraints
      await this.db.execAsync('PRAGMA foreign_keys = ON;');
      await this.db.execAsync('PRAGMA journal_mode = WAL;');

      // Create tables
      await this.createTables();

      // Run migrations if needed
      await this.runMigrations();

      console.log('📱 Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createTableQueries = [
      // Members table
      `CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL,
        church_id TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_synced TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tenant_id, email)
      );`,

      // Events table
      `CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        location TEXT,
        capacity INTEGER,
        fee INTEGER,
        church_id TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_synced TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,

      // Attendance table
      `CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        member_id TEXT NOT NULL,
        service_id TEXT,
        event_id TEXT,
        checked_in_at TEXT NOT NULL,
        checked_in_by TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        last_synced TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(member_id) REFERENCES members(id)
      );`,

      // Announcements table
      `CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'NORMAL',
        published INTEGER NOT NULL DEFAULT 0,
        published_at TEXT,
        church_id TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_synced TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,

      // Outbox table
      `CREATE TABLE IF NOT EXISTS outbox (
        id TEXT PRIMARY KEY,
        idempotency_key TEXT NOT NULL UNIQUE,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        operation TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        retry_count INTEGER NOT NULL DEFAULT 0,
        next_retry_at TEXT,
        error_message TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,

      // Meta table
      `CREATE TABLE IF NOT EXISTS meta (
        resource_key TEXT PRIMARY KEY,
        etag TEXT,
        next_cursor TEXT,
        last_fetch TEXT NOT NULL,
        last_full_sync TEXT
      );`,

      // Indexes for performance
      `CREATE INDEX IF NOT EXISTS idx_members_tenant_church ON members(tenant_id, church_id);`,
      `CREATE INDEX IF NOT EXISTS idx_members_active ON members(active) WHERE active = 1;`,
      `CREATE INDEX IF NOT EXISTS idx_events_tenant_church ON events(tenant_id, church_id);`,
      `CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);`,
      `CREATE INDEX IF NOT EXISTS idx_attendance_member ON attendance(member_id);`,
      `CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(checked_in_at);`,
      `CREATE INDEX IF NOT EXISTS idx_announcements_tenant_published ON announcements(tenant_id, published);`,
      `CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox(status) WHERE status != 'SYNCED';`,
      `CREATE INDEX IF NOT EXISTS idx_outbox_retry ON outbox(next_retry_at) WHERE status = 'FAILED';`,
    ];

    for (const query of createTableQueries) {
      await this.db.execAsync(query);
    }
  }

  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Get current version
    const result = await this.db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version;'
    );
    const currentVersion = result?.user_version || 0;

    if (currentVersion < DB_VERSION) {
      console.log(`📱 Running migrations from v${currentVersion} to v${DB_VERSION}`);
      
      // Add future migrations here
      // if (currentVersion < 2) {
      //   await this.db.execAsync('ALTER TABLE members ADD COLUMN new_field TEXT;');
      // }

      // Update version
      await this.db.execAsync(`PRAGMA user_version = ${DB_VERSION};`);
    }
  }

  // Get database instance (ensure initialization first)
  async getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      await this.initialize();
    }
    if (!this.db) {
      throw new Error('Database failed to initialize');
    }
    return this.db;
  }

  // Transaction helper
  async transaction<T>(
    callback: (db: SQLite.SQLiteDatabase) => Promise<T>
  ): Promise<T> {
    const db = await this.getDb();
    return await db.withTransactionAsync(callback);
  }

  // Clear all data (for testing/reset)
  async clearAll(): Promise<void> {
    const db = await this.getDb();
    const tables = ['members', 'events', 'attendance', 'announcements', 'outbox', 'meta'];
    
    for (const table of tables) {
      await db.execAsync(`DELETE FROM ${table};`);
    }
    
    console.log('🧹 Database cleared');
  }

  // Export for debugging
  async exportData(): Promise<Record<string, any[]>> {
    const db = await this.getDb();
    const tables = ['members', 'events', 'attendance', 'announcements', 'outbox', 'meta'];
    const data: Record<string, any[]> = {};

    for (const table of tables) {
      const rows = await db.getAllAsync(`SELECT * FROM ${table} LIMIT 100;`);
      data[table] = rows;
    }

    return data;
  }

  // Close database (cleanup)
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.initPromise = null;
    }
  }
}

// Singleton instance
export const database = new Database();

// Utility functions
export const generateId = (): string => {
  // Simple UUID v4 generator for React Native
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const toISOString = (date: Date = new Date()): string => {
  return date.toISOString();
};

// Error types
export class DatabaseError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class SyncError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'SyncError';
  }
}