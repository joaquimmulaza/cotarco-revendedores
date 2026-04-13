import { test, expect } from '@playwright/test';
import path from 'path';
import { extractVerificationUrl, waitForEmailInLog } from './helpers/emailHelper';
import { request } from '@playwright/test';
import fs from 'fs';

/**
 * Fluxo (c) - Rejeição de Distribuidor com Motivo Dinâmico no Email PartnerRejected
 *
 * Cobre a Secção 3(c) da estratégia E2E_Email_Testing_Strategy.md:
 * 1. Criar um distribuidor com email único (Date.now()), estado 'pending'.
 * 2. Autenticar como admin via storageState existente (playwright/.auth/admin.json).
 * 3. Rejeitar o distribuidor via UI: tab Pendentes → card → Rejeitar → preencher REJECTION_REASON
 *    no textarea do ConfirmDialog → confirmar.
 * 4. Usar waitForEmailInLog(testEmail) para obter o bloco do email PartnerRejected.
 * 5. Fazer assert que o bloco contém exactamente o REJECTION_REASON submetido no passo 3.
 *
 * Arquitectura do motivo:
 * - Backend: PartnerRejected($user, $reason) — reason validado e passado ao mailable.
 * - Blade: {{ $reason }} renderizado num callout box no corpo do email.
 * - Frontend: textarea obrigatório no ConfirmDialog de rejeição do PartnerManager.
 */

// Motivo de rejeição dinâmico — usado tanto no passo 3 (submissão via UI)
// como no passo 5 (assert sobre o conteúdo do email).
const REJECTION_REASON = 'Documentação incompleta';

