import { test as setup, expect } from '@playwright/test';

const partnerFile = 'playwright/.auth/partner.json';

setup('authenticate as partner', async ({ page }) => {
  await page.goto('/distribuidores/login');
  await page.fill('input[name="email"]', 'marketing@soclima.com');
  await page.fill('input[name="password"]', 'cotarco.2025');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/distribuidores/dashboard');
  await page.context().storageState({ path: partnerFile });
});
