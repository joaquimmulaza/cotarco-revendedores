import { test as setup, expect } from '@playwright/test';

const adminFile = 'playwright/.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/distribuidores/admin/login', { waitUntil: 'networkidle' });

  // Usar seletores por name (mais robustos com animações Framer Motion)
  await page.fill('input[name="email"]', 'joaquimmulazadev@gmail.com');
  await page.fill('input[name="password"]', 'cotarco.2025');
  await page.click('button[type="submit"]');

  // Aguardar redirecionamento para o dashboard de admin
  await page.waitForURL(/.*\/admin\/dashboard/, { timeout: 15000 });

  // Guardar estado de autenticação
  await page.context().storageState({ path: adminFile });
});