test.describe('Fluxo (c): Rejeição de Distribuidor com Motivo Dinâmico no Email', () => {
  // Timeout padrão do helper: 10s (Secção 4).
  // Usar 15000-20000ms apenas para fluxos AppyPay (Secção 3d).
  const EMAIL_TIMEOUT = 30000;

  const testAlvaraPath = path.join(process.cwd(), 'tests', 'test-alvara.pdf');

  // Email único por execução de teste — garante isolamento de race conditions (Secção 2)
  const testId = Date.now();
  const testEmail = `distribuidor.rejeicao${testId}@exemplo.com`;
  const partnerName = `Parceiro Rejeicao ${testId}`;

  // --- Passo 1: Criar o distribuidor via UI de registo público (estado inicial: pending) ---
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();

    await page.goto('/distribuidores/register');
    await page.getByLabel('Nome completo').fill(partnerName);
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Telefone').fill('910000003');
    await page.getByLabel('Nome da Empresa').fill('Empresa Rejeicao E2E Lda');
    await page.setInputFiles('input[id="alvara"]', testAlvaraPath);
    await page.getByLabel('Palavra-passe', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirmar palavra-passe').fill('Password123!');
    await page.getByRole('button', { name: 'Registar' }).click();

    await expect(page).toHaveURL(/.*\/email-verification-pending/, { timeout: 15000 });
    
    // --- Extrair link e verificar email para transitar status para pending_approval ---
    const emailBlock = await waitForEmailInLog(testEmail, 20000);
    const verificationUrl = extractVerificationUrl(emailBlock);
    expect(verificationUrl).not.toBeNull();

    // Capturar o ID do utilizador a partir do link de verificação
    const userIdMatch = verificationUrl!.match(/\/verify\/(\d+)\//);
    const userId = userIdMatch ? userIdMatch[1] : null;

    await page.goto(verificationUrl!);
    await expect(page).toHaveURL(/.*\/email-validated/); 
    await context.close();

    // --- SINAL POSITIVO (BACKEND): Polling à API Admin para confirmar status pending_approval ---
    if (userId) {
      const adminState = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'playwright', '.auth', 'admin.json'), 'utf8'));
      const token = adminState.origins[0]?.localStorage?.find((item: any) => item.name === 'auth_token')?.value;

      const adminContext = await request.newContext({
        storageState: path.join(process.cwd(), 'playwright', '.auth', 'admin.json'),
        baseURL: 'http://127.0.0.1:5173',
        extraHTTPHeaders: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      await expect.poll(async () => {
        const response = await adminContext.get(`/api/admin/partners/${userId}`);
        
        if (response.status() !== 200) {
          console.warn(`[beforeAll] Erro na API (Status ${response.status()}).`);
          return null;
        }

        const body = await response.json();
        // Tentar extrair status de várias formas possíveis (Resource, Direct, Wrapped)
        const status = body.partner?.status || body.data?.status || body.status;
        
        if (status !== 'pending_approval') {
          console.warn(`[beforeAll] Status atual de ${userId}: "${status}". Body: ${JSON.stringify(body)}`);
        }
        return status;
      }, {
        message: `A aguardar status 'pending_approval' para o parceiro ${userId} via API`,
        timeout: 15000,
      }).toBe('pending_approval');

      await adminContext.dispose();
    }
  });

  test('admin rejeita com motivo, PartnerRejected contém motivo exacto submetido', async ({ page }) => {
    // --- Passo 2: Admin já autenticado via storageState (admin-tests project) ---
    // Diagnóstico antes da falha


    await page.goto('/distribuidores/admin/dashboard/partners');
    
    // Captura o heading para debug
    const heading = page.getByRole('heading', { name: /Gestão de Parceiros/i });
    try {
      await expect(heading).toBeVisible({ timeout: 5000 });
    } catch (e) {
      console.error(`[FAILURE DEBUG] URL final após goto: ${page.url()}`);
      console.error(`[FAILURE DEBUG] Conteúdo do body (primeiros 1000 chars): ${await page.evaluate(() => document.body.innerText.substring(0, 1000))}`);
      throw e;
    }
    await page.locator('.react-loading-skeleton').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});

    // --- Passo 3: Tab Pendentes → pesquisa → card → Rejeitar ---
    await expect(page.getByText(/Pendentes/)).toBeVisible({ timeout: 10000 });
    await page.getByRole('tab', { name: /Pendentes/ }).click();

    await page.waitForTimeout(500);
    await page.locator('.react-loading-skeleton').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});

    const searchInput = page.getByPlaceholder('Pesquisar por nome, email ou empresa...');
    await searchInput.click();
    await searchInput.fill(testEmail);

    await page.waitForTimeout(1000);
    await page.locator('.react-loading-skeleton').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});

    // --- Localizar o card específico após pesquisa ---
    // Aguardar o debounce (500ms) e o loading da API
    const partnerCard = page.locator('div.border', { hasText: testEmail }).first();
    await expect(partnerCard).toBeVisible({ timeout: 15000 });
    
    // Garantir que o card não é um Skeleton (verificar se o nome está presente)
    await expect(partnerCard.getByRole('heading', { name: partnerName })).toBeVisible({ timeout: 15000 });
    
    await partnerCard.scrollIntoViewIfNeeded();
    // 6. Clicar em "Ações" -> "Rejeitar"
    await partnerCard.locator('button:has-text("Rejeitar")').click();

    // --- Preencher o motivo no textarea do ConfirmDialog ---
    // Sinal Positivo Determinístico: Aguardar o dialog que contém o heading correcto estar visível
    const dialog = page.getByRole('dialog').filter({ 
      has: page.getByRole('heading', { name: 'Rejeitar Parceiro', exact: true }) 
    });
    
    // Sinal Positivo Determinístico (v3): Aguardar o CONTEÚDO (heading) estar visível
    await dialog.getByRole('heading').waitFor({ state: 'visible', timeout: 5000 });
    
    const rejectionTextarea = dialog.locator('textarea#rejection-reason');
    await rejectionTextarea.fill(REJECTION_REASON);

    // Confirmar a rejeição com o motivo preenchido
    const confirmButton = dialog.getByRole('button', { name: 'Rejeitar', exact: true });
    await confirmButton.click();

    // --- SINAL POSITIVO (UI): Dialog deve fechar e card deve desaparecer ---
    await expect(dialog).toBeHidden({ timeout: 10000 });
    await expect(partnerCard).toBeHidden({ timeout: 15000 });

    // Verificar toast de sucesso
    await expect(page.locator('li[data-sonner-toast]').first()).toContainText('sucesso', {
      timeout: 10000,
    });

    // --- Passo 4: Aguardar email PartnerRejected no log ---
    const emailBlock = await waitForEmailInLog(testEmail, EMAIL_TIMEOUT);

    expect(emailBlock).toBeTruthy();
    expect(emailBlock).toContain(testEmail);

    // --- Passo 5: Assert que o motivo dinâmico submetido está no email ---
    // O backend passou REJECTION_REASON ao PartnerRejected($user, $reason),
    // o blade renderizou {{ $reason }} no corpo, e o log capturou o HTML resultante.
    expect(emailBlock).toContain(REJECTION_REASON);
  });
});
