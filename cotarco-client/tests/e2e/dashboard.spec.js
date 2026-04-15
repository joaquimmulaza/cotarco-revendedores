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
    
    // The category buttons are now explicitly tagged
    const categoriesList = page.getByTestId('categories-list');
    await expect(categoriesList).toBeVisible({ timeout: 30000 });
    
    const categoryButton = categoriesList.locator('button[data-category-id="999999"]');
    await expect(categoryButton).toBeVisible({ timeout: 15000 });
    await categoryButton.click();
    console.log('Category "Teste Playwright" clicked for generic product test');
    console.log('Category clicked');

    const productCards = page.locator('.product-card');
    await expect(productCards.first()).toBeVisible({ timeout: 30000 });
    
    const count = await productCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should add product to cart', async ({ page }) => {
    // 1. Select the "Teste Playwright" category
    const categoriesList = page.getByTestId('categories-list');
    await expect(categoriesList).toBeVisible({ timeout: 30000 });
    const categoryButton = categoriesList.locator('button[data-category-id="999999"]');
    await expect(categoryButton).toBeVisible({ timeout: 15000 });
    await categoryButton.click();
    // Wait for the button to reflect the active state (CSS class or data attribute)
    await expect(categoryButton).toHaveAttribute('data-active', 'true', { timeout: 10000 });
    console.log('Category "Teste Playwright" selected and active in dashboard');

    // 2. Wait explicitly for the specific test product to become visible
    const testProduct = page.locator('.product-card', { hasText: 'Produto de Teste Playwright' }).first();
    await expect(testProduct).toBeVisible({ timeout: 45000 });
    console.log('Test product visible in dashboard');

    // Click "Adicionar"
    await testProduct.getByRole('button', { name: /Adicionar/i }).click();
    console.log('Clicked Adicionar in dashboard');

    // Wait for cart to update
    const cartButton = page.getByRole('button', { name: 'Abrir carrinho' });
    await expect(cartButton).toContainText(/[1-9]/, { timeout: 15000 });
    console.log('Cart updated in dashboard');

    // Open cart
    await cartButton.click();

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
