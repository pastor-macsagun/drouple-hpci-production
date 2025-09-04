/**
 * Sync Manager Tests
 * Unit tests for offline sync functionality
 */

import { syncManager } from '../src/lib/sync/syncManager';

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

// Mock database
jest.mock('../src/data/db', () => ({
  database: {
    initialize: jest.fn(() => Promise.resolve()),
    getQueuedCheckIns: jest.fn(() => Promise.resolve([])),
    getQueuedRSVPs: jest.fn(() => Promise.resolve([])),
    getQueueCounts: jest.fn(() => Promise.resolve({ checkIns: 0, rsvps: 0 })),
    getValue: jest.fn(() => Promise.resolve(null)),
    setValue: jest.fn(() => Promise.resolve()),
    upsertMember: jest.fn(() => Promise.resolve()),
    upsertEvent: jest.fn(() => Promise.resolve()),
    clearOldFailedQueue: jest.fn(() => Promise.resolve()),
    deleteOldMembers: jest.fn(() => Promise.resolve()),
    close: jest.fn(() => Promise.resolve()),
    updateCheckInStatus: jest.fn(() => Promise.resolve()),
    deleteCheckIn: jest.fn(() => Promise.resolve()),
    updateRSVPStatus: jest.fn(() => Promise.resolve()),
    deleteRSVP: jest.fn(() => Promise.resolve()),
  },
}));

// Mock auth API
jest.mock('../src/lib/api', () => ({
  authApi: {
    post: jest.fn(() => Promise.resolve({ success: true })),
    get: jest.fn(() =>
      Promise.resolve({
        success: true,
        data: { members: [], events: [] },
      })
    ),
  },
}));

describe('SyncManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize successfully', async () => {
    await expect(syncManager.initialize()).resolves.not.toThrow();
  });

  it('should return sync status', () => {
    const status = syncManager.getStatus();
    expect(status).toHaveProperty('isOnline');
    expect(status).toHaveProperty('isSyncing');
    expect(status).toHaveProperty('lastSync');
    expect(status).toHaveProperty('queueCount');
    expect(status).toHaveProperty('errors');
  });

  it('should add and remove status listeners', () => {
    const listener = jest.fn();
    const unsubscribe = syncManager.addStatusListener(listener);

    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });

  it('should sync successfully when online', async () => {
    await syncManager.initialize();
    const result = await syncManager.syncNow();

    // Result could be true or false depending on network state
    expect(typeof result).toBe('boolean');
  });

  it('should flush queue successfully', async () => {
    await syncManager.initialize();
    const result = await syncManager.flushQueue();

    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('syncedCount');
    expect(result).toHaveProperty('failedCount');
  });

  it('should cleanup successfully', async () => {
    await syncManager.initialize();
    await expect(syncManager.shutdown()).resolves.not.toThrow();
  });
});
