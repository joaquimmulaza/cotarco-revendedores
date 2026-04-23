// CREDENCIAIS DE TESTE (CONFORME SOLICITADO PELO UTILIZADOR):
// Email: joaquimmulazadev@gmail.com
// Senha: cotarco.2025
import { test as setup, expect } from '@playwright/test';

const adminFile = 'playwright/.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/distribuidores/admin/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[name="email"]');

  // Usar seletores por name (mais robustos com animações Framer Motion)
  await page.fill('input[name="email"]', 'joaquimmulazadev@gmail.com');
  await page.fill('input[name="password"]', 'cotarco.2025');
  
  // Clicar no botão e aguardar a resposta da rede e a navegação
  await Promise.all([
    page.waitForURL(/\/distribuidores\/admin\/dashboard/, { timeout: 30000 }),
    page.click('button[data-testid="admin-login-submit"]')
  ]);

  // Guardar estado de autenticação
  await page.context().storageState({ path: adminFile });
});
