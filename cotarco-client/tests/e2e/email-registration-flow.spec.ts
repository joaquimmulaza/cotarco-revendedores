import { test, expect } from '@playwright/test';
import path from 'path';
import { waitForEmailInLog, extractVerificationUrl } from './helpers/emailHelper';

/**
 * Fluxo (a) - Registo Genérico com Verificação de Email
 *
 * Cobre a Secção 3(a) da estratégia E2E_Email_Testing_Strategy.md:
 * 1. Registar um utilizador com email único (Date.now()).
 * 2. Aguardar pelo email de verificação no log do Laravel (MAIL_MAILER=log).
 * 3. Extrair o URL assinado (signed route) do bloco de email.
 * 4. Navegar para o URL de verificação.
 * 5. Fazer assert que o utilizador fica verificado com sucesso.
 */
// Limpar qualquer storageState injetado pelo projeto partner-tests (playwright.config.js),
// garantindo que este teste corre sempre sem sessão autenticada pré-existente.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Fluxo (a): Registo Genérico com Verificação de Email', () => {
  const testAlvaraPath = path.join(process.cwd(), 'tests', 'test-alvara.pdf');

  // Timeout padrão do helper: 10s (Secção 4).
  // Os fluxos AppyPay (Secção 3d) devem usar 15000-20000ms explicitamente.
  const EMAIL_TIMEOUT = 45000;

  test('deve registar utilizador, receber email de verificação e verificar conta via link assinado', async ({ page }) => {
    // Secção 2: email único por teste para evitar race conditions em paralelo
    const testEmail = `distribuidor+${Date.now()}@exemplo.com`;

    // --- Passo 1: Preencher e submeter o formulário de registo ---
    await page.goto('/distribuidores/register');

    await page.getByLabel('Nome completo').fill('Utilizador Teste E2E');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Telefone').fill('910000001');
    await page.getByLabel('Nome da Empresa').fill('Empresa Teste E2E Lda');
    await page.setInputFiles('input[id="alvara"]', testAlvaraPath);
    await page.getByLabel('Palavra-passe', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirmar palavra-passe').fill('Password123!');

    await page.getByRole('button', { name: 'Registar' }).click();

    // Confirmar que o registo foi bem-sucedido e o utilizador foi redirecionado
    await expect(page).toHaveURL(/.*\/email-verification-pending/, {
      timeout: 20000,
    });

    // --- Passo 2: Aguardar pelo email de verificação no log (queue assíncrona) ---
    // O helper usa expect.poll com retry conforme a Secção 4.
    const emailBlock = await waitForEmailInLog(testEmail, EMAIL_TIMEOUT);

    // Garantir que o bloco de email foi encontrado
    expect(emailBlock).toBeTruthy();

    // --- Passo 3: Extrair o URL assinado do bloco de email ---
    const verificationUrl = extractVerificationUrl(emailBlock);

    expect(
      verificationUrl,
      `Não foi possível extrair o URL de verificação do email para ${testEmail}. Bloco encontrado:\n${emailBlock}`
    ).not.toBeNull();

    // --- Passo 4: Navegar para o URL de verificação ---
    // A signed route do Laravel valida a assinatura e redireciona para o frontend
    await page.goto(verificationUrl!);

    // --- Passo 5: Assertar que o utilizador ficou verificado com sucesso ---
    // O Laravel redireciona para /distribuidores/email-validated após verificação bem-sucedida
    await expect(page).toHaveURL(/.*\/email-validated/, {
      timeout: 20000,
    });

    await expect(
      page.getByRole('heading', { name: /Email validado com sucesso/i })
    ).toBeVisible();
  });
});
