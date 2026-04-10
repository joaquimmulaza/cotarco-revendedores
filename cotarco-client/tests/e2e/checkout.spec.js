import { test, expect } from '@playwright/test';

test.describe('Checkout Page', () => {
  test.use({ storageState: 'playwright/.auth/partner.json' });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
    // Before checkout, let's add an item to the cart
    await page.goto('/distribuidores/dashboard');
    
    // Wait for products to load
    const firstProduct = page.locator('.product-card').first();
    await expect(firstProduct).toBeVisible({ timeout: 25000 });
    
    // Add product to cart
    await firstProduct.getByRole('button', { name: /Adicionar/i }).first().click();
    
    // Open cart drawer
    await page.getByRole('button', { name: 'Abrir carrinho' }).click();
    
    // Click "Finalizar Compra" inside the drawer
    await page.getByRole('button', { name: 'Finalizar Compra' }).click();
    
    // Wait for navigation to checkout
    await page.waitForURL('**/checkout', { timeout: 25000 });
  });

  test('should fill shipping form and finalize order', async ({ page }) => {
    // Fill in the shipping form
    await expect(page.getByLabel('Endereço')).toBeVisible({ timeout: 25000 });

    await page.getByLabel('Endereço').fill('Rua da Liberdade, 123');
    await page.getByLabel('Cidade').fill('Luanda');
    await page.getByLabel('Telefone').fill('912345678');

    // Click on finalize order
    const finalizeButton = page.getByRole('button', { name: 'Finalizar Encomenda' });
    
    // Wait for the payment creation request to be sent and accepted
    const [response] = await Promise.all([
      page.waitForResponse(response => 
        response.url().includes('/orders/create-payment') && response.status() === 202,
        { timeout: 30000 }
      ),
      finalizeButton.click()
    ]);

    // The backend might take time to generate references (polling up to 120s in UI)
    await expect(page.getByText('Pagamento Gerado com Sucesso!')).toBeVisible({ timeout: 100000 });
    await expect(page.getByText('Entidade')).toBeVisible();
    await expect(page.getByText('Referência')).toBeVisible();
  });
});
