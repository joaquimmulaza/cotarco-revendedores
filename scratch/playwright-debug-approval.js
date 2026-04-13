
const { chromium, expect } = require('playwright');
const fs = require('fs');
const path = require('path');

// --- Configuração ---
const API_URL = 'http://127.0.0.1:8000';
const CLIENT_URL = 'http://127.0.0.1:5173';
const LOG_PATH = 'c:/cotarco-revendedores/cotarco-api/storage/logs/laravel.log';

(async () => {
  console.log('🚀 Iniciando debug de aprovação...');
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testId = Date.now();
  const testEmail = `debug+aprovacao${testId}@exemplo.com`;
  const partnerName = `Debug Parceiro ${testId}`;

  try {
    // 1. Registo
    console.log(`📝 Registando parceiro: ${testEmail}`);
    await page.goto(`${CLIENT_URL}/distribuidores/register`);
    await page.fill('input[name="name"]', partnerName);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="phone"]', '910000000');
    await page.fill('input[name="company_name"]', 'Empresa Debug Lda');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="password_confirmation"]', 'Password123!');
    // Anexar alvara fictício
    const alvaraPath = 'c:/cotarco-revendedores/cotarco-client/tests/test-alvara.pdf';
    await page.setInputFiles('input[id="alvara"]', alvaraPath);
    await page.click('button:has-text("Registar")');

    await page.waitForURL('**/email-verification-pending');
    console.log('✅ Registo concluído.');

    // 2. Extrair Email de Verificação
    console.log('📧 Aguardando email no log...');
    await page.waitForTimeout(3000); // Aguardar queue
    const logContent = fs.readFileSync(LOG_PATH, 'utf8');
    const emailBlockRegex = new RegExp(`^To: ${testEmail.replace('+', '\\+')}[\\s\\S]*?(?=\\r?\\n\\[\\d{4}-\\d{2}-\\d{2}|$)`, 'm');
    const match = logContent.match(emailBlockRegex);
    
    if (!match) throw new Error(`Email para ${testEmail} não encontrado no log!`);
    const emailBlock = match[0];
    const urlMatch = emailBlock.match(/https?:\/\/\S*\/api\/email\/verify\/[^\s"<>]+/);
    if (!urlMatch) throw new Error('URL de verificação não encontrado no bloco!');
    
    let verificationUrl = urlMatch[0];
    // Corrigir porta se necessário (se o log tiver 8001 e estivermos no 8000)
    verificationUrl = verificationUrl.replace(':8001', ':8000');
    console.log(`🔗 URL extraído: ${verificationUrl}`);

    // 3. Verificar Email
    await page.goto(verificationUrl);
    await page.waitForURL('**/login');
    console.log('✅ Email verificado.');

    // 4. Admin Login
    console.log('🔑 Autenticando como Admin...');
    await page.goto(`${CLIENT_URL}/distribuidores/admin/login`);
    await page.fill('input[name="email"]', 'joaquimmulazadev@gmail.com');
    await page.fill('input[name="password"]', 'cotarco.2025');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // 5. Dashboard -> Pendentes
    console.log('📊 Navegando para Gestão de Parceiros...');
    await page.goto(`${CLIENT_URL}/distribuidores/admin/dashboard/partners`);
    await page.click('button:has-text("Pendentes")');
    await page.waitForTimeout(1000);
    
    console.log(`🔎 Pesquisando por: ${testEmail}`);
    const searchInput = page.getByPlaceholder('Pesquisar por nome, email ou empresa...');
    await searchInput.click();
    await searchInput.pressSequentially(testEmail, { delay: 100 });
    await page.waitForTimeout(2000);

    // 6. Localizar Card e Clicar em Aprovar
    const card = page.locator('div.border', { hasText: testEmail }).first();
    await card.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'c:/cotarco-revendedores/debug_card.png' });
    
    console.log('🖱️ Clicando em Aprovar (no card)...');
    await card.locator('button:has-text("Aprovar")').click();
    await page.waitForTimeout(500);

    // 7. Debug do Modal
    console.log('🧐 Analisando Modal...');
    await page.screenshot({ path: 'c:/cotarco-revendedores/debug_modal.png' });
    
    const dialog = page.getByRole('dialog');
    const dialogVisible = await dialog.isVisible();
    console.log(`Modal visível: ${dialogVisible}`);
    
    if (dialogVisible) {
        const html = await dialog.innerHTML();
        console.log('--- HTML DO DIALOG ---');
        console.log(html);
        console.log('----------------------');
        
        const approveBtn = dialog.getByRole('button', { name: 'Aprovar', exact: true });
        const btnVisible = await approveBtn.isVisible();
        console.log(`Botão de confirmação visível: ${btnVisible}`);
        
        if (btnVisible) {
            await approveBtn.click();
            console.log('✅ Clique no botão de confirmação REALIZADO.');
        } else {
            console.log('❌ Botão de confirmação NÃO ENCONTRADO no modal.');
        }
    } else {
        console.log('❌ MODAL NÃO ABRIU!');
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'c:/cotarco-revendedores/debug_final.png' });

  } catch (err) {
    console.error(`❌ ERRO: ${err.message}`);
    await page.screenshot({ path: 'c:/cotarco-revendedores/debug_error.png' });
  } finally {
    await browser.close();
  }
})();
