import { test, expect } from '@playwright/test';

test.describe('Partner Dashboard', () => {
  test.use({ storageState: 'playwright/.auth/partner.json' });

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
    });
    page.on('response', resp => {
      if (resp.url().includes('/api/')) console.log('FETCH API:', resp.url(), resp.status());
    });
    await page.goto('/distribuidores/dashboard');
  });

  test('should display logged in user data', async ({ page }) => {
    // Fix: use .first() to avoid strict mode violation if both name and email are present
    await expect(page.getByText(/Joaquim Mulaza|marketing@soclima.com/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('should load categories and products', async ({ page }) => {
    await expect(page.getByText('Categorias')).toBeVisible({ timeout: 15000 });
    
    // The category buttons are usually in a white shadow container
    const categoryButtons = page.locator('.bg-white.shadow button');
    await expect(categoryButtons.first()).toBeVisible({ timeout: 20000 });
    
    // Click a category and check for products
    await categoryButtons.first().click();

    const productCards = page.locator('.product-card');
    await expect(productCards.first()).toBeVisible({ timeout: 30000 });
    
    const count = await productCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should add product to cart', async ({ page }) => {
    // Wait for products
    const productCard = page.locator('.product-card').first();
    await expect(productCard).toBeVisible({ timeout: 30000 });

    // Click "Adicionar"
    await productCard.getByRole('button', { name: /Adicionar/i }).click();

    // Open cart
    await page.getByRole('button', { name: 'Abrir carrinho' }).click();

    // Verify
    await expect(page.getByText('Meu Carrinho de Compras')).toBeVisible();
    await expect(page.locator('.flex.items-center.gap-3.border-b.pb-3').first()).toBeVisible();
  });

  test('should navigate through pages', async ({ page }) => {
    await expect(page.locator('.product-card').first()).toBeVisible({ timeout: 30000 });
    
    const nextButton = page.getByRole('button', { name: 'Próximo' });
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await expect(page.locator('.product-card').first()).toBeVisible();
    }
  });
});
