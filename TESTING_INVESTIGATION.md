# Investigação de Testes E2E (Playwright)

## 🔍 Porque os testes não estão a ser executados?

Após uma investigação minuciosa ao ambiente e aos ficheiros, foram detetados os seguintes motivos críticos para os testes não estarem a arrancar:

1. **Falta de Dependências no `package.json`:**
   O ficheiro `cotarco-client/package.json` **não possui** o pacote `@playwright/test` instalado. Se estiveres a tentar rodar via `npm run test`, o que está a ser acionado é o **Vitest** (que vem nas dependências) e não o Playwright. O Vitest falhará ou simplesmente ignorará a sintaxe do Playwright (ex: `import { test } from '@playwright/test'`).

2. **Ausência de Script npm:**
   Não há um script em `package.json` desenhado para o Playwright (exemplo: `"test:e2e": "playwright test"`).

3. **Instalação dos Binários dos Browsers:**
   Como o pacote em si não foi adicionado ao projeto, significa que o comando de pós-instalação `npx playwright install` (que baixa os navegadores Chromium, Firefox e WebKit, necessários para a execução background/headless) não foi acionado. Sem esses binários na máquina, nenhum teste arranca.

4. **Diretórios e Configurações de Paths:**
   Apesar das configurações (como em `global.setup.js` e `playwright.config.js`) se encontrarem criadas e mapeadas no caminho `tests/e2e`, no instante em que o Node/Playwright for invocado (se for instalado manualmente via `npx`), vão ocorrer problemas de contexto (`cwd` ou caminhos relativos como `../cotarco-api/artisan`) dependendo de que diretório exato o comando principal parta.

5. **O Erro Famoso: `Timed out waiting 120000ms from config.webServer.`**
   Acabamos de confirmar que o teu erro crasso de timeout vem da configuração em `playwright.config.js`. O Playwright deteta a propriedade `webServer` e tenta fazer requisições até que os URLs do Backend e Frontend respondam com um simples status HTTP 200. No teu ficheiro de configuração configuraste a *url* do Backend para esperar através de: `http://localhost:8000/api/test`. No entanto, **a rota `/api/test` não existe** em lado nenhum no Laravel (`routes/api.php` ou `web.php`).
   - Como essa rota dá `404 Not Found`, o Playwright assume eternamente (até cruzar 120 segundos) que o servidor do Laravel "ainda está a iniciar" e rebenta com timeout matando a pipeline de E2E antes de um único teste arrancar.
   - **Fix Rápido:** No `playwright.config.js`, tens de mudar a propriedade `url` do servidor Artisan para uma rota real que não exija auth (ex: `http://localhost:8000` (Laravel home) ou `http://localhost:5173/distribuidores` se estiveres só a testar a porta).

---

## 🐳 Docker: O Ambiente Ideal para Testes E2E?

Mencionaste uma das maiores dores de cabeça do E2E: o infame *"na minha máquina funciona, na produção falha"*. 

A tua intuição está 100% correta. **Usar o Docker localmente é definitivamente o melhor ambiente possível para a execução dos testes E2E.**

**Por que deves rodar estes testes em Docker?**
1. **Ambiente Imutável:** O Playwright oferece uma imagem Docker oficial (`mcr.microsoft.com/playwright:latest`). Se executares lá os teus testes, garantirá que o SO (Linux), os binários do Chromium, e as dimensões default de viewport são matemáticas e iguais entre a tua máquina Windows e a cloud/Pipeline CI/CD.
2. **Isolamento da Rede:** Numa configuração pura de `docker-compose`, poderias levantar o Banco de Dados (MySQL Test), a API (Laravel) e o FrontEnd + Playwright numa rede interna que não interfere nos processos rodando simultaneamente na tua máquina local, evitando litígios por portas como a `8000` ou `5173`.
3. **Gestão do Estado:** Ficheiros de autenticação persistidos como `admin.json` no Playwright lidam melhor com isolamentos de disco de docker containers.

**O que aprendemos para o próximo passo:**
Não deves focar apenas em adicionar o `@playwright/test` no NPM do teu Windows. Deves primeiro criar uma orquestração clara (um script Shell ou `docker-compose.test.yml`) que consiga subir os 3 lados essenciais num container puro e iniciar os testes:
- 1 container de Banco de Dados.
- 1 container rodando o Backend (`php artisan serve`).
- 1 container do Client que, de facto, contém a imagem oficial do Playwright para disparar comandos na API interna local.
