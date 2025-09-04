/**
 * Check-In System E2E Tests
 * Tests QR scanning, manual check-in, offline queue, and sync
 */

import {
  loginAsUser,
  waitForElementToBeVisible,
  takeScreenshot,
  tapElement,
} from './setup';

describe('Check-In System', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await loginAsUser('member');
  });

  describe('QR Code Check-In', () => {
    it('should successfully check-in with QR code scanning', async () => {
      // Navigate to check-in
      await element(by.id('check-in-card')).tap();
      await waitForElementToBeVisible('checkin-screen');

      // Start QR scanner
      await element(by.id('qr-scanner-button')).tap();
      await waitForElementToBeVisible('qr-scanner');

      // Grant camera permission
      await device.grantPermissions(['camera']);

      // Mock QR code scan
      await device.mockQRCodeScan('drouple://checkin/service-sunday-1');

      // Should show success message
      await waitForElementToBeVisible('checkin-success');
      await expect(element(by.text('Check-in successful!'))).toBeVisible();

      await takeScreenshot('qr-checkin-success');
    });

    it('should handle invalid QR codes', async () => {
      await element(by.id('check-in-card')).tap();
      await waitForElementToBeVisible('checkin-screen');

      await element(by.id('qr-scanner-button')).tap();
      await waitForElementToBeVisible('qr-scanner');

      // Mock invalid QR code
      await device.mockQRCodeScan('invalid-qr-code');

      // Should show error
      await waitForElementToBeVisible('checkin-error');
      await expect(element(by.text('Invalid QR code'))).toBeVisible();

      await takeScreenshot('invalid-qr-code');
    });

    it('should prompt for camera permission', async () => {
      await element(by.id('check-in-card')).tap();
      await waitForElementToBeVisible('checkin-screen');

      // Deny camera permission first
      await device.denyPermissions(['camera']);

      await element(by.id('qr-scanner-button')).tap();

      // Should show permission prompt
      await waitForElementToBeVisible('camera-permission-prompt');
      await expect(
        element(by.text('Camera permission required'))
      ).toBeVisible();

      await takeScreenshot('camera-permission-prompt');
    });
  });

  describe('Manual Check-In', () => {
    it('should allow manual service selection', async () => {
      await element(by.id('check-in-card')).tap();
      await waitForElementToBeVisible('checkin-screen');

      // Switch to manual mode
      await element(by.id('manual-checkin-tab')).tap();

      // Select service
      await element(by.id('service-selector')).tap();
      await waitForElementToBeVisible('service-list');

      await element(by.id('service-sunday-1')).tap();

      // Confirm check-in
      await element(by.id('confirm-checkin-button')).tap();

      // Should show success
      await waitForElementToBeVisible('checkin-success');

      await takeScreenshot('manual-checkin-success');
    });

    it('should prevent duplicate check-ins', async () => {
      // Check-in first time
      await element(by.id('check-in-card')).tap();
      await element(by.id('manual-checkin-tab')).tap();
      await element(by.id('service-selector')).tap();
      await element(by.id('service-sunday-1')).tap();
      await element(by.id('confirm-checkin-button')).tap();

      // Wait for success
      await waitForElementToBeVisible('checkin-success');

      // Navigate back and try again
      await element(by.id('back-button')).tap();
      await element(by.id('check-in-card')).tap();
      await element(by.id('manual-checkin-tab')).tap();
      await element(by.id('service-selector')).tap();
      await element(by.id('service-sunday-1')).tap();
      await element(by.id('confirm-checkin-button')).tap();

      // Should show duplicate error
      await waitForElementToBeVisible('duplicate-checkin-error');
      await expect(element(by.text('Already checked in'))).toBeVisible();

      await takeScreenshot('duplicate-checkin-error');
    });
  });

  describe('Offline Check-In', () => {
    it('should queue check-in when offline', async () => {
      // Disable network
      await device.disableNetwork();

      await element(by.id('check-in-card')).tap();
      await waitForElementToBeVisible('checkin-screen');

      // Should show offline indicator
      await waitForElementToBeVisible('offline-indicator');

      // Attempt check-in
      await element(by.id('qr-scanner-button')).tap();
      await device.mockQRCodeScan('drouple://checkin/service-sunday-1');

      // Should queue for sync
      await waitForElementToBeVisible('queued-for-sync');
      await expect(element(by.text('Queued for sync'))).toBeVisible();

      await takeScreenshot('offline-checkin-queued');

      await device.enableNetwork();
    });

    it('should sync queued check-ins when back online', async () => {
      // Queue check-in offline first
      await device.disableNetwork();
      await element(by.id('check-in-card')).tap();
      await element(by.id('qr-scanner-button')).tap();
      await device.mockQRCodeScan('drouple://checkin/service-sunday-1');

      await waitForElementToBeVisible('queued-for-sync');

      // Enable network
      await device.enableNetwork();

      // Should auto-sync
      await waitForElementToBeVisible('sync-success');
      await expect(element(by.text('1 check-in synced'))).toBeVisible();

      await takeScreenshot('checkin-sync-success');
    });
  });

  describe('Check-In History', () => {
    it('should display check-in history', async () => {
      await element(by.id('check-in-card')).tap();
      await waitForElementToBeVisible('checkin-screen');

      // Navigate to history tab
      await element(by.id('history-tab')).tap();
      await waitForElementToBeVisible('checkin-history');

      // Should show previous check-ins
      await expect(element(by.id('checkin-history-list'))).toBeVisible();

      await takeScreenshot('checkin-history');
    });
  });

  describe('Service Status', () => {
    it('should show live attendance count', async () => {
      await element(by.id('check-in-card')).tap();
      await waitForElementToBeVisible('checkin-screen');

      // Should show real-time count
      await expect(element(by.id('attendance-count'))).toBeVisible();
      await expect(element(by.text(/\d+ attendees/))).toBeVisible();

      await takeScreenshot('live-attendance');
    });

    it('should show service status (active/inactive)', async () => {
      await element(by.id('check-in-card')).tap();
      await waitForElementToBeVisible('checkin-screen');

      await element(by.id('manual-checkin-tab')).tap();

      // Should show service status chips
      await expect(element(by.id('service-status-active'))).toBeVisible();

      await takeScreenshot('service-status');
    });
  });

  describe('Accessibility', () => {
    it('should announce check-in success to screen readers', async () => {
      await element(by.id('check-in-card')).tap();
      await element(by.id('qr-scanner-button')).tap();
      await device.mockQRCodeScan('drouple://checkin/service-sunday-1');

      // Should have accessibility announcement
      await waitForElementToBeVisible('checkin-success');
      const successElement = element(by.id('checkin-success'));

      await expect(successElement).toHaveAccessibilityRole('alert');
      await expect(successElement).toHaveAccessibilityLabel(
        'Check-in successful for Sunday Service'
      );

      await takeScreenshot('checkin-accessibility');
    });
  });
});
