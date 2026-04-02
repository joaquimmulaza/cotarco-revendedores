import { test, expect } from '@playwright/test';

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/distribuidores/register');
  });

  test('should register a new partner successfully', async ({ page }) => {
    // Fill out the form with unique data
    const email = `test-user-${Date.now()}@example.com`;
    await page.getByLabel('Nome').fill('Test User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirmar Password').fill('Password123!');

    // Submit the form
    await page.getByRole('button', { name: 'Criar Conta' }).click();

    // Assert that the user is redirected and a success message is shown
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('text=Bem-vindo')).toBeVisible();
  });

  test('should show an error for existing email', async ({ page }) => {
    // Use an email that is known to exist from seeding
    await page.getByLabel('Nome').fill('Existing User');
    await page.getByLabel('Email').fill('partner@example.com');
    await page.getByLabel('Password', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirmar Password').fill('Password123!');

    await page.getByRole('button', { name: 'Criar Conta' }).click();

    // Assert that an error message is displayed
    await expect(page.locator('text=O email já está em uso')).toBeVisible();
  });

  test('should show an error for mismatched passwords', async ({ page }) => {
    await page.getByLabel('Nome').fill('Test User');
    await page.getByLabel('Email').fill(`test-user-${Date.now()}@example.com`);
    await page.getByLabel('Password', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirmar Password').fill('Password321!');

    await page.getByRole('button', { name: 'Criar Conta' }).click();

    // Assert that a validation message is shown
    await expect(page.locator('text=As passwords não coincidem')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Criar Conta' }).click();

    // Assert that validation messages for each field are visible
    await expect(page.locator('text=O nome é obrigatório')).toBeVisible();
    await expect(page.locator('text=O email é obrigatório')).toBeVisible();
    await expect(page.locator('text=A password é obrigatória')).toBeVisible();
  });
});
