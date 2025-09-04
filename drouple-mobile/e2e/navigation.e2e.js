/**
 * Navigation & Role-based Gating E2E Tests
 */

const { device, expect, element, by, waitFor } = require('detox');

describe('Navigation and Role Gating', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should show correct tabs for MEMBER role', async () => {
    // Login as member
    await waitFor(element(by.testID('login-screen')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.testID('email-input')).typeText('member@drouple.com');
    await element(by.testID('password-input')).typeText('TestPassword123!');
    await element(by.testID('login-button')).tap();

    await waitFor(element(by.testID('dashboard-screen')))
      .toBeVisible()
      .withTimeout(15000);

    // Check that member can see basic tabs
    await expect(element(by.testID('home-tab'))).toBeVisible();
    await expect(element(by.testID('checkin-tab'))).toBeVisible();
    await expect(element(by.testID('events-tab'))).toBeVisible();
    await expect(element(by.testID('members-tab'))).toBeVisible();
    await expect(element(by.testID('more-tab'))).toBeVisible();
  });

  it('should navigate between all tabs successfully', async () => {
    // Home tab (already active)
    await expect(element(by.testID('dashboard-screen'))).toBeVisible();

    // Check-in tab
    await element(by.testID('checkin-tab')).tap();
    await waitFor(element(by.testID('checkin-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Events tab
    await element(by.testID('events-tab')).tap();
    await waitFor(element(by.testID('events-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Members tab
    await element(by.testID('members-tab')).tap();
    await waitFor(element(by.testID('members-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // More tab
    await element(by.testID('more-tab')).tap();
    await waitFor(element(by.testID('more-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Back to home
    await element(by.testID('home-tab')).tap();
    await waitFor(element(by.testID('dashboard-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
