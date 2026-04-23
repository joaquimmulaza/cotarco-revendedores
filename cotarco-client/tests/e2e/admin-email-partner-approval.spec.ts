import { test, expect } from '@playwright/test';
import path from 'path';
import { extractVerificationUrl, waitForEmailInLog, extractLoginUrl } from './helpers/emailHelper';
import { request } from '@playwright/test';
import fs from 'fs';

/**
 * Fluxo (b) - Aprovação de Distribuidor pelo Admin com Email PartnerApproved
 *
 * Cobre a Secção 3(b) da estratégia E2E_Email_Testing_Strategy.md:
 * 1. Criar um distribuidor com email único (Date.now()) via API, com estado 'pending'.
 * 2. Autenticar como admin usando storageState existente (playwright/.auth/admin.json).
 * 3. Navegar para o painel de gestão de parceiros e aprovar o distribuidor via UI.
 * 4. Aguardar o email PartnerApproved no log com timeout padrão de 10s.
 * 5. Extrair o link /distribuidores/login do bloco de email.
 * 6. Navegar para o link e assertar que a página de login do distribuidor carrega.
 *
 * Nota: Este teste corre sob o projeto 'admin-tests' (playwright.config.js),
 * que injeta o storageState do admin.json. Não é necessário sobrescrever o storageState.
 */
