const { test, expect } = require('@playwright/test');
const { hasRoleCredential } = require('../helpers/env');
const { loginRole } = require('../helpers/auth');
const { academicRoutes } = require('../helpers/selectors');

test.describe('Academic flow - project group', () => {
  test('mahasiswa can open project group page', async ({ page }) => {
    test.skip(!hasRoleCredential('mahasiswa'), 'Butuh akun testing mahasiswa.');

    await loginRole(page, 'mahasiswa');
    await page.goto(academicRoutes.kelompok);

    await expect(page.locator('body')).toContainText(/kelompok|anggota|proyek/i);
  });

  test.skip('create/update group requires dedicated seed data', async () => {
    // TODO: Enable only in staging/testing data. Project group mutation affects both members.
  });
});
