/**
 * Offline-First & Sync Manager E2E Tests
 * Tests delta sync, conflict resolution, and offline-first functionality
 */

import {
  loginAsUser,
  waitForElementToBeVisible,
  takeScreenshot,
} from './setup';

describe('Offline-First & Sync Manager', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await loginAsUser('member');
  });

  describe('Offline Data Access', () => {
    it('should load cached data when offline', async () => {
      // Load data while online
      await element(by.id('tab-events')).tap();
      await waitForElementToBeVisible('events-screen');
      await expect(element(by.text('Youth Night'))).toBeVisible();

      // Go offline
      await device.disableNetwork();

      // Navigate away and back
      await element(by.id('tab-dashboard')).tap();
      await element(by.id('tab-events')).tap();

      // Should still show cached data
      await waitForElementToBeVisible('events-screen');
      await expect(element(by.text('Youth Night'))).toBeVisible();
      await expect(element(by.id('offline-indicator'))).toBeVisible();

      await takeScreenshot('offline-cached-data');

      await device.enableNetwork();
    });

    it('should show offline indicators appropriately', async () => {
      await device.disableNetwork();

      // Should show global offline indicator
      await waitForElementToBeVisible('offline-indicator');

      // Navigate to different screens
      await element(by.id('tab-checkin')).tap();
      await waitForElementToBeVisible('offline-indicator');

      await element(by.id('tab-events')).tap();
      await waitForElementToBeVisible('offline-indicator');

      await takeScreenshot('offline-indicators');

      await device.enableNetwork();
    });
  });

  describe('Queue Management', () => {
    it('should queue actions when offline', async () => {
      await device.disableNetwork();

      // Perform check-in
      await element(by.id('check-in-card')).tap();
      await element(by.id('qr-scanner-button')).tap();
      await device.mockQRCodeScan('drouple://checkin/service-sunday-1');

      // Should queue for sync
      await waitForElementToBeVisible('queued-for-sync');

      // RSVP to event
      await element(by.id('tab-events')).tap();
      await element(by.id('event-youth-night')).tap();
      await element(by.id('rsvp-button')).tap();

      // Should queue RSVP
      await waitForElementToBeVisible('rsvp-queued');

      // Check sync queue
      await element(by.id('tab-more')).tap();
      await element(by.id('sync-status-button')).tap();
      await waitForElementToBeVisible('sync-queue-screen');

      // Should show 2 queued items
      await expect(element(by.text('2 items queued'))).toBeVisible();
      await expect(element(by.text('Check-in'))).toBeVisible();
      await expect(element(by.text('RSVP'))).toBeVisible();

      await takeScreenshot('sync-queue');

      await device.enableNetwork();
    });

    it('should auto-sync when network returns', async () => {
      // Queue items offline
      await device.disableNetwork();

      await element(by.id('check-in-card')).tap();
      await element(by.id('qr-scanner-button')).tap();
      await device.mockQRCodeScan('drouple://checkin/service-sunday-1');
      await waitForElementToBeVisible('queued-for-sync');

      // Enable network
      await device.enableNetwork();

      // Should auto-sync
      await waitForElementToBeVisible('sync-progress');
      await waitForElementToBeVisible('sync-success');
      await expect(element(by.text('1 item synced'))).toBeVisible();

      await takeScreenshot('auto-sync-success');
    });

    it('should handle sync failures with retry', async () => {
      // Queue items offline
      await device.disableNetwork();

      await element(by.id('check-in-card')).tap();
      await element(by.id('qr-scanner-button')).tap();
      await device.mockQRCodeScan('drouple://checkin/invalid-service');
      await waitForElementToBeVisible('queued-for-sync');

      // Enable network with mock server error
      await device.enableNetwork();
      await device.mockServerError();

      // Should show retry notification
      await waitForElementToBeVisible('sync-retry');
      await expect(element(by.text('Sync failed, will retry'))).toBeVisible();

      // Should retry with exponential backoff
      await device.wait(2000); // Wait for first retry
      await waitForElementToBeVisible('sync-retry');

      await takeScreenshot('sync-failure-retry');

      await device.clearServerError();
    });
  });

  describe('Delta Sync', () => {
    it('should perform incremental sync for large datasets', async () => {
      // Mock last sync timestamp
      await device.setLastSyncTime('2024-01-01T00:00:00Z');

      // Enable network and sync
      await element(by.id('tab-more')).tap();
      await element(by.id('sync-now-button')).tap();

      // Should show delta sync progress
      await waitForElementToBeVisible('delta-sync-progress');
      await expect(
        element(by.text('Syncing changes since Jan 1'))
      ).toBeVisible();

      // Should complete successfully
      await waitForElementToBeVisible('sync-complete');
      await expect(element(by.text('5 items updated'))).toBeVisible();

      await takeScreenshot('delta-sync');
    });

    it('should fallback to full sync when delta fails', async () => {
      await device.setLastSyncTime('invalid-timestamp');

      await element(by.id('tab-more')).tap();
      await element(by.id('sync-now-button')).tap();

      // Should fallback to full sync
      await waitForElementToBeVisible('full-sync-progress');
      await expect(element(by.text('Performing full sync'))).toBeVisible();

      await takeScreenshot('full-sync-fallback');
    });
  });

  describe('Conflict Resolution', () => {
    it('should detect and resolve simple conflicts', async () => {
      // Mock conflict scenario
      await device.mockDataConflict({
        type: 'member_profile',
        localVersion: { name: 'John Doe Local' },
        serverVersion: { name: 'John Doe Server' },
      });

      await element(by.id('tab-more')).tap();
      await element(by.id('sync-now-button')).tap();

      // Should show conflict resolution dialog
      await waitForElementToBeVisible('conflict-resolution-modal');
      await expect(element(by.text('Data Conflict Detected'))).toBeVisible();

      // Should show both versions
      await expect(element(by.text('John Doe Local'))).toBeVisible();
      await expect(element(by.text('John Doe Server'))).toBeVisible();

      // Choose server version
      await element(by.id('choose-server-version')).tap();

      // Should resolve conflict
      await waitForElementToBeVisible('conflict-resolved');

      await takeScreenshot('conflict-resolution');
    });

    it('should handle automatic conflict resolution', async () => {
      // Mock auto-resolvable conflict (timestamp-based)
      await device.mockDataConflict({
        type: 'event_rsvp',
        localVersion: {
          status: 'CONFIRMED',
          updatedAt: '2024-01-01T12:00:00Z',
        },
        serverVersion: {
          status: 'CANCELLED',
          updatedAt: '2024-01-01T13:00:00Z',
        },
        autoResolve: 'latest_wins',
      });

      await element(by.id('tab-more')).tap();
      await element(by.id('sync-now-button')).tap();

      // Should auto-resolve without user intervention
      await waitForElementToBeVisible('sync-complete');
      await expect(element(by.text('1 conflict auto-resolved'))).toBeVisible();

      await takeScreenshot('auto-conflict-resolution');
    });
  });

  describe('Bandwidth Optimization', () => {
    it('should compress data for slow connections', async () => {
      await device.setNetworkConditions('3g');

      await element(by.id('tab-more')).tap();
      await element(by.id('sync-now-button')).tap();

      // Should show compression indicator
      await waitForElementToBeVisible('compression-active');
      await expect(
        element(by.text('Optimizing for slow connection'))
      ).toBeVisible();

      await takeScreenshot('bandwidth-optimization');

      await device.setNetworkConditions('wifi');
    });

    it('should defer non-critical syncs on cellular', async () => {
      await device.setNetworkConditions('cellular');

      // Should show cellular warning
      await waitForElementToBeVisible('cellular-warning');
      await expect(element(by.text('Using cellular data'))).toBeVisible();

      // Non-critical sync should be deferred
      await element(by.id('tab-more')).tap();
      await element(by.id('sync-now-button')).tap();

      await waitForElementToBeVisible('sync-deferred');
      await expect(
        element(by.text('Full sync deferred until WiFi'))
      ).toBeVisible();

      await takeScreenshot('cellular-sync-deferred');

      await device.setNetworkConditions('wifi');
    });
  });

  describe('Storage Management', () => {
    it('should manage offline storage limits', async () => {
      // Mock storage near limit
      await device.setStorageUsage(0.9); // 90% full

      await element(by.id('tab-more')).tap();
      await element(by.id('storage-settings-button')).tap();
      await waitForElementToBeVisible('storage-screen');

      // Should show storage warning
      await expect(element(by.text('Storage 90% full'))).toBeVisible();
      await expect(element(by.id('cleanup-suggestions'))).toBeVisible();

      // Should offer cleanup options
      await element(by.id('cleanup-old-data-button')).tap();

      await waitForElementToBeVisible('cleanup-complete');
      await expect(element(by.text('200MB freed'))).toBeVisible();

      await takeScreenshot('storage-management');
    });

    it('should prioritize critical data when storage is low', async () => {
      await device.setStorageUsage(0.95); // 95% full

      // Try to cache new data
      await element(by.id('tab-events')).tap();

      // Should show prioritization message
      await waitForElementToBeVisible('storage-prioritization');
      await expect(
        element(by.text('Prioritizing essential data'))
      ).toBeVisible();

      await takeScreenshot('data-prioritization');
    });
  });

  describe('Sync Status & Monitoring', () => {
    it('should show detailed sync status', async () => {
      await element(by.id('tab-more')).tap();
      await element(by.id('sync-status-button')).tap();
      await waitForElementToBeVisible('sync-status-screen');

      // Should show sync health
      await expect(element(by.text('Sync Status: Healthy'))).toBeVisible();
      await expect(element(by.text('Last sync: 5 minutes ago'))).toBeVisible();
      await expect(element(by.text('Queue: 0 items'))).toBeVisible();

      await takeScreenshot('sync-status');
    });

    it('should show sync history', async () => {
      await element(by.id('tab-more')).tap();
      await element(by.id('sync-status-button')).tap();
      await element(by.id('sync-history-tab')).tap();

      // Should show recent sync attempts
      await expect(element(by.id('sync-history-list'))).toBeVisible();
      await expect(element(by.text('Jan 15, 2024 - Success'))).toBeVisible();
      await expect(element(by.text('Jan 14, 2024 - Failed'))).toBeVisible();

      await takeScreenshot('sync-history');
    });
  });
});
