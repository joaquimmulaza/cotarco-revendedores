# Technical Design Document: E2E Test Stabilization & Business Logic Guardrails

## 1. Introduction
O objetivo deste documento é definir a arquitetura e os padrões técnicos para a estabilização da suite de testes E2E do projeto Cotarco. O foco principal é resolver problemas de infraestrutura de teste (portas) e implementar validações automáticas para o estado "Sob consulta".

## 2. Problem Statement
### 2.1 Configuration Drift (Port 8000 vs 8001)
O frontend (Vite) está a ignorar a variável de ambiente `VITE_API_URL` injetada pelo Playwright porque o ficheiro `.env` local tem precedência. Isto faz com que os testes tentem comunicar com a API de desenvolvimento (8000) em vez da API de testes (8001).

### 2.2 "Sob Consulta" Validation
Produtos que não têm preço definido no mapa de stock (ou cujos jobs falharam) exibem "Sob consulta". Atualmente, os testes não validam se isto é um estado esperado ou um erro de integração.

## 3. Proposed Solution
### 3.1 Network Isolation Implementation
Modificar a inicialização do `webServer` no `playwright.config.js` para usar um comando que garanta a sobreposição das configurações do `.env`:
```bash
npx cross-env VITE_API_URL=http://127.0.0.1:8001/api VITE_API_PORT=8001 npm run dev
```

### 3.2 Product Pricing Guardrails
Implementar asserções negativas para o texto "Sob consulta" nos fluxos críticos:
- **Selector:** `.product-card span:has-text("Sob consulta")`
- **Logic:** `await expect(page.locator('text=Sob consulta')).not.toBeVisible()` em contextos de produtos semeados para teste.

### 3.3 UI Synchronization Patterns
Substituir esperas baseadas em tempo (`waitForTimeout`) por esperas baseadas em estado de elementos (skeletons):
```javascript
await expect(page.locator('.react-loading-skeleton')).not.toBeVisible();
```

## 4. Architecture Impact
### 4.1 Test Files
- **playwright.config.js:** Ponto único de verdade para portas e URLs.
- **tests/e2e/helpers/productData.js:** Centralização de SKUs e categorias esperadas.

### 4.2 Application Code
- **Nenhuma alteração permitida.** A solução deve ser puramente baseada na camada de teste.

## 5. Risk Assessment
- **Sincronização:** Se os skeletons demorarem muito a aparecer (rede lenta), o teste pode falhar precocemente. É vital usar `waitForSelector` com o estado `attached` primeiro.
- **Flakiness:** A limpeza da base de dados no `global.setup.js` deve ser atómica para evitar poluição entre diferentes rodagens de teste.

## 6. Maintenance Plan
Qualquer novo componente de UI que inclua estados de carregamento (loadings/spinners) deve ter o respetivo tratamento adicionado à suite E2E na primeira implementação.
