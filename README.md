# Cotarco Distribuidores

>**Cotarco Distribuidores** é um marketplace B2B e B2C (Business to Business e Business to Consumer) que oferece uma vasta gama de eletrodomésticos, telemóveis, e acessórios da marca Samsung construído para gerenciar o registro, aprovação e as operações de distribuidores da Cotarco. O sistema é composto por uma arquitetura separada com um **Frontend (Client)** em React (Vite) e um **Backend (API)** em Laravel. Através dessa plataforma, distribuidores podem se registrar, e no registo submeter a documentação (ex: alvarás) para validar a empresa, fazer login, visualizar produtos (com suporte a descrições customizadas originárias do WooCommerce) e realizar pedidos (com pagamentos integrados via API do gateway AppyPay usando referências Multicaixa). Administradores podem gerir aprovações de distribuidores pendentes.

---

## Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Instalação e Setup](#instalação-e-setup)
- [Executar Localmente](#executar-localmente)
- [Estrutura de Diretórios](#estrutura-de-diretórios)
- [Rotas da API](#rotas-da-api)
- [Fluxos Principais](#fluxos-principais)
- [Testes](#testes)
- [Comandos Artisan Úteis](#comandos-artisan-úteis)
- [Deploy (Produção)](#deploy-produção)

---

## Visão Geral

O **Cotarco Distribuidores** é um marketplace B2B e B2C que permite à Cotarco gerir toda a operação com os seus parceiros comerciais. A plataforma cobre o ciclo completo: desde o **registo e onboarding** de novos distribuidores (com envio de documentação como alvarás), passando pela **aprovação administrativa**, até ao **catálogo de produtos** com preços diferenciados B2B/B2C e **checkout com pagamento via referência Multicaixa**.

### Papéis de Utilizador

| Papel | Descrição |
|---|---|
| `admin` | Gere aprovações, rejeições, encomendas e ficheiros de stock |
| `partner` (revendedor) | Acede ao catálogo, faz encomendas e descarrega ficheiros de stock |
| `distribuidor` | Variação do role de parceiro com modelo de negócio diferente |

### Estados de Conta de Parceiro

```
registered → pending_approval → approved
                              ↘ rejected
```

---

## Arquitetura

O projeto é composto por **duas aplicações independentes** que comunicam via API REST:

```
cotarco-revendedores/
├── cotarco-api/        # Backend — Laravel 12.x (API REST + Jobs + Serviços)
└── cotarco-client/     # Frontend — React 19 + Vite (SPA)
```

### Diagrama de Comunicação

```
[React SPA] ──(HTTP/JSON)──→ [Laravel API]
                                  │
                    ┌─────────────┼─────────────┐
                    ↓             ↓             ↓
               [MySQL DB]  [AppyPay API]  [WooCommerce API]
                              (OAuth2)      (REST Basic Auth)
```

---

## Tecnologias

### Backend (`cotarco-api`)

| Tecnologia | Versão | Uso |
|---|---|---|
| PHP | ^8.2 | Runtime |
| Laravel | ^12.0 | Framework principal |
| Laravel Sanctum | ^4.2 | Autenticação via tokens (API) |
| MySQL | — | Base de dados principal |
| maatwebsite/excel | ^3.1 | Processamento de ficheiros de stock (.xlsx) |
| barryvdh/laravel-dompdf | ^3.1 | Geração de faturas PDF |
| Symfony DOM Crawler | ^7.3 | Parsing de HTML para descrições WooCommerce |
| PHPUnit | ^11.5 | Testes unitários e de feature |

### Frontend (`cotarco-client`)

| Tecnologia | Versão | Uso |
|---|---|---|
| React | ^19.1 | Framework UI |
| Vite | ^7.1 | Build tool e servidor de desenvolvimento |
| React Router DOM | ^7.8 | Roteamento SPA (basename: `/distribuidores`) |
| TailwindCSS | ^4.1 | Estilização utilitária |
| Radix UI | — | Componentes acessíveis (Dialog, Radio Group) |
| Framer Motion | ^12 | Animações |
| TanStack Query | ^5.90 | Cache e estado do servidor |
| TanStack Table | ^8.21 | Tabelas de dados |
| React Hook Form | ^7.64 | Gestão de formulários |
| Axios | ^1.11 | Cliente HTTP |
| Sonner | ^2 | Notificações toast |
| Vitest | ^3.2 | Testes unitários |
| Playwright | ^1.59 | Testes E2E |

---

## Pré-requisitos

- **PHP** >= 8.2 com extensões: `pdo_mysql`, `bcmath`, `openssl`, `tokenizer`, `xml`, `gd`
- **Composer** >= 2.x
- **Node.js** >= 20.x e **npm** >= 10.x
- **MySQL** >= 8.0 (gerido localmente via PhpMyAdmin)
- Credenciais ativas de:
  - **WooCommerce REST API** (Consumer Key + Secret)
  - **AppyPay Gateway** (OAuth2: Client ID, Client Secret, Resource, Payment Method ID)
  - Servidor **SMTP** configurado (produção: `mail.cotarco.co.ao`)

---

## Configuração do Ambiente

### 1. Backend (`cotarco-api/.env`)

Copie o ficheiro de exemplo e preencha os valores:

```bash
cd cotarco-api
cp .env.example .env
php artisan key:generate
```

Bloco de variáveis obrigatório:

```dotenv
APP_URL=http://localhost
FRONTEND_URL=http://localhost:5173/distribuidores

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cotarco_revendedores
DB_USERNAME=root
DB_PASSWORD=

# WooCommerce REST API
WOOCOMMERCE_STORE_URL=""
WOOCOMMERCE_CONSUMER_KEY=""
WOOCOMMERCE_CONSUMER_SECRET=""

# AppyPay — Gateway de Pagamento (OAuth 2.0)
APPYPAY_CLIENT_ID=""
APPYPAY_CLIENT_SECRET=""
APPYPAY_RESOURCE=""
APPYPAY_PAYMENT_METHOD_ID=""
APPYPAY_AUTH_URL="https://login.microsoftonline.com/auth.appypay.co.ao/oauth2/token"
APPYPAY_API_URL="https://gwy-api.appypay.co.ao"

QUEUE_CONNECTION=database
MAIL_MAILER=smtp
MAIL_HOST=mail.cotarco.co.ao
MAIL_PORT=587
MAIL_USERNAME=""
MAIL_PASSWORD=""
MAIL_FROM_ADDRESS="noreply@cotarco.co.ao"
```

> **⚠️ Nunca commitar credenciais reais.** O ficheiro `.env` está no `.gitignore`.

### 2. Ambiente de Testes (`cotarco-api/.env.testing`)

Usado automaticamente pelo PHPUnit. Aponta para a base de dados isolada:

```dotenv
DB_DATABASE=cotarco_revendedores_test
QUEUE_CONNECTION=sync
MAIL_MAILER=array
```

### 3. Frontend (`cotarco-client/.env`)

```dotenv
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## Instalação e Setup

### Backend

```bash
cd cotarco-api

# Instalar dependências PHP
composer install

# Criar a base de dados no MySQL e executar as migrações
php artisan migrate

# Popular com dados de seed (admin, parceiros de teste, produtos)
php artisan db:seed

# Criar link simbólico para storage público
php artisan storage:link
```

### Frontend

```bash
cd cotarco-client

# Instalar dependências Node.js
npm install
```

---

## Executar Localmente

### Backend (modo completo com queue e logs)

```bash
cd cotarco-api
composer run dev
```

Este comando executa em paralelo:
- `php artisan serve` — servidor HTTP na porta 8000
- `php artisan queue:listen --tries=1` — worker de filas (jobs assíncronos)
- `php artisan pail --timeout=0` — logs em tempo real
- `npm run dev` — assets Vite do backend (se houver)

### Frontend

```bash
cd cotarco-client
npm run dev
```

O frontend ficará disponível em: **http://127.0.0.1:5173/distribuidores**

---

## Estrutura de Diretórios

```
cotarco-api/
├── app/
│   ├── Actions/            # Lógica de domínio isolada (ex: registo de parceiro)
│   ├── Console/Commands/   # 22 comandos Artisan personalizados para manutenção e debug
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/      # AdminController, PartnerController, OrderController (admin)
│   │   │   ├── Api/        # ProductController, CategoryController
│   │   │   ├── Auth/       # AuthController, RegisterController
│   │   │   ├── OrderController.php       # Checkout de parceiros
│   │   │   ├── StockFileController.php   # Gestão de ficheiros de stock
│   │   │   └── WebhookController.php     # Webhooks AppyPay
│   │   ├── Middleware/     # Middlewares de autenticação (admin, parceiro)
│   │   └── Requests/       # Form Requests com validação
│   ├── Jobs/
│   │   ├── CreateAppyPayChargeJob.php    # Criação assíncrona de cobrança Multicaixa
│   │   ├── ProcessStockFileJob.php       # Processamento de ficheiros de stock .xlsx
│   │   └── ProcessStockMapJob.php        # Mapeamento de stock
│   ├── Mail/               # Mailables: aprovação, rejeição, verificação de email
│   ├── Models/
│   │   ├── User.php
│   │   ├── PartnerProfile.php
│   │   ├── Category.php
│   │   ├── Product.php
│   │   ├── ProductPrice.php
│   │   ├── Order.php
│   │   ├── OrderItem.php
│   │   └── StockFile.php
│   ├── Notifications/
│   ├── Observers/
│   ├── Services/
│   │   ├── AppyPayService.php      # OAuth2 + criação de cobranças Multicaixa
│   │   └── WooCommerceService.php  # Sincronização de produtos e descrições customizadas
│   └── Providers/
├── database/
│   ├── migrations/         # 26 migrações
│   └── seeders/
└── routes/
    └── api.php             # Definição de todas as rotas da API

cotarco-client/
├── src/
│   ├── App.jsx             # Router principal (basename: /distribuidores)
│   ├── components/
│   │   ├── admin/          # Componentes exclusivos do painel admin
│   │   ├── ui/             # Componentes base (Button, Dialog, etc.)
│   │   ├── Header.jsx
│   │   ├── ProductCard.jsx
│   │   ├── ProductDetailModal.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── StockFileManager.jsx
│   │   └── CartDrawer.jsx
│   ├── contexts/           # React Contexts (Auth, Cart, etc.)
│   ├── hooks/              # Custom hooks
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── ForgotPassword.jsx + ResetPassword.jsx
│   │   ├── EmailVerificationPending.jsx + EmailValidated.jsx
│   │   ├── Dashboard.jsx          # Dashboard principal do revendedor
│   │   ├── CheckoutPage.jsx       # Checkout com integração AppyPay
│   │   ├── OrderDetailPage.jsx    # Detalhe da encomenda e referência Multicaixa
│   │   ├── AdminLogin.jsx
│   │   └── AdminDashboard.jsx
│   └── services/           # Comunicação com a API (axios)
└── tests/
    ├── e2e/                # Testes Playwright (login, registo, checkout, admin)
    └── unit/               # Testes Vitest/RTL
```

---

## Rotas da API

### Públicas

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/api/register` | Registo de novo revendedor |
| `POST` | `/api/login` | Login de revendedor |
| `POST` | `/api/admin/login` | Login de administrador |
| `POST` | `/api/forgot-password` | Solicitar reset de senha |
| `POST` | `/api/reset-password` | Redefinir senha |
| `GET` | `/api/email/verify/{id}/{hash}` | Verificação de email (redirect para frontend) |
| `POST` | `/api/webhooks/appypay` | Webhook de atualização de pagamento AppyPay |

### Protegidas — Parceiros (`auth:sanctum` + middleware `parceiro`)

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/categories` | Listar categorias |
| `GET` | `/api/products` | Listar produtos com preços B2B |
| `POST` | `/api/orders/create-payment` | Criar encomenda e iniciar pagamento Multicaixa |
| `GET` | `/api/orders/payment-reference/{id}` | Consultar referência de pagamento gerada |
| `GET` | `/api/parceiro/stock-files` | Listar ficheiros de stock disponíveis |
| `GET` | `/api/parceiro/stock-files/{file}/download` | Descarregar ficheiro de stock específico |

### Protegidas — Admin (`auth:sanctum` + middleware `admin`)

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/admin/dashboard-stats` | Estatísticas do painel |
| `GET/PUT` | `/api/admin/partners` | Listar e gerir parceiros |
| `PUT` | `/api/admin/partners/{user}/status` | Aprovar ou rejeitar parceiro |
| `GET` | `/api/admin/partners/{user}/alvara` | Descarregar alvará de um parceiro |
| `GET` | `/api/admin/orders` | Listar todas as encomendas |
| `GET` | `/api/admin/orders/{order}/invoice` | Descarregar fatura PDF |
| `GET/POST/PATCH/DELETE` | `/api/admin/stock-files/*` | Gestão completa de ficheiros de stock |

---

## Fluxos Principais

### 1. Onboarding de Revendedor

```
Registo (Register.jsx)
  → Upload de alvará + dados da empresa
  → Email de verificação enviado
  → Utilizador clica no link → status: pending_approval
  → Admin recebe notificação
  → Admin aprova/rejeita no painel
  → Revendedor recebe email com resultado
```

### 2. Checkout com Pagamento Multicaixa

```
Dashboard.jsx → adicionar produtos ao carrinho
  → CheckoutPage.jsx → submeter encomenda
  → POST /api/orders/create-payment
  → Laravel cria Order + dispara CreateAppyPayChargeJob
  → Job: AppyPayService.getAccessToken() (OAuth2 com cache)
  → Job: AppyPayService.createCharge() → API AppyPay
  → API retorna entidade + referência Multicaixa
  → Email enviado ao parceiro com dados de pagamento
  → OrderDetailPage.jsx → polling de GET /payment-reference/{id}
```

### 3. Sincronização de Produtos (WooCommerce)

```
php artisan woocommerce:sync
  → WooCommerceService.php → WooCommerce REST API
  → Importa/atualiza products, categories, product_prices
  → Descrições customizadas: iframes extraídos via DOM Crawler
  → Estratégia de fallback: custom_desc → long_desc → short_desc
```

---

## Testes

### Backend (PHPUnit)

```bash
cd cotarco-api

# Executar todos os testes (usa .env.testing automaticamente)
composer test

# Ou diretamente
php artisan test

# Executar um ficheiro específico
php artisan test tests/Feature/Auth/RegisterTest.php
```

> Os testes usam a base de dados `cotarco_revendedores_test` com queue síncrona e mailer em memória.

### Frontend — Unitários (Vitest)

```bash
cd cotarco-client

# Modo watch (desenvolvimento)
npm test

# Execução única (CI)
npm run test:run

# Interface gráfica
npm run test:ui
```

### Frontend — E2E (Playwright)

```bash
cd cotarco-client

# Executar todos os testes E2E
npm run test:e2e

# Executar um ficheiro específico
npx playwright test tests/e2e/checkout.spec.js

# Com interface gráfica
npx playwright test --ui
```

> **Regra de TDD:** Todo o código funcional deve ser precedido pelos seus testes. O commit só é permitido após todos os testes passarem (verde/100%).

---

## Comandos Artisan Úteis

### Diagnóstico e Manutenção

```bash
# Verificar estado do registo de um parceiro
php artisan debug:partner-registration

# Corrigir utilizadores sem PartnerProfile associado
php artisan fix:orphan-users

# Validar permissões de ficheiros em produção
php artisan check:production-permissions

# Forçar verificação de email de um utilizador
php artisan email:force-verify {email}

# Reenviar email de verificação
php artisan email:resend {email}

# Limpar cache do WooCommerce
php artisan woocommerce:clear-cache

# Sincronizar produtos com WooCommerce
php artisan woocommerce:sync

# Medir performance da integração WooCommerce
php artisan woocommerce:measure-performance
```

### Desenvolvimento e Debug

```bash
# Listar todos os utilizadores
php artisan users:list

# Listar todos os perfis de parceiro
php artisan partners:list

# Gerar token de admin para testes
php artisan admin:generate-token

# Testar envio de emails
php artisan email:test {email}
```

---

## Deploy (Produção)

O projeto está hospedado em **cPanel (Shared Hosting)**. O script de deploy está em `deploy-local.ps1` (PowerShell) e o YAML de deploy do cPanel em `.cpanel.yml`.

### Considerações de Produção

- **Queue Worker:** Em shared hosting, utilizar `QUEUE_CONNECTION=database` com cron jobs para `php artisan queue:work` (respeitar limites de CPU e memória do plano).
- **SSH:** Sessões SSH em shared hosting podem ter limites de tempo; preferir comandos rápidos.
- **Storage:** Os alvarás são armazenados no filesystem privado (`storage/app/private`). Garantir que as permissões estão corretas com `php artisan check:production-permissions`.
- **`.env` do Frontend:** A variável `VITE_API_BASE_URL` deve apontar para o domínio de produção.