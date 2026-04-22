import { test, expect } from '@playwright/test';

test.describe('Sidebar Component (Admin Context)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the root or specialized admin route, relying on the Admin Layout
    await page.goto('/distribuidores/admin/dashboard');
    await page.evaluate(() => window.localStorage.setItem('sidebar:state', 'true'));
    await page.reload();
  });

  test('should render the sidebar with official logo and Admin items', async ({ page }) => {
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar).toBeVisible();

    // Official Logo Check - one of the logos (full or icon) should be visible
    const logo = sidebar.locator('img[alt="Cotarco"]').filter({ visible: true });
    await expect(logo).toBeVisible();

    // Specific Admin Items
    const expectedItems = ["Home", "Parceiros", "Catálogo", "Stocks", "Encomendas", "Definições"];
    for (const item of expectedItems) {
      await expect(sidebar.locator('a', { hasText: item })).toBeVisible();
    }

    // Should NOT have Partner specific elements
    await expect(page.locator('a', { hasText: 'Histórico' })).not.toBeVisible();
    await expect(page.locator('a', { hasText: 'O Meu Perfil' })).not.toBeVisible();
  });

  test('should toggle expanded/collapsed states and persist in Admin context', async ({ page }) => {
    // The data-state is on the div that is a peer of the sidebar content wrapper
    const sidebarContainer = page.locator('[data-state][data-collapsible]').first();
    const trigger = page.locator('[data-sidebar="trigger"]').first();
    
    // Ensure it is visible and loaded
    await expect(sidebarContainer).toBeVisible();

    // On Desktop, should start as expanded
    await expect(sidebarContainer).toHaveAttribute('data-state', 'expanded');

    await trigger.click();
    await expect(sidebarContainer).toHaveAttribute('data-state', 'collapsed');

    // Verify label is hidden in collapsed state
    await expect(page.locator('span', { hasText: 'Home' })).toBeHidden();

    // LocalStorage validation
    let sidebarState = await page.evaluate(() => window.localStorage.getItem('sidebar:state'));
    expect(sidebarState).toBe('false');

    // Reload the page and ensure it stays collapsed
    await page.reload();
    await expect(sidebarContainer).toHaveAttribute('data-state', 'collapsed');

    // Toggle back to expanded
    await trigger.click();
    await expect(sidebarContainer).toHaveAttribute('data-state', 'expanded');
    sidebarState = await page.evaluate(() => window.localStorage.getItem('sidebar:state'));
    expect(sidebarState).toBe('true');
  });
});
