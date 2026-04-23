import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Analytics', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to dashboard since auth is handled by setup
    await page.goto('/distribuidores/admin/dashboard');
  });

  test('should display accurate metrics in the dashboard', async ({ page }) => {
    await page.goto('/distribuidores/admin/dashboard');

    // Check for the metrics cards
    const metricsGrid = page.locator('[data-testid="metrics-grid"]');
    await expect(metricsGrid).toBeVisible();

    // Check for specific labels
    await expect(metricsGrid.locator('text=Receita Total')).toBeVisible();
    await expect(metricsGrid.locator('text=Total de Encomendas')).toBeVisible();
    await expect(metricsGrid.locator('text=Ticket Médio (AOV)')).toBeVisible();

    // Check for currency symbols in at least one of the metrics
    await expect(metricsGrid.locator('text=Kz').first()).toBeVisible();
  });
});
