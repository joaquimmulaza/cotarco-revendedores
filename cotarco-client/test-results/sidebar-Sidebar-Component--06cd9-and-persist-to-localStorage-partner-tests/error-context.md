# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sidebar.spec.js >> Sidebar Component (Partner Context) >> should toggle expanded and collapsed states and persist to localStorage
- Location: tests\e2e\sidebar.spec.js:24:3

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  locator('[data-sidebar="sidebar"]')
Expected: "expanded"
Received: ""
Timeout:  10000ms

Call log:
  - Expect "toHaveAttribute" with timeout 10000ms
  - waiting for locator('[data-sidebar="sidebar"]')
    10 × locator resolved to <div data-sidebar="sidebar" class="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow">…</div>
       - unexpected value "null"

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - region "Notifications alt+T"
    - generic [ref=e5]:
      - generic [ref=e7]:
        - generic [ref=e9]:
          - generic [ref=e10]: P
          - generic [ref=e11]: Painel Parceiro
        - list [ref=e15]:
          - listitem [ref=e16]:
            - link "Início" [ref=e17] [cursor=pointer]:
              - /url: /distribuidores/dashboard
              - img [ref=e18]
              - generic [ref=e21]: Início
          - listitem [ref=e22]:
            - link "Histórico" [ref=e23] [cursor=pointer]:
              - /url: /distribuidores/orders
              - img [ref=e24]
              - generic [ref=e27]: Histórico
          - listitem [ref=e28]:
            - link "Perfil" [ref=e29] [cursor=pointer]:
              - /url: /distribuidores/profile
              - img [ref=e30]
              - generic [ref=e33]: Perfil
      - generic [ref=e34]:
        - banner [ref=e35]:
          - button "Toggle Sidebar" [ref=e36]:
            - img
            - generic [ref=e37]: Toggle Sidebar
        - main [ref=e38]:
          - generic [ref=e39]:
            - generic [ref=e42]:
              - generic [ref=e43]:
                - img "Cotarco - Tecnologias e Comércio Geral" [ref=e45] [cursor=pointer]
                - button "Mapa de Stock" [ref=e47] [cursor=pointer]
              - generic [ref=e49]:
                - button "Abrir carrinho" [ref=e51]:
                  - img [ref=e52]
                - generic [ref=e56]:
                  - paragraph [ref=e57]: Parceiro Playwright
                  - paragraph [ref=e58]: marketing@soclima.com
                - button "Sair" [ref=e59] [cursor=pointer]
            - main [ref=e60]:
              - generic [ref=e62]:
                - generic [ref=e63]:
                  - heading "Categorias" [level=3] [ref=e64]
                  - generic [ref=e65]:
                    - button "Acessórios" [ref=e66]
                    - button "Acessórios Maquinas de Lavar" [ref=e67]
                    - button "Eletrodomésticos" [ref=e68]
                    - button "Eq. Som" [ref=e69]
                    - button "Suportes TV" [ref=e70]
                    - button "Telemóveis" [ref=e71]
                    - button "Televisões" [ref=e72]
                    - button "Categoria de Teste 1" [ref=e73]
                    - button "Categoria de Teste 2" [ref=e74]
                    - button "Teste Playwright" [ref=e75]
                    - button "Testes Automatizados" [ref=e76]
                - generic [ref=e77]:
                  - heading "Produtos" [level=3] [ref=e78]
                  - generic [ref=e79]:
                    - generic [ref=e80]:
                      - img "Capa Galaxy A73 Silicone" [ref=e82]
                      - generic [ref=e84]:
                        - heading "Capa Galaxy A73 Silicone" [level=3] [ref=e85]
                        - generic [ref=e88]: Sob consulta
                    - generic [ref=e89]:
                      - img "Capa Galaxy A34 Slot Cartão (Preto)" [ref=e91]
                      - generic [ref=e93]:
                        - heading "Capa Galaxy A34 Slot Cartão (Preto)" [level=3] [ref=e94]
                        - generic [ref=e97]: Sob consulta
                    - generic [ref=e98]:
                      - img "Capa Galaxy A23 Slot Cartão" [ref=e100]
                      - generic [ref=e102]:
                        - heading "Capa Galaxy A23 Slot Cartão" [level=3] [ref=e103]
                        - generic [ref=e106]: Sob consulta
                    - generic [ref=e107]:
                      - img "Capa Galaxy A14 Slot Cartão (Preto)" [ref=e109]
                      - generic [ref=e111]:
                        - heading "Capa Galaxy A14 Slot Cartão (Preto)" [level=3] [ref=e112]
                        - generic [ref=e115]: Sob consulta
                    - generic [ref=e116]:
                      - img "Capa Galaxy A13 Slot Cartão" [ref=e118]
                      - generic [ref=e120]:
                        - heading "Capa Galaxy A13 Slot Cartão" [level=3] [ref=e121]
                        - generic [ref=e124]: Sob consulta
                    - generic [ref=e125]:
                      - img "Capa Galaxy Note 10 Flip LED View" [ref=e127]
                      - generic [ref=e129]:
                        - heading "Capa Galaxy Note 10 Flip LED View" [level=3] [ref=e130]
                        - generic [ref=e133]: Sob consulta
                    - generic [ref=e134]:
                      - img "Capa Galaxy S20+ Flip LED View" [ref=e136]
                      - generic [ref=e138]:
                        - heading "Capa Galaxy S20+ Flip LED View" [level=3] [ref=e139]
                        - generic [ref=e142]: Sob consulta
                    - generic [ref=e143]:
                      - img "Capa Galaxy S20 Flip LED View" [ref=e145]
                      - generic [ref=e147]:
                        - heading "Capa Galaxy S20 Flip LED View" [level=3] [ref=e148]
                        - generic [ref=e151]: Sob consulta
                    - generic [ref=e152]:
                      - img "Capa Galaxy Note 10+ Protective" [ref=e154]
                      - generic [ref=e156]:
                        - heading "Capa Galaxy Note 10+ Protective" [level=3] [ref=e157]
                        - generic [ref=e160]: Sob consulta
                    - generic [ref=e161]:
                      - img "Capa Galaxy S20 Ultra Protective" [ref=e163]
                      - generic [ref=e165]:
                        - heading "Capa Galaxy S20 Ultra Protective" [level=3] [ref=e166]
                        - generic [ref=e169]: Sob consulta
                  - generic [ref=e170]:
                    - button "Anterior" [disabled] [ref=e171]
                    - generic [ref=e172]: Página 1 de 8
                    - button "Próximo" [ref=e173]
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Sidebar Component (Partner Context)', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Navigate to the root, which the Partner Layout should wrap
  6  |     await page.goto('/distribuidores/dashboard');
  7  |     await page.evaluate(() => window.localStorage.removeItem('sidebar:state'));
  8  |     await page.reload();
  9  |   });
  10 | 
  11 |   test('should render the sidebar with Partner navigation items', async ({ page }) => {
  12 |     const sidebar = page.locator('[data-sidebar="sidebar"]');
  13 |     await expect(sidebar).toBeVisible();
  14 | 
  15 |     // Specific Partner Items
  16 |     await expect(page.locator('a', { hasText: 'Início' })).toBeVisible();
  17 |     await expect(page.locator('a', { hasText: 'Histórico' })).toBeVisible();
  18 | 
  19 |     // Should NOT have Admin elements
  20 |     await expect(page.locator('a', { hasText: 'Estatísticas' })).not.toBeVisible();
  21 |     await expect(page.locator('a', { hasText: 'Produtos' })).not.toBeVisible();
  22 |   });
  23 | 
  24 |   test('should toggle expanded and collapsed states and persist to localStorage', async ({ page }) => {
  25 |     const sidebar = page.locator('[data-sidebar="sidebar"]');
  26 |     const trigger = page.locator('[data-sidebar="trigger"]').first();
  27 |     
  28 |     // Initially, it should be expanded on Desktop
> 29 |     await expect(sidebar).toHaveAttribute('data-state', 'expanded');
     |                           ^ Error: expect(locator).toHaveAttribute(expected) failed
  30 |     
  31 |     // Toggle to collapse
  32 |     await trigger.click();
  33 |     await expect(sidebar).toHaveAttribute('data-state', 'collapsed');
  34 | 
  35 |     // Check localStorage
  36 |     const sidebarState = await page.evaluate(() => window.localStorage.getItem('sidebar:state'));
  37 |     expect(sidebarState).toBe('false');
  38 | 
  39 |     // Toggle back to expand
  40 |     await trigger.click();
  41 |     await expect(sidebar).toHaveAttribute('data-state', 'expanded');
  42 |     
  43 |     const sidebarStateExpanded = await page.evaluate(() => window.localStorage.getItem('sidebar:state'));
  44 |     expect(sidebarStateExpanded).toBe('true');
  45 |   });
  46 | 
  47 |   test('should highlight the active navigation link', async ({ page }) => {
  48 |     // Assuming / translates to Início or Dashboard for Partner
  49 |     const activeLink = page.locator('a[data-active="true"]');
  50 |     await expect(activeLink).toBeVisible();
  51 |     await expect(activeLink).toContainText('Início');
  52 |   });
  53 | });
  54 | 
```