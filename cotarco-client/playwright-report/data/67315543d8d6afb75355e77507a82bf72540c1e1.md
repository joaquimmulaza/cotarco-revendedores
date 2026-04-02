# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.auth.setup.js >> authenticate as admin
- Location: tests\e2e\admin.auth.setup.js:5:1

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - region "Notifications alt+T"
    - generic [ref=e4]:
      - generic [ref=e7]:
        - generic [ref=e8]: Distribua
        - generic [ref=e9]: Qualidade
        - generic [ref=e10]: e Inovação
      - generic [ref=e11]:
        - generic [ref=e12]:
          - img "Cotarco - Tecnologias e Comércio Geral" [ref=e14]
          - heading "Painel de Administração" [level=2] [ref=e16]
        - generic [ref=e18]:
          - generic [ref=e19]: Network Error
          - generic [ref=e20]:
            - generic [ref=e21]:
              - generic [ref=e22]: Email
              - textbox "Email" [ref=e24]:
                - /placeholder: admin@cotarco.com
                - text: joaquimmulazadev@gmail.com
            - generic [ref=e25]:
              - generic [ref=e26]: Palavra-passe
              - generic [ref=e27]:
                - textbox "Palavra-passe" [ref=e28]: cotarco.2025
                - button [ref=e29] [cursor=pointer]:
                  - img [ref=e30]
            - button "Entrar no Painel" [ref=e34] [cursor=pointer]
          - link "← Voltar ao site principal" [ref=e37] [cursor=pointer]:
            - /url: /distribuidores
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test as setup, expect } from '@playwright/test';
  2  | 
  3  | const adminFile = 'playwright/.auth/admin.json';
  4  | 
  5  | setup('authenticate as admin', async ({ page }) => {
  6  |   await page.goto('/distribuidores/admin/login', { waitUntil: 'networkidle' });
  7  | 
  8  |   // Usar seletores por name (mais robustos com animações Framer Motion)
  9  |   await page.fill('input[name="email"]', 'joaquimmulazadev@gmail.com');
  10 |   await page.fill('input[name="password"]', 'cotarco.2025');
  11 |   await page.click('button[type="submit"]');
  12 | 
  13 |   // Aguardar redirecionamento para o dashboard de admin
> 14 |   await page.waitForURL(/.*\/admin\/dashboard/, { timeout: 15000 });
     |              ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  15 | 
  16 |   // Guardar estado de autenticação
  17 |   await page.context().storageState({ path: adminFile });
  18 | });
  19 | 
```