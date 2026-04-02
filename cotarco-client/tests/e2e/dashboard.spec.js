import { test, expect } from '@playwright/test';

test.describe('Partner Dashboard', () => {
  test.use({ storageState: 'playwright/.auth/partner.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/distribuidores/dashboard');
  });

  test('should display logged in user data', async ({ page }) => {
    await expect(page.locator('text=partner@example.com')).toBeVisible();
  });

  test('should load categories and products', async ({ page }) => {
    // Check for a category button
    await expect(page.getByRole('button', { name: 'Portáteis' })).toBeVisible();
    
    // Check for a product card
    await expect(page.locator('.product-card')).toHaveCount(10); 
  });

  test('should add products to the cart', async ({ page }) => {
    // Find the first product and add it to the cart
    const firstProduct = page.locator('.product-card').first();
    await firstProduct.getByRole('button', { name: 'Adicionar' }).click();

    // Check if the cart count updates
    const cartLink = page.getByRole('link', { name: /Carrinho/ });
    await expect(cartLink).toContainText('Carrinho (1)');

    // Add another product
    const secondProduct = page.locator('.product-card').nth(1);
    await secondProduct.getByRole('button', { name: 'Adicionar' }).click();

    // Check if the cart count updates again
    await expect(cartLink).toContainText('Carrinho (2)');
  });

  test('should interact with pagination', async ({ page }) => {
    // Assuming there are more than 10 products from seeding to trigger pagination
    await expect(page.locator('.product-card')).toHaveCount(10);
    
    // Go to the next page
    await page.getByRole('link', { name: 'Próximo' }).click();

    // Check that the URL has changed
    await expect(page).toHaveURL(/.*page=2/);

    // Check that new products are loaded
    await expect(page.locator('.product-card').first()).toBeVisible();
  });
});
