import { test, expect } from '@playwright/test';

test.describe('Email Verification Pages Static Content', () => {
  test('should display the email verification pending page correctly', async ({ page }) => {
    await page.goto('/distribuidores/email-verification-pending');

    // Root cause: the DOM heading is an <h2> with the full text "Por favor, verifique o seu e-mail".
    // Pinning level: 2 avoids ambiguous role matches across all heading levels.
    // The explicit timeout gives React time to mount the component in the SPA shell.
    await expect(
      page.getByRole('heading', { name: /verifique o seu e-mail/i, level: 2 })
    ).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/Enviámos um link de verificação/i)).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('link', { name: /Voltar ao login/i })).toBeVisible({ timeout: 20000 });
  });

  test('should display the email validated page correctly', async ({ page }) => {
    await page.goto('/distribuidores/email-validated');

    await expect(
      page.getByRole('heading', { name: /Email validado com sucesso/i, level: 2 })
    ).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/aprovação pela nossa equipa/i)).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('link', { name: /Voltar ao login/i })).toBeVisible({ timeout: 20000 });
  });

  test('should display the email verification error page correctly', async ({ page }) => {
    await page.goto('/distribuidores/email-verification-error');

    await expect(
      page.getByRole('heading', { name: /Erro na Verificação de Email/i, level: 2 })
    ).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/erro durante a verificação/i)).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('link', { name: /Ir para Login/i })).toBeVisible({ timeout: 20000 });
  });
});
