const { test, expect } = require('@playwright/test');
const { hasRoleCredential } = require('../helpers/env');
const { loginRole } = require('../helpers/auth');
const { academicRoutes } = require('../helpers/selectors');

test.describe('Academic flow - supervisor assignment', () => {
  test('koordinator can open assign pembimbing page', async ({ page }) => {
    test.skip(!hasRoleCredential('koordinator'), 'Butuh akun testing koordinator.');

    await loginRole(page, 'koordinator');
    await page.goto(academicRoutes.assignPembimbing);

    await expect(page.locator('body')).toContainText(/assign pembimbing|penugasan pembimbing|pembimbing/i);
  });

  test.skip('assign pembimbing mutation requires dedicated proposal seed data', async () => {
    // TODO: Enable when approved test proposal exists. Project requires 1 pembimbing, internship requires 2.
  });
});
