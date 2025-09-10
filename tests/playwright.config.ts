import { defineConfig, devices } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'https://app.drouple.app';
const DATE = new Date().toISOString().split('T')[0];

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // PWA tests should run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: `artifacts/PWA-AUDIT-${DATE}/playwright-report` }],
    ['json', { outputFile: `artifacts/PWA-AUDIT-${DATE}/test-results.json` }]
  ],
  use: {
    baseURL: APP_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  outputDir: `artifacts/PWA-AUDIT-${DATE}/test-results/`,
  
  projects: [
    {
      name: 'iPhone 16 Pro',
      use: {
        ...devices['iPhone 14 Pro'], // Closest available device
        viewport: { width: 393, height: 852 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'Pixel 8',
      use: {
        ...devices['Pixel 5'], // Closest available device
        viewport: { width: 412, height: 915 },
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        deviceScaleFactor: 2.625,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});