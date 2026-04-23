# TLC Tasks: E2E Stabilization Checklist

## Phase 1: Environment & Config
- [x] Fix port mismatch in `playwright.config.js`
    - [x] Ensure `VITE_API_URL` is correctly injected into the Client dev server.
    - [x] Add a diagnostic step in `global.setup.js` to verify API availability on port 8001.
- [x] Stabilize Auth Setup
    - [x] Verify if `storageState` is correctly generated and loaded.

## Phase 2: Refactor Tests for "Sob Consulta"
- [x] Update `dashboard.spec.js`
    - [x] Implement check for "Sob consulta" badge.
    - [x] Ensure test fails if specific test products (e.g. 999999) are in this state.
- [x] Update `admin-product-management.spec.js`
    - [x] Validate price cell content isn't "Sob consulta" or "N/D".
- [x] Update `checkout.spec.js`
    - [x] Guard against "Sob consulta" before cart addition.

## Phase 3: Layout & Synchronization
- [x] Fix category selectors in `dashboard.spec.js`
    - [x] Match `data-testid="categories-list"` and `data-category-id`.
- [x] Implement explicit waits for skeletons in `Dashboard` and `ProductList`.
- [x] Verify variation expander logic in `admin-product-management.spec.js`.

## Phase 4: Final Verification
- [ ] Run full E2E suite: `npx playwright test`
- [ ] Generate and review HTML report.
