# Arquitetura de Testes E2E (v2) - Cotarco

> [!IMPORTANT]
> **Aviso Crítico para Agentes:** Antes de modificar qualquer parte da arquitetura de testes (seeders, configuração de portas, `global.setup.js`, `playwright.config.js`), deves listar explicitamente quais os testes que podem ser afetados pela mudança e aguardar aprovação. Modificações sem esta análise prévia introduziram regressões no passado.

## 1. Visão Geral da Arquitetura

A suite de testes E2E (End-to-End) garante a integridade dos fluxos críticos de negócio, tanto para parceiros (distribuidores) quanto para administradores.

### Stack Completa
-   **Frontend:** Vite + React (Porta `5173`)
-   **Backend:** Laravel API (Porta `8001`)
-   **Automação:** Playwright
-   **Base de Dados:** MySQL (`cotarco_revendedores_test`)

### Estrutura de Projetos
Os testes estão divididos em dois projetos principais no Playwright:
1.  **partner-tests:** Testes focados na jornada do distribuidor (login, catálogo, carrinho, checkout). Ignora ficheiros que contenham `admin` no nome.
2.  **admin-tests:** Testes focados na gestão (aprovação de parceiros, stock, encomendas). Executa apenas ficheiros que contenham `admin` no nome.

### Fluxo de Execução
1.  **Global Setup:** Antes de qualquer teste, o `global.setup.js` executa `migrate:fresh --seed` na API para garantir um estado limpo.
2.  **WebServers:** O Playwright inicia dois servidores:
    -   API na porta `8001` com `APP_ENV=testing`.
    -   Client na porta `5173`, apontando para a API na `8001`.
3.  **Auth Setup:** Projetos de setup (`setup` e `admin-setup`) realizam login e guardam o estado da sessão em `playwright/.auth/` para reutilização em testes subsequentes, evitando logins repetitivos.

---

## 2. Configuração do Ambiente

### Porta do Servidor (`8001`)
A porta `8001` é utilizada para evitar conflitos com instâncias de desenvolvimento locais que normalmente correm na porta `8000`. Esta porta é injetada via variáveis de ambiente tanto no `php artisan serve` quanto no `npm run dev`.

### Variáveis de Ambiente
-   **API (.env.testing):** Define `DB_DATABASE=cotarco_revendedores_test`.
-   **Playwright Config:** Injeta `VITE_API_URL=http://127.0.0.1:8001/api` para garantir que o frontend comunica com o ambiente de teste.

### Global Setup e Base de Dados
O ficheiro `tests/e2e/global.setup.js` é o guardião do estado:
1.  Define o nome da BD: `cotarco_revendedores_test`.
2.  Executa: `npx cross-env APP_ENV=testing DB_DATABASE=... php artisan migrate:fresh --seed`.
3.  Isto garante que todos os seeders necessários estão presentes antes do primeiro teste começar.

---

## 3. Mapa de Seeders e Dados de Teste

| Nome do Seeder | O que garante | Utilizado por | Estratégia |
| :--- | :--- | :--- | :--- |
| `PlaywrightAuthSeeder` | Cria o Admin e o Parceiro padrão para login. Cria categoria e produto com ID `999999`. | Todos os testes básicos, `checkout.spec.js`, `dashboard.spec.js`. | `updateOrCreate` |
| `AdminE2ETestSeeder` | Cria parceiros em diversos estados (Pendente, Ativo) e importa dados de um Excel real. | `admin-partner-actions.spec.js`, `admin-stock-management.spec.js`. | `updateOrCreate` |
| `TestPartnerSeeder` | Cria um parceiro genérico `teste@parceiro.com`. | Legado / Testes manuais de setup. | `if (!exists) create` (Anti-pattern parcial) |

**Nota sobre `updateOrCreate`:** Esta estratégia é obrigatória para permitir que o seeder seja executado múltiplas vezes sem falhar por chaves duplicadas, permitindo debugging local sem reset total da BD.

---

## 4. Estratégia dos Testes Existentes

### Checkout (`checkout.spec.js`)
-   **O que testa:** Fluxo completo desde o dashboard até à geração de pagamento.
-   **Dependências:** Dados do `PlaywrightAuthSeeder` (Categoria/Produto `999999`).
-   **Fluxo:** Dashboard → Categoria `999999` → Adicionar ao Carrinho → Drawer → Checkout Form → Finalizar Encomenda.
-   **Waits Críticos:** `waitForURL('**/checkout')`, `waitForResponse` para `/orders/create-payment`, e timeout estendido (120s) para espera da notificação de pagamento gerado.

