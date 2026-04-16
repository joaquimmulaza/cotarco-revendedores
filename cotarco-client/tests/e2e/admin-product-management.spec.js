import { test, expect } from '@playwright/test';
import { PRODUCT_TEST_DATA } from './helpers/productData';

const adminState = 'playwright/.auth/admin.json';

test.describe('Admin Product Management', () => {
  test.use({ storageState: adminState });

  test.beforeEach(async ({ page }) => {
    // Navigate to Product List
    await page.goto('/distribuidores/admin/dashboard/product-list');
    // Ensure the skeleton or loading is gone and the table is visible
    await expect(page.getByRole('heading', { name: 'Produtos' })).toBeVisible();
  });

  test('should list products and show categories', async ({ page }) => {
    // Check if table carries rows
    const rows = page.locator('data-testid=product-row');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
    
    // Check categories listbox
    const listbox = page.getByRole('button', { name: /Todas as Categorias/i });
    await expect(listbox).toBeVisible();
  });

  test('should search products with debounce', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Pesquisar produtos/i);
    
    // Prepare for response
    const responsePromise = page.waitForResponse(resp => 
      resp.url().includes('/admin/products') && resp.status() === 200
    );

    await searchInput.fill(PRODUCT_TEST_DATA.SKU_PARENT);
    
    // Wait for the debounced network call
    await responsePromise;

    // Verify only the parent SKU is visible
    const productRow = page.locator(`[data-sku="${PRODUCT_TEST_DATA.SKU_PARENT}"]`);
    await expect(productRow).toBeVisible();
    
    // Ensure others are hidden (or simply check count if it's unique)
    const rowsCount = await page.locator('data-testid=product-row').count();
    expect(rowsCount).toBe(1);

    // Clear search
    const clearButton = page.getByLabel('Limpar pesquisa');
    if (await clearButton.isVisible()) {
      await clearButton.click();
    } else {
      await searchInput.fill('');
    }
    
    await expect(page.locator('data-testid=product-row').first()).toBeVisible();
  });

  test('should filter by category and test pagination', async ({ page }) => {
    // 1. Filter by Category 1
    const listbox = page.getByRole('button', { name: /Todas as Categorias/i });
    await listbox.click();
    
    const categoryOption = page.getByRole('option', { name: PRODUCT_TEST_DATA.CAT_1_NAME });
    await categoryOption.click();

    // Wait for filtered response
    await page.waitForResponse(resp => 
      resp.url().includes('category_id=') && resp.status() === 200
    );

    // Check first product SKU starts with prefix
    const firstRow = page.locator('data-testid=product-row').first();
    await expect(firstRow).toBeVisible();
    const sku = await firstRow.getAttribute('data-sku');
    expect(sku.startsWith(PRODUCT_TEST_DATA.SKU_SIMPLE_CAT1_PREFIX) || sku === PRODUCT_TEST_DATA.SKU_PARENT).toBeTruthy();

    // 2. Test Pagination (Page 2)
    const nextPage = page.getByRole('button', { name: 'Próxima' });
    await expect(nextPage).toBeEnabled();
    
    const paginationResponse = page.waitForResponse(resp => 
      resp.url().includes('page=2') && resp.status() === 200
    );
    await nextPage.click();
    await paginationResponse;

    await expect(page.getByText(/Página 2 de/i)).toBeVisible();
    
    // Ensure we are still in Category 1 context (check a row in page 2)
    const p2FirstRow = page.locator('data-testid=product-row').first();
    const p2Sku = await p2FirstRow.getAttribute('data-sku');
    expect(p2Sku.startsWith(PRODUCT_TEST_DATA.SKU_SIMPLE_CAT1_PREFIX)).toBeTruthy();
  });

  test('should expand product variations', async ({ page }) => {
    // Search for the parent first to be sure it's on screen
    const searchInput = page.getByPlaceholder(/Pesquisar produtos/i);
    await searchInput.fill(PRODUCT_TEST_DATA.SKU_PARENT);
    await page.waitForResponse(resp => resp.url().includes('/admin/products'));

    const parentRow = page.locator(`[data-sku="${PRODUCT_TEST_DATA.SKU_PARENT}"]`);
    await expect(parentRow).toBeVisible();

    // Click expander icon
    const expander = parentRow.locator('button').first(); // The first button in the column id: expander
    await expander.click();

    // Verify variation table appears
    await expect(page.getByText('Variações do Produto')).toBeVisible();
    await expect(page.getByText(PRODUCT_TEST_DATA.SKU_CHILD_1)).toBeVisible();
    await expect(page.getByText(PRODUCT_TEST_DATA.SKU_CHILD_2)).toBeVisible();
  });

  test('should show empty state for non-existent products', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Pesquisar produtos/i);
    
    const responsePromise = page.waitForResponse(resp => 
      resp.url().includes('/admin/products') && resp.status() === 200
    );

    await searchInput.fill(PRODUCT_TEST_DATA.NON_EXISTENT_SKU);
    await responsePromise;

    await expect(page.getByText('Sem produtos para mostrar.')).toBeVisible();
  });
});
