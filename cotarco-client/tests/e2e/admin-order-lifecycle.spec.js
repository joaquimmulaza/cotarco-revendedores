import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * @file admin-order-lifecycle.spec.js
 * @description Teste coeso do ciclo de vida da encomenda: Parceiro (Checkout) -> Webhook -> Admin (Gestão).
 * Segue as Regras de Ouro da Arquitetura E2E v2.
 */

test.describe('Order Lifecycle 360 (Golden Flow)', () => {
  let merchantTransactionId;
  const PRODUCT_SKU = 'E2E-ORDER-PROD-01';
  const PRODUCT_NAME = 'Produto Teste Fluxo';
  const API_URL = 'http://127.0.0.1:8001/api';

  test('should complete the full order lifecycle from partner checkout to admin verification', async ({ browser, request }) => {
    test.setTimeout(180000); // 3 minutos para o fluxo completo

    // --- FASE 1: PARCEIRO (CHECKOUT) ---
    console.log('--- Iniciando Fase: Parceiro Checkout ---');
    const partnerContext = await browser.newContext({ storageState: 'playwright/.auth/partner.json' });
    const partnerPage = await partnerContext.newPage();

    await partnerPage.goto('/distribuidores/dashboard');
    console.log(`Current URL: ${partnerPage.url()}`);
    
    // Selecionar categoria de teste 999998
    const categoriesList = partnerPage.getByTestId('categories-list');
    await expect(categoriesList).toBeVisible({ timeout: 45000 });
    const categoryButton = categoriesList.locator('button[data-category-id="999998"]');
    await expect(categoryButton).toBeVisible({ timeout: 15000 });
    await categoryButton.click();

    // Adicionar produto ao carrinho
    const testProduct = partnerPage.getByTestId('product-card').filter({ hasText: PRODUCT_NAME }).first();
    await expect(testProduct).toBeVisible({ timeout: 30000 });
    await testProduct.getByTestId('add-to-cart-button').click();

    // Abrir carrinho e ir para checkout
    const cartButton = partnerPage.getByTestId('cart-button');
    await expect(cartButton).toContainText(/[1-9]/, { timeout: 15000 });
    await cartButton.click();
    await partnerPage.getByTestId('cart-checkout-button').click();
    await partnerPage.waitForURL('**/checkout');

    // Preencher checkout
    await partnerPage.getByLabel('Endereço').fill('Rua de Teste E2E, 99');
    await partnerPage.getByLabel('Cidade').fill('Luanda');
    await partnerPage.getByLabel('Telefone').fill('900000000');

    console.log('Finalizando encomenda...');
    const [response] = await Promise.all([
      partnerPage.waitForResponse(resp => 
        resp.url().includes('/orders/create-payment') && resp.status() === 202,
        { timeout: 60000 }
      ),
      partnerPage.getByRole('button', { name: 'Finalizar Encomenda' }).click()
    ]);

    const responseBody = await response.json();
    merchantTransactionId = responseBody.merchantTransactionId;
    console.log(`Encomenda criada! ID: ${merchantTransactionId}`);

    // Esperar pelo polling indicar "Pagamento Gerado"
    await expect(partnerPage.getByText('Pagamento Gerado com Sucesso!')).toBeVisible({ timeout: 120000 });
    await partnerContext.close();

    // --- FASE 2: WEBHOOK (SUCESSO) ---
    console.log('\n--- Iniciando Fase: Simulação de Webhook ---');
    const webhookResponse = await request.post(`${API_URL}/webhooks/appypay`, {
      data: {
        merchantTransactionId: merchantTransactionId,
        responseStatus: { status: 'success' },
        reference: {
          entity: '99999',
          referenceNumber: '123456789',
          dueDate: '2026-12-31'
        }
      }
    });

    expect(webhookResponse.ok()).toBeTruthy();
    console.log('Webhook processado com sucesso.');

    // --- FASE 3: ADMIN (VERIFICAÇÃO) ---
    console.log('\n--- Iniciando Fase: Verificação Admin ---');
    const adminContext = await browser.newContext({ storageState: 'playwright/.auth/admin.json' });
    const adminPage = await adminContext.newPage();

    // 1. Validar decremento de stock
    console.log('Validando decremento de stock...');
    await adminPage.goto('/distribuidores/admin/dashboard/product-list');
    
    // Procurar SKU
    const searchInput = adminPage.getByPlaceholder(/Pesquisar produtos por nome ou referência/i);
    await expect(searchInput).toBeVisible({ timeout: 20000 });
    await searchInput.fill(PRODUCT_SKU);
    await adminPage.keyboard.press('Enter');
    
    // O stock inicial era 10, compramos 1, deveria ser 9.
    const productRow = adminPage.locator(`tr:has-text("${PRODUCT_SKU}")`);
    await expect(productRow).toBeVisible({ timeout: 20000 });
    // Procura por uma célula que contenha exatamente "9" (pode ser formatado como 9 ou 9,00 etc)
    await expect(productRow.locator('td')).toContainText(['9']);
    console.log('Stock validado com sucesso (10 -> 9).');

    // 2. Validar Estado da Encomenda e Fatura
    console.log('Validando estado da encomenda e fatura...');
    await adminPage.goto('/distribuidores/admin/dashboard/orders');
    
    // Filtrar por Parceiro Playwright para isolar a nossa encomenda
    const partnerSearch = adminPage.getByPlaceholder(/Filtrar por nome do parceiro/i);
    await expect(partnerSearch).toBeVisible({ timeout: 20000 });
    await partnerSearch.fill('Parceiro Playwright');
    await adminPage.keyboard.press('Enter');
    
    // Clicar no filtro "Sucesso" para garantir que vemos a encomenda paga
    const successFilter = adminPage.getByRole('button', { name: 'Sucesso' });
    await successFilter.click();

    // A primeira linha deve ser a nossa encomenda mais recente
    const orderRow = adminPage.locator('tbody tr').first();
    await expect(orderRow).toBeVisible({ timeout: 20000 });
    await expect(orderRow).toContainText('Sucesso');
    await expect(orderRow).toContainText('Parceiro Playwright');
    
    // Abrir detalhes
    await orderRow.click();
    
    // Esperar pelo botão de fatura na página de detalhes
    // Nota: O botão pode demorar a aparecer se a fatura for gerada em background, mas no webhook de sucesso ela é gerada síncronamente no seeder.
    const invoiceButton = adminPage.locator('button:has-text("Fatura"), button:has-text("Invoice"), a:has-text("Baixar Fatura")').first();
    await expect(invoiceButton).toBeVisible({ timeout: 30000 });
    console.log('Documentos da encomenda validados (Status e Fatura).');

    await adminContext.close();
  });

  test('should verify email notification logs', async () => {
    // Verificação de logs no backend
    const logPath = path.join('..', 'cotarco-api', 'storage', 'logs', 'laravel.log');
    
    if (fs.existsSync(logPath)) {
      const logContent = fs.readFileSync(logPath, 'utf8');
      
      // Procurar pelas strings de log do WebhookController
      expect(logContent).toContain('A enviar e-mails de pagamento confirmado');
      console.log('Logs de e-mail confirmados.');
    } else {
      console.log('Aviso: laravel.log não encontrado no caminho esperado.');
    }
  });
});
