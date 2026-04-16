# Arquitetura de Testes E2E - Cotarco

> [!CAUTION]
> **AVISO CRÍTICO PARA AGENTES**
> Antes de modificar qualquer parte da arquitetura de testes (seeders, configuração de portas, `global.setup.js`, `playwright.config.js`), o agente deve listar explicitamente quais os testes que podem ser afetados pela mudança e aguardar aprovação. Modificações sem esta análise prévia introduziram regressões no passado.

## 1. Visão Geral da Arquitetura

A stack de testes E2E do projeto é composta por:
- **Playwright**: Framework principal de execução de testes.
- **Laravel (Backend)**: API servida isoladamente para testes.
- **Vite (Frontend)**: Servidor de desenvolvimento do cliente.
- **MySQL**: Base de dados dedicada (`cotarco_revendedores_test`).

### Separação de Projetos
Os testes estão divididos em dois projetos principais no Playwright:
1. **`partner-tests`**: Foca nas funcionalidades do parceiro/distribuidor (Dashboard, Carrinho, Checkout). Ignora ficheiros que contenham `admin` no nome. Usa o estado de autenticação em `playwright/.auth/partner.json`.
2. **`admin-tests`**: Foca nas funcionalidades de administração (Gestão de parceiros, aprovações, stocks). Executa apenas ficheiros que contenham `admin` no nome. Usa o estado de autenticação em `playwright/.auth/admin.json`.

### Fluxo de Arranque
1. **`global.setup.js`**: Corre uma única vez no início de tudo. Executa `php artisan migrate:fresh --seed` na API para garantir que a base de dados está limpa e com os dados base necessários.
2. **Setup Projects (`auth.setup.js` / `admin.auth.setup.js`)**: Realizam o login real nas interfaces e guardam os cookies/localStorage nos ficheiros JSON de autenticação.
3. **Execução dos Testes**: Os testes correm em paralelo (dentro do limite de workers=1 configurado para estabilidade) usando os estados de autenticação pré-gerados.

## 2. Configuração do Ambiente

### Portas e Portagens
- **Backend API**: Porta **8001**. Usamos a 8001 para garantir isolamento total de qualquer instância de desenvolvimento que possa estar a correr na 8000, evitando colisão de logs, sessões ou cache.
- **Frontend Client**: Porta **5173**.

### Variáveis de Ambiente
- **`.env.testing` (API)**: Define `APP_URL=http://localhost:8001` e `DB_DATABASE=cotarco_revendedores_test`.
- **`playwright.config.js`**: 
    - Injeta `VITE_API_URL=http://127.0.0.1:8001/api` para o frontend.
    - Injeta `VITE_API_PORT=8001` para garantir que o proxy do Vite redireciona corretamente para o backend de teste.

### Isolamento de BD
A variável `DB_DATABASE=cotarco_revendedores_test` é passada explicitamente nos comandos do `webServer` e no `global.setup.js` via `cross-env`. Nunca se deve correr testes contra a base de dados de produção ou desenvolvimento local.

## 3. Mapa de Seeders e Dados de Teste

| Nome do Seeder | O que garante | Testes Dependentes | Estratégia |
| :--- | :--- | :--- | :--- |
| `PlaywrightAuthSeeder` | Usuários admin e parceiro base, categoria e produto de teste. | Quase todos (Login, Dashboard, Checkout). | `updateOrCreate` - Para garantir persistência e evitar erros de duplicados se o seeder correr manualmente. |
| `AdminE2ETestSeeder` | Parceiros em diversos estados (pending, active) e produtos via Excel. | `admin-partner-actions.spec.js`, `admin-stock-management.spec.js`. | `updateOrCreate` + `delete` prévio de emails específicos para garantir estado limpo. |

## 4. Estrutura dos Testes Existentes

| Ficheiro | O que testa | Dependências de Dados | Fluxo / Waits Críticos |
| :--- | :--- | :--- | :--- |
| `dashboard.spec.js` | Listagem, filtros e carrinho. | `PlaywrightAuthSeeder` | Login -> Clica Categoria -> **Aguardar `data-active="true"`** -> Adicionar. |
| `checkout.spec.js` | Finalização de encomenda. | `PlaywrightAuthSeeder` | Dashboard -> Adicionar -> Carrinho -> Finalizar. |
| `admin-partner-actions.spec.js` | Aprovação/Rejeição de parceiros. | `AdminE2ETestSeeder` | Admin Dashboard -> Procurar Parceiro -> Clicar Ação -> Validar Popup. |
| `email-registration-flow.spec.ts` | Registo e verificação de email. | Dinâmico (Cria novo user) | Registo -> Captura Email (Log) -> Clica Link -> Verifica Login. |

## 5. Regras de Ouro

- **NUNCA** usar IDs hardcoded (`id: 1`, `category_id: 26`) nos testes. Usa atributos `data-` ou seletores de texto estáveis.
- **NUNCA** assumir que a base de dados tem dados de uma run anterior. O `global.setup.js` limpa tudo.
- **NUNCA** reutilizar o `storageState` de um projeto noutro (ex: usar admin no partner-tests).
- **SEMPRE** usar `updateOrCreate` nos seeders de teste para que sejam idempotentes.
- **SEMPRE** aguardar visibilidade ou estados de atributos (`expect(...).toHaveAttribute(...)`) antes de interagir. O Playwright é rápido demais para o React em certas transições.
- **SEMPRE** verificar que o teste passa isoladamente com `npx playwright test nome.spec.js`.

## 6. Anti-Patterns Já Encontrados e Corrigidos

- **Seeder Condicional**: Antigamente havia seeders que só criavam dados se a tabela estivesse vazia. Se um teste falhasse a meio, a run seguinte não criava os dados necessários. **Solução**: Uso obrigatório de `updateOrCreate`.
- **Porta Hardcoded no Spec**: Testes que faziam `replace(':8001', ':8000')` para contornar erros de config. **Solução**: Corrigir o `APP_URL` no `.env.testing` e remover o replace.
- **Contaminação de Estado**: `reuseExistingServer: true` no config permitia que testes usassem servidores "sujos" de runs manuais. **Solução**: `reuseExistingServer: false` para CI/E2E.
- **Testes de 0ms**: Ocorriam quando o Playwright não conseguia ligar ao servidor ou o `global.setup.js` falhava silenciosamente devido a portas erradas.
- **`category_id=999999`**: Detetado como artefacto de debug hardcoded. Embora usado no seeder para evitar colisões, os testes **não devem** referincer este ID diretamente, mas sim o nome da categoria "Teste Playwright".

## 7. Checklist para Implementar um Novo Teste

- [ ] O dado que preciso já é criado por algum seeder existente?
- [ ] Se não, estou a adicionar ao seeder correto usando `updateOrCreate`?
- [ ] O teste passa isolado sem depender de outros ficheiros `.spec`?
- [ ] Estou a evitar IDs hardcoded e a usar locators estáveis (ex: `getByRole`, `data-testid`)?
- [ ] Adicionei waits explícitos para todas as transições assíncronas (ex: aguardar que um modal feche ou um atributo mude)?
- [ ] Identifiquei corretamente o projeto (`partner-tests` ou `admin-tests`)?
- [ ] Atualizei este `E2E_TEST_ARCHITECTURE.md` se adicionei novas dependências ou seeders?
