import { test, expect, request } from '@playwright/test';
import path from 'path';
import { waitForEmailInLog } from './helpers/emailHelper';

/**
 * // TODO SECURITY: webhook sem validação de assinatura — ver débito técnico
 * 
 * Fluxo (d) - Pagamento Confirmado via AppyPay Webhook (Multicaixa)
 * 
 * Cobre a Secção 3(d) da estratégia E2E_Email_Testing_Strategy.md:
 * 1. Simular utilizador ativo a criar uma encomenda via API.
 * 2. Obter merchantTransactionId gerado pela aplicação.
 * 3. Disparar webhook de sucesso via request.newContext() para simular chamada externa.
 * 4. Aguardar email PaymentSuccessCustomer no log (timeout 20s).
 * 5. Validar que o email contém as referências correctas.
 */

// Email único por execução para isolamento de testes
const testId = Date.now();
const testEmail = `distribuidor.pagamento${testId}@exemplo.com`;
const partnerName = `Parceiro Pagamento ${testId}`;

test.describe('Fluxo (d): Notificação de Pagamento Confirmado (AppyPay)', () => {
  // Variável de escopo para partilhar a referência entre beforeAll e o test
  let merchantTransactionId: string;

  const testAlvaraPath = path.join(process.cwd(), 'tests', 'test-alvara.pdf');

  test.beforeAll(async ({ browser }) => {
    // Garantir contexto limpo para o registo
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();

    // --- Passo 1: Registar o parceiro ---
    await page.goto('/distribuidores/register');
    await page.getByLabel('Nome completo').fill(partnerName);
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Telefone').fill('920000004');
    await page.getByLabel('Nome da Empresa').fill('Pagamentos E2E Lda');
    await page.setInputFiles('input[id="alvara"]', testAlvaraPath);
    await page.getByLabel('Palavra-passe', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirmar palavra-passe').fill('Password123!');
    await page.getByRole('button', { name: 'Registar' }).click();

    // Aguardar página de pendente
    await expect(page).toHaveURL(/.*\/email-verification-pending/, { timeout: 15000 });

    // --- Passo 1.5: Extrair e Verificar Email (Obrigatório) ---
    const emailBlock = await waitForEmailInLog(testEmail, 20000);
    const verificationUrlMatch = emailBlock.match(/https?:\/\/\S*\/api\/email\/verify\/[^\s"<>]+/);
    if (!verificationUrlMatch) throw new Error('URL de verificação não encontrado no log');
    let verificationUrl = verificationUrlMatch[0];

    await page.goto(verificationUrl);
    await expect(page).toHaveURL(/.*\/email-validated/);
    console.log(`✅ Email verificado para ${testEmail}`);

    // --- Passo 2: Admin aprova o parceiro ---
    const adminContext = await browser.newContext({ storageState: 'playwright/.auth/admin.json' });
    const adminPage = await adminContext.newPage();
    await adminPage.goto('/distribuidores/admin/dashboard/partners');

    await adminPage.getByRole('tab', { name: /Pendentes/ }).click();
    const searchInput = adminPage.getByPlaceholder('Pesquisar por nome, email ou empresa...');
    await searchInput.click();
    await searchInput.fill(testEmail);

    // Aguardar debounce e loading
    const partnerCard = adminPage.locator('div.border', { hasText: testEmail }).first();
    // Garantir que o card não é um Skeleton (verificar se o nome está presente)
    await expect(partnerCard.getByRole('heading', { name: partnerName })).toBeVisible({ timeout: 15000 });

    await partnerCard.locator('button:has-text("Aprovar")').click();

    // Confirmar no modal (Sinal Positivo Determinístico)
    const dialog = adminPage.getByRole('dialog').filter({
      has: adminPage.getByRole('heading', { name: /Aprovar Parceiro/i })
    });

    // Aguardar o heading estar visível (Sinal Positivo v3)
    await dialog.getByRole('heading').waitFor({ state: 'visible', timeout: 5000 });

    const confirmButton = dialog.getByRole('button', { name: /Aprovar|Reativar/ });
    await confirmButton.click();

    // Verificar sucesso da aprovação na UI
    await expect(adminPage.locator('li[data-sonner-toast]').first()).toContainText('sucesso', { timeout: 15000 });

    // Sincronização DETERMINÍSTICA: Garantir que o status mudou para 'Ativo' na DB/UI
    // Como estamos na tab 'Pendentes', o card pode desaparecer. Vamos verificar no card se ele ainda estiver lá,
    // ou simplesmente confiar no toast + um pequeno aguardo se necessário. 
    // Mas a melhor forma é procurar o card novamente (ele deve ter movido ou o filtro atualizado)
    await adminPage.getByRole('tab', { name: /Ativos/ }).click();
    await searchInput.fill(testEmail);
    await expect(partnerCard.getByText('Ativo', { exact: true })).toBeVisible({ timeout: 10000 });

    await adminContext.close();

    // --- Passo 3: Criar Encomenda ---
    // Voltar à página do parceiro e fazer login para obter token
    await page.goto('/distribuidores/login');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Palavra-passe').fill('Password123!');
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Root cause: Login.jsx calls navigate('/dashboard') synchronously, but <ProtectedRoute>
    // renders a full-page skeleton while AuthContext.loading === true (validateSession() is async).
    // During that transient render, the URL is already /dashboard but the content is a spinner.
    // `waitForURL` blocks until React Router commits the navigation — this is the correct primitive
    // for SPA redirects, as opposed to `toHaveURL` which snapshots the URL at a single point in time.
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });

    // Extrair token do localStorage (Sinal Positivo: aguardar persistência após login)
    await expect.poll(async () => {
      const val = await page.evaluate(() => localStorage.getItem('auth_token'));
      return !!val;
    }, {
      message: 'A aguardar que o token de autenticação seja guardado no localStorage',
      timeout: 10000,
    }).toBe(true);

    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    console.warn(`[DEBUG] Token extraído para uso na API (comprimento: ${token.length})`);

    // Passo 3: Criar Encomenda usando contexto ISOLADO para evitar conflito de cookies (Sanctum Stateful)
    const apiContext = await request.newContext({
      baseURL: 'http://127.0.0.1:8001',
      extraHTTPHeaders: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const orderResponse = await apiContext.post('/api/orders/create-payment', {
      data: {
        items: [
          { sku: 'PROD-TEST', name: 'Item de Teste E2E', quantity: 2, price: 500 }
        ],
        details: {
          address: 'Rua dos Testes, 123',
          city: 'Luanda',
          province: 'Luanda'
        }
      }
    });

    if (orderResponse.status() !== 202) {
      console.error('Order creation failed with status:', orderResponse.status());
      console.error('Response body:', await orderResponse.text());
    }
    expect(orderResponse.status()).toBe(202);
    const orderData = await orderResponse.json();
    merchantTransactionId = orderData.merchantTransactionId;
    await apiContext.dispose();

    await context.close();
  });

  test('webhook de sucesso dispara email PaymentSuccessCustomer para o cliente', async () => {
    // Garantir que temos a referência da encomenda
    expect(merchantTransactionId).toBeDefined();

    // --- Passo 4: Simular Webhook do AppyPay ---
    // Usar request.newContext() para garantir que é uma chamada "externa" sem cookies/sessão
    const apiContext = await request.newContext();

    // O WebhookController espera merchantTransactionId e responseStatus.status === 'success'
    const webhookResponse = await apiContext.post('http://127.0.0.1:8001/api/webhooks/appypay', {
      data: {
        merchantTransactionId: merchantTransactionId,
        responseStatus: {
          status: 'success'
        },
        reference: {
          entity: '12345',
          referenceNumber: '900800700',
          dueDate: '2026-12-31'
        }
      }
    });

    expect(webhookResponse.status()).toBe(200);
    expect(await webhookResponse.json()).toMatchObject({ status: 'received' });

    // --- Passo 5: Aguardar email no Log ---
    // Timeout de 20s conforme Secção 3(d) devido ao processamento assíncrono (Webhooks + Queue)
    const emailBlock = await waitForEmailInLog(testEmail, 30000);

    // Asserções obrigatórias
    expect(emailBlock).toBeTruthy();
    expect(emailBlock).toContain(testEmail);
    expect(emailBlock).toContain('Pagamento Confirmado');
    expect(emailBlock).toContain(merchantTransactionId);

    // Limpeza do contexto da API
    await apiContext.dispose();
  });
});
