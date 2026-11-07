const { test, expect } = require('@playwright/test');
const { hasRoleCredential } = require('../helpers/env');
const { loginRole } = require('../helpers/auth');

const ADMIN_SUBPAGES = ['kelola-dosen', 'kelola-users', 'monitoring'];

test.describe('Admin management', () => {
  test('admin dapat membuka seluruh subhalaman manajemen', async ({ page }) => {
    test.skip(!hasRoleCredential('admin'), 'Butuh akun testing admin.');

    await loginRole(page, 'admin');

    for (const subpage of ADMIN_SUBPAGES) {
      await test.step(`admin/${subpage}`, async () => {
        await page.goto(`/dashboard/admin/${subpage}`);

        // AuthGuard melempar peran lain kembali ke dashboard-nya sendiri,
        // jadi URL harus tetap di subhalaman ini.
        await expect(page).toHaveURL(new RegExp(`/dashboard/admin/${subpage}$`));
        await expect(page.locator('body')).not.toContainText(/application error|internal server error/i);
      });
    }
  });
});
