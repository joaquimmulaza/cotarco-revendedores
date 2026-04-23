# E2E Stabilization: Failure Audit & Tasks

## [PORTA DE ENTRADA] Bloqueadores de Conexão
Estes ficheiros estão a falhar com timeouts massivos, provavelmente devido ao erro de porta (8000 vs 8001):
- [ ] **admin-login.spec.js**: Garantir redirecionamento após login admin.
- [ ] **admin-dashboard.spec.js**: Corrigir navegação entre tabs com esperas por skeletons.

## [ADMIN] Gestão de Produtos & Parceiros
Ficheiros com falhas de lógica e seletores:
- [ ] **admin-product-management.spec.js**: 
    - [ ] Listagem de produtos (esperar por `.react-loading-skeleton` detach).
    - [ ] Debounce na pesquisa (aumentar `waitForTimeout` ou esperar por contador de resultados).
    - [ ] Filtro por categoria (validar `data-category-id`).
    - [ ] Expansão de variações (verificar seletor de expander/collapse).
- [ ] **admin-partner-actions.spec.js**: Estabilizar fluxo de aprovação de parceiro pendente.
- [ ] **admin-partner-edit.spec.js**: Corrigir edição de perfis (timeouts de 1.6m detetados).

## [PARTNER] Dashboard & Checkout
- [ ] **dashboard.spec.js**: Implementar regra de erro para "Sob consulta" no SKU de teste.
- [ ] **checkout.spec.js**: Garantir que o formulário de envio é preenchido após o carregamento completo do carrinho.
- [ ] **admin-order-lifecycle.spec.js**: Sincronizar o "Golden Flow" entre o checkout do parceiro e a visibilidade no admin.

## [EMAILS] Validação de Logs (0ms - Erros de Setup)
Estes testes falham instantaneamente, indicando erro no `beforeAll` ou dependências de ficheiros:
- [ ] **admin-email-partner-approval.spec.ts**
- [ ] **admin-email-partner-rejection.spec.ts**
- [ ] **admin-email-payment-success.spec.ts**
    - Verificar se o ficheiro `playwright/.auth/admin.json` existe e tem um token válido.
    - Verificar se os logs de email em `storage/logs/laravel.log` (no backend) estão acessíveis pela permissão do Windows.
