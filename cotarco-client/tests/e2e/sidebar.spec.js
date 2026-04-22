import { test, expect } from '@playwright/test';

test.describe('Sidebar Component (Partner Context)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the root, which the Partner Layout should wrap
    await page.goto('/distribuidores/dashboard');
    await page.evaluate(() => window.localStorage.setItem('sidebar:state', 'true'));
    await page.reload();
  });

  test('should render the sidebar with official logo and Partner items', async ({ page }) => {
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar).toBeVisible();

    // Official Logo Check - one of the logos (full or icon) should be visible
    const logo = sidebar.locator('img[alt="Cotarco"]').filter({ visible: true });
    await expect(logo).toBeVisible();

    // Specific Partner Items
    const expectedItems = ["Início", "Histórico", "O Meu Perfil"];
    for (const item of expectedItems) {
      await expect(sidebar.locator('a', { hasText: item })).toBeVisible();
    }

    // Should NOT have Admin elements
    await expect(page.locator('a', { hasText: 'Parceiros' })).not.toBeVisible();
    await expect(page.locator('a', { hasText: 'Stocks' })).not.toBeVisible();
  });

  test('should toggle expanded and collapsed states and persist to localStorage', async ({ page }) => {
    const sidebarContainer = page.locator('[data-state][data-collapsible]').first();
    const trigger = page.locator('[data-sidebar="trigger"]').first();
    
    // Initially, it should be expanded based on our beforeEach
    await expect(sidebarContainer).toHaveAttribute('data-state', 'expanded');
    
    // Toggle to collapse
    await trigger.click();
    await expect(sidebarContainer).toHaveAttribute('data-state', 'collapsed');

    // Verify label is hidden in collapsed state
    await expect(page.locator('span', { hasText: 'Início' })).toBeHidden();

    // Check localStorage - it should be 'false' now
    const sidebarState = await page.evaluate(() => window.localStorage.getItem('sidebar:state'));
    expect(sidebarState).toBe('false');

    // Toggle back to expand
    await trigger.click();
    const finalState = await page.evaluate(() => window.localStorage.getItem('sidebar:state'));
    expect(finalState).toBe('true');
  });

  test('should highlight the active navigation link correctly', async ({ page }) => {
    // Navigate specifically to check highlight
    await page.goto('/distribuidores/dashboard');
    
    // In our new sidebar, Início points to /catalog (which maps to Dashboard) 
    // but the URL remains /distribuidores/dashboard if navigated there directly.
    // However, if we navigate to /distribuidores/catalog, it should definitely be active.
    await page.goto('/distribuidores/catalog');
    
    const activeLink = page.locator('button[data-active="true"], a[data-active="true"]').first();
    await expect(activeLink).toBeVisible();
    
    // It should be either Início or Comprar (both point to /catalog)
    const text = await activeLink.textContent();
    expect(["Início"]).toContain(text?.trim());
  });
});
