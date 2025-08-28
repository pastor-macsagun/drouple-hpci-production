import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Allow 1 retry locally for flaky auth
  workers: process.env.CI ? 1 : 2, // Allow 2 workers locally for speed
  reporter: process.env.CI 
    ? [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']]
    : [['html', { outputFolder: 'playwright-report', open: 'on-failure' }]],
  globalSetup: './e2e/global-setup.ts',
  
  // Optimized timeout configuration for reliable auth flows
  timeout: 30000, // 30s per test (reduced from 45s with better auth logic)
  expect: {
    timeout: 8000, // 8s for expect assertions (increased for stability)
  },
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    testIdAttribute: 'data-testid',
    
    // Optimized stability settings for faster auth flows
    actionTimeout: 10000, // 10s for actions (reduced with better selectors)
    navigationTimeout: 20000, // 20s for navigations (reduced with retry logic)
    
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
