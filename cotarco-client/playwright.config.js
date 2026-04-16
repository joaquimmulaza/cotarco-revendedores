import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global.setup.js',
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  workers: 1,
  retries: 2,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },

  webServer: [
    {
      command: 'npx cross-env APP_ENV=testing DB_DATABASE=cotarco_revendedores_test php artisan serve --port=8001',
      reuseExistingServer: false,
      cwd: 'c:/cotarco-revendedores/cotarco-api',
      env: {
        APP_ENV: 'testing',
        DB_DATABASE: 'cotarco_revendedores_test'
      }
    },
    {
      command: 'npx cross-env VITE_API_URL=http://127.0.0.1:8001/api VITE_API_PORT=8001 npm run dev -- --host 127.0.0.1 --port 5173',
      reuseExistingServer: false,
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
      testIgnore: /.*admin.*\.spec\.[jt]s/,
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/partner.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'admin-tests',
      testDir: './tests/e2e',
      testMatch: /.*admin.*\.spec\.[jt]s/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup', 'admin-setup'],
    },
  ],
});
