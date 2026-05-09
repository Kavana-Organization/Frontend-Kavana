const { test, expect } = require('@playwright/test');
const { hasRoleCredential } = require('../helpers/env');
const { loginRole } = require('../helpers/auth');
const { routeMap } = require('../helpers/selectors');

test.describe('Mahasiswa dashboard', () => {
  test('mahasiswa dashboard shows core academic widgets', async ({ page }) => {
    test.skip(!hasRoleCredential('mahasiswa'), 'Butuh akun testing mahasiswa.');

    await loginRole(page, 'mahasiswa');
    await page.goto(routeMap.mahasiswa);

    await expect(page.locator('body')).toContainText(/dashboard/i);
    await expect(page.locator('body')).toContainText(/proposal|bimbingan|laporan|track/i);
  });
});
