const { test, expect } = require('@playwright/test');
const { hasRoleCredential } = require('../helpers/env');
const { loginRole } = require('../helpers/auth');
const { expectNoHorizontalOverflow } = require('../helpers/ui');
const { academicRoutes } = require('../helpers/selectors');

test.describe('Responsive UI', () => {
  test('public landing page does not overflow on configured viewport', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText(/kavana/i);
    await expectNoHorizontalOverflow(page);
  });

  test('login page stays usable on configured viewport', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email atau npm/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /masuk|login/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('mahasiswa dashboard and forms stay usable on configured viewport', async ({ page }) => {
    test.skip(!hasRoleCredential('mahasiswa'), 'Butuh akun testing mahasiswa untuk responsive dashboard.');

    await loginRole(page, 'mahasiswa');
    await expectNoHorizontalOverflow(page);

    await page.goto(academicRoutes.proposal);
    await expect(page.locator('body')).toContainText(/upload proposal|proposal/i);
    await expectNoHorizontalOverflow(page);

    await page.goto(academicRoutes.bimbingan);
    await expect(page.locator('body')).toContainText(/bimbingan/i);
    await expectNoHorizontalOverflow(page);

    await page.goto(academicRoutes.laporan);
    await expect(page.locator('body')).toContainText(/laporan/i);
    await expectNoHorizontalOverflow(page);
  });
});
