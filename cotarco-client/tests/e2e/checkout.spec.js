import { test, expect } from '@playwright/test';

test.describe('Checkout Page', () => {
  test.use({ storageState: 'playwright/.auth/partner.json' });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
    // Before checkout, let's add an item to the cart
    await page.goto('/distribuidores/dashboard');
    
    // 1. Wait for categories and select the "Teste Playwright" category
    const categoriesList = page.getByTestId('categories-list');
    await expect(categoriesList).toBeVisible({ timeout: 30000 });
    const categoryButton = categoriesList.locator('button[data-category-id="999999"]');
    await expect(categoryButton).toBeVisible({ timeout: 15000 });
    await categoryButton.click();
    console.log('Category "Teste Playwright" selected');

    // 2. Wait explicitly for the specific test product to load in the DOM
    const testProduct = page.getByTestId('product-card').filter({ hasText: 'Produto de Teste Playwright' }).first();
    await expect(testProduct).toBeVisible({ timeout: 45000 });
    
    // Guardrail: Ensure price is loaded
    await expect(testProduct.locator('span:has-text("Sob consulta")')).not.toBeVisible({
      message: "Erro: Não é possível prosseguir para checkout com produto 'Sob consulta'."
    });
    
    console.log('Test product visible and valid on dashboard');
    
    // Add product to cart
    await testProduct.getByTestId('add-to-cart-button').first().click();
    console.log('Clicked Adicionar');

    // Wait for the cart to update (badge should appear)
    const cartButton = page.getByTestId('cart-button');
    await expect(cartButton).toContainText(/[1-9]/, { timeout: 15000 });
    console.log('Cart updated with items');
    
    // Open cart drawer
    await page.getByTestId('cart-button').click();
    console.log('Cart drawer opened');
    
    // Click "Finalizar Compra" inside the drawer
    await page.getByTestId('cart-checkout-button').click();
    
    // Wait for navigation to checkout
    await page.waitForURL('**/checkout', { timeout: 60000 });
    console.log('Navigated to checkout');
  });

  test('should fill shipping form and finalize order', async ({ page }) => {
    // Fill in the shipping form
    await expect(page.getByLabel('Endereço')).toBeVisible({ timeout: 25000 });

    await page.getByLabel('Endereço').fill('Rua da Liberdade, 123');
    await page.getByLabel('Cidade').fill('Luanda');
    await page.getByLabel('Telefone').fill('912345678');

    // Click on finalize order
    const finalizeButton = page.getByRole('button', { name: 'Finalizar Encomenda' });
    await expect(finalizeButton).toBeEnabled();
    
    console.log('Clicking finalize order...');
    // Wait for the payment creation request to be sent and accepted
    const [response] = await Promise.all([
      page.waitForResponse(response => 
        response.url().includes('/orders/create-payment') && (response.status() === 202 || response.status() === 201 || response.status() === 200),
        { timeout: 60000 }
      ),
      finalizeButton.click()
    ]);

    console.log('Payment request sent, status:', response.status());

    // The backend might take time to generate references (polling up to 120s in UI)
    await expect(page.getByText('Pagamento Gerado com Sucesso!')).toBeVisible({ timeout: 120000 });
    await expect(page.getByText('Entidade')).toBeVisible();
    await expect(page.getByText('Referência')).toBeVisible();
    console.log('Order finalized successfully');
  });
});
