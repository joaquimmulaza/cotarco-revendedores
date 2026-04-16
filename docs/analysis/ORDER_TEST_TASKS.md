# Checklist de Implementação: Testes E2E de Encomendas

Este ficheiro serve como o plano de execução para o próximo agente/sessão.

- [ ] **Fase 1: Preparação de Dados (Seeders)**
    - [ ] Atualizar `PlaywrightAuthSeeder.php` para incluir o produto `999998` (SKU: `E2E-ORDER-PROD-01`) com stock inicial.
    - [ ] Garantir que o `admin` e o `partner` padrão têm dados fidedignos para os testes.

- [ ] **Fase 2: Fluxo do Parceiro (Checkout)**
    - [ ] Modificar `tests/e2e/checkout.spec.js` para:
        - [ ] Adicionar o produto `999998` ao carrinho.
        - [ ] Completar o checkout.
        - [ ] Capturar o `merchantTransactionId` da resposta de rede ou do polling do UI.
        - [ ] Validar a exibição da referência de pagamento.

- [ ] **Fase 3: Integração e Webhooks**
    - [ ] Criar (ou adicionar ao `checkout.spec.js`) o passo de simulação de webhook:
        - [ ] Disparar POST para `/api/webhooks/appypay` com status `success`.
        - [ ] Aguardar processamento (pequeno delay ou polling).

- [ ] **Fase 4: Fluxo Administrativo**
    - [ ] Modificar `tests/e2e/admin-order-detail.spec.js` para:
        - [ ] Navegar para a lista de encomendas.
        - [ ] Filtrar por "Sucesso".
        - [ ] Clicar na encomenda gerada no passo anterior.
        - [ ] Validar que todos os campos (Cliente, Itens, Totais) estão correctos.
        - [ ] Testar download da fatura.

- [ ] **Fase 5: Verificação de Efeitos Secundários**
    - [ ] Validar decremento de stock: Navegar para a lista de stock do admin e verificar o SKU `E2E-ORDER-PROD-01`.
    - [ ] Validar envio de e-mails: Inspeccionar `/storage/logs/laravel.log` via script de teste se possível (ou apenas assumir se o log indicar sucesso).

## Notas Técnicas para o Agente
- Use `test.use({ storageState: 'playwright/.auth/admin.json' })` para o admin.
- Use `test.use({ storageState: 'playwright/.auth/partner.json' })` para o parceiro.
- Mantenha os timeouts de 120s para o polling de referências de pagamento.
