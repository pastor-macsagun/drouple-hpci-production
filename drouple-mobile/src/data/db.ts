/**
 * SQLite Database Layer
 * Provides offline storage capabilities with auto-migration support
 */

import * as SQLite from 'expo-sqlite/next';
import type { SQLiteDatabase } from 'expo-sqlite/next';

// Database configuration
const DATABASE_NAME = 'drouple_mobile.db';
const DATABASE_VERSION = 1;

// Define table schemas
interface DbMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  churchId: string;
  isActive: boolean;
  updatedAt: string;
}

interface DbEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  currentAttendees: number;
  waitlistCount: number;
  fee: number;
  userRSVPStatus?: 'confirmed' | 'waitlisted' | null;
  tags: string; // JSON string
  updatedAt: string;
}

interface DbCheckInQueue {
  id: string;
  serviceId: string;
  memberId: string;
  checkInTime: string;
  isNewBeliever: boolean;
  status: 'queued' | 'synced' | 'failed';
  attempts: number;
  errorMessage?: string;
  createdAt: string;
}

interface DbRSVPQueue {
  id: string;
  eventId: string;
  action: 'rsvp' | 'cancel' | 'waitlist';
  status: 'queued' | 'synced' | 'failed';
  attempts: number;
  errorMessage?: string;
  createdAt: string;
}

interface DbKeyValue {
  key: string;
  value: string;
  updatedAt: string;
}

class DatabaseManager {
  private db: SQLiteDatabase | null = null;
  private initialized = false;

  /**
   * Initialize the database connection and run migrations
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Open database connection
      this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);

      // Enable foreign keys
      await this.db.execAsync('PRAGMA foreign_keys = ON;');

      // Run migrations
      await this.runMigrations();

      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get database instance (with initialization check)
   */
  private getDb(): SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Run database migrations
   */
  private async runMigrations(): Promise<void> {
    const db = this.getDb();

    // Check current version
    let currentVersion = 0;
    try {
      const result = await db.getFirstAsync<{ user_version: number }>(
        'PRAGMA user_version'
      );
      currentVersion = result?.user_version || 0;
    } catch (error) {
      console.warn('Failed to get database version:', error);
    }

    console.log(
      `Database version: ${currentVersion}, target: ${DATABASE_VERSION}`
    );

    // Run migrations from current version to target version
    for (let version = currentVersion; version < DATABASE_VERSION; version++) {
      await this.runMigration(version + 1);
    }

    // Update version
    if (currentVersion < DATABASE_VERSION) {
      await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
      console.log(`Database upgraded to version ${DATABASE_VERSION}`);
    }
  }

  /**
   * Run specific migration
   */
  private async runMigration(version: number): Promise<void> {
    const db = this.getDb();
    console.log(`Running migration to version ${version}`);

    switch (version) {
      case 1:
        await this.createInitialTables(db);
        break;
      default:
        throw new Error(`Unknown migration version: ${version}`);
    }
  }

  /**
   * Create initial database tables
   */
  private async createInitialTables(db: SQLiteDatabase): Promise<void> {
    // Members table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL,
        churchId TEXT NOT NULL,
        isActive INTEGER NOT NULL DEFAULT 1,
        updatedAt TEXT NOT NULL,
        UNIQUE(email, churchId)
      );
    `);

    // Events table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        location TEXT NOT NULL,
        startsAt TEXT NOT NULL,
        endsAt TEXT NOT NULL,
        capacity INTEGER NOT NULL DEFAULT 0,
        currentAttendees INTEGER NOT NULL DEFAULT 0,
        waitlistCount INTEGER NOT NULL DEFAULT 0,
        fee REAL NOT NULL DEFAULT 0,
        userRSVPStatus TEXT,
        tags TEXT NOT NULL DEFAULT '[]',
        updatedAt TEXT NOT NULL
      );
    `);

    // Check-in queue table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS checkin_queue (
        id TEXT PRIMARY KEY,
        serviceId TEXT NOT NULL,
        memberId TEXT NOT NULL,
        checkInTime TEXT NOT NULL,
        isNewBeliever INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'queued',
        attempts INTEGER NOT NULL DEFAULT 0,
        errorMessage TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (memberId) REFERENCES members (id)
      );
    `);

    // RSVP queue table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS rsvp_queue (
        id TEXT PRIMARY KEY,
        eventId TEXT NOT NULL,
        action TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'queued',
        attempts INTEGER NOT NULL DEFAULT 0,
        errorMessage TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (eventId) REFERENCES events (id)
      );
    `);

    // Key-value store table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS kv (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);

    // Create indexes for better performance
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_members_church ON members (churchId);
      CREATE INDEX IF NOT EXISTS idx_members_email ON members (email);
      CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events (startsAt);
      CREATE INDEX IF NOT EXISTS idx_checkin_queue_status ON checkin_queue (status);
      CREATE INDEX IF NOT EXISTS idx_rsvp_queue_status ON rsvp_queue (status);
    `);

    console.log('Initial tables created successfully');
  }

  /**
   * Members repository methods
   */
  async getMembers(limit = 50, offset = 0): Promise<DbMember[]> {
    const db = this.getDb();
    return await db.getAllAsync<DbMember>(
      'SELECT * FROM members WHERE isActive = 1 ORDER BY name ASC LIMIT ? OFFSET ?',
      [limit, offset]
    );
  }

  async searchMembers(query: string, limit = 20): Promise<DbMember[]> {
    const db = this.getDb();
    const searchTerm = `%${query}%`;
    return await db.getAllAsync<DbMember>(
      `SELECT * FROM members 
       WHERE isActive = 1 AND (name LIKE ? OR email LIKE ?) 
       ORDER BY name ASC LIMIT ?`,
      [searchTerm, searchTerm, limit]
    );
  }

  async getMemberById(id: string): Promise<DbMember | null> {
    const db = this.getDb();
    return await db.getFirstAsync<DbMember>(
      'SELECT * FROM members WHERE id = ? AND isActive = 1',
      [id]
    );
  }

  async upsertMember(member: DbMember): Promise<void> {
    const db = this.getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO members 
       (id, name, email, phone, role, churchId, isActive, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        member.id,
        member.name,
        member.email,
        member.phone || null,
        member.role,
        member.churchId,
        member.isActive ? 1 : 0,
        member.updatedAt,
      ]
    );
  }

  async deleteOldMembers(cutoffDate: string): Promise<void> {
    const db = this.getDb();
    await db.runAsync('DELETE FROM members WHERE updatedAt < ?', [cutoffDate]);
  }

  /**
   * Events repository methods
   */
  async getEvents(limit = 20, offset = 0): Promise<DbEvent[]> {
    const db = this.getDb();
    return await db.getAllAsync<DbEvent>(
      `SELECT * FROM events 
       WHERE startsAt > datetime('now') 
       ORDER BY startsAt ASC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  }

  async getEventById(id: string): Promise<DbEvent | null> {
    const db = this.getDb();
    return await db.getFirstAsync<DbEvent>(
      'SELECT * FROM events WHERE id = ?',
      [id]
    );
  }

  async upsertEvent(event: DbEvent): Promise<void> {
    const db = this.getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO events 
       (id, title, description, location, startsAt, endsAt, capacity, 
        currentAttendees, waitlistCount, fee, userRSVPStatus, tags, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event.id,
        event.title,
        event.description,
        event.location,
        event.startsAt,
        event.endsAt,
        event.capacity,
        event.currentAttendees,
        event.waitlistCount,
        event.fee,
        event.userRSVPStatus || null,
        event.tags,
        event.updatedAt,
      ]
    );
  }

  /**
   * Check-in queue methods
   */
  async enqueueCheckIn(
    checkIn: Omit<DbCheckInQueue, 'id' | 'createdAt'>
  ): Promise<string> {
    const db = this.getDb();
    const id = `checkin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO checkin_queue 
       (id, serviceId, memberId, checkInTime, isNewBeliever, status, attempts, errorMessage, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        checkIn.serviceId,
        checkIn.memberId,
        checkIn.checkInTime,
        checkIn.isNewBeliever ? 1 : 0,
        checkIn.status,
        checkIn.attempts,
        checkIn.errorMessage || null,
        createdAt,
      ]
    );

    return id;
  }

  async getQueuedCheckIns(): Promise<DbCheckInQueue[]> {
    const db = this.getDb();
    return await db.getAllAsync<DbCheckInQueue>(
      "SELECT * FROM checkin_queue WHERE status = 'queued' ORDER BY createdAt ASC"
    );
  }

  async updateCheckInStatus(
    id: string,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    const db = this.getDb();
    await db.runAsync(
      'UPDATE checkin_queue SET status = ?, errorMessage = ?, attempts = attempts + 1 WHERE id = ?',
      [status, errorMessage || null, id]
    );
  }

  async deleteCheckIn(id: string): Promise<void> {
    const db = this.getDb();
    await db.runAsync('DELETE FROM checkin_queue WHERE id = ?', [id]);
  }

  /**
   * RSVP queue methods
   */
  async enqueueRSVP(
    rsvp: Omit<DbRSVPQueue, 'id' | 'createdAt'>
  ): Promise<string> {
    const db = this.getDb();
    const id = `rsvp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO rsvp_queue 
       (id, eventId, action, status, attempts, errorMessage, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        rsvp.eventId,
        rsvp.action,
        rsvp.status,
        rsvp.attempts,
        rsvp.errorMessage || null,
        createdAt,
      ]
    );

    return id;
  }

  async getQueuedRSVPs(): Promise<DbRSVPQueue[]> {
    const db = this.getDb();
    return await db.getAllAsync<DbRSVPQueue>(
      "SELECT * FROM rsvp_queue WHERE status = 'queued' ORDER BY createdAt ASC"
    );
  }

  async updateRSVPStatus(
    id: string,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    const db = this.getDb();
    await db.runAsync(
      'UPDATE rsvp_queue SET status = ?, errorMessage = ?, attempts = attempts + 1 WHERE id = ?',
      [status, errorMessage || null, id]
    );
  }

  async deleteRSVP(id: string): Promise<void> {
    const db = this.getDb();
    await db.runAsync('DELETE FROM rsvp_queue WHERE id = ?', [id]);
  }

  /**
   * Key-value store methods
   */
  async getValue(key: string): Promise<string | null> {
    const db = this.getDb();
    const result = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM kv WHERE key = ?',
      [key]
    );
    return result?.value || null;
  }

  async setValue(key: string, value: string): Promise<void> {
    const db = this.getDb();
    const updatedAt = new Date().toISOString();
    await db.runAsync(
      'INSERT OR REPLACE INTO kv (key, value, updatedAt) VALUES (?, ?, ?)',
      [key, value, updatedAt]
    );
  }

  async deleteValue(key: string): Promise<void> {
    const db = this.getDb();
    await db.runAsync('DELETE FROM kv WHERE key = ?', [key]);
  }

  /**
   * Database maintenance
   */
  async getQueueCounts(): Promise<{ checkIns: number; rsvps: number }> {
    const db = this.getDb();

    const checkInResult = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM checkin_queue WHERE status = 'queued'"
    );

    const rsvpResult = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM rsvp_queue WHERE status = 'queued'"
    );

    return {
      checkIns: checkInResult?.count || 0,
      rsvps: rsvpResult?.count || 0,
    };
  }

  async clearOldFailedQueue(olderThanDays = 7): Promise<void> {
    const db = this.getDb();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoffIso = cutoffDate.toISOString();

    await db.runAsync(
      "DELETE FROM checkin_queue WHERE status = 'failed' AND createdAt < ?",
      [cutoffIso]
    );

    await db.runAsync(
      "DELETE FROM rsvp_queue WHERE status = 'failed' AND createdAt < ?",
      [cutoffIso]
    );
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.initialized = false;
      console.log('Database connection closed');
    }
  }
}

// Export singleton instance
export const database = new DatabaseManager();

// Export types
export type { DbMember, DbEvent, DbCheckInQueue, DbRSVPQueue, DbKeyValue };

export default database;
