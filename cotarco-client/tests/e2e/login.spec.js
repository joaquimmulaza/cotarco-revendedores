import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/distribuidores/login');
  });

  test('should login successfully and redirect to dashboard', async ({ page }) => {
    await page.fill('input[name="email"]', 'marketing@soclima.com');
    await page.fill('input[name="password"]', 'cotarco.2025');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test('should show an error message with invalid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    const errorMessage = page.locator('text=Credenciais inválidas.');
    await expect(errorMessage).toBeVisible();
  });
});
