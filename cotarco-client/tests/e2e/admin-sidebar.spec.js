import { test, expect } from '@playwright/test';

test.describe('Sidebar Component (Admin Context)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the root or specialized admin route, relying on the Admin Layout
    await page.goto('/distribuidores/admin/dashboard');
    await page.evaluate(() => window.localStorage.removeItem('sidebar:state'));
    await page.reload();
  });

  test('should render the sidebar with Admin navigation items', async ({ page }) => {
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar).toBeVisible();

    // Specific Admin Items
    await expect(page.locator('a', { hasText: 'Estatísticas' })).toBeVisible();
    await expect(page.locator('a', { hasText: 'Produtos' })).toBeVisible();
    await expect(page.locator('a', { hasText: 'Parceiros' })).toBeVisible();

    // Should NOT have Partner specific elements except common ones if defined
    // Wait, "Início" or "Histórico" might not be in Admin or might be under different names. Let's assert what definitely shouldn't be there.
    await expect(page.locator('a', { hasText: 'Histórico' })).not.toBeVisible();
  });

  test('should toggle expanded/collapsed states and persist in Admin context', async ({ page }) => {
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    const trigger = page.locator('[data-sidebar="trigger"]').first();
    
    // Ensure it is visible and loaded
    await expect(sidebar).toBeVisible();

    // On Desktop, should start as expanded
    await expect(sidebar).toHaveAttribute('data-state', 'expanded');

    await trigger.click();
    await expect(sidebar).toHaveAttribute('data-state', 'collapsed');

    // LocalStorage validation
    let sidebarState = await page.evaluate(() => window.localStorage.getItem('sidebar:state'));
    expect(sidebarState).toBe('false');

    // Reload the page and ensure it stays collapsed
    await page.reload();
    await expect(sidebar).toHaveAttribute('data-state', 'collapsed');

    // Clean up to return to expanded
    await trigger.click();
    await expect(sidebar).toHaveAttribute('data-state', 'expanded');
    sidebarState = await page.evaluate(() => window.localStorage.getItem('sidebar:state'));
    expect(sidebarState).toBe('true');
  });
});
