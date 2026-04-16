# PROMPT DE EXECUÇÃO: Implementação de Testes E2E (Fluxo 360º de Encomendas)

Copia este prompt para um novo chat para iniciar a implementação com contexto total.

---

## 🎯 OBJETIVO
Implementar um teste End-to-End (E2E) coeso que valide todo o ciclo de vida de uma encomenda na plataforma Cotarco: do checkout do Parceiro até à gestão e decremento de stock no painel Admin.

## 📂 FICHEIROS DE CONTEXTO (Lê estes ficheiros primeiro)
1. **[E2E_TEST_ARCHITECTURE_v2.md](file:///c:/cotarco-revendedores/cotarco-client/E2E_TEST_ARCHITECTURE_v2.md)**: Arquitetura sagrada de testes.
2. **[ORDER_FLOW_RESEARCH.md](file:///c:/cotarco-revendedores/docs/analysis/ORDER_FLOW_RESEARCH.md)**: Pesquisa técnica do fluxo.
3. **[ORDER_TEST_SPEC.md](file:///c:/cotarco-revendedores/docs/analysis/ORDER_TEST_SPEC.md)**: Especificação dos cenários.
4. **[ORDER_TEST_DESIGN.md](file:///c:/cotarco-revendedores/docs/analysis/ORDER_TEST_DESIGN.md)**: Design técnico da implementação.
5. **[ORDER_TEST_TASKS.md](file:///c:/cotarco-revendedores/docs/analysis/ORDER_TEST_TASKS.md)**: Checklist detalhada.

## 🛠️ TAREFAS DE IMPLEMENTAÇÃO

### 1. Backend: Preparação de Dados
- **Modificar [PlaywrightAuthSeeder.php](file:///c:/cotarco-revendedores/cotarco-api/database/seeders/PlaywrightAuthSeeder.php)**:
  - Injetar o produto ID `999998`, SKU `E2E-ORDER-PROD-01`, Preço `1000`, Stock `10`.
  - Associar à categoria ID `999998` ("Testes Automatizados").

### 2. E2E: Novo Teste "Golden Flow"
- **Criar [admin-order-lifecycle.spec.js](file:///c:/cotarco-revendedores/cotarco-client/tests/e2e/admin-order-lifecycle.spec.js)**:
  - **Ator Parceiro**: Realizar login, adicionar 2 unidades do produto `E2E-ORDER-PROD-01`, finalizar checkout. 
  - **Interceção de API**: Capturar o `merchantTransactionId` da resposta de `create-payment`.
  - **Simulação de Webhook**: Usar `request.post` para simular o sucesso do pagamento no endpoint `/api/webhooks/appypay`.
  - **Ator Admin**: Navegar para a lista de encomendas, encontrar a encomenda "Sucesso", validar detalhes e baixar fatura.
  - **Verificação de Stock**: Navegar para a lista de produtos/preços e validar que o stock é `8`.

### 3. Verificação de E-mails (Automated)
- Adicionar um passo no teste para ler `storage/logs/laravel.log` na API e verificar a existência das mensagens de disparo de e-mail:
  - "A enviar e-mails de encomenda criada..."
  - "A enviar e-mails de pagamento confirmado..."

## ⚠️ REGRAS DE OURO
- API na porta **8001**, Client na **5173**.
- Base de dados: **cotarco_revendedores_test**.
- Nunca usar IDs hardcoded, excepto os IDs de sistema reservados (`999999`, `999998`).
- Usar `toBeVisible()` e `waitForResponse()` para sincronização robusta.

---
**Instrução para o Agente:** Começa por configurar os seeders e depois avança para a criação do ficheiro `.spec.js`. Verifica cada passo com `npx playwright test`.
