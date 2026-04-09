import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Register Page', () => {
  const testAlvaraPath = path.join(process.cwd(), 'tests', 'test-alvara.pdf');

  test.beforeEach(async ({ page }) => {
    await page.goto('/distribuidores/register');
  });

  test('should register a new partner successfully', async ({ page }) => {
    // Fill out the form with unique data
    const email = `test-user-${Date.now()}@example.com`;
    
    await page.getByLabel('Nome completo').fill('Test User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Telefone').fill('900000000');
    await page.getByLabel('Nome da Empresa').fill('Test Company Lda');
    
    // Upload Alvará
    await page.setInputFiles('input[id="alvara"]', testAlvaraPath);
    
    await page.getByLabel('Palavra-passe', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirmar palavra-passe').fill('Password123!');

    // Submit the form
    await page.getByRole('button', { name: 'Registar' }).click();

    // Assert that the user is redirected to email verification pending
    await expect(page).toHaveURL(/.*\/email-verification-pending/);
  });

  test('should show an error for existing email', async ({ page }) => {
    // Use an email that is known to exist from seeding
    await page.getByLabel('Nome completo').fill('Existing User');
    await page.getByLabel('Email').fill('marketing@soclima.com');
    await page.getByLabel('Telefone').fill('900000000');
    await page.getByLabel('Nome da Empresa').fill('Existing Company');
    await page.setInputFiles('input[id="alvara"]', testAlvaraPath);

    await page.getByLabel('Palavra-passe', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirmar palavra-passe').fill('Password123!');

    await page.getByRole('button', { name: 'Registar' }).click();

    // Assert that the specific error message from Laravel is displayed
    // We use .first() because the error message appears both at the top and below the field
    await expect(page.locator('text=Este email já está registrado.').first()).toBeVisible();
  });

  test('should show an error for mismatched passwords', async ({ page }) => {
    await page.getByLabel('Nome completo').fill('Test User');
    await page.getByLabel('Email').fill(`test-user-${Date.now()}@example.com`);
    await page.getByLabel('Telefone').fill('900000000');
    await page.getByLabel('Nome da Empresa').fill('Test Company');
    await page.setInputFiles('input[id="alvara"]', testAlvaraPath);

    await page.getByLabel('Palavra-passe', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirmar palavra-passe').fill('Password321!');

    await page.getByRole('button', { name: 'Registar' }).click();

    // Assert that a validation message is shown
    await expect(page.locator('text=As palavras-passe não coincidem')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Registar' }).click();

    // Assert that validation messages for each field are visible
    await expect(page.locator('text=Nome completo é obrigatório')).toBeVisible();
    await expect(page.locator('text=Email é obrigatório')).toBeVisible();
    await expect(page.locator('text=Telefone é obrigatório')).toBeVisible();
    // Use exact match to avoid strict mode violation with "Confirmação da palavra-passe é obrigatória"
    await expect(page.getByText('Palavra-passe é obrigatória', { exact: true })).toBeVisible();
  });
});
