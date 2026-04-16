# Pesquisa do Fluxo de Encomendas - Cotarco

Esta análise detalha a implementação técnica atual do ciclo de vida das encomendas para informar a estratégia de testes E2E.

## 1. Fluxo de Criação (Checkout)
- **Controller:** `App\Http\Controllers\OrderController@createPayment`
- **Operação:** 
    - Recebe `items` e `details` (shipping).
    - Calcula o total (arredondado para inteiro para a AppyPay).
    - Cria registo na tabela `orders` com status `pending`.
    - Cria itens da encomenda.
    - Despacha o Job `CreateAppyPayChargeJob`.
- **Resposta:** status `202 Accepted` com `merchantTransactionId`.

## 2. Processamento Assíncrono (Pagamento)
- **Job:** `App\Jobs\CreateAppyPayChargeJob`
- **Responsabilidades:**
    - Chama `AppyPayService` para gerar a referência de pagamento (Entidade/Referência).
    - Atualiza `shipping_details` com os dados de referência.
    - Envia e-mails iniciais:
        - `OrderPlacedCustomer`: Com os dados de pagamento.
        - `OrderPlacedAdmin`: Notificando nova encomenda pendente.

## 3. Confirmação de Pagamento (Webhook)
- **Controller:** `App\Http\Controllers\WebhookController@handleAppyPay`
- **Gatilho:** Recebe POST da AppyPay com o status do pagamento.
- **Ações no Sucesso:**
    - Atualiza status da encomenda para `success`.
    - **Gestão de Stock:** Decrementa a quantidade vendida na tabela `product_prices`.
    - Se o stock chegar a zero, marca o produto como `outofstock` na tabela `products`.
    - Envia e-mails de sucesso:
        - `PaymentSuccessCustomer`.
        - `PaymentSuccessAdmin`.
    - Guarda referências finais em `shipping_details`.

## 4. Visualização e Gestão (Admin)
- **Frontend Component:** `OrderList.jsx` (Lista com filtros de status e pesquisa).
- **Page:** `OrderDetailPage.jsx` (Detalhes completos, histórico e download de fatura).
- **Endpoint Fatura:** `GET /admin/orders/{id}/invoice`.

## 5. Pontos Críticos para Testes
- **Race Conditions:** O frontend faz polling da encomenda enquanto o Job processa. O teste deve lidar com esperas dinâmicas.
- **Isolamento de Dados:** Cada teste deve usar um SKU/Produto específico para validar o decremento de stock sem interferência.
- **E-mails:** No ambiente de teste, verificar se os e-mails são disparados (logs).
