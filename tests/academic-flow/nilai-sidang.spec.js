const { test, expect } = require('@playwright/test');
const { hasRoleCredential } = require('../helpers/env');
const { loginRole } = require('../helpers/auth');
const { academicRoutes } = require('../helpers/selectors');

test.describe('Academic flow - nilai sidang', () => {
  test('mahasiswa can open final score/result page', async ({ page }) => {
    test.skip(!hasRoleCredential('mahasiswa'), 'Butuh akun testing mahasiswa.');

    await loginRole(page, 'mahasiswa');
    await page.goto(academicRoutes.hasil);

    await expect(page.locator('body')).toContainText(/nilai|hasil|sidang|lulus|revisi/i);
  });

  test.skip('input nilai sidang requires dedicated dosen/koordinator test data', async () => {
    // TODO: Enable when seeded sidang exists.
  });
});
