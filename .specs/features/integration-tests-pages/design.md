# Design da Estratégia de Testes de Integração (E2E)

## 1. Visão Geral

Este documento detalha a estratégia para implementar testes de integração (E2E) robustos para as páginas da aplicação `cotarco-client`. O objetivo é validar a comunicação real entre o frontend (React) e o backend (PHP Laravel), utilizando uma base de dados de teste dedicada para garantir o isolamento e a consistência dos testes.

## 2. Configuração do Ambiente de Teste

### 2.1. Backend (Laravel - `cotarco-api`)

Para isolar o ambiente de teste, criaremos um ficheiro de configuração de ambiente específico para os testes.

**Ficheiro `.env.testing`:**

Será criado um ficheiro `cotarco-api/.env.testing` com a seguinte configuração para a base de dados:

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cotarco_revendedores_test
DB_USERNAME=root
DB_PASSWORD=

# Desativar o envio de e-mails durante os testes
MAIL_MAILER=array

# Usar uma fila síncrona para testes
QUEUE_CONNECTION=sync
```

**Base de Dados de Teste:**

- Uma nova base de dados MySQL chamada `cotarco_revendedores_test` será utilizada.
- O Playwright será configurado para executar as migrações e o seeding antes de iniciar a suite de testes.

**Comando de Preparação da Base de Dados:**

Antes da execução dos testes do Playwright, o seguinte comando Artisan será executado para preparar a base de dados de teste:

```bash
php artisan migrate:fresh --seed --env=testing
```

Este comando irá:
1.  Apagar todas as tabelas existentes na base de dados `cotarco_revendedores_test`.
2.  Executar todas as migrações para criar a estrutura da base de dados.
3.  Executar os seeders (`AdminUserSeeder.php`, `TestPartnerSeeder.php`, etc.) para popular a base de dados com dados de teste (utilizadores administradores, parceiros, produtos, etc.).

### 2.2. Frontend (React - `cotarco-client`)

**Ferramenta de Teste: Playwright**

Utilizaremos a `playwright-skill` para configurar e executar os testes E2E.

**Configuração do Playwright (`playwright.config.js`):**

A configuração do Playwright será ajustada para:

1.  **`webServer`**: Iniciar automaticamente o servidor de desenvolvimento do frontend (WampServer/Vite) e o servidor do backend (Laravel).
2.  **`baseURL`**: Definir a URL base para os testes.
3.  **`globalSetup`**: Criar um ficheiro de setup global para executar o comando de preparação da base de dados antes de todos os testes.

```javascript
// playwright.config.js (exemplo)
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173/distribuidores',
    trace: 'on-first-retry',
  },

  // Iniciar os servidores necessários antes dos testes
  webServer: [
    {
      command: 'php ../cotarco-api/artisan serve --port=8000',
      url: 'http://localhost:8000/api/test',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173/distribuidores',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
  ],

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

**Setup Global (`global.setup.js`):**

Este ficheiro irá conter a lógica para executar o `migrate:fresh --seed`.

```javascript
// tests/e2e/global.setup.js
import { execSync } from 'child_process';

async function globalSetup() {
  console.log('Preparando a base de dados de teste...');
  try {
    execSync('php ../cotarco-api/artisan migrate:fresh --seed --env=testing', {
      stdio: 'inherit',
    });
    console.log('Base de dados de teste pronta.');
  } catch (error) {
    console.error('Falha ao preparar a base de dados de teste:', error);
    process.exit(1);
  }
}

export default globalSetup;
```

## 3. Plano de Testes por Página

Serão criados ficheiros de teste distintos para cada página principal, cobrindo os seguintes cenários:

| Ficheiro de Teste             | Página                          | Cenários de Teste Principais                                                                                                                            |
| ----------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `register.spec.js`            | `Register.jsx`                  | - Registo de um novo parceiro com sucesso.<br>- Tentativa de registo com dados inválidos (e.g., email já existente, passwords não coincidem).<br>- Validação dos campos do formulário. |
| `login.spec.js`               | `Login.jsx`                     | - Login com um parceiro de teste (criado pelo seeder) com sucesso.<br>- Tentativa de login com credenciais inválidas.<br>- Redirecionamento para o Dashboard após login. |
| `admin-login.spec.js`         | `AdminLogin.jsx`                | - Login com um utilizador admin (criado pelo seeder) com sucesso.<br>- Tentativa de login com credenciais de não-admin.<br>- Redirecionamento para o Admin Dashboard. |
| `forgot-password.spec.js`     | `ForgotPassword.jsx` & `ResetPassword.jsx` | - Solicitação de reset de password para um email existente.<br>- Verificação da mensagem de sucesso.<br>- (O teste do link de email é complexo em E2E, focaremos no fluxo da UI). |
| `dashboard.spec.js`           | `Dashboard.jsx`                 | - Verificação se os dados do utilizador logado são exibidos.<br>- Carregamento de categorias e produtos.<br>- Adição de produtos ao carrinho.<br>- Interação com a paginação. |
| `admin-dashboard.spec.js`     | `AdminDashboard.jsx`            | - Navegação entre os diferentes separadores (Gestão de Parceiros, Mapa de Stock, etc.).<br>- Verificação de que apenas utilizadores admin podem aceder. |
| `checkout.spec.js`            | `CheckoutPage.jsx`              | - Preenchimento do formulário de envio.<br>- Finalização da encomenda (mockando a resposta do pagamento se necessário, mas validando a criação da ordem na BD de teste). |
| `email-verification.spec.js`  | `EmailValidated.jsx`, `EmailVerificationError.jsx`, `EmailVerificationPending.jsx` | - Verificação do conteúdo estático das páginas, uma vez que o fluxo de verificação real via email não é testável diretamente com Playwright. |
| `order-detail.spec.js` | `OrderDetailPage.jsx` | - Acesso à página de detalhes de uma encomenda pelo administrador. <br> - Verificação das informações do cliente e produtos. <br> - Teste do download da fatura. |

## 4. Próximos Passos (Implementação)

1.  **Configurar Playwright**: Usar `playwright-skill` para instalar e configurar o Playwright no diretório `cotarco-client`.
2.  **Criar `.env.testing`**: Criar o ficheiro no diretório `cotarco-api`.
3.  **Criar `global.setup.js`**: Implementar o script de setup da base de dados.
4.  **Implementar os Testes**: Criar os ficheiros `.spec.js` para cada página, seguindo o plano acima.
5.  **Executar os Testes**: Correr a suite de testes para validar a implementação.


