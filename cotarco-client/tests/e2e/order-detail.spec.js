import { test, expect } from '@playwright/test';

test.describe('Admin Order Detail Page', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    // This assumes there is at least one order from the seeders.
    await page.goto('/distribuidores/admin/dashboard/orders');
    // Click the link for the first order in the table.
    await page.locator('tbody tr').first().getByRole('link').click();
    await page.waitForURL('**/admin/dashboard/orders/**');
  });

  test('should display customer and product information', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Detalhes da Encomenda' })).toBeVisible();

    // Check for customer info
    await expect(page.getByRole('heading', { name: 'Cliente' })).toBeVisible();
    await expect(page.locator('text=Nome:')).toBeVisible();
    await expect(page.locator('text=Email:')).toBeVisible();

    // Check for order items
    await expect(page.getByRole('heading', { name: 'Itens da Encomenda' })).toBeVisible();
    await expect(page.locator('tbody tr').first()).toBeVisible(); // Check for at least one product row
  });

  test('should download the invoice', async ({ page }) => {
    // Start waiting for the download
    const downloadPromise = page.waitForEvent('download');
    
    // Click the download button
    await page.getByRole('button', { name: 'Baixar Fatura' }).click();
    
    // Wait for the download to complete
    const download = await downloadPromise;

    // Assert that the download is successful
    expect(download.suggestedFilename()).toContain('.pdf');
  });
});
