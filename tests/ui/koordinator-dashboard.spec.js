const { test, expect } = require('@playwright/test');
const { hasRoleCredential } = require('../helpers/env');
const { loginRole } = require('../helpers/auth');
const { routeMap, academicRoutes } = require('../helpers/selectors');

test.describe('Koordinator dashboard', () => {
  test('koordinator can access coordinator menus', async ({ page }) => {
    test.skip(!hasRoleCredential('koordinator'), 'Butuh akun testing koordinator.');

    await loginRole(page, 'koordinator');
    await page.goto(routeMap.koordinator);

    await expect(page.locator('body')).toContainText(/dashboard|koordinator|kepala prodi/i);

    await page.goto(academicRoutes.validasiProposal);
    await expect(page.locator('body')).toContainText(/validasi proposal|proposal/i);

    await page.goto(academicRoutes.assignPembimbing);
    await expect(page.locator('body')).toContainText(/assign pembimbing|penugasan/i);

    await page.goto(academicRoutes.jadwalSidang);
    await expect(page.locator('body')).toContainText(/jadwal sidang/i);
  });
});
