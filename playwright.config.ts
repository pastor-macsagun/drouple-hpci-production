import { defineConfig, devices } from '@playwright/test';

const PLAYWRIGHT_HOST = process.env.PLAYWRIGHT_HOST ?? '127.0.0.1';
const PLAYWRIGHT_PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const PLAYWRIGHT_BASE_URL = `http://${PLAYWRIGHT_HOST}:${PLAYWRIGHT_PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0, // No retries locally, 2 retries in CI
  workers: process.env.CI ? 1 : 2, // Allow 2 workers locally for speed
  reporter: process.env.CI 
    ? [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']]
    : [['html', { outputFolder: 'playwright-report', open: 'on-failure' }]],
  globalSetup: './e2e/global-setup.ts',
  
  // Increased timeout configuration for accessibility and navigation tests
  timeout: 120_000, // 2 minutes per test (increased from 30s for axe-core scans)
  expect: {
    timeout: 20_000, // 20s for expect assertions (increased from 8s for stability)
    // Visual regression settings
    toHaveScreenshot: { maxDiffPixelRatio: 0.2 },
    // Update screenshots with `npx playwright test --update-snapshots`
  },
  
  use: {
    baseURL: PLAYWRIGHT_BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    testIdAttribute: 'data-testid',
    
    // Improved stability settings for complex tests
    actionTimeout: 15_000, // 15s for actions (increased from 10s)
    navigationTimeout: 30_000, // 30s for navigations (increased from 20s)
    
    // Viewport for consistency
    viewport: { width: 1280, height: 720 },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Mobile tests for PWA
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // Visual regression tests
    {
      name: 'visual-regression',
      testDir: './tests/visual',
      use: {
        ...devices['Pixel 5'],
        // Specific settings for visual tests
        colorScheme: 'light',
      },
    },

    // PWA-specific tests
    {
      name: 'pwa-tests',
      testMatch: '**/pwa*.spec.ts',
      use: {
        ...devices['Pixel 5'],
        // Enable service worker for PWA tests
        serviceWorkers: 'allow',
      },
    }
  ],

  webServer: {
    command: `npm run dev -- --hostname ${PLAYWRIGHT_HOST} --port ${PLAYWRIGHT_PORT}`,
    url: PLAYWRIGHT_BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  
  outputDir: 'test-results/',
});
