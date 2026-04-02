import { test, expect } from '@playwright/test';

test.describe('Email Verification Pages Static Content', () => {
  test('should display the email verification pending page correctly', async ({ page }) => {
    await page.goto('/distribuidores/email-verification-pending');

    await expect(page.getByRole('heading', { name: 'Por favor, verifique o seu e-mail' })).toBeVisible();
    await expect(page.getByText('Enviámos um link de verificação para o endereço indicado.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Voltar ao login' })).toBeVisible();
  });

  test('should display the email validated page correctly', async ({ page }) => {
    await page.goto('/distribuidores/email-validated');

    await expect(page.getByRole('heading', { name: 'Email validado com sucesso!' })).toBeVisible();
    await expect(page.getByText('A sua conta está agora em fase de aprovação pela nossa equipa.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ir para o Dashboard' })).toBeVisible();
  });

  test('should display the email verification error page correctly', async ({ page }) => {
    await page.goto('/distribuidores/email-verification-error');

    await expect(page.getByRole('heading', { name: 'Ocorreu um erro' })).toBeVisible();
    await expect(page.getByText('Não foi possível validar o seu email.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Tentar Novamente' })).toBeVisible();
  });
});
