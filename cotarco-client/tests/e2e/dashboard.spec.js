import { test, expect } from '@playwright/test';

test.describe('Partner Dashboard (Overview de Métricas)', () => {
  test.use({ storageState: 'playwright/.auth/partner.json' });

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
    });
    await page.goto('/distribuidores/dashboard');
    // Aguardar que os skeletons desapareçam
    await page.locator('.react-loading-skeleton').waitFor({ state: 'detached', timeout: 30000 }).catch(() => {});
  });

  test('should display logged in user data', async ({ page }) => {
    await expect(page.getByText(/Joaquim Mulaza|marketing@soclima.com/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('should render metric cards on dashboard', async ({ page }) => {
    // Os cards de métricas do PartnerDashboardOverview devem estar visíveis
    const metricCards = page.getByTestId('partner-metric-card');
    await expect(metricCards.first()).toBeVisible({ timeout: 20000 });
    const count = await metricCards.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('should NOT render product catalog on dashboard', async ({ page }) => {
    // A listagem de produtos já não existe nesta rota
    await expect(page.getByTestId('categories-list')).not.toBeVisible({ timeout: 5000 }).catch(() => {});
    await expect(page.getByTestId('product-card').first()).not.toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('should navigate to catalog via sidebar link', async ({ page }) => {
    const catalogLink = page.getByTestId('sidebar-nav-catalog');
    await expect(catalogLink).toBeVisible({ timeout: 10000 });
    await catalogLink.click();
    await expect(page).toHaveURL(/\/catalog/, { timeout: 10000 });
    // Catálogo deve renderizar
    await expect(page.getByTestId('categories-list')).toBeVisible({ timeout: 30000 });
  });
  test('should render the recent orders table at the bottom', async ({ page }) => {
    const ordersTable = page.getByTestId('partner-orders-table');
    await expect(ordersTable).toBeVisible({ timeout: 15000 });
    await expect(ordersTable.getByText('Últimas Encomendas')).toBeVisible();
  });
});
