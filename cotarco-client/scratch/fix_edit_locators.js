
import fs from 'fs';
const path = 'tests/e2e/admin-partner-edit.spec.js';
let content = fs.readFileSync(path, 'utf8');

// Replace locators
content = content.replace(/page\.getByRole\('heading', { name: 'GestÃ£o de Parceiros' }\)/g, "page.getByTestId('breadcrumb-page')");
content = content.replace(/page\.getByRole\('tab', { name: \/Ativos\/ }\)\.click\(\)/g, "page.getByTestId('partner-tab-active').click()");
content = content.replace(/page\.getByPlaceholder\('Pesquisar por nome, email ou empresa\.\.\.'\)/g, "page.getByTestId('partner-search-input')");
content = content.replace(/const dialog = page\.getByRole\('dialog'\);/g, "const dialog = page.getByTestId('modal-container');");
content = content.replace(/dialog\.getByRole\('button', { name: 'Guardar AlteraÃ§Ãµes' }\)/g, "page.getByTestId('modal-confirm-btn')");
content = content.replace(/page\.locator\('li\[data-sonner-toast\]'\)/g, "page.getByTestId('toast-container').locator('li')");

// Fix some encoding if they already exist as corrupted (unlikely but safe)
content = content.replace(/autenticaÃ§Ã£o/g, 'autenticação');
content = content.replace(/pÃ¡gina/g, 'página');

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed locators in admin-partner-edit.spec.js');
