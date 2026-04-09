import { test, expect } from '@playwright/test';

test.describe('Email Verification Pages Static Content', () => {
  test('should display the email verification pending page correctly', async ({ page }) => {
    await page.goto('/distribuidores/email-verification-pending');

    await expect(page.getByRole('heading', { name: /verifique o seu e-mail/i })).toBeVisible();
    await expect(page.getByText(/Enviámos um link de verificação/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Voltar ao login/i })).toBeVisible();
  });

  test('should display the email validated page correctly', async ({ page }) => {
    await page.goto('/distribuidores/email-validated');

    await expect(page.getByRole('heading', { name: /Email validado com sucesso/i })).toBeVisible();
    await expect(page.getByText(/aprovação pela nossa equipa/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Voltar ao login/i })).toBeVisible();
  });

  test('should display the email verification error page correctly', async ({ page }) => {
    await page.goto('/distribuidores/email-verification-error');

    await expect(page.getByRole('heading', { name: /Erro na Verificação de Email/i })).toBeVisible();
    await expect(page.getByText(/erro durante a verificação/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Ir para Login/i })).toBeVisible();
  });
});
