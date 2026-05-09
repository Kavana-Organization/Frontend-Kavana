const { test, expect } = require('@playwright/test');
const { hasRoleCredential } = require('../helpers/env');
const { loginRole } = require('../helpers/auth');
const { routeMap } = require('../helpers/selectors');

test.describe('Admin dashboard', () => {
  test('admin can access system management dashboard', async ({ page }) => {
    test.skip(!hasRoleCredential('admin'), 'Butuh akun testing admin.');

    await loginRole(page, 'admin');
    await page.goto(routeMap.admin);

    await expect(page.locator('body')).toContainText(/admin|dashboard/i);
    await expect(page.locator('body')).toContainText(/user|dosen|log|activity|monitoring/i);
  });
});
