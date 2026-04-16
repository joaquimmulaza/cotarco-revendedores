# Technical Design: Order Management E2E Tests

Este documento descreve a arquitetura técnica para a implementação da suite de testes de encomendas.

## 1. Contexto e Objetivos
Consolidar os testes de `checkout.spec.js` e `admin-order-detail.spec.js` num fluxo coeso que valide a integridade dos dados (stock, status) e a integração entre frontend e backend (webhooks e jobs).

## 2. Abordagem de Implementação

### 2.1 Seeders de Isolamento
Utilizaremos o `PlaywrightAuthSeeder` para injetar um produto específico de teste:
- **SKU:** `E2E-ORDER-PROD-01`
- **ID Reservado:** `999998` (Adjacente ao fumo de teste `999999`)
- **Stock Inicial:** 10 unidades.

### 2.2 Utilitário de Webhook (Playwright Helper)
Para evitar depender de um ambiente real de AppyPay, o teste Playwright interagirá directamente com o endpoint de webhook.
```javascript
// Exemplo de chamada no teste
await request.post('http://127.0.0.1:8001/api/webhooks/appypay', {
  data: {
    merchantTransactionId: orderReference,
    responseStatus: { status: 'success' },
    reference: {
      entity: '12345',
      referenceNumber: '987654321',
      dueDate: '2026-12-31'
    }
  }
});
```

### 2.3 Verificação de Stock (Backend Integration)
Como o Playwright não tem acesso directo à BD MySQL sem drivers adicionais, utilizaremos um dos seguintes métodos:
1. **Endpoint de Teste:** Criar um endpoint temporário `/api/testing/check-stock/{sku}` protegido pelo `APP_ENV=testing`.
2. **Dashboard UI:** O teste navegará para a página de gestão de stock do admin e lerá o valor no ecrã (mais "E2E puro").

### 2.4 Verificação de E-mails
Configurar o Laravel para usar o driver `log` em testes. O teste Playwright pode ler o ficheiro `storage/logs/laravel.log` para confirmar a existência das strings:
- "A enviar e-mails de encomenda criada..."
- "A enviar e-mails de pagamento confirmado..."

## 3. Segurança e Ambiente
- **Portas:** Sagradas na `8001` (API) e `5173` (Client).
- **Database:** `cotarco_revendedores_test`.
- **CSRF:** Desativado para rotas de Webhook via `VerifyCsrfToken` middleware (padrão Laravel para API).
