import { test, expect } from '@playwright/test';

test.describe('Checkout Page', () => {
  // This test requires the user to be logged in as a partner
  // and to have items in the cart.
  test.use({ storageState: 'playwright/.auth/partner.json' });

  test.beforeEach(async ({ page }) => {
    // Before checkout, let's add an item to the cart
    await page.goto('/distribuidores/dashboard');
    const firstProduct = page.locator('.product-card').first();
    await firstProduct.getByRole('button', { name: 'Adicionar' }).click();
    await page.getByRole('link', { name: /Carrinho/ }).click();
    await page.waitForURL('**/carrinho');
  });

  test('should fill shipping form and finalize order', async ({ page }) => {
    // Mock the payment API response
    await page.route('**/api/orders/create-payment', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          entity: '90210',
          reference: '123456789',
          amount: '1000'
        }),
      });
    });
    
    // Go to checkout from cart
    await page.getByRole('button', { name: 'Finalizar Compra' }).click();
    await page.waitForURL('**/checkout');

    // Fill in the shipping form
    await page.getByLabel('Morada de Entrega').fill('Rua da Liberdade, 123');
    await page.getByLabel('Cidade').fill('Luanda');
    await page.getByLabel('Telefone').fill('912345678');

    // Finalize the order
    await page.getByRole('button', { name: 'Finalizar Encomenda' }).click();

    // Check for payment success message
    await expect(page.getByRole('heading', { name: 'Pagamento Gerado com Sucesso!' })).toBeVisible();

    // Verify the order details are displayed
    await expect(page.locator('text=Entidade:')).toContainText('90210');
    await expect(page.locator('text=Referência:')).toContainText('123456789');
  });
});
