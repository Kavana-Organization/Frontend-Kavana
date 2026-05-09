const { test, expect } = require('@playwright/test');
const { hasRoleCredential } = require('../helpers/env');
const { loginRole } = require('../helpers/auth');
const { routeMap } = require('../helpers/selectors');

test.describe('Dosen dashboard', () => {
  test('dosen can open dashboard and see supervision context', async ({ page }) => {
    test.skip(!hasRoleCredential('dosen'), 'Butuh akun testing dosen.');

    await loginRole(page, 'dosen');
    await page.goto(routeMap.dosen);

    await expect(page.locator('body')).toContainText(/dashboard|dosen/i);
    await expect(page.locator('body')).toContainText(/mahasiswa|bimbingan|laporan/i);
  });
});
