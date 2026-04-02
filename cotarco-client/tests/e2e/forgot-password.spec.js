import { test, expect } from '@playwright/test';

test.describe('Forgot Password Page', () => {
  test('should allow a user to request a password reset', async ({ page }) => {
    await page.goto('/distribuidores/forgot-password');

    // Use the email of the seeded partner user
    await page.getByLabel('Email').fill('partner@example.com');
    await page.getByRole('button', { name: 'Enviar Link de Redefinição' }).click();

    // Check for the success message
    await expect(page.getByRole('heading', { name: 'Email Enviado' })).toBeVisible();
    await expect(page.getByText('Se o e-mail existir em nossa base, enviamos um link de redefinição.')).toBeVisible();

    // Check for the link to go back to login
    await expect(page.getByRole('link', { name: 'Voltar ao Login' })).toBeVisible();
  });
});