test.describe('Fluxo (b): Aprovação de Distribuidor Admin com Email PartnerApproved', () => {
  // Timeout padrão do helper: 10s (Secção 4).


  // Usar 15000-20000ms apenas para fluxos AppyPay (Secção 3d).
  const EMAIL_TIMEOUT = 30000;

  const testAlvaraPath = path.join(process.cwd(), 'tests', 'test-alvara.pdf');

  // Email único por execução de teste — garante isolamento de race conditions (Secção 2)
  const testId = Date.now();
  const testEmail = `distribuidor.aprovacao${testId}@exemplo.com`;
  const partnerName = `Parceiro Aprovacao ${testId}`;

  // --- Passo 1: Criar o distribuidor via UI de registo público (estado inicial: pending) ---
  // Feito no setup do teste para que o admin possa depois aprová-lo.
  // Usamos uma nova page isolada (sem storageState do admin) para simular o registo público.
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] }, // Sem sessão autenticada
    });
    const page = await context.newPage();

    await page.goto('/distribuidores/register');
    await page.getByLabel('Nome completo').fill(partnerName);
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Telefone').fill('910000002');
    await page.getByLabel('Nome da Empresa').fill('Empresa Aprovacao E2E Lda');
    await page.setInputFiles('input[id="alvara"]', testAlvaraPath);
    await page.getByLabel('Palavra-passe', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirmar palavra-passe').fill('Password123!');
    await page.getByRole('button', { name: 'Registar' }).click();

    // Confirmar que o registo foi bem-sucedido
    await expect(page).toHaveURL(/.*\/email-verification-pending/, { timeout: 15000 });

    // --- Extrair link e verificar email para transitar status para pending_approval ---
    const emailBlock = await waitForEmailInLog(testEmail, 30000);
    const verificationUrl = extractVerificationUrl(emailBlock);
    expect(verificationUrl).not.toBeNull();
    
    // Capturar o ID do utilizador a partir do link de verificação (ex: /email/verify/123/hash)
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
        baseURL: 'http://127.0.0.1:8001',
        extraHTTPHeaders: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      await expect.poll(async () => {
        const response = await adminContext.get(`/api/admin/partners/${userId}`);
        
        console.log('API Status:', response.status());
        const body = await response.json();
        console.log('API Body:', JSON.stringify(body));

        if (!response.ok()) {
          console.warn(`[beforeAll] Erro na API (Status ${response.status()}).`);
          return null;
        }
        
        console.log(`[DEBUG] Partner Approval Response for ${userId}:`, JSON.stringify(body));
        // Extract status from possible different response structures
        const status = body.partner?.status || body.data?.status || body.status || (body.results ? body.results[0]?.status : null);
        
        if (status !== 'pending_approval') {
          console.warn(`[beforeAll] Status atual de ${userId}: "${status}".`);
        }
        return status;
      }, {
        message: `A aguardar status 'pending_approval' para o parceiro ${userId}`,
        timeout: 30000,
      }).toBe('pending_approval');

      await adminContext.dispose();
    }
  });

  test('admin aprova distribuidor, PartnerApproved chega ao log, link de login válido', async ({ page, browser }) => {
    // --- Passo 2: Admin já autenticado via storageState (admin-tests project) ---
    // Navegar para o painel de gestão de parceiros
    // Diagnóstico    // 1. Ir para dashboard de admin
    await page.goto('/distribuidores/admin/dashboard/partners');
    
    // Pequeno log para depuração caso falhe
    const heading = page.getByText('Gestão de Parceiros').first();
    try {
      await expect(heading).toBeVisible({ timeout: 10000 });
    } catch (e) {
      console.error(`[FAILURE DEBUG] URL final após goto: ${page.url()}`);
      console.error(`[FAILURE DEBUG] Conteúdo do body (primeiros 1000 chars): ${await page.evaluate(() => document.body.innerText.substring(0, 1000))}`);
      throw e;
    }

    // Aguardar que os skeletons de loading inicial desapareçam
    await page.locator('.react-loading-skeleton').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});

    // --- Passo 3: Ir à tab Pendentes e pesquisar o distribuidor criado ---
    await expect(page.getByText(/Pendentes/)).toBeVisible({ timeout: 10000 });
    await page.getByRole('tab', { name: /Pendentes/ }).click();

    // Aguardar debounce da tab + skeleton de loading
    await page.waitForTimeout(500);
    await page.locator('.react-loading-skeleton').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});

    const searchInput = page.getByPlaceholder('Pesquisar por nome, email ou empresa...');
    await searchInput.click();
    await searchInput.fill(testEmail);

    // Aguardar debounce da pesquisa (500ms) + skeleton
    await page.waitForTimeout(1000);
    await page.locator('.react-loading-skeleton').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});

    // --- Localizar o card específico após pesquisa ---
    // Aguardar o debounce (500ms) e o loading da API
    const partnerCard = page.getByTestId('partner-card').filter({ hasText: testEmail }).first();
    await expect(partnerCard).toBeVisible({ timeout: 15000 });
    
    // Garantir que o card não é um Skeleton (verificar se o nome está presente)
    await expect(partnerCard.getByRole('heading', { name: partnerName })).toBeVisible({ timeout: 15000 });
    
    await partnerCard.scrollIntoViewIfNeeded();
    // 6. Clicar em "Ações" -> "Aprovar"
    await partnerCard.getByTestId('partner-approve-button').first().click();

    // --- Confirmar no modal de aprovação ---
    // Sinal Positivo Determinístico: Aguardar o dialog que contém o heading correcto estar visível
    const dialog = page.getByRole('dialog').filter({ 
      has: page.getByRole('heading', { name: 'Aprovar Parceiro', exact: true }) 
    });
    
    // Sinal Positivo Determinístico (v3): Aguardar o CONTEÚDO (heading) estar visível
    await dialog.getByRole('heading').waitFor({ state: 'visible', timeout: 5000 });
    
    const confirmButton = dialog.getByRole('button', { name: 'Aprovar', exact: true });
    await confirmButton.click();

    // --- SINAL POSITIVO (UI): O card do parceiro deve desaparecer da lista de Pendentes ---
    await expect(partnerCard).toBeHidden({ timeout: 15000 });

    // Verificar toast de sucesso (confirmação visual da acção do admin)
    await expect(page.locator('li[data-sonner-toast]').first()).toContainText('sucesso', {
      timeout: 10000,
    });

    // --- Passo 4: Aguardar email PartnerApproved no log (queue assíncrona) ---
    // O helper usa expect.poll com retry conforme a Secção 4.
    // Timeout padrão de 10s — é um envio direto (não AppyPay).
    const emailBlock = await waitForEmailInLog(testEmail, EMAIL_TIMEOUT);

    // Confirmar que o bloco de email corresponde ao distribuidor correto
    expect(emailBlock).toBeTruthy();
    expect(emailBlock).toContain(testEmail);

    // Confirmar que é o email de aprovação (sujeito / conteúdo esperado)
    expect(emailBlock).toMatch(/Conta Aprovada|Conta aprovada|partner.approved/i);

    // --- Passo 5: Extrair o link /distribuidores/login do bloco de email ---
    const loginUrl = extractLoginUrl(emailBlock);

    expect(
      loginUrl,
      `Não foi possível extrair o URL de login do email PartnerApproved para ${testEmail}.\nBloco:\n${emailBlock}`
    ).not.toBeNull();

    // --- Passo 6: Navegar para o link e assertar que a página de login carrega ---
    // --- VERIFICAÇÃO FINAL: O link do email leva à página de login ---
    const loginLink = extractLoginUrl(emailBlock);
    expect(loginLink).toBeTruthy();
    
    // Usar um novo contexto para garantir que a sessão de admin não causa redireccionamentos
    const partnerContext = await browser.newContext();
    const partnerPage = await partnerContext.newPage();
    
    try {
      await partnerPage.goto(loginLink!);
      
      // Confirmar elementos fundamentais da página de login
      // Regex robusta para apanhar "Iniciar sessão", "Login" ou "Entrar"
      await expect(partnerPage.getByRole('heading', { name: /iniciar sessão|login|entrar/i }))
        .toBeVisible({ timeout: 10000 });
        
      await expect(partnerPage.locator('input[name="email"]')).toBeVisible();
      await expect(partnerPage.locator('input[name="password"]')).toBeVisible();
    } finally {
      await partnerContext.close();
    }
  });
});
