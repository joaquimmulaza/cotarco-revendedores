# MCP & Stitch UI Generation Context (Regras Estritas)

**Aviso Geral aos Agentes (AI/MCP/Stitch):** 
Antes de gerar qualquer prompt para construção de telas (via Google Stitch ou criação direta de código React), este documento **DEVE** ser lido e suas regras devem ser injetadas como contexto. A inobservância destas regras gerará alucinações de componentes e violação do core business do projeto.

---

## 1. Contexto Geográfico e de Negócio (NÃO ALUCINAR)
- **Localização:** O projeto **Cotarco Revendedores** opera **exclusivamente em Angola**.
- **Moeda Oficial:** Sempre utilizar **Kwanza**. O símbolo deve ser formatado como `Kz` (ex: `Kz 1.250.000,00`). **Jamais** utilize `R$`, `$`, `€`.
- **Localidades Mocks:** Ao criar dados falsos na UI (Mock Data), utilizar cidades e províncias reais de Angola (ex: Luanda, Benguela, Lubango, Viana, Talatona). Nunca sugerir localizações do Brasil ou de outros países (ex: "São Paulo, SP" ou "Joinville").
- **Tipos de Dados Falsos:** Se for criar nomes de empresas para demonstração, use algo contextual ao mercado angolano B2B (ex: "Electro Comercial Luanda", "Distribuidora Kwanza", "Comercial do Lobito").

## 2. Core Business e Base de Dados
As interfaces devem espelhar as entidades reais do banco de dados (Laravel Backend), não invente features soltas.
O domínio real é de um marketplace B2B/B2C para **Distribuidores de Eletrodomésticos/Smartphones**:
1. **Parceiros / Distribuidores (`PartnerProfile`)**: Distribuidores que se cadastram e precisam ser aprovados pela administração (Aprovações Pendentes).
2. **Catálogo (`Product` / `Category`)**: Eletrodomésticos, telefones celulares e similares.
3. **Pedidos (`Order`)**: Fluxo de checkout com pagamentos referenciados por Multicaixa via AppyPay. 
*Aviso:* Não coloque na UI dados como "Lucro Recorrente", "Crescimento de SaaS", ou métricas alheias a um distribuidor atacadista de hardware.

## 3. Restrições de Componentes UI (Arquitetura Shadcn)
As interfaces construídas no código ou passadas ao Stitch **não devem inventar componentes UI ou estruturas sem nexo com a codebase existente**.

O frontend (`cotarco-client`) está usando TailwindCSS e os seguintes componentes da biblioteca **shadcn/ui** instalados nativamente em `src/components/ui/`:
- `alert`, `badge`, `button`, `card`, `carousel`, `input`, `label`, `radio-group`, `separator`, `sheet`, `sidebar`, `skeleton`, `sonner`, `table`, `tooltip`.

**Regras para o Design de Componentes:**
- **Sidebar:** Em hipótese alguma tente recriar uma barra lateral ou barra de navegação "na mão" com divs complexas. Use e referencie o padrão do componente nativo `sidebar.jsx` do Shadcn UI para barras de layout.
- **Formulários/Cards:** Baseie-se apenas na combinação de `<Card>`, `<Input>`, `<Label>` e `<Button>` disponíveis.
- **Tabelas de Informação:** Use sempre a estrutura do componente `<Table>` (padrão shadcn) para listagem de transações, parceiros e ordens.

## 4. Injeção Direta no Prompt do MCP do Google Stitch
Sempre que for chamar o prompt no `mcp_stitch_generate_screen_from_text` ou ferramentas assemelhadas, as seguintes indicações deverão estar obrigatoriamente no seu prompt:
> "STRICT BUSINESS RULES: 1) The project is in Angola. Currency is AOA, use 'Kz'. No BRL (R$) or USD. 2) Mock locations must be Angolan cities like Luanda or Benguela. 3) The layout MUST explicitly emulate Shadcn UI patterns. For sidebars use the standard Shadcn Sidebar structures. For tables, standard Shadcn table rows. 4) Valid Context Metrics: Partner Approvals (Distributors onboarding), Total Orders (B2B appliances/hardware), and AppyPay Multicaixa transactions. Do not hallucinate random SaaS metrics."
