# Contexto do Projeto: Cotarco Revendedores

## 📌 Descrição do Projeto
**Cotarco Distribuidores** é um marketplace B2B e B2C (Business to Business e Business to Consumer) que oferece uma vasta gama de eletrodomésticos, telemóveis, e acessórios da marca Samsung construído para gerenciar o registro, aprovação e as operações de distribuidores da Cotarco. O sistema é composto por uma arquitetura separada com um **Frontend (Client)** em React (Vite) e um **Backend (API)** em Laravel. Através dessa plataforma, distribuidores podem se registrar, e no registo submeter a documentação (ex: alvarás) para validar a empresa, fazer login, visualizar produtos (com suporte a descrições customizadas originárias do WooCommerce) e realizar pedidos (com pagamentos integrados via API do gateway AppyPay usando referências Multicaixa). Administradores podem gerir aprovações de distribuidores pendentes.

---

## 🏗 Infraestrutura, Base de Dados e Variáveis de Ambiente
*   **SGBD:** MySQL (Gerido pelo PhpMyAdmin).
*   **Bases de Dados Nativas:**
    *   **Produção/Desenvolvimento (`.env` e `.env.example`):** Focadas na BD `cotarco_revendedores`. Utiliza `QUEUE_CONNECTION=database` e envio SMTP mapeado para `mail.cotarco.co.ao`.
    *   **Testes (`.env.testing`):** Direcionada exatamenta à BD isolada `cotarco_revendedores_test`. Comportamento sincrono e silencioso (`QUEUE_CONNECTION=sync` e `MAIL_MAILER=array`).
*   **Configurações e Chaves (.env):** Toda a integração do projeto baseia-se num sistema *secret-driven*, com uma configuração local estrita obrigatória. O ambiente necessita imperativamente da parametrização real de chaves da API WooCommerce (para gestão e descrições customizadas de faturas) bem como das credenciais OAUTH completas do Gateway AppyPay. Eis um reflexo do bloco essencial a ser injetado pelos desenvolvedores:
    ```dotenv
    APP_URL=http://localhost
    
    # WOOCOMMERCE API CREDENTIALS
    WOOCOMMERCE_STORE_URL=""
    WOOCOMMERCE_CONSUMER_KEY=""
    WOOCOMMERCE_CONSUMER_SECRET=""
    
    # Credenciais OAuth 2.0 - Gateway de Pagamento
    APPYPAY_CLIENT_ID=""
    APPYPAY_CLIENT_SECRET=""
    APPYPAY_RESOURCE=""
    
    # ID do Método de Pagamento (Referência Multicaixa)
    APPYPAY_PAYMENT_METHOD_ID=""
    
    # URLs da API
    APPYPAY_AUTH_URL="https://login.microsoftonline.com/auth.appypay.co.ao/oauth2/token"
    APPYPAY_API_URL="https://gwy-api.appypay.co.ao"
    ```
*   **Ambiente de Produção:** O deploy encontra-se hospedado num ambiente de hospedagem compartilhada (Shared Hosting) gerido via **cPanel**. Esta informação é fundamental no momento de criar tarefas de cron, automatizações ou otimizações, já que o ambiente partilhado possui limites de recursos e bloqueios nas sessões SSH.

---

## 📂 Análise da Árvore de Diretórios

A estrutura raiz principal (`c:\cotarco-revendedores`) está dividida em duas aplicações independentes:

### 1. `cotarco-api/` (Backend Laravel 12.x)
- **`app/Http/Controllers/`**: Contém a lógica das rotas da API.
  - `Auth/`: Controladores de autenticação e registro.
  - `Admin/`: Controladores para ações administrativas (ex: aprovar revendedores).
  - `OrderController.php`, `StockFileController.php`, `WebhookController.php`: Controladores de domínio para pedidos, arquivos de estoque e webhooks.
- **`app/Models/`**: Modelos Eloquent do banco de dados representativos do domínio.
  - `User.php`, `PartnerProfile.php`: Modelos principais para usuários e perfis de parceiros.
  - `Category.php`, `Product.php`, `ProductPrice.php`: Modelos de catálogo.
  - `Order.php`, `OrderItem.php`, `StockFile.php`: Modelos operacionais.
