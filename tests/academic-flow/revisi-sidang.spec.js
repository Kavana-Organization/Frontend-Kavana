const { test, expect } = require('@playwright/test');
const { hasRoleCredential } = require('../helpers/env');
const { loginRole } = require('../helpers/auth');
const { academicRoutes } = require('../helpers/selectors');

test.describe('Academic flow - revisi sidang', () => {
  test('mahasiswa can open revisi sidang page', async ({ page }) => {
    test.skip(!hasRoleCredential('mahasiswa'), 'Butuh akun testing mahasiswa.');

    await loginRole(page, 'mahasiswa');
    await page.goto(academicRoutes.revisi);

    await expect(page.locator('body')).toContainText(/revisi|sidang/i);
  });

  test.skip('submit revisi requires seeded sidang result with revision status', async () => {
    // TODO: Enable when a test sidang has status revisi.
  });
});
