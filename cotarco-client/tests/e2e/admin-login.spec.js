import { test, expect } from '@playwright/test';

test.describe('Admin Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/distribuidores/admin/login', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[name="email"]');
  });

  test('should login successfully with admin credentials and redirect', async ({ page }) => {
    // Credenciais correspondem ao AdminUserSeeder.php
    await page.fill('input[name="email"]', 'joaquimmulazadev@gmail.com');
    await page.fill('input[name="password"]', 'cotarco.2025');
    await page.getByTestId('admin-login-submit').click();

    // Esperar redirecionamento para o admin dashboard
    await expect(page).toHaveURL(/.*\/admin\/dashboard/);
    await expect(page.getByTestId('breadcrumb-page')).toBeVisible();
  });

  test('should fail login with non-admin credentials', async ({ page }) => {
    // Parceiro de teste do TestPartnerSeeder.php (não é admin)
    await page.fill('input[name="email"]', 'marketing@soclima.com');
    await page.fill('input[name="password"]', 'cotarco.2025');
    await page.getByTestId('admin-login-submit').click();

    // Esperar mensagem de "Acesso negado" (match parcial - AdminLogin.jsx linha 140)
    const errorMessage = page.locator('text=Acesso negado');
    await expect(errorMessage).toBeVisible();
    // Não deve redirecionar
    await expect(page).not.toHaveURL(/.*\/admin\/dashboard/);
  });

  test('should fail login with invalid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', 'joaquimmulazadev@gmail.com');
    await page.fill('input[name="password"]', 'password-errada-123');
    await page.getByTestId('admin-login-submit').click();

    // Mensagem real do AdminLogin.jsx pode ser "Email ou palavra-passe incorretos." ou vinda do backend "Credenciais inválidas."
    const errorAlert = page.locator('div:has-text("incorretos"), div:has-text("inválidas")').last();
    await expect(errorAlert).toBeVisible({ timeout: 30000 });
    
    await expect(page).not.toHaveURL(/.*\/admin\/dashboard/);
  });
});
