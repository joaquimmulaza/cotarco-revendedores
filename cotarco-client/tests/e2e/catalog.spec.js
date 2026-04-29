import { test, expect } from '@playwright/test';

test.describe('Partner Catalog Page (/catalog)', () => {
  test.use({ storageState: 'playwright/.auth/partner.json' });

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
    });
    page.on('response', resp => {
      if (resp.url().includes('/api/')) console.log('FETCH API:', resp.url(), resp.status());
    });
    await page.goto('/distribuidores/catalog');
    await page.locator('.react-loading-skeleton').waitFor({ state: 'detached', timeout: 30000 }).catch(() => {});
  });

  test('should load categories and products', async ({ page }) => {
    const categoriesList = page.getByTestId('categories-list');
    await expect(categoriesList).toBeVisible({ timeout: 30000 });

    const categoryButton = categoriesList.locator('button[data-category-id="999999"]');
    await expect(categoryButton).toBeVisible({ timeout: 15000 });
    await categoryButton.click();

    const productCards = page.getByTestId('product-card');
    await expect(productCards.first()).toBeVisible({ timeout: 30000 });

    const testProduct = page.getByTestId('product-card').filter({ hasText: 'Produto de Teste Playwright' }).first();
    if (await testProduct.isVisible()) {
      await expect(testProduct.locator('span:has-text("Sob consulta")')).not.toBeVisible({
        message: "Erro: O Produto de Teste Playwright está 'Sob consulta'. Verifique o stock no backend."
      });
    }

    const count = await productCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should add product to cart', async ({ page }) => {
    const categoriesList = page.getByTestId('categories-list');
    await expect(categoriesList).toBeVisible({ timeout: 30000 });
    const categoryButton = categoriesList.locator('button[data-category-id="999999"]');
    await expect(categoryButton).toBeVisible({ timeout: 15000 });
    await categoryButton.click();
    await expect(categoryButton).toHaveAttribute('data-active', 'true', { timeout: 10000 });

    const testProduct = page.getByTestId('product-card').filter({ hasText: 'Produto de Teste Playwright' }).first();
    await expect(testProduct).toBeVisible({ timeout: 45000 });
    await expect(testProduct.locator('span:has-text("Sob consulta")')).not.toBeVisible({
      message: "Impedimento: Não é possível testar o carrinho com produto 'Sob consulta'."
    });

    await testProduct.getByTestId('add-to-cart-button').click();

    const cartButton = page.getByTestId('cart-button');
    await expect(cartButton).toContainText(/[1-9]/, { timeout: 15000 });

    await cartButton.click();
    await expect(page.getByText('Meu Carrinho de Compras')).toBeVisible();
    await expect(page.locator('.flex.items-center.gap-3.border-b.pb-3').first()).toBeVisible();
  });

  test('should navigate through pages', async ({ page }) => {
    await expect(page.getByTestId('product-card').first()).toBeVisible({ timeout: 30000 });

    const nextButton = page.getByRole('button', { name: 'Próximo' });
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await expect(page.getByTestId('product-card').first()).toBeVisible();
    }
  });
});