- **`routes/`**: Definições das rotas da API (incluindo autenticação, administração e dados de produto).
- **Scripts de Debug**: Existência de ferramentas CLI customizadas como `php artisan debug:partner-registration` para manutenção da base.

### 2. `cotarco-client/` (Frontend React 19 + Vite)
- **`src/pages/`**: Páginas da aplicação.
  - **Auth/Onboarding**: `Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`, `EmailVerificationPending.jsx`, `EmailValidated.jsx`.
  - **Revendedor**: `Dashboard.jsx`, `CheckoutPage.jsx`, `OrderDetailPage.jsx`.
  - **Admin**: `AdminDashboard.jsx`, `AdminLogin.jsx`.
- **`src/components/`, `src/hooks/`, `src/services/`, `src/contexts/`**: Arquitetura padrão React componentizada e modular para chamadas à API, estado global e reusabilidade de UI. Estrutura baseada em TailwindCSS, Radix UI e Framer Motion.

---

## ✅ O que já está implementado (Status Atual)

*   **Autenticação e Autorização:**
    *   Sistema base utilizando Laravel Sanctum (Tokens JWT).
    *   Registro de novos distribuidores (fluxo de onboarding de distribuidores).
    *   Páginas de Login separadas (Login de distribuidores e Login de Admin).
    *   Recuperação e redefinição de senha (`ForgotPassword`, `ResetPassword`).
    *   Validação de e-mail implementada.

*   **Gestão de distribuidores (Admin):**
    *   Lista de distribuidores pendentes.
    *   Aprovação e rejeição de registro de distribuidores.
    *   Envio automatizado de e-mails de notificação (RevendedorApproved, RevendedorRejected).
    *   Criação automática do `PartnerProfile` ligado ao `User`.
    *   Armazenamento de documentação (`alvaras`) no file system privado com gestão de permissões.

*   **Catálogo e Produtos:**
    *   Exibição de produtos, categorias e integrações de preços.
    *   Integração Customizada de Descrições do Produto: Lógica avançada para buscar iframes (códigos extraídos do WooCommerce via metadados) usando priorização de renderização (HTML sanilizado injetado via front-end). Funcionalidade de fallback de descrições curta e longa.

