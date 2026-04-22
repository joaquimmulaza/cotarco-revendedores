# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-partner-actions.spec.js >> Admin Partner Actions >> should reject a pending partner
- Location: tests\e2e\admin-partner-actions.spec.js:204:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('li[data-sonner-toast]').filter({ hasText: /sucesso/i }).first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('li[data-sonner-toast]').filter({ hasText: /sucesso/i }).first()

```

# Test source

```ts
  132 |     const cleanupIds = [
  133 |       seeded.toApprove.userId,
  134 |       seeded.toReject.userId,
  135 |       seeded.toDeactivate.userId,
  136 |     ];
  137 | 
  138 |     for (const userId of cleanupIds) {
  139 |       if (!userId) continue;
  140 |       try {
  141 |         const res = await apiCtx.delete(`http://127.0.0.1:8001/api/testing/seed-partner/${userId}`);
  142 |         if (res.status() !== 204 && res.status() !== 404) {
  143 |           console.warn(`[afterAll] Cleanup failed for userId=${userId}: status ${res.status()}`);
  144 |         }
  145 |       } catch (e) {
  146 |         console.warn(`[afterAll] Cleanup failed for userId=${userId}: ${e.message}`);
  147 |       }
  148 |     }
  149 | 
  150 |     await apiCtx.dispose();
  151 |   });
  152 | 
  153 |   test.beforeEach(async ({ page }) => {
  154 |     await page.goto('/distribuidores/admin/dashboard/partners');
  155 | 
  156 |     const isLogin = page.url().includes('/admin/login');
  157 |     if (isLogin) {
  158 |       throw new Error('Falha na autenticação: redirecionado para a página de login.');
  159 |     }
  160 | 
  161 |     await expect(
  162 |       page.getByRole('heading', { name: 'Gestão de Parceiros' })
  163 |     ).toBeVisible({ timeout: 15000 });
  164 | 
  165 |     // Wait for any initial skeleton load to complete
  166 |     await page
  167 |       .locator('.space-y-4 .react-loading-skeleton')
  168 |       .waitFor({ state: 'detached', timeout: 15000 })
  169 |       .catch(() => {});
  170 |   });
  171 | 
  172 |   test('should approve a pending partner', async ({ page }) => {
  173 |     const { name: partnerName } = seeded.toApprove;
  174 | 
  175 |     await page.getByRole('tab', { name: /Pendentes/ }).click();
  176 | 
  177 |     // Type into the search box — React Query will fire /api/admin/partners?search=<name>.
  178 |     // waitForResponse is avoided here because it can race in the full parallel suite
  179 |     // (response may arrive before the listener registers if debounce is fast).
  180 |     // Direct toBeVisible() auto-retries until the rendered card confirms the API responded.
  181 |     const searchInput = page.getByPlaceholder('Pesquisar por nome, email ou empresa...');
  182 |     await searchInput.fill('');
  183 |     await searchInput.pressSequentially(partnerName, { delay: 50 });
  184 | 
  185 |     const partnerCard = page.locator('.partner-card', { hasText: partnerName }).first();
  186 |     await expect(partnerCard).toBeVisible({ timeout: 30000 });
  187 | 
  188 |     await partnerCard.getByRole('button', { name: 'Aprovar' }).click();
  189 | 
  190 |     const confirmButton = page.getByRole('dialog').getByRole('button', { name: 'Aprovar' });
  191 |     await expect(confirmButton).toBeVisible({ timeout: 10000 });
  192 |     await confirmButton.click();
  193 | 
  194 |     await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 30000 });
  195 |     // Assert the Sonner toast immediately after the dialog closes — before waiting
  196 |     // for the card to detach, because the toast is transient and may disappear
  197 |     // within seconds of the action completing.
  198 |     await expect(
  199 |       page.locator('li[data-sonner-toast]').filter({ hasText: /sucesso/i }).first()
  200 |     ).toBeVisible({ timeout: 15000 });
  201 |     await expect(partnerCard).not.toBeVisible({ timeout: 30000 });
  202 |   });
  203 | 
  204 |   test('should reject a pending partner', async ({ page }) => {
  205 |     const { name: partnerName } = seeded.toReject;
  206 | 
  207 |     await page.getByRole('tab', { name: /Pendentes/ }).click();
  208 | 
  209 |     // Same pattern: fill search, let toBeVisible() wait for the card to render.
  210 |     const searchInput = page.getByPlaceholder('Pesquisar por nome, email ou empresa...');
  211 |     await searchInput.fill('');
  212 |     await searchInput.pressSequentially(partnerName, { delay: 50 });
  213 | 
  214 |     const partnerCard = page.locator('.partner-card', { hasText: partnerName }).first();
  215 |     await expect(partnerCard).toBeVisible({ timeout: 30000 });
  216 | 
  217 |     await partnerCard.getByRole('button', { name: 'Rejeitar' }).click();
  218 | 
  219 |     const dialog = page.getByRole('dialog');
  220 |     const rejectButton = dialog.getByRole('button', { name: 'Rejeitar' });
  221 |     await expect(rejectButton).toBeVisible({ timeout: 15000 });
  222 | 
  223 |     await dialog.locator('#rejection-reason').fill('Documentação incompleta — teste automatizado.');
  224 |     await rejectButton.click();
  225 | 
  226 |     await expect(dialog).not.toBeVisible({ timeout: 30000 });
  227 |     // Assert the Sonner toast immediately after the dialog closes — before waiting
  228 |     // for the card to detach, because the toast is transient and may disappear
  229 |     // within seconds of the action completing.
  230 |     await expect(
  231 |       page.locator('li[data-sonner-toast]').filter({ hasText: /sucesso/i }).first()
> 232 |     ).toBeVisible({ timeout: 15000 });
      |       ^ Error: expect(locator).toBeVisible() failed
  233 |     await expect(partnerCard).not.toBeVisible({ timeout: 30000 });
  234 |   });
  235 | 
  236 |   test('should deactivate an active partner', async ({ page }) => {
  237 |     const { name: partnerName } = seeded.toDeactivate;
  238 | 
  239 |     await page.getByRole('tab', { name: /Ativos/ }).click();
  240 | 
  241 |     // Same pattern: fill search, let toBeVisible() wait for the card to render.
  242 |     const searchInput = page.getByPlaceholder('Pesquisar por nome, email ou empresa...');
  243 |     await searchInput.fill('');
  244 |     await searchInput.pressSequentially(partnerName, { delay: 50 });
  245 | 
  246 |     const partnerCard = page.locator('.partner-card', { hasText: partnerName }).first();
  247 |     await expect(partnerCard).toBeVisible({ timeout: 30000 });
  248 | 
  249 |     await partnerCard.getByRole('button', { name: 'Desativar' }).click();
  250 | 
  251 |     const deactivateButton = page.getByRole('dialog').getByRole('button', { name: 'Desativar' });
  252 |     await expect(deactivateButton).toBeVisible({ timeout: 15000 });
  253 |     await deactivateButton.click();
  254 | 
  255 |     await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 30000 });
  256 |     // Assert the Sonner toast immediately after the dialog closes — before waiting
  257 |     // for the card to detach, because the toast is transient and may disappear
  258 |     // within seconds of the action completing.
  259 |     await expect(
  260 |       page.locator('li[data-sonner-toast]').filter({ hasText: /sucesso/i }).first()
  261 |     ).toBeVisible({ timeout: 15000 });
  262 |     await expect(partnerCard).not.toBeVisible({ timeout: 30000 });
  263 |   });
  264 | });
  265 | 
```