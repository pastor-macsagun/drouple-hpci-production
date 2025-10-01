import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts', './tests/setup/vitest.setup.ts'],
    exclude: [
      'node_modules/**',
      'tests/e2e/**',
      'tests/pathways.spec.ts',
      'e2e/**',
      '.next/**',
      'dist/**',
      'coverage/**',
      '**/*.spec.ts',
    ],
    reporters: process.env.CI 
      ? ['default', 'html', 'json'] 
      : ['default'],
    outputFile: {
      json: 'test-results/vitest-results.json',
      html: 'coverage/html/index.html',
    },
    coverage: {
      enabled: process.env.COVERAGE === 'true',
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json', 'json-summary'],
      reportsDirectory: 'coverage',
      include: [
        'src/**/*.{ts,tsx}',
        'app/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
      ],
      exclude: [
        'node_modules/**',
        'test/**',
        'tests/**',
        'e2e/**',
        '*.config.*',
        '**/*.d.ts',
        '**/*.test.*',
        '**/*.spec.*',
        '**/fixtures/**',
        '**/seed.ts',
        'scripts/**',
        '**/*.stories.*',
        '**/layout.tsx',
        '**/loading.tsx',
        '**/error.tsx',
        '**/not-found.tsx',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
        // Critical modules with stricter thresholds
        'lib/rbac.ts': {
          statements: 90,
          branches: 90,
          functions: 90,
          lines: 90,
        },
        'lib/tenancy.ts': {
          statements: 90,
          branches: 90,
          functions: 90,
          lines: 90,
        },
        'app/events/actions.ts': {
          statements: 85,
          branches: 85,
          functions: 85,
          lines: 85,
        },
        'app/checkin/actions.ts': {
          statements: 85,
          branches: 85,
          functions: 85,
          lines: 85,
        },
        'app/pathways/actions.ts': {
          statements: 85,
          branches: 85,
          functions: 85,
          lines: 85,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      'next/server': path.resolve(__dirname, './node_modules/next/dist/server/web/exports/index.js'),
      '@testing-library/user-event': path.resolve(__dirname, './tests/stubs/user-event.ts'),
    },
  },
})
