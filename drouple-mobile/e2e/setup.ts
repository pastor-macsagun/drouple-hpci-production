/**
 * E2E Test Setup
 * Global setup for Detox E2E tests
 */

import { beforeAll, beforeEach, afterAll } from '@jest/globals';
import { cleanup, device } from 'detox';

// Global setup
beforeAll(async () => {
  await device.launchApp({
    delete: true, // Delete app data before launch
    permissions: {
      calendar: 'YES',
      camera: 'YES',
      contacts: 'YES',
      location: 'always',
      microphone: 'YES',
      notifications: 'YES',
      photos: 'YES',
    },
  });
});

beforeEach(async () => {
  await device.reloadReactNative();
});

afterAll(async () => {
  await cleanup();
});

// Global helpers for E2E tests
export const waitForElementToBeVisible = async (
  elementId: string,
  timeout = 10000
) => {
  await waitFor(element(by.id(elementId)))
    .toBeVisible()
    .withTimeout(timeout);
};

export const waitForElementToExist = async (
  elementId: string,
  timeout = 10000
) => {
  await waitFor(element(by.id(elementId)))
    .toExist()
    .withTimeout(timeout);
};

export const tapElement = async (elementId: string) => {
  await element(by.id(elementId)).tap();
};

export const typeInElement = async (elementId: string, text: string) => {
  await element(by.id(elementId)).typeText(text);
};

export const scrollToElement = async (
  elementId: string,
  scrollViewId: string
) => {
  await element(by.id(scrollViewId)).scrollTo('bottom');
  await waitForElementToBeVisible(elementId);
};

export const takeScreenshot = async (name: string) => {
  await device.takeScreenshot(name);
};

// Mock user credentials for testing
export const testUsers = {
  superAdmin: {
    email: 'superadmin@test.com',
    password: 'Test123!',
    role: 'SUPER_ADMIN',
  },
  churchAdmin: {
    email: 'admin@manila.test.com',
    password: 'Test123!',
    role: 'CHURCH_ADMIN',
  },
  vip: {
    email: 'vip@manila.test.com',
    password: 'Test123!',
    role: 'VIP',
  },
  leader: {
    email: 'leader@manila.test.com',
    password: 'Test123!',
    role: 'LEADER',
  },
  member: {
    email: 'member@manila.test.com',
    password: 'Test123!',
    role: 'MEMBER',
  },
};

// Login helper function
export const loginAsUser = async (userType: keyof typeof testUsers) => {
  const user = testUsers[userType];

  // Wait for login screen
  await waitForElementToBeVisible('login-screen');

  // Enter credentials
  await element(by.id('email-input')).typeText(user.email);
  await element(by.id('password-input')).typeText(user.password);

  // Tap login button
  await element(by.id('login-button')).tap();

  // Wait for dashboard to load
  await waitForElementToBeVisible('dashboard-screen', 15000);

  // Take screenshot after login
  await takeScreenshot(`logged-in-as-${userType}`);
};

// Logout helper
export const logout = async () => {
  // Navigate to More tab
  await element(by.id('tab-more')).tap();
  await waitForElementToBeVisible('more-screen');

  // Tap logout
  await element(by.id('logout-button')).tap();

  // Confirm logout if modal appears
  try {
    await waitForElementToBeVisible('confirm-logout-button', 2000);
    await element(by.id('confirm-logout-button')).tap();
  } catch (e) {
    // No confirmation modal, continue
  }

  // Wait for login screen
  await waitForElementToBeVisible('login-screen', 10000);
};
