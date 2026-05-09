const { test, expect } = require('@playwright/test');
const { hasRoleCredential } = require('../helpers/env');
const { loginRole } = require('../helpers/auth');
const { routeMap } = require('../helpers/selectors');

test.describe('Kaprodi dashboard', () => {
  test('kaprodi can access monitoring and coordinator-level menus', async ({ page }) => {
    test.skip(!hasRoleCredential('kaprodi'), 'Butuh akun testing kaprodi.');

    await loginRole(page, 'kaprodi');
    await page.goto(routeMap.kaprodi);

    await expect(page.locator('body')).toContainText(/dashboard|kepala prodi|kaprodi/i);
    await expect(page.locator('body')).toContainText(/monitoring|dosen|koordinator|mahasiswa/i);
  });
});
