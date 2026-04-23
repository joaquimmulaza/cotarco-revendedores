# TLC Design: E2E Test Stabilization

## 1. Environment Configuration
### Port Resolution (8000 vs 8001)
- O `playwright.config.js` será modificado para garantir que o `VITE_API_URL` e `VITE_API_PORT` são passados corretamente.
- Se o `.env` estiver a causar problemas, usaremos o flag `--mode e2e` no Vite e criaremos um ficheiro `.env.e2e` temporário ou injetaremos diretamente via shell.

## 2. Business Logic Validation: "Sob Consulta"
### Assertion Strategy
Para validar que um produto NÃO está em estado "Sob consulta":
```javascript
const priceBadge = productCard.locator('span:has-text("Sob consulta")');
await expect(priceBadge).not.toBeVisible({
  message: "Este produto de teste não deveria estar 'Sob consulta'. Verifique o stock/preço no backend."
});
```

### Affected Tests
- `dashboard.spec.js`: No carregamento inicial por categoria.
- `checkout.spec.js`: Antes de adicionar ao carrinho.
- `admin-product-management.spec.js`: Na coluna de preço da tabela de produtos.

## 3. UI Synchronization
### Skeleton Handling
Usar `page.locator('.react-loading-skeleton').waitFor({ state: 'detached' })` ou aguardar por um elemento específico que só aparece após o loading (ex: `data-testid="categories-list"`).

## 4. Test Locators Refnement
- **Categories:** `[data-testid="categories-list"] button[data-category-id]`
- **Product Rows (Admin):** `tr[data-testid="product-row"]`
- **Expanders:** `button[data-testid="expander-button"]` (se existir) ou seletor de posição resiliente.
