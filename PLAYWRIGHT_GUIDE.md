# Guia de Testes Playwright - Cotarco

Este guia explica como configurar e executar os testes de ponta a ponta (E2E) no projeto Cotarco.

## 📋 Pré-requisitos

Antes de começar, certifique-se de que tem instalado:
- **Node.js** (v18 ou superior)
- **PHP** (8.1 ou superior)
- **Composer**
- **MySQL/MariaDB**

---

## 🛠️ 1. Preparação do Ambiente Backend (API)

Os testes do Playwright dependem de uma API funcional com uma base de dados limpa.

### 1.1 Configurar Base de Dados de Teste
Crie uma base de dados chamada `cotarco_revendedores_test` no seu servidor MySQL.

### 1.2 Configurar Variáveis de Ambiente
Verifique o ficheiro `cotarco-api/.env.testing`. Ele deve apontar para a base de dados de teste:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cotarco_revendedores_test
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
```

### 1.3 Migrar e Popular a Base de Dados
A partir da pasta `cotarco-api`, execute os seguintes comandos para preparar os dados necessários para os testes:

```bash
# Instalar dependências se necessário
composer install

# Executar migrações e seeders no ambiente de teste
php artisan migrate:fresh --seed --env=testing
```

> [!NOTE]
> O comando acima cria os utilizadores de teste padrão (Admin e Parceiro) definidos em `PlaywrightAuthSeeder.php`.

---

## 💻 2. Preparação do Ambiente Frontend (Client)

A partir da pasta `cotarco-client`:

### 2.1 Instalar Dependências
```bash
npm install
```

### 2.2 Instalar Browsers do Playwright
```bash
npx playwright install
```

---

## 🚀 3. Execução dos Testes

Pode executar os testes de várias formas a partir da pasta `cotarco-client`:

### 3.1 Executar Todos os Testes (Modo Headless)
Este comando iniciará automaticamente os servidores necessários (Backend e Frontend) e correrá todos os testes.

```bash
npm run test:e2e
```

### 3.2 Executar com Interface UI (Recomendado para Debug)
A interface UI permite ver os testes a correr em tempo real e inspecionar erros.

```bash
npx playwright test --ui
```

### 3.3 Executar Projetos Específicos
O Playwright está configurado com projetos separados:

- **Apenas testes de Parceiro**:
  ```bash
  npx playwright test --project=partner-tests
  ```

- **Apenas testes de Admin**:
  ```bash
  npx playwright test --project=admin-tests
  ```

---

## 🔍 4. Resolução de Problemas Comuns

### Erro de Autenticação
Se os testes falharem na fase de `setup` (login), verifique se:
1. O seeder foi executado corretamente no ambiente de teste.
2. Os dados em `cotarco-api/database/seeders/PlaywrightAuthSeeder.php` coincidem com os seletores em `tests/e2e/auth.setup.js` e `tests/e2e/admin.auth.setup.js`.

### Porta em Uso
Se receber um erro de "Address already in use", verifique se não tem outras instâncias do `php artisan serve` ou `vite` a correr nas portas 8001 ou 5174.

### Logs
Pode verificar os logs do Laravel em `cotarco-api/storage/logs/laravel.log` para depurar erros de API durante os testes.
