import { test, expect } from '@playwright/test';

test.describe('Admin Partner Edit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/distribuidores/admin/dashboard/partners');
    await expect(page.locator('h3:has-text("Gestão de Parceiros")')).toBeVisible({ timeout: 15000 });
    // Esperar um pouco para estabilização inicial
    await page.locator('.react-loading-skeleton').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
  });

  test('should edit partner profiles', async ({ page }) => {
    const partnerName = 'Edit Test Partner';
    
    // 1. Mudar para a tab 'Ativos'
    await expect(page.getByText(/Ativos/)).toBeVisible({ timeout: 15000 });
    await page.getByRole('tab', { name: /Ativos/ }).click();
    await page.waitForTimeout(500);
    await page.locator('.react-loading-skeleton').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});
    
    // 2. Pesquisar o parceiro
    const searchInput = page.getByPlaceholder('Pesquisar por nome, email ou empresa...');
    await searchInput.fill(partnerName);
    
    // Esperar o debouncedSearchTerm (500ms) + loading
    await page.waitForTimeout(1000);
    await page.locator('.react-loading-skeleton').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});
    
    // 3. Localizar o card e abrir modal
    const partnerCard = page.locator('div.border, div.rounded-lg').filter({ has: page.locator('h4', { hasText: partnerName }) }).first();
    await expect(partnerCard).toBeVisible({ timeout: 15000 });
    
    await partnerCard.locator('button:has-text("Editar")').click();
    
    // 4. Verificar modal e editar
    // Usar regex para ser flexível com o título que contém o nome do parceiro
    const modalTitle = page.getByText(/Editar Parceiro:/);
    await expect(modalTitle).toBeVisible({ timeout: 15000 });
    
    const modal = page.locator('div[role="dialog"]');
    const businessModelSelect = modal.locator('select').first();
    await businessModelSelect.selectOption('B2C');
    
    const discountInput = modal.locator('input[type="number"]');
    await discountInput.fill('15');
    
    // 5. Salvar
    await modal.locator('button:has-text("Guardar Alterações")').click();
    
    // 6. Verificar toast e atualização do card
    await expect(page.locator('li[data-sonner-toast]').first()).toContainText('sucesso', { timeout: 15000 });
    
    // Aguardar o re-fetch automático
    await page.waitForTimeout(2000);
    await page.locator('.react-loading-skeleton').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});
    
    const updatedCard = page.locator('div.border, div.rounded-lg').filter({ has: page.locator('h4', { hasText: partnerName }) }).first();
    await expect(updatedCard).toContainText('15% Desconto', { timeout: 10000 });
    await expect(updatedCard).toContainText('B2C', { timeout: 10000 });
  });
});
