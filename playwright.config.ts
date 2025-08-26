import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI 
    ? [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']]
    : [['html', { outputFolder: 'playwright-report', open: 'on-failure' }]],
  globalSetup: './e2e/global-setup.ts',
  
  // Timeout configuration
  timeout: 30000, // 30s per test
  expect: {
    timeout: 5000, // 5s for expect assertions
  },
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    testIdAttribute: 'data-testid',
    
    // Additional stability settings
    actionTimeout: 10000, // 10s for actions
    navigationTimeout: 30000, // 30s for navigations
    
    // Viewport for consistency
    viewport: { width: 1280, height: 720 },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  
  outputDir: 'test-results/',
});