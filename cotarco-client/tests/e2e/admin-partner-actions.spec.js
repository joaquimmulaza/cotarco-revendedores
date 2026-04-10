import { test, expect } from '@playwright/test';

test.describe('Admin Partner Actions', () => {
  // Configurar para correr em série para evitar conflitos de estado
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/distribuidores/admin/dashboard/partners');
    await expect(page.locator('h3:has-text("Gestão de Parceiros")')).toBeVisible({ timeout: 15000 });
    // Esperar que o carregamento inicial termine
    await page.locator('.react-loading-skeleton').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
  });

  test('should approve a pending partner', async ({ page }) => {
    const partnerName = 'Approve Test Partner';
    
    // 1. Garantir que estamos na tab 'Pendentes'
    await expect(page.getByText(/Pendentes/)).toBeVisible({ timeout: 15000 });
    await page.getByRole('tab', { name: /Pendentes/ }).click();
    
    // Esperar o skeleton aparecer e desaparecer para garantir que a tab mudou e carregou
    await page.waitForTimeout(500);
    await page.locator('.react-loading-skeleton').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});
    
    // 2. Pesquisar o parceiro
    const searchInput = page.getByPlaceholder('Pesquisar por nome, email ou empresa...');
    await searchInput.fill(partnerName);
    
    // Esperar o debounce (500ms) + loading
    await page.waitForTimeout(1000); 
    await page.locator('.react-loading-skeleton').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});
    
    // 3. Localizar o card e agir
    // Usamos um seletor mais robusto que procura a div.border que contém o heading do parceiro
    const partnerCard = page.locator('div.border', { has: page.getByRole('heading', { name: partnerName }) }).first();
    await expect(partnerCard).toBeVisible({ timeout: 15000 });
    
    await partnerCard.locator('button:has-text("Aprovar")').click();
    
    // 4. Confirmar no modal
    const confirmButton = page.locator('div[role="dialog"] button:has-text("Aprovar")');
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();
    
    // 5. Verificar sucesso
    await expect(page.locator('li[data-sonner-toast]').first()).toContainText('sucesso', { timeout: 15000 });
    
    // 6. Verificar que o parceiro saiu da lista
    await page.waitForTimeout(1000);
    await expect(partnerCard).not.toBeVisible({ timeout: 10000 });
  });

  test('should reject a pending partner', async ({ page }) => {
    const partnerName = 'Reject Test Partner';
    
    await expect(page.getByText(/Pendentes/)).toBeVisible({ timeout: 15000 });
    await page.getByRole('tab', { name: /Pendentes/ }).click();
    await page.waitForTimeout(500);
    await page.locator('.react-loading-skeleton').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});
    
    const searchInput = page.getByPlaceholder('Pesquisar por nome, email ou empresa...');
    await searchInput.fill(partnerName);
    
    await page.waitForTimeout(1000);
    await page.locator('.react-loading-skeleton').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});
    
    const partnerCard = page.locator('div.border', { has: page.getByRole('heading', { name: partnerName }) }).first();
    await expect(partnerCard).toBeVisible({ timeout: 15000 });
    
    await partnerCard.locator('button:has-text("Rejeitar")').click();
    
    const confirmButton = page.locator('div[role="dialog"] button:has-text("Rejeitar")');
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();
    
    await expect(page.locator('li[data-sonner-toast]').first()).toContainText('sucesso', { timeout: 15000 });
  });

  test('should deactivate an active partner', async ({ page }) => {
    const partnerName = 'Deactivate Test Partner';
    
    await expect(page.getByText(/Ativos/)).toBeVisible({ timeout: 15000 });
    await page.getByRole('tab', { name: /Ativos/ }).click();
    await page.waitForTimeout(500);
    await page.locator('.react-loading-skeleton').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});
    
    const searchInput = page.getByPlaceholder('Pesquisar por nome, email ou empresa...');
    await searchInput.fill(partnerName);
    
    await page.waitForTimeout(1000);
    await page.locator('.react-loading-skeleton').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});
    
    const partnerCard = page.locator('div.border', { has: page.getByRole('heading', { name: partnerName }) }).first();
    await expect(partnerCard).toBeVisible({ timeout: 15000 });
    
    await partnerCard.locator('button:has-text("Desativar")').click();
    
    const confirmButton = page.locator('div[role="dialog"] button:has-text("Desativar")');
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();
    
    await expect(page.locator('li[data-sonner-toast]').first()).toContainText('sucesso', { timeout: 15000 });
  });
});
