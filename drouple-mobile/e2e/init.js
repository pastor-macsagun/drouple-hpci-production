/**
 * E2E Test Initialization
 */

const { device, expect } = require('detox');
const adapter = require('detox/runners/jest/adapter');

// Set the default test timeout
jest.setTimeout(300000);

beforeAll(async () => {
  await adapter.beforeAll();
});

beforeEach(async () => {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
});

afterEach(async () => {
  await adapter.afterEach();
});

// Helper functions for E2E tests
global.sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

global.waitForElement = async (element, timeout = 30000) => {
  await waitFor(element).toBeVisible().withTimeout(timeout);
  return element;
};

global.tapAndWait = async (element, waitForElement) => {
  await element.tap();
  if (waitForElement) {
    await waitFor(waitForElement).toBeVisible().withTimeout(10000);
  } else {
    await sleep(1000); // Default wait
  }
};

global.scrollToElement = async (scrollView, element, direction = 'down') => {
  await waitFor(element)
    .toBeVisible()
    .whileElement(by.id(scrollView))
    .scroll(200, direction);
};

global.typeTextAndDismiss = async (element, text) => {
  await element.tap();
  await element.typeText(text);
  if (device.getPlatform() === 'ios') {
    await element.tapReturnKey();
  }
};