*   **Pedidos e Checkout:**
    *   Funcionalidade de Checkout (`CheckoutPage`) com visualização de tela de sucesso/detalhes dos pedidos (`OrderDetailPage`).
    *   Integração com Gateway de Pagamento (AppyPay): Geração de referências Multicaixa para pagamentos utilizando chamadas OAuth2 à API AppyPay (veja a [Documentação Oficial da API AppyPay](https://appypay.stoplight.io/docs/appypay-payment-gateway/e36aeb2e2fb52-intro)). O processamento ocorre de forma assíncrona (`CreateAppyPayChargeJob`) disparando e-mails para o distribuidor contendo a entidade e referência para pagamento local.
    *   APIs para recebimento de webhooks (incluindo atualizações de pagamento em `WebhookController`) e gestão de estoque (`StockFileController`).

*   **Interface (Frontend):**
    *   Layouts e rotas protegidas devidamente configuradas usando react-router-dom.
    *   Manuseio robusto de estados de carregamento (Skeleton loaders) e tratamento de erros visuais (hot toast / sonner).

*   **Manutenção Operacional e Solução de Problemas:**
    *   Comandos definidos no Laravel para diagnosticar e curar a base de dados em Produção:
        *   `php artisan debug:partner-registration` (Verificação de status)
        *   `php artisan fix:orphan-users` (Correção de contas problemáticas)
        *   `php artisan check:production-permissions` (Validação de infraestrutura)
    *   Logs ricos implementados nas `Actions` de registro.

---

## 🛠 Diretrizes de Desenvolvimento e Regras de Atuação (Vibe Coding)

### 1. Princípios de "Vibe Coding" com Disciplina
* **TDD Obrigatório (Test-Driven Development):** Todo o código funcional deve ser precedido por testes (tanto no Frontend como no Backend). É estritamente proibido escrever a implementação antes dos testes. O fluxo de trabalho obrigatório é: 1. Escrever Testes (e mockar o necessário) -> 2. Executar (irão falhar) -> 3. Escrever Código -> 4. Passar nos Testes.
* **Modularidade:** Manter os ficheiros pequenos e o código altamente modular. Se um ficheiro crescer demasiado, o agente deve parar e sugerir uma refatoração.
* **Um Passo de Cada Vez:** Resolver apenas o problema que foi pedido no prompt.
* **Segurança Primeiro:** Nunca colocar passwords, chaves de API ou tokens de forma *hardcoded* no código. Utilizar SEMPRE variáveis de ambiente (`.env`).
* **Sem Confirmações Cegas:** Face a ambiguidades arquitetónicas, colocar questões. Não optar pelo caminho de menor resistência se isso comprometer a qualidade.
* **Refatoração Contínua:** Procurar assiduamente por código morto, duplicações ou lógicas pesadas e sugerir opções de melhoria.
* **Integração de Rotas Contínua:** No Frontend, a criação de uma nova página (`.jsx`) OBRIGA ao registo da nova rota correspondente em `App.jsx` (via `react-router-dom`) e à atualização de links de navegação caso aplicável.

### 2. Atuação Base da IA
* Antes de dar início à implementação de qualquer funcionalidade (por exemplo, ao ser pedido para "criar um componente X"), a **primeira resposta do agente DEVE ser o código num teste de unidade/integração** focado no comportamento desse componente ou funcionalidade.

### 3. Integração e Fluxo do Google Stitch (UI/UX)
**REGRA ABSOLUTA DE DESIGN E INTERFACE (STITCH-FIRST):** O Google Stitch atua como o Design System e a Única Fonte de Verdade da UI. É estritamente proibido inventar designs ou tentar adivinhar a formatação TailwindCSS no código diretamente.

* **Workflow de Alta Precisão (Passo-a-passo):**
  1. **TDD:** Escrever e correr os testes unitários do componente de antemão.
  2. **Enhance Prompt:** Utilizar skills dedicas como a `enhance_prompt` combinando os requisitos da UI em conjunto com o contexto imutável do projeto.
  3. **Geração:** Enviar as requisições geradas para processamento pelo Stitch via MCP (`generate_screen_from_text` ou `edit_screens`), visando sempre em duas versões desktop e mobile estruturado em Tailwind CSS.
  4. **Integração:** Trazer os retornos do Stitch traduzindo para componentes React via a skill `react_components`.
  5. **Validação:** Refinar e polir os dados no código gerado garantindo que atende à passagem total dos testes definidos (Passo 1).

### 4. Master Version Control (Commits Automáticos)
* Regra: **"Commit Often, With Clear Messages"**.
* O Agente Integrador final tem DEVER ABSOLUTO de comitar as mudanças garantindo *previamente* que todos os testes passem (Verde/100%).
* **Efetuar o Push - Fluxo Git Permitido em Sucesso:**
  1. Adicionar: `git add .`
  2. Comentar de forma padronizada em Inglês: `git commit -m "[Type]: Breve descrição da causa da mudança"`. (Tipos permitidos: `feat`, `fix`, `ui`, `refactor`, `test`, `chore`). A mensagem exprime *o que* mudou e o *porquê*.
  3. Concluir: `git push`.
* **Cuidado Extremo:** Ao cruzar um ambiente em que os testes falham, o agente é ESTRITAMENTE IMPEDIDO de gerar *commits* enviando código danificado para o branch principal.

### 5. Manutenção Obrigatória de Contexto (DRY)
* **A REGRA DE OURO ARQUITETÓNICA:** Este documento em si de contexto (`context.md`) OBRIGATORIAMENTE deve ser atualizado após uma nova funcionalidade ser terminada, refatorada ou corrigida.
* **Propósito:** Evitar ambiguidades, duplicações de código de domínio e lógicas já implementadas em processos contínuos por novos agentes (**DRY - Don't Repeat Yourself**).
* **Verdade Única:** Agentes que entrem numa tarefa devem tratar todo o estado assinalado neste ficheiro como a fonte central de conhecimentos reais antes de começar atuações ou implementações.
