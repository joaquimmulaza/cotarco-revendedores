import { test, expect } from '@playwright/test';

// Este suite corre com o storageState de admin (configurado no projeto admin-tests)
test.describe('Admin Dashboard', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('should allow navigation between dashboard tabs', async ({ page }) => {
    await page.goto('/distribuidores/admin/dashboard/partners');

    // Navigate to Mapa de Stock and verify
    await page.getByRole('link', { name: 'Mapa de Stock' }).click();
    await expect(page).toHaveURL(/.*\/admin\/dashboard\/stock-files/);
    await expect(page.getByRole('heading', { name: 'Mapa de Stock' })).toBeVisible();

    // Navigate back to Gestão de Parceiros
    await page.getByRole('link', { name: 'Gestão de Parceiros' }).click();
    await expect(page).toHaveURL(/.*\/admin\/dashboard\/partners/);
    await expect(page.getByRole('heading', { name: 'Gestão de Parceiros' })).toBeVisible();
  });
});

// Este suite corre SEM autenticação — estado limpo forçado
test.describe('Admin Dashboard Access', () => {
  // Substituir o storageState do projeto com um estado completamente vazio (sem auth)
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should redirect non-admin users from admin dashboard', async ({ page }) => {
    await page.goto('/distribuidores/admin/dashboard/partners', { waitUntil: 'networkidle' });
    
    // Deve ser redirecionado para a página de login do admin
    await expect(page).toHaveURL(/.*\/admin\/login/);
    await expect(page.getByRole('heading', { name: 'Painel de Administração' })).toBeVisible();
  });
});

