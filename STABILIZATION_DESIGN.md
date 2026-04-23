# E2E Stabilization: Design Patterns & Strategies

## 1. Padrão de Sincronização por Skeletons
Para evitar os erros de timeout (33s - 54s) vistos em `admin-product-management.spec.js`, o agente deve usar este padrão:
```javascript
// Aguardar que o loading comece (opcional mas seguro)
const skeleton = page.locator('.react-loading-skeleton');
// Aguardar que o loading termine
await skeleton.waitFor({ state: 'detached', timeout: 20000 });
```

## 2. Validação da Regra "Sob Consulta"
Nos testes de `dashboard` e `product-management`, substituir a verificação de preço genérica por uma que capture o erro de negócio:
```javascript
const priceCell = row.locator('td.price-column'); // Ajustar seletor real
const priceText = await priceCell.innerText();
if (priceText.includes('Sob consulta')) {
  throw new Error("ERRO DE NEGÓCIO: Produto não deveria estar 'Sob consulta' neste contexto.");
}
```

## 3. Login Automático e State
Muitos testes de admin falham porque o `storageState` pode estar expirado ou a porta da API mudou.
- O agente deve verificar se o ficheiro `playwright/.auth/admin.json` aponta para a porta correta (`8001`).
- Se houver falha de "Acesso Negado" ou redirecionamento infinito, deve regenerar o estado de autenticação manualmente num teste de setup.

## 4. Debounce em Pesquisas
Para testes de pesquisa (search items), usar `page.fill()` seguido de `page.press('Enter')` ou uma espera explícita de `800ms` antes de contar os resultados, para acomodar o debounce do React:
```javascript
await page.fill('input[placeholder*="Pesquisar"]', 'Termo de Teste');
await page.waitForTimeout(1000); // Debounce + Latência API
await expect(page.locator('tr[data-testid="product-row"]')).toBeVisible();
```
