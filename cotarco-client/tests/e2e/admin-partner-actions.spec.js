import { test, expect, request } from '@playwright/test';

/**
 * Test data seeding strategy:
 * Each run uses Date.now() as a unique suffix to avoid cross-run state pollution.
 */

const testRun = Date.now();

// Partners seeded by beforeAll — shared across serial tests via module-level state
const seeded = {
  toApprove: { name: '', email: '', userId: null },
  toReject:  { name: '', email: '', userId: null },
  toDeactivate: { name: '', email: '', userId: null },
};

// ──────────────── Helpers ─────────────────────────────────────────────────────────────

async function seedPartner(apiCtx, { name, email }, initial_status) {
  const response = await apiCtx.post('http://127.0.0.1:8001/api/testing/seed-partner', {
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

async function getAdminToken(browser) {
  const ctx = await browser.newContext({
    storageState: 'playwright/.auth/admin.json',
  });
  const page = await ctx.newPage();
  await page.goto('/distribuidores/admin/dashboard/partners', { waitUntil: 'domcontentloaded' });
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  await ctx.close();

  if (!token) {
    throw new Error('Could not extract admin token from localStorage.');
  }
  return token;
}

// ──────────────── Suite ─────────────────────────────────────────────────────────────

test.describe('Admin Partner Actions', () => {
  test.describe.configure({ mode: 'serial' });

  let adminToken;

  test.beforeAll(async ({ browser }) => {
    adminToken = await getAdminToken(browser);
    const apiCtx = await request.newContext();

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
    const apiCtx = await request.newContext();
    const cleanupIds = [
      seeded.toApprove.userId,
      seeded.toReject.userId,
      seeded.toDeactivate.userId,
    ];

    for (const userId of cleanupIds) {
      if (!userId) continue;
      try {
        await apiCtx.delete(`http://127.0.0.1:8001/api/testing/seed-partner/${userId}`);
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

    await expect(page.getByTestId('breadcrumb-page')).toBeVisible({ timeout: 15000 });

    await page
      .locator('.space-y-4 .react-loading-skeleton')
      .waitFor({ state: 'detached', timeout: 15000 })
      .catch(() => {});
  });

  test('should approve a pending partner', async ({ page }) => {
    const { name: partnerName } = seeded.toApprove;
    await page.getByTestId('partner-tab-pending_approval').click();
    await page.waitForTimeout(500);
    await page.locator('.react-loading-skeleton').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});

    const searchInput = page.getByTestId('partner-search-input');
    await searchInput.fill(partnerName);
    await page.waitForTimeout(1000);
    await page.locator('.react-loading-skeleton').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});

    const partnerCard = page.getByTestId('partner-card').filter({ hasText: partnerName }).first();
    await expect(partnerCard).toBeVisible({ timeout: 15000 });

    await partnerCard.getByTestId('partner-approve-button').first().click();

    const confirmButton = page.getByTestId('modal-confirm-btn');
    await expect(confirmButton).toBeVisible({ timeout: 10000 });
    await confirmButton.click();

    await expect(page.getByTestId('modal-container')).not.toBeVisible({ timeout: 30000 });
    await expect(
      page.locator('li[data-sonner-toast]').filter({ hasText: /sucesso/i }).first()
    ).toBeVisible({ timeout: 15000 });
    await expect(partnerCard).not.toBeVisible({ timeout: 30000 });
  });

  test('should reject a pending partner', async ({ page }) => {
    const { name: partnerName } = seeded.toReject;
    await page.getByTestId('partner-tab-pending_approval').click();
    await page.waitForTimeout(500);
    await page.locator('.react-loading-skeleton').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});

    const searchInput = page.getByTestId('partner-search-input');
    await searchInput.fill(partnerName);
    await page.waitForTimeout(1000);
    await page.locator('.react-loading-skeleton').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});

    const partnerCard = page.getByTestId('partner-card').filter({ hasText: partnerName }).first();
    await expect(partnerCard).toBeVisible({ timeout: 15000 });

    await partnerCard.getByTestId('partner-reject-button').first().click();

    const dialog = page.getByTestId('modal-container');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await dialog.locator('textarea').fill('Razão de rejeição de teste');
    await dialog.getByTestId('modal-confirm-btn').click();

    await expect(page.getByTestId('modal-container')).not.toBeVisible({ timeout: 30000 });
    await expect(
      page.locator('li[data-sonner-toast]').filter({ hasText: /sucesso/i }).first()
    ).toBeVisible({ timeout: 15000 });
    await expect(partnerCard).not.toBeVisible({ timeout: 30000 });
  });

  test('should deactivate an active partner', async ({ page }) => {
    const { name: partnerName } = seeded.toDeactivate;
    await page.getByTestId('partner-tab-active').click();
    await page.waitForTimeout(500);
    await page.locator('.react-loading-skeleton').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});

    const searchInput = page.getByTestId('partner-search-input');
    await searchInput.fill(partnerName);
    await page.waitForTimeout(1000);
    await page.locator('.react-loading-skeleton').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});

    const partnerCard = page.getByTestId('partner-card').filter({ hasText: partnerName }).first();
    await expect(partnerCard).toBeVisible({ timeout: 15000 });

    await partnerCard.getByTestId('partner-deactivate-button').first().click();

    const confirmButton = page.getByTestId('modal-confirm-btn');
    await expect(confirmButton).toBeVisible({ timeout: 10000 });
    await confirmButton.click();

    await expect(page.getByTestId('modal-container')).not.toBeVisible({ timeout: 30000 });
    await expect(
      page.locator('li[data-sonner-toast]').filter({ hasText: /sucesso/i }).first()
    ).toBeVisible({ timeout: 15000 });
    await expect(partnerCard).not.toBeVisible({ timeout: 30000 });
  });
});
