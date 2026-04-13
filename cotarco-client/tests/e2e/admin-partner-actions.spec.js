import { test, expect, request } from '@playwright/test';

/**
 * Test data seeding strategy:
 *
 * Root cause of previous failures: tests assumed static partners ('João Teste',
 * 'Reject Test Partner', etc.) existed in the DB, but no seeding mechanism
 * ensured that. waitForResponse timed out because the API returned no matching
 * partners — not a Playwright sync issue, but a missing data dependency.
 *
 * Fix: beforeAll seeds three partners via the public registration API, then
 * promotes them to `pending_approval` or `active` status via the admin API
 * (using the stored admin auth token). afterAll cleans up by deleting the
 * created users through the admin status endpoint + a direct DB cleanup call.
 *
 * Each run uses Date.now() as a unique suffix to avoid cross-run state pollution.
 */

const testRun = Date.now();

// Partners seeded by beforeAll — shared across serial tests via module-level state
const seeded = {
  toApprove: { name: '', email: '', userId: null },
  toReject:  { name: '', email: '', userId: null },
  toDeactivate: { name: '', email: '', userId: null },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Registers a partner via the public API and returns the created user's ID.
 * Uses multipart/form-data to match the RegisterController validation rules.
 */
async function seedPartner(apiCtx, { name, email }, initial_status) {
  const response = await apiCtx.post('http://127.0.0.1:8000/api/testing/seed-partner', {
    data: {
      name,
      email,
      initial_status,
    },
  });

  if (response.status() !== 201) {
    throw new Error(
      `Seed failed for ${email} — status ${response.status()}: ${await response.text()}`
    );
  }

  const body = await response.json();
  return body.id;
}

/**
 * Updates a partner's status via the admin API.
 * Requires the admin Bearer token extracted from localStorage after admin login.
 */
async function setPartnerStatus(apiCtx, adminToken, userId, status, extra = {}) {
  const response = await apiCtx.put(
    `http://127.0.0.1:8000/api/admin/partners/${userId}/status`,
    {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { status, ...extra },
    }
  );

  if (response.status() !== 200) {
    throw new Error(
      `setPartnerStatus(${userId}, ${status}) failed — ${response.status()}: ${await response.text()}`
    );
  }
}

/**
 * Extracts the admin Bearer token from localStorage after admin login.
 * Relies on the storageState already having the session set up by admin-setup.
 */
async function getAdminToken(browser) {
  const ctx = await browser.newContext({
    storageState: 'playwright/.auth/admin.json',
  });
  const page = await ctx.newPage();
  // Navigate to a protected admin page so the app bootstraps and sets the token
  await page.goto('/distribuidores/admin/dashboard/partners', { waitUntil: 'domcontentloaded' });
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  await ctx.close();

  if (!token) {
    throw new Error(
      'Could not extract admin token from localStorage. ' +
      'Ensure admin.auth.setup.js ran successfully and saved auth_token.'
    );
  }
  return token;
}

// ─── Suite ───────────────────────────────────────────────────────────────────

test.describe('Admin Partner Actions', () => {
  // Serial mode: order matters — approve must run before deactivate
  test.describe.configure({ mode: 'serial' });

  let adminToken;

  test.beforeAll(async ({ browser }) => {
    // 1. Get admin API token
    adminToken = await getAdminToken(browser);

    const apiCtx = await request.newContext();

    // 2. Seed the three partners via the public registration endpoint
    seeded.toApprove.name  = `Aprovar_${testRun}`;
    seeded.toApprove.email = `aprovar_${testRun}@e2e.test`;

    seeded.toReject.name  = `Rejeitar_${testRun}`;
    seeded.toReject.email = `rejeitar_${testRun}@e2e.test`;

    seeded.toDeactivate.name  = `Desativar_${testRun}`;
    seeded.toDeactivate.email = `desativar_${testRun}@e2e.test`;

    seeded.toApprove.userId    = await seedPartner(apiCtx, seeded.toApprove, 'pending_approval');
    seeded.toReject.userId     = await seedPartner(apiCtx, seeded.toReject, 'pending_approval');
    seeded.toDeactivate.userId = await seedPartner(apiCtx, seeded.toDeactivate, 'active');

    await apiCtx.dispose();
  });

  test.afterAll(async () => {
    // Clean up: hard delete all seeded partners to avoid polluting the DB
    const apiCtx = await request.newContext();

    const cleanupIds = [
      seeded.toApprove.userId,
      seeded.toReject.userId,
      seeded.toDeactivate.userId,
    ];

    for (const userId of cleanupIds) {
      if (!userId) continue;
      try {
        const res = await apiCtx.delete(`http://127.0.0.1:8000/api/testing/seed-partner/${userId}`);
        if (res.status() !== 204 && res.status() !== 404) {
          console.warn(`[afterAll] Cleanup failed for userId=${userId}: status ${res.status()}`);
        }
      } catch (e) {
        console.warn(`[afterAll] Cleanup failed for userId=${userId}: ${e.message}`);
      }
    }

    await apiCtx.dispose();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/distribuidores/admin/dashboard/partners');

    const isLogin = page.url().includes('/admin/login');
    if (isLogin) {
      throw new Error('Falha na autenticação: redirecionado para a página de login.');
    }

    await expect(
      page.getByRole('heading', { name: 'Gestão de Parceiros' })
    ).toBeVisible({ timeout: 15000 });

    // Wait for any initial skeleton load to complete
    await page
      .locator('.space-y-4 .react-loading-skeleton')
      .waitFor({ state: 'detached', timeout: 15000 })
      .catch(() => {});
  });

  test('should approve a pending partner', async ({ page }) => {
    const { name: partnerName } = seeded.toApprove;

    await page.getByRole('tab', { name: /Pendentes/ }).click();

    // Type into the search box — React Query will fire /api/admin/partners?search=<name>.
    // waitForResponse is avoided here because it can race in the full parallel suite
    // (response may arrive before the listener registers if debounce is fast).
    // Direct toBeVisible() auto-retries until the rendered card confirms the API responded.
    const searchInput = page.getByPlaceholder('Pesquisar por nome, email ou empresa...');
    await searchInput.fill('');
    await searchInput.pressSequentially(partnerName, { delay: 50 });

    const partnerCard = page
      .locator('div.border')
      .filter({ has: page.getByRole('heading', { name: partnerName }) })
      .first();
    await expect(partnerCard).toBeVisible({ timeout: 30000 });

    await partnerCard.getByRole('button', { name: 'Aprovar' }).click();

    const confirmButton = page.getByRole('dialog').getByRole('button', { name: 'Aprovar' });
    await expect(confirmButton).toBeVisible({ timeout: 10000 });
    await confirmButton.click();

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 30000 });
    // Assert the Sonner toast immediately after the dialog closes — before waiting
    // for the card to detach, because the toast is transient and may disappear
    // within seconds of the action completing.
    await expect(
      page.locator('li[data-sonner-toast]').filter({ hasText: /sucesso/i }).first()
    ).toBeVisible({ timeout: 15000 });
    await expect(partnerCard).not.toBeVisible({ timeout: 30000 });
  });

  test('should reject a pending partner', async ({ page }) => {
    const { name: partnerName } = seeded.toReject;

    await page.getByRole('tab', { name: /Pendentes/ }).click();

    // Same pattern: fill search, let toBeVisible() wait for the card to render.
    const searchInput = page.getByPlaceholder('Pesquisar por nome, email ou empresa...');
    await searchInput.fill('');
    await searchInput.pressSequentially(partnerName, { delay: 50 });

    const partnerCard = page
      .locator('div.border')
      .filter({ has: page.getByRole('heading', { name: partnerName }) })
      .first();
    await expect(partnerCard).toBeVisible({ timeout: 30000 });

    await partnerCard.getByRole('button', { name: 'Rejeitar' }).click();

    const dialog = page.getByRole('dialog');
    const rejectButton = dialog.getByRole('button', { name: 'Rejeitar' });
    await expect(rejectButton).toBeVisible({ timeout: 15000 });

    await dialog.locator('#rejection-reason').fill('Documentação incompleta — teste automatizado.');
    await rejectButton.click();

    await expect(dialog).not.toBeVisible({ timeout: 30000 });
    // Assert the Sonner toast immediately after the dialog closes — before waiting
    // for the card to detach, because the toast is transient and may disappear
    // within seconds of the action completing.
    await expect(
      page.locator('li[data-sonner-toast]').filter({ hasText: /sucesso/i }).first()
    ).toBeVisible({ timeout: 15000 });
    await expect(partnerCard).not.toBeVisible({ timeout: 30000 });
  });

  test('should deactivate an active partner', async ({ page }) => {
    const { name: partnerName } = seeded.toDeactivate;

    await page.getByRole('tab', { name: /Ativos/ }).click();

    // Same pattern: fill search, let toBeVisible() wait for the card to render.
    const searchInput = page.getByPlaceholder('Pesquisar por nome, email ou empresa...');
    await searchInput.fill('');
    await searchInput.pressSequentially(partnerName, { delay: 50 });

    const partnerCard = page
      .locator('div.border')
      .filter({ has: page.getByRole('heading', { name: partnerName }) })
      .first();
    await expect(partnerCard).toBeVisible({ timeout: 30000 });

    await partnerCard.getByRole('button', { name: 'Desativar' }).click();

    const deactivateButton = page.getByRole('dialog').getByRole('button', { name: 'Desativar' });
    await expect(deactivateButton).toBeVisible({ timeout: 15000 });
    await deactivateButton.click();

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 30000 });
    // Assert the Sonner toast immediately after the dialog closes — before waiting
    // for the card to detach, because the toast is transient and may disappear
    // within seconds of the action completing.
    await expect(
      page.locator('li[data-sonner-toast]').filter({ hasText: /sucesso/i }).first()
    ).toBeVisible({ timeout: 15000 });
    await expect(partnerCard).not.toBeVisible({ timeout: 30000 });
  });
});
