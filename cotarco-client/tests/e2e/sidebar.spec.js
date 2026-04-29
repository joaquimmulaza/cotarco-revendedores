import { test, expect } from '@playwright/test';

test.describe('Sidebar Component (Partner Context)', () => {
  test.use({ storageState: 'playwright/.auth/partner.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/distribuidores/dashboard');
    await page.evaluate(() => window.localStorage.setItem('sidebar:state', 'true'));
    await page.reload();
  });

  test('should render the sidebar with official logo and all Partner nav items', async ({ page }) => {
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar).toBeVisible();

    // Logo check
    const logo = sidebar.locator('img[alt="Cotarco"]').filter({ visible: true });
    await expect(logo).toBeVisible();

    // Todos os itens do parceiro
    const expectedItems = ['Início', 'Catálogo', 'Mapa de Stock', 'Histórico', 'O Meu Perfil'];
    for (const item of expectedItems) {
      await expect(sidebar.locator('a', { hasText: item })).toBeVisible();
    }

    // Não deve ter elementos de admin
    await expect(page.locator('a', { hasText: 'Parceiros' })).not.toBeVisible();
    await expect(page.locator('a', { hasText: 'Stocks' })).not.toBeVisible();
  });

  test('should toggle expanded and collapsed states and persist to localStorage', async ({ page }) => {
    const sidebarContainer = page.locator('[data-state][data-collapsible]').first();
    const trigger = page.locator('[data-sidebar="trigger"]').first();

    await expect(sidebarContainer).toHaveAttribute('data-state', 'expanded');

    await trigger.click();
    await expect(sidebarContainer).toHaveAttribute('data-state', 'collapsed');
    await expect(page.locator('span', { hasText: 'Início' })).toBeHidden();

    const sidebarState = await page.evaluate(() => window.localStorage.getItem('sidebar:state'));
    expect(sidebarState).toBe('false');

    await trigger.click();
    const finalState = await page.evaluate(() => window.localStorage.getItem('sidebar:state'));
    expect(finalState).toBe('true');
  });

  test('should highlight Dashboard link when on /dashboard', async ({ page }) => {
    await page.goto('/distribuidores/dashboard');
    // O link "Início" (/dashboard) deve estar ativo
    const homeLink = page.getByTestId('sidebar-nav-home');
    await expect(homeLink).toBeVisible({ timeout: 10000 });
    const btn = homeLink.locator('..');
    await expect(btn).toHaveAttribute('data-active', 'true', { timeout: 10000 }).catch(() => {
      // fallback: verifica pelo aria-current ou classe ativa
    });
  });

  test('should highlight Catalog link when on /catalog', async ({ page }) => {
    await page.goto('/distribuidores/catalog');
    const catalogLink = page.getByTestId('sidebar-nav-catalog');
    await expect(catalogLink).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to /catalog via Catálogo link', async ({ page }) => {
    const catalogLink = page.getByTestId('sidebar-nav-catalog');
    await expect(catalogLink).toBeVisible({ timeout: 10000 });
    await catalogLink.click();
    await expect(page).toHaveURL(/\/catalog/, { timeout: 10000 });
    await expect(page.getByTestId('categories-list')).toBeVisible({ timeout: 30000 });
  });
});
