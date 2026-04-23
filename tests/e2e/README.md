# E2E Testing Documentation

Este diretório contém a suite de testes de ponta-a-ponta (E2E) para o projeto Cotarco.

## Arquitetura de Teste
Os testes correm num ambiente isolado com as seguintes regras:
- **Porta da API:** `8001` (Iniciada via `php artisan serve`).
- **Base de Dados:** `cotarco_revendedores_test`.
- **Frontend:** Porta `5173`.

## Convenções de Código
- **Localizadores:** Preferir `getByTestId`, `getByRole` e `getByText`.
- **Custom Selectors:**
    - `data-testid="categories-list"`: Menu de categorias no dashboard.
    - `data-testid="product-row"`: Linhas da tabela de administração.
- **Sincronização:** Nunca usar `waitForTimeout`. Usar asserções automáticas do Playwright ou aguardar por skeletons.

## A Regra de Negócio "Sob Consulta"
Foi implementada uma regra estrita para os testes:
**Produtos de teste (SKUs definidos em `helpers/productData.js`) não devem apresentar o estado "Sob consulta".**

Se um teste encontrar o badge "Sob consulta" num destes produtos, deve falhar imediatamente. Isto garante que os jobs de processamento de stock estão a funcionar e que os preços estão a ser injetados corretamente.

### Exemplo de Validação:
```javascript
const product = page.locator(`[data-sku="${PRODUCT_TEST_DATA.SKU_PARENT}"]`);
await expect(product.getByText('Sob consulta')).not.toBeVisible();
```

## Como Correr os Testes
1. Pare o backend e frontend de desenvolvimento.
2. Execute `npx playwright test`.
3. Para ver o relatório: `npx playwright show-report`.
