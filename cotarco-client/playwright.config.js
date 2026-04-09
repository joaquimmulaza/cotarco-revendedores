import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global.setup.js',
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: true,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },

  webServer: [
    {
      command: 'php artisan serve --port=8001 --env=testing',
      url: 'http://127.0.0.1:8001/api/test',
      timeout: 120 * 1000,
      reuseExistingServer: true,
      cwd: 'c:/cotarco-revendedores/cotarco-api'
    },
    {
      command: 'npx cross-env VITE_API_URL=http://127.0.0.1:8001/api npm run dev -- --host 127.0.0.1 --port 5173',
      url: 'http://127.0.0.1:5173/distribuidores/',
      timeout: 120 * 1000,
      reuseExistingServer: true,
      cwd: 'c:/cotarco-revendedores/cotarco-client'
    },
  ],

  projects: [
    // Setup projects
    {
      name: 'setup', 
      testMatch: /auth\.setup\.js/ 
    },
    {
      name: 'admin-setup',
      testMatch: /admin\.auth\.setup\.js/
    },

    // Test projects
    {
      name: 'partner-tests',
      testDir: './tests/e2e',
      testIgnore: /.*admin.*\.spec\.js/,
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/partner.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'admin-tests',
      testDir: './tests/e2e',
      testMatch: /.*admin.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['admin-setup'],
    },
  ],
});
