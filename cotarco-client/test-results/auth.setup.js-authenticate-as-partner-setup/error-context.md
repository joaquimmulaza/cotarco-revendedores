# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.setup.js >> authenticate as partner
- Location: tests\e2e\auth.setup.js:5:1

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected: "http://127.0.0.1:5174/distribuidores/dashboard"
Received: "http://127.0.0.1:5174/distribuidores/login"
Timeout:  5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    9 × unexpected value "http://127.0.0.1:5174/distribuidores/login"

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
          - heading "Iniciar sessão" [level=2] [ref=e15]
        - generic [ref=e17]:
          - generic [ref=e18]: Network Error
          - generic [ref=e19]:
            - generic [ref=e20]:
              - generic [ref=e21]: Email
              - textbox "Email" [ref=e23]: marketing@soclima.com
            - generic [ref=e24]:
              - generic [ref=e26]: Palavra-passe
              - generic [ref=e27]:
                - textbox "Palavra-passe" [ref=e28]: cotarco.2025
                - button [ref=e29] [cursor=pointer]:
                  - img [ref=e30]
              - link "Esqueci a senha" [ref=e33] [cursor=pointer]:
                - /url: /distribuidores/forgot-password
            - button "Entrar" [ref=e35] [cursor=pointer]
          - link "Não tem conta? Registe-se aqui" [ref=e38] [cursor=pointer]:
            - /url: /distribuidores/register
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test as setup, expect } from '@playwright/test';
  2  | 
  3  | const partnerFile = 'playwright/.auth/partner.json';
  4  | 
  5  | setup('authenticate as partner', async ({ page }) => {
  6  |   await page.goto('/distribuidores/login');
  7  |   await page.fill('input[name="email"]', 'marketing@soclima.com');
  8  |   await page.fill('input[name="password"]', 'cotarco.2025');
  9  |   await page.click('button[type="submit"]');
> 10 |   await expect(page).toHaveURL('/distribuidores/dashboard');
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  11 |   await page.context().storageState({ path: partnerFile });
  12 | });
  13 | 
```