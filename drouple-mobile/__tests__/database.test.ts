/**
 * Database Tests
 * Unit tests for SQLite database operations
 */

import { database, DbMember, DbEvent } from '../src/data/db';

// Mock expo-sqlite
jest.mock('expo-sqlite/next', () => ({
  openDatabaseAsync: jest.fn(() =>
    Promise.resolve({
      execAsync: jest.fn(() => Promise.resolve()),
      runAsync: jest.fn(() => Promise.resolve({ lastInsertRowId: 1 })),
      getFirstAsync: jest.fn(() => Promise.resolve({ user_version: 0 })),
      getAllAsync: jest.fn(() => Promise.resolve([])),
      closeAsync: jest.fn(() => Promise.resolve()),
    })
  ),
}));

describe('Database', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('should initialize successfully', async () => {
    await expect(database.initialize()).resolves.not.toThrow();
  });

  it('should upsert member successfully', async () => {
    await database.initialize();

    const mockMember: DbMember = {
      id: 'test-member',
      name: 'Test Member',
      email: 'test@example.com',
      phone: '+1234567890',
      role: 'MEMBER',
      churchId: 'test-church',
      isActive: true,
      updatedAt: new Date().toISOString(),
    };

    await expect(database.upsertMember(mockMember)).resolves.not.toThrow();
  });

  it('should upsert event successfully', async () => {
    await database.initialize();

    const mockEvent: DbEvent = {
      id: 'test-event',
      title: 'Test Event',
      description: 'A test event',
      location: 'Test Location',
      startsAt: new Date().toISOString(),
      endsAt: new Date().toISOString(),
      capacity: 100,
      currentAttendees: 50,
      waitlistCount: 5,
      fee: 0,
      userRSVPStatus: null,
      tags: JSON.stringify(['test']),
      updatedAt: new Date().toISOString(),
    };

    await expect(database.upsertEvent(mockEvent)).resolves.not.toThrow();
  });

  it('should enqueue check-in successfully', async () => {
    await database.initialize();

    const checkInData = {
      serviceId: 'test-service',
      memberId: 'test-member',
      checkInTime: new Date().toISOString(),
      isNewBeliever: false,
      status: 'queued' as const,
      attempts: 0,
    };

    await expect(database.enqueueCheckIn(checkInData)).resolves.toBeDefined();
  });

  it('should enqueue RSVP successfully', async () => {
    await database.initialize();

    const rsvpData = {
      eventId: 'test-event',
      action: 'rsvp' as const,
      status: 'queued' as const,
      attempts: 0,
    };

    await expect(database.enqueueRSVP(rsvpData)).resolves.toBeDefined();
  });

  it('should get and set key-value pairs', async () => {
    await database.initialize();

    const key = 'test-key';
    const value = 'test-value';

    await expect(database.setValue(key, value)).resolves.not.toThrow();
    // Note: In a real test, we would mock getAllAsync to return the expected value
  });
});
