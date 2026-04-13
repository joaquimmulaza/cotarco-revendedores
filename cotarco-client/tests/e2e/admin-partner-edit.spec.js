import { test, expect } from '@playwright/test';

test.describe('Admin Partner Edit', () => {
  // Configurar para correr em série para evitar conflitos de estado
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/distribuidores/admin/dashboard/partners');
    
    // Verificar se fomos redirecionados para o login (erro de auth)
    const isLogin = await page.url().includes('/admin/login');
    if (isLogin) {
      throw new Error('Falha na autenticação: redirecionado para a página de login.');
    }

    // Usar um seletor específico para o cabeçalho h3 para evitar ambiguidade (Sidebar vs Content)
    // Aumentamos o timeout para 30s porque o `php artisan serve` é single-threaded e
    // testes em paralelo (como o partner-actions) podem bloquear o servidor com requests pesados (seed/bcrypt).
    await expect(page.getByRole('heading', { name: 'Gestão de Parceiros' })).toBeVisible({ timeout: 30000 });
    
    // Esperar carregamento inicial
    await page.locator('.space-y-4 .react-loading-skeleton').waitFor({ state: 'detached', timeout: 30000 }).catch(() => {});
  });

  test('should edit partner profiles', async ({ page }) => {
    const partnerName = 'Edit Test Partner';
    
    // 1. Garantir que estamos na tab 'Ativos'
    await page.getByRole('tab', { name: /Ativos/ }).click();
    
    // Type into the search box — waitForResponse is replaced with direct assertion
    // to avoid race conditions in the full parallel suite.
    const searchInput = page.getByPlaceholder('Pesquisar por nome, email ou empresa...');
    await searchInput.fill('');
    await searchInput.pressSequentially(partnerName, { delay: 50 });
    
    // 3. Localizar o card
    const partnerCard = page.locator('div.border').filter({ has: page.getByRole('heading', { name: partnerName }) }).first();
    await expect(partnerCard).toBeVisible({ timeout: 30000 });
    await partnerCard.getByRole('button', { name: 'Editar' }).click();
    
    // 4. Preencher formulário de edição
    const dialog = page.getByRole('dialog');
    const saveButton = dialog.getByRole('button', { name: 'Guardar Alterações' });
    await expect(saveButton).toBeVisible({ timeout: 15000 });
    
    // Preencher campos usando IDs reais do componente
    await dialog.locator('#edit-business-model').selectOption('B2C');
    await dialog.locator('#edit-discount').fill('15');
    await saveButton.click();
    
    // 5. Verificar atualização (modal fecha e card atualiza com novo desconto)
    // O fechamento pode demorar porque depende da resposta da API de edição (`PATCH`)
    await expect(dialog).not.toBeVisible({ timeout: 30000 });

    // Assert the Sonner toast immediately after the dialog closes — before waiting
    // for the card to reflect updated data, because the toast is transient and may
    // disappear within seconds of the action completing.
    await expect(
      page.locator('li[data-sonner-toast]').filter({ hasText: /sucesso/i }).first()
    ).toBeVisible({ timeout: 15000 });

    // O card deve atualizar com o novo desconto
    const updatedCard = page.locator('div.border').filter({ has: page.getByRole('heading', { name: partnerName }) }).first();
    await expect(updatedCard).toContainText('15%', { timeout: 30000 });
  });
});
