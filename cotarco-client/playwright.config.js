import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global.setup.js',
  fullyParallel: true,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:5174',
    trace: 'retain-on-failure',
  },

  webServer: [
    {
      command: 'php artisan serve --port=8001 --env=testing',
      url: 'http://127.0.0.1:8001/api/test',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      cwd: 'c:/cotarco-revendedores/cotarco-api'
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5174',
      url: 'http://127.0.0.1:5174/distribuidores/',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
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
