import { test, expect } from '@playwright/test';

test.describe('Admin Order Detail Page', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    // This assumes there is at least one order from the seeders.
    await page.goto('/distribuidores/admin/dashboard/orders');
    
    // Wait for the table to be loaded and have at least one valid row (order ID starts with #)
    // If it says "Nenhuma encomenda encontrada.", this locator will timeout here rather than waiting for navigation
    const firstRow = page.locator('tbody tr:has(td:text-matches("#"))').first();
    await expect(firstRow).toBeVisible({ timeout: 20000 });
    
    // Click the second cell (Order ID) instead of the whole row to avoid clicking the checkbox
    const idCell = firstRow.locator('td').nth(1);
    await idCell.click({ delay: 100 });
    
    // Wait for the URL to contain the order detail path
    await page.waitForURL(/\/admin\/dashboard\/orders\/[a-zA-Z0-9-]+/, { timeout: 35000 });
    
    // Wait for the detail page to load by checking for its specific header
    await expect(page.getByTestId('order-details-heading')).toBeVisible({ timeout: 25000 });
  });

  test('should display customer and product information', async ({ page }) => {
    // Check for customer section
    await expect(page.getByText('Cliente', { exact: true })).toBeVisible();
    
    // Check for customer info (values instead of labels)
    // We expect the email to at least be present (regex for email pattern)
    await expect(page.locator('text=/^[^\s@]+@[^\s@]+\.[^\s@]+$/').or(page.locator('text=@')).first()).toBeVisible(); 

    // Check for order items
    await expect(page.getByText(/Itens da Encomenda/i)).toBeVisible();
    await expect(page.locator('table tbody tr').first()).toBeVisible(); // Check for at least one product row
  });

  test('should download the invoice', async ({ page }) => {
    // Start waiting for the download
    const downloadPromise = page.waitForEvent('download');
    
    // Click the download button (using the data-testid or text)
    await page.getByRole('button', { name: 'Baixar Fatura' }).click();
    
    // Wait for the download to complete
    const download = await downloadPromise;

    // Assert that the download is successful
    expect(download.suggestedFilename()).toContain('.pdf');
  });
});
