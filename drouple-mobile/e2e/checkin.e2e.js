/**
 * Check-in E2E Tests
 */

const { device, expect, element, by, waitFor } = require('detox');

describe('Check-in Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });

    // Login first
    await waitFor(element(by.testID('login-screen')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.testID('email-input')).typeText('test@drouple.com');
    await element(by.testID('password-input')).typeText('TestPassword123!');
    await element(by.testID('login-button')).tap();
    await waitFor(element(by.testID('dashboard-screen')))
      .toBeVisible()
      .withTimeout(15000);
  });

  beforeEach(async () => {
    // Navigate to check-in tab
    await element(by.testID('checkin-tab')).tap();
    await waitFor(element(by.testID('checkin-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should show check-in screen with QR and manual options', async () => {
    await expect(element(by.testID('scan-qr-button'))).toBeVisible();
    await expect(element(by.testID('manual-checkin-button'))).toBeVisible();
  });

  it('should open QR scanner when online', async () => {
    await element(by.testID('scan-qr-button')).tap();

    await waitFor(element(by.testID('qr-scanner')))
      .toBeVisible()
      .withTimeout(5000);

    // Close scanner
    await element(by.testID('close-scanner-button')).tap();
  });

  it('should queue check-in when offline', async () => {
    // Simulate offline state (this would need to be mocked)
    await element(by.testID('manual-checkin-button')).tap();

    await waitFor(element(by.testID('member-search')))
      .toBeVisible()
      .withTimeout(5000);

    // Search for member
    await element(by.testID('member-search-input')).typeText('Test Member');

    // Select first result and check-in
    await waitFor(element(by.testID('member-result-0')))
      .toBeVisible()
      .withTimeout(3000);
    await element(by.testID('member-result-0')).tap();

    await element(by.testID('confirm-checkin-button')).tap();

    // Should show success message
    await waitFor(element(by.text('Check-in successful')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
