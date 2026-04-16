# Handoff: Implementação de Testes E2E de Encomendas

Olá! Este ficheiro resume o trabalho de análise e planeamento realizado para automatizar o fluxo de gestão de encomendas.

## Contexto
O objetivo é implementar um fluxo de teste 360º:
1. **Carrinho/Checkout** (Parceiro)
2. **Geração de Pagamento** (Jobs/Polling)
3. **Confirmação de Pagamento** (Webhook Simulation)
4. **Gestão Administrativa** (Admin Dashboard)
5. **Verificação de Stock & Fatura** (Efeitos Secundários)

## Ficheiros de Contexto Disponíveis
Para começar a implementação, utiliza os seguintes ficheiros localizados em `docs/analysis/`:
- [Pesquisa do Fluxo (ORDER_FLOW_RESEARCH.md)](file:///c:/cotarco-revendedores/docs/analysis/ORDER_FLOW_RESEARCH.md)
- [Especificação dos Cenários (ORDER_TEST_SPEC.md)](file:///c:/cotarco-revendedores/docs/analysis/ORDER_TEST_SPEC.md)
- [Design Técnico (ORDER_TEST_DESIGN.md)](file:///c:/cotarco-revendedores/docs/analysis/ORDER_TEST_DESIGN.md)
- [Checklist de Tarefas (ORDER_TEST_TASKS.md)](file:///c:/cotarco-revendedores/docs/analysis/ORDER_TEST_TASKS.md)

## Arquitetura de Testes
Consulta também o ficheiro central da arquitetura em:
- [Arquitetura E2E v2 (E2E_TEST_ARCHITECTURE_v2.md)](file:///c:/cotarco-revendedores/cotarco-client/E2E_TEST_ARCHITECTURE_v2.md)

## Dicas para Implementação
- Os testes devem ser adicionados/atualizados em `cotarco-client/tests/e2e/`.
- O servidor de teste corre na porta `8001`.
- Usa a estratégia de `updateOrCreate` nos seeders (`cotarco-api/database/seeders/PlaywrightAuthSeeder.php`).

Bom trabalho!
