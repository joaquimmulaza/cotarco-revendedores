# Detailed Test Fix Guide

This guide provides the exact code transformations required to fix the E2E test failures caused by the Sidebar/Layout migration.

## 1. File: `tests/e2e/admin-dashboard.spec.js`

**Context**: Sidebar labels changed.

```diff
- await page.getByRole('link', { name: 'Mapa de Stock' }).click();
+ await page.getByRole('link', { name: 'Stocks' }).click();

- await page.getByRole('link', { name: 'Gestão de Parceiros' }).click();
+ await page.getByRole('link', { name: 'Parceiros' }).click();
```

## 2. File: `tests/e2e/admin-product-management.spec.js`

**Context**: Updated placeholders and components in `ProductListViewer.jsx`.

```diff
- await page.getByPlaceholder(/Pesquisar produtos/i).fill('Produto Inexistente');
+ await page.getByPlaceholder(/Pesquisar produtos por nome ou referência/i).fill('Produto Inexistente');

- await page.getByRole('button', { name: /Todas as Categorias/i }).click();
+ // Since it's a Headless UI Listbox, clicking the button triggers the options
+ await page.getByRole('button', { name: 'Todas as Categorias' }).click();

- await page.getByRole('button', { name: 'Próximo' }).click();
+ await page.getByRole('button', { name: 'Próxima' }).click();
```

## 3. File: `tests/e2e/admin-login.spec.js`

**Context**: Verification of landing page.

```diff
- await expect(page.getByRole('heading', { name: 'Gestão de Parceiros' })).toBeVisible();
+ // Use the new Sidebar item or breadcrumb label
+ await expect(page.getByRole('heading', { name: 'Parceiros' })).toBeVisible();
```

## 4. File: `tests/e2e/dashboard.spec.js` (Partner)

**Context**: Ensure selectors are robust.

```javascript
// Ensure category list is visible
const categoriesList = page.getByTestId('categories-list');
await expect(categoriesList).toBeVisible({ timeout: 30000 });

// Ensure 'Add' button in ProductCard is targeted correctly
// In ProductCard.jsx: className="... my-bg-red text-white text-xs font-medium ..."
await testProduct.getByRole('button', { name: 'Adicionar' }).click();
```

## 5. File: `tests/e2e/checkout.spec.js`

**Context**: Navigation via Sidebar.

```javascript
// Verification of navigation to checkout
await page.waitForURL('**/checkout', { timeout: 60000 });
```

---

### Execution Note for the delegated agent:
1. Apply the changes above.
2. Run `npm run dev` to ensure the app is up.
3. Execute `npx playwright test` to verify.
