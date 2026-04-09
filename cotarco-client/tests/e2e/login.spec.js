import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  // Executar sem estado de autenticação guardado (limpar sessão para conseguir testar o login)
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/distribuidores/login');
  });

  test('should login successfully and redirect to dashboard', async ({ page }) => {
    await page.fill('input[name="email"]', 'marketing@soclima.com');
    await page.fill('input[name="password"]', 'cotarco.2025');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 30000 });
    await expect(page.getByText('Categorias')).toBeVisible();
  });

  test('should show an error message with invalid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    const errorMessage = page.locator('text=Credenciais inválidas.');
    await expect(errorMessage).toBeVisible({ timeout: 30000 });
  });
});