### Gestão de Parceiros (`admin-partner-actions.spec.js`)
-   **O que testa:** Aprovação, Rejeição e Desativação de parceiros.
-   **Dependências:** Utiliza um endpoint de teste (`/api/testing/seed-partner`) no `beforeAll` para criar parceiros únicos por run (usando `Date.now()`).
-   **Fluxo:** Login Admin → Tabela de Parceiros → Pesquisa → Clique em Ação → Confirmar em Modal → Verificar Toast de Sucesso.
-   **Waits Críticos:** Espera que o esqueleto de carregamento (`.react-loading-skeleton`) desapareça e que os Toasts de sucesso fiquem visíveis.

### Gestão de Stock (`admin-stock-management.spec.js`)
-   **O que testa:** Upload de ficheiro Excel, ativação e remoção.
-   **Dependências:** `AdminE2ETestSeeder` e cópia de ficheiro Excel fidedigno.
-   **Fluxo:** Upload de ficheiro → Verificação na lista → Validação dinâmica no UI (procura o SKU carregado e verifica se o preço bate certo com o Excel).
-   **Waits Críticos:** `Promise.race` entre mensagem de sucesso e erro no upload.

---

## 5. Regras de Ouro

1.  **NUNCA** uses IDs hardcoded (`category_id`, `product_id`, `user_id`) nos testes, a menos que sejam os IDs de sistema reservados (ex: `999999` para dados de infraestrutura).
2.  **NUNCA** assumas o estado da base de dados sem verificar ou executar o seeder apropriado.
3.  **NUNCA** reutilizes estado entre testes — cada teste deve ser auto-suficiente ou garantir o seu setup no `beforeEach/beforeAll`.
4.  **SEMPRE** usa `updateOrCreate` nos seeders de teste para garantir idempotência.
5.  **SEMPRE** aguarda a visibilidade explícita de elementos (`toBeVisible()`) antes de interagir. Nunca uses waits fixos (`waitForTimeout`) a menos que seja estritamente necessário para debouncing de UI.
6.  **SEMPRE** verifica que o teste passa isolado correndo: `npx playwright test nome.spec.js`.

---

## 6. Anti-Patterns Corrigidos (Lições Aprendidas)

-   **Seeder Condicional:** Antigamente os seeders só criavam dados se a tabela estivesse vazia. Se um teste falhasse a meio e deixasse lixo, o run seguinte falhava. Corrigido para `updateOrCreate` ou `delete` agressivo no setup.
-   **Conflito de Portas:** O uso de `replace(':8001', ':8000')` em scripts de deploy/teste causava falhas silenciosas onde o client tentava falar com a API de produção ou dev. A porta `8001` é agora sagrada para E2E.
-   **`reuseExistingServer: true`:** Causava contaminação de estado porque a API não era reiniciada entre runs de teste locais. Deve ser sempre `false` em ambientes de CI/Final Testing.
-   **Testes de 0ms:** Causados por `APP_URL` errado no `.env.testing`. Se o Playwright não consegue chegar ao servidor, ele falha instantaneamente.
-   **ID 999999:** Foi investigado e confirmado como um "Reserved ID" para testes de fumaça rápida. Não deves apagá-lo, mas deves garantir que novos testes usam dados dinâmicos ou IDs fora deste range.

---

## 7. Checklist para Implementar um Novo Teste

-   [ ] O dado que preciso já é criado por algum seeder existente?
-   [ ] Se não, estou a adicionar ao seeder correto usando `updateOrCreate`?
-   [ ] O teste passa isolado (standalone) sem depender da ordem de outros ficheiros?
-   [ ] Estou a evitar IDs hardcoded e a usar locators estáveis (ex: `getByRole`, `getByTestId`, `getByPlaceholder`)?
-   [ ] Adicionei waits explícitos para todas as transições assíncronas (transição de URL, modals, toasts)?
-   [ ] Identifiquei qual projeto (`partner-tests` ou `admin-tests`) deve incluir este teste com base no nome do ficheiro?
-   [ ] Atualizei este documento ou os comentários do seeder se introduzi novos dados globais?

---

*Documento gerado para garantir a estabilidade do ecossistema de testes Cotarco.*
