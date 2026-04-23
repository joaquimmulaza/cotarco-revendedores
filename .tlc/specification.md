# TLC Specification: E2E Test Stabilization & Business Logic Validation

## 1. Vision
Garantir uma suite de testes E2E robusta e fiável que sirva como rede de segurança para o projeto Cotarco, validando não apenas fluxos de interface, mas também regras de negócio críticas como a disponibilidade de preços e stock.

## 2. Goals
- **Estabilização de Ambiente:** Resolver falhas de conexão entre o Frontend (Vite) e a API de testes (Laravel 8001).
- **Validação de Negócio:** Implementar verificações para capturar o estado "Sob consulta" como um erro em cenários onde um preço numérico é esperado.
- **Resiliência de UI:** Adaptar os testes aos novos componentes (skeletons, breadcrumbs) e garantir esperas adequadas por carregamentos assíncronos.

## 3. Requirements
- **Configuração de Portas:** O sistema deve forçar o uso da porta `8001` para a API durante os testes, ignorando configurações locais do `.env` se necessário.
- **Detetar "Sob Consulta":** Criar um padrão de asserção que identifique o componente `<span class="bg-gray-100 text-gray-800 ...">Sob consulta</span>` no `ProductCard`.
- **Tratamento de Skeletons:** Garantir que o teste espera pelo desaparecimento de `Skeleton` antes de interagir com categorias ou produtos.
- **Não Modificar Aplicação:** Nenhuma alteração deve ser feita no código-fonte (`src/` ou `app/`), apenas no diretório `tests/e2e/` e configurações de teste.

## 4. Context & Constraints
- **Admin Email:** `joaquimmulazadev@gmail.com`
- **Partner Email:** `marketing@soclima.com`
- **Ambiente:** Windows, PowerShell.
- **Porta Sagrada:** `8001` para API, `5173` para Client.
