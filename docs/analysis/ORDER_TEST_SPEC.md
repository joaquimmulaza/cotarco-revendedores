# Especificação de Testes E2E: Gestão de Encomendas

Esta especificação define os cenários de teste necessários para garantir a robustez do fluxo de encomendas.

## Cenário 1: Fluxo Completo de Sucesso (Happy Path)
**Objetivo:** Validar que um parceiro pode comprar, pagar e o admin ver a encomenda atualizada.

1. **Setup:** 
    - Login como Parceiro.
    - Garantir que existe um produto "Teste E2E" com stock = 10.
2. **Ações do Parceiro:**
    - Adicionar 2 unidades ao carrinho.
    - Preencher dados de envio.
    - Clicar em "Finalizar Encomenda".
3. **Validação de Transição:**
    - Esperar pelo status "Pagamento Gerado" (Polling do Job).
    - Verificar que a Entidade e Referência aparecem no UI.
4. **Simulação de Pagamento (Backend Action):**
    - Chamar o Webhook via API Mock (POST `/api/webhooks/appypay`) com status `success`.
5. **Validação Administrativa:**
    - Login como Admin.
    - Navegar para "Encomendas".
    - Encontrar a encomenda pelo ID.
    - Verificar status "Sucesso".
    - Validar que o stock do produto agora é 8.
    - Baixar a fatura PDF e verificar se não há erro.

## Cenário 2: Falha na Geração de Pagamento
**Objetivo:** Validar o comportamento do sistema quando o serviço externo de pagamentos falha.

1. **Simulação:** Mockar o Job `CreateAppyPayChargeJob` para falhar (marcar como `failed`).
2. **Validação:** 
    - O frontend deve mostrar uma mensagem de erro ou status "Falhou".
    - O stock não deve ser alterado.

## Cenário 3: Webhook de Pagamento Rejeitado
**Objetivo:** Validar que o sistema lida com pagamentos que não foram completados.

1. **Ação:** Chamar Webhook com status `failed`.
2. **Validação:**
    - Order status muda para `failed`.
    - Stock não decrementa.

## Requisitos de Dados (Seeders)
- **Produto E2E:** Nome "Produto Teste Fluxo", SKU "TEST-ORDER-001", Preço 1000 AOA, Stock 10.
- **Categoria:** "Testes Automatizados".
