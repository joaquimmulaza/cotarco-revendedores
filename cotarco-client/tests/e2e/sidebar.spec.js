import { test, expect } from '@playwright/test';

test.describe('Sidebar Component (Partner Context)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the root, which the Partner Layout should wrap
    await page.goto('/distribuidores/dashboard');
    await page.evaluate(() => window.localStorage.removeItem('sidebar:state'));
    await page.reload();
  });

  test('should render the sidebar with Partner navigation items', async ({ page }) => {
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar).toBeVisible();

    // Specific Partner Items
    await expect(page.locator('a', { hasText: 'Início' })).toBeVisible();
    await expect(page.locator('a', { hasText: 'Histórico' })).toBeVisible();

    // Should NOT have Admin elements
    await expect(page.locator('a', { hasText: 'Estatísticas' })).not.toBeVisible();
    await expect(page.locator('a', { hasText: 'Produtos' })).not.toBeVisible();
  });

  test('should toggle expanded and collapsed states and persist to localStorage', async ({ page }) => {
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    const trigger = page.locator('[data-sidebar="trigger"]').first();
    
    // Initially, it should be expanded on Desktop
    await expect(sidebar).toHaveAttribute('data-state', 'expanded');
    
    // Toggle to collapse
    await trigger.click();
    await expect(sidebar).toHaveAttribute('data-state', 'collapsed');

    // Check localStorage
    const sidebarState = await page.evaluate(() => window.localStorage.getItem('sidebar:state'));
    expect(sidebarState).toBe('false');

    // Toggle back to expand
    await trigger.click();
    await expect(sidebar).toHaveAttribute('data-state', 'expanded');
    
    const sidebarStateExpanded = await page.evaluate(() => window.localStorage.getItem('sidebar:state'));
    expect(sidebarStateExpanded).toBe('true');
  });

  test('should highlight the active navigation link', async ({ page }) => {
    // Assuming / translates to Início or Dashboard for Partner
    const activeLink = page.locator('a[data-active="true"]');
    await expect(activeLink).toBeVisible();
    await expect(activeLink).toContainText('Início');
  });
});
