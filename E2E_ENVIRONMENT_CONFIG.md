# E2E Environment Configuration Guide

Este documento serve para garantir que o ambiente de execução de testes está corretamente isolado do ambiente de desenvolvimento.

## 1. Conflito de Portas (Causa Raiz)
Identificamos que o frontend `cotarco-client` utiliza um ficheiro `.env` que por vezes sobrepõe as variáveis injetadas pelo Playwright.

### Solução no comando de execução:
O próximo agente deve garantir que o comando no `playwright.config.js` ou no terminal utiliza `cross-env` para forçar as portas:
```bash
VITE_API_URL=http://127.0.0.1:8001/api VITE_API_PORT=8001 npm run dev
```

## 2. Bases de Dados
- **API Test Server:** Deve correr sempre com `APP_ENV=testing`.
- **Database:** `cotarco_revendedores_test`.

## 3. Logs de Email (Crucial para tests/e2e/admin-email-*)
Os testes de email dependem da leitura do log do Laravel. 
- O helper `emailHelper.js` procura em: `c:/cotarco-revendedores/cotarco-api/storage/logs/laravel.log`.
- Se os testes de email falharem com 0ms, verificar se o log está vazio ou se o caminho está incorreto no ambiente Windows.

## 4. Credenciais Padrão
- **Admin:** `joaquimmulazadev@gmail.com` / `cotarco.2025`
- **Partner:** `marketing@soclima.com` / `cotarco.2025` (ou password definida no register)
