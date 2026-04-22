# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-sidebar.spec.js >> Sidebar Component (Admin Context) >> should toggle expanded/collapsed states and persist in Admin context
- Location: tests\e2e\admin-sidebar.spec.js:33:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('div[data-state][data-collapsible]').first()
Expected: visible
Received: hidden
Timeout:  15000ms

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('div[data-state][data-collapsible]').first()
    15 × locator resolved to <div data-side="left" data-collapsible="" data-state="expanded" data-variant="sidebar" class="group peer hidden w-[--sidebar-width] shrink-0 text-sidebar-foreground md:block transition-[width] duration-300 ease-in-out data-[state=collapsed]:w-[--sidebar-width-icon] border-none shadow-[2px_0_12px_rgba(0,0,0,0.05)] bg-[#fcfcfc]">…</div>
       - unexpected value "hidden"

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - region "Notifications alt+T"
    - generic [ref=e4]:
      - generic [ref=e6]:
        - img "Cotarco" [ref=e9]
        - list [ref=e13]:
          - listitem [ref=e14]:
            - link "Home" [ref=e15] [cursor=pointer]:
              - /url: /distribuidores/admin/dashboard
              - img [ref=e16]
              - generic [ref=e17]: Home
          - listitem [ref=e18]:
            - link "Parceiros" [ref=e19] [cursor=pointer]:
              - /url: /distribuidores/admin/dashboard/partners
              - img [ref=e20]
              - generic [ref=e25]: Parceiros
          - listitem [ref=e26]:
            - link "Catálogo" [ref=e27] [cursor=pointer]:
              - /url: /distribuidores/admin/dashboard/product-list
              - img [ref=e28]
              - generic [ref=e31]: Catálogo
          - listitem [ref=e32]:
            - link "Stocks" [ref=e33] [cursor=pointer]:
              - /url: /distribuidores/admin/dashboard/stock-files
              - img [ref=e34]
              - generic [ref=e38]: Stocks
          - listitem [ref=e39]:
            - link "Encomendas" [ref=e40] [cursor=pointer]:
              - /url: /distribuidores/admin/dashboard/orders
              - img [ref=e41]
              - generic [ref=e45]: Encomendas
          - listitem [ref=e46]:
            - link "Definições" [ref=e47] [cursor=pointer]:
              - /url: /distribuidores/admin/dashboard/settings
              - img [ref=e48]
              - generic [ref=e51]: Definições
        - list [ref=e53]:
          - listitem [ref=e54]:
            - generic [ref=e55]:
              - generic [ref=e57]: AP
              - generic [ref=e58]:
                - generic [ref=e59]: Admin Playwright
                - generic [ref=e60]: joaquimmulazadev@gmail.com
              - button "Sair" [ref=e61]:
                - img [ref=e62]
      - main [ref=e65]:
        - generic [ref=e68]:
          - button "Toggle Sidebar" [ref=e69]:
            - img
            - generic [ref=e70]: Toggle Sidebar
          - navigation "breadcrumb" [ref=e71]:
            - list [ref=e72]:
              - listitem [ref=e73]: Administração
              - listitem [ref=e74]:
                - img [ref=e75]
              - listitem [ref=e77]:
                - link "Dashboard" [disabled] [ref=e78]
        - main [ref=e79]:
          - generic [ref=e81]:
            - generic [ref=e82]:
              - link "Gestão de Parceiros" [ref=e83] [cursor=pointer]:
                - /url: /distribuidores/admin/dashboard/partners
                - generic [ref=e85]:
                  - img [ref=e87]
                  - paragraph [ref=e90]: Gestão de Parceiros
              - link "Mapa de Stock" [ref=e91] [cursor=pointer]:
                - /url: /distribuidores/admin/dashboard/stock-files
                - generic [ref=e93]:
                  - img [ref=e95]
                  - paragraph [ref=e98]: Mapa de Stock
              - link "Gestão de Produtos" [ref=e99] [cursor=pointer]:
                - /url: /distribuidores/admin/dashboard/product-list
                - generic [ref=e101]:
                  - img [ref=e103]
                  - paragraph [ref=e106]: Gestão de Produtos
              - link "Encomendas" [ref=e107] [cursor=pointer]:
                - /url: /distribuidores/admin/dashboard/orders
                - generic [ref=e109]:
                  - img [ref=e111]
                  - paragraph [ref=e114]: Encomendas
            - generic [ref=e117]:
              - generic [ref=e118]:
                - heading "Gestão de Parceiros" [level=3] [ref=e119]
                - generic [ref=e120]:
                  - generic:
                    - img
                  - textbox "Pesquisar por nome, email ou empresa..." [ref=e121]
              - generic [ref=e122]:
                - tablist [ref=e123]:
                  - tab "Pendentes (2)" [selected] [ref=e124]
                  - tab "Ativos (5)" [ref=e125]
                  - tab "Rejeitados (2)" [ref=e126]
                  - tab "Desativados (0)" [ref=e127]
                - tabpanel "Pendentes (2)" [ref=e129]:
                  - generic [ref=e131]:
                    - generic [ref=e133]:
                      - generic [ref=e134]:
                        - generic [ref=e135]:
                          - heading "Reject Test Partner" [level=4] [ref=e136]
                          - generic [ref=e137]: Pendente
                          - generic [ref=e138]: Distribuidor
                          - generic [ref=e139]: "-10% Desconto"
                        - generic [ref=e140]: Registado em 21 de abril de 2026
                      - generic [ref=e141]:
                        - generic [ref=e142]:
                          - generic [ref=e143]:
                            - generic [ref=e144]: "Email:"
                            - generic [ref=e145]: reject@example.com
                          - generic [ref=e146]:
                            - generic [ref=e147]: "Empresa:"
                            - generic [ref=e148]: Reject Test Partner Ltd
                          - generic [ref=e149]:
                            - generic [ref=e150]: "Telefone:"
                            - generic [ref=e151]: "+351912345678"
                          - generic [ref=e152]:
                            - generic [ref=e153]: "Modelo:"
                            - generic [ref=e154]: B2B
                        - generic [ref=e155]:
                          - button "Editar" [ref=e156] [cursor=pointer]:
                            - img [ref=e157]
                            - text: Editar
                          - button "Ver Alvará" [ref=e159] [cursor=pointer]:
                            - img [ref=e160]
                            - text: Ver Alvará
                          - button "Aprovar" [ref=e163] [cursor=pointer]:
                            - img [ref=e164]
                            - text: Aprovar
                          - button "Rejeitar" [ref=e166]:
                            - img [ref=e167]
                            - text: Rejeitar
                    - generic [ref=e170]:
                      - generic [ref=e171]:
                        - generic [ref=e172]:
                          - heading "Approve Test Partner" [level=4] [ref=e173]
                          - generic [ref=e174]: Pendente
                          - generic [ref=e175]: Distribuidor
                          - generic [ref=e176]: "-10% Desconto"
                        - generic [ref=e177]: Registado em 21 de abril de 2026
                      - generic [ref=e178]:
                        - generic [ref=e179]:
                          - generic [ref=e180]:
                            - generic [ref=e181]: "Email:"
                            - generic [ref=e182]: approve@example.com
                          - generic [ref=e183]:
                            - generic [ref=e184]: "Empresa:"
                            - generic [ref=e185]: Approve Test Partner Ltd
                          - generic [ref=e186]:
                            - generic [ref=e187]: "Telefone:"
                            - generic [ref=e188]: "+351912345678"
                          - generic [ref=e189]:
                            - generic [ref=e190]: "Modelo:"
                            - generic [ref=e191]: B2B
                        - generic [ref=e192]:
                          - button "Editar" [ref=e193] [cursor=pointer]:
                            - img [ref=e194]
                            - text: Editar
                          - button "Ver Alvará" [ref=e196] [cursor=pointer]:
                            - img [ref=e197]
                            - text: Ver Alvará
                          - button "Aprovar" [ref=e200] [cursor=pointer]:
                            - img [ref=e201]
                            - text: Aprovar
                          - button "Rejeitar" [ref=e203]:
                            - img [ref=e204]
                            - text: Rejeitar
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Sidebar Component (Admin Context)', () => {
  4  |   test.use({ storageState: 'playwright/.auth/admin.json' });
  5  | 
  6  |   test.beforeEach(async ({ page }) => {
  7  |     // Navigate to the root or specialized admin route, relying on the Admin Layout
  8  |     await page.goto('/distribuidores/admin/dashboard');
  9  |     await page.evaluate(() => window.localStorage.setItem('sidebar:state', 'true'));
  10 |     await page.reload();
  11 |   });
  12 | 
  13 |   test('should render the sidebar with official logo and Admin items', async ({ page }) => {
  14 |     // Wait for the sidebar to be fully initialized
  15 |     const sidebar = page.locator('[data-sidebar="sidebar"]').first();
  16 |     await expect(sidebar).toBeVisible({ timeout: 15000 });
  17 | 
  18 |     // Official Logo Check - one of the logos (full or icon) should be visible
  19 |     const logo = sidebar.locator('img[alt="Cotarco"]').filter({ visible: true });
  20 |     await expect(logo).toBeVisible();
  21 | 
  22 |     // Specific Admin Items - Target the links directly for better resilience
  23 |     const expectedItems = ["Home", "Parceiros", "Catálogo", "Stocks", "Encomendas", "Definições"];
  24 |     for (const item of expectedItems) {
  25 |       await expect(sidebar.getByRole('link', { name: item })).toBeVisible({ timeout: 10000 });
  26 |     }
  27 | 
  28 |     // Should NOT have Partner specific elements
  29 |     await expect(page.locator('a', { hasText: 'Histórico' })).not.toBeVisible();
  30 |     await expect(page.locator('a', { hasText: 'O Meu Perfil' })).not.toBeVisible();
  31 |   });
  32 | 
  33 |   test('should toggle expanded/collapsed states and persist in Admin context', async ({ page }) => {
  34 |     // Use the specific Sidebar component state attribute (the parent div has the state)
  35 |     const sidebar = page.locator('div[data-state][data-collapsible]').first();
  36 |     const trigger = page.locator('[data-sidebar="trigger"]').filter({ visible: true }).first();
  37 |     
> 38 |     await expect(sidebar).toBeVisible({ timeout: 15000 });
     |                           ^ Error: expect(locator).toBeVisible() failed
  39 | 
  40 |     // On Desktop, should start as expanded (default)
  41 |     await expect(sidebar).toHaveAttribute('data-state', 'expanded');
  42 | 
  43 |     await trigger.click();
  44 |     
  45 |     // Wait for the transition to complete
  46 |     await expect(sidebar).toHaveAttribute('data-state', 'collapsed', { timeout: 15000 });
  47 | 
  48 |     // Verify label is hidden in collapsed state
  49 |     await expect(page.locator('span', { hasText: 'Home' })).toBeHidden();
  50 | 
  51 |     // LocalStorage validation
  52 |     let sidebarState = await page.evaluate(() => window.localStorage.getItem('sidebar:state'));
  53 |     expect(sidebarState).toBe('false');
  54 | 
  55 |     // Reload the page and ensure it stays collapsed
  56 |     await page.reload();
  57 |     const reloadedSidebar = page.locator('[data-state][data-collapsible]').first();
  58 |     await expect(reloadedSidebar).toHaveAttribute('data-state', 'collapsed', { timeout: 15000 });
  59 | 
  60 |     // Toggle back to expanded
  61 |     await trigger.click();
  62 |     await expect(reloadedSidebar).toHaveAttribute('data-state', 'expanded');
  63 |     sidebarState = await page.evaluate(() => window.localStorage.getItem('sidebar:state'));
  64 |     expect(sidebarState).toBe('true');
  65 |   });
  66 | });
  67 | 
```