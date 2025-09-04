/**
 * Authentication E2E Tests
 */

const { device, expect, element, by, waitFor } = require('detox');

describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show login screen on app launch', async () => {
    await waitFor(element(by.testID('login-screen')))
      .toBeVisible()
      .withTimeout(10000);

    await expect(element(by.testID('email-input'))).toBeVisible();
    await expect(element(by.testID('password-input'))).toBeVisible();
    await expect(element(by.testID('login-button'))).toBeVisible();
  });

  it('should successfully login with valid credentials', async () => {
    await element(by.testID('email-input')).typeText('test@drouple.com');
    await element(by.testID('password-input')).typeText('TestPassword123!');
    await element(by.testID('login-button')).tap();

    // Should navigate to dashboard
    await waitFor(element(by.testID('dashboard-screen')))
      .toBeVisible()
      .withTimeout(15000);

    await expect(element(by.testID('home-tab'))).toBeVisible();
  });

  it('should show error with invalid credentials', async () => {
    await element(by.testID('email-input')).typeText('invalid@drouple.com');
    await element(by.testID('password-input')).typeText('wrongpassword');
    await element(by.testID('login-button')).tap();

    // Should show error message
    await waitFor(element(by.text('Invalid credentials')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
