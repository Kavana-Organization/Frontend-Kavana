const { test, expect } = require('@playwright/test');
const { hasRoleCredential } = require('../helpers/env');
const { loginRole } = require('../helpers/auth');

const KOORDINATOR_SUBPAGES = [
  'daftar-mahasiswa',
  'rekap-mahasiswa',
  'kelola-periode',
  'bimbingan-approve',
  'laporan-approve',
  'revisi-monitoring',
  'revisi-approve',
];

test.describe('Koordinator management', () => {
  test('koordinator dapat membuka seluruh subhalaman manajemen', async ({ page }) => {
    test.skip(!hasRoleCredential('koordinator'), 'Butuh akun testing koordinator.');

    await loginRole(page, 'koordinator');

    for (const subpage of KOORDINATOR_SUBPAGES) {
      await test.step(`koordinator/${subpage}`, async () => {
        await page.goto(`/dashboard/koordinator/${subpage}`);

        await expect(page).toHaveURL(new RegExp(`/dashboard/koordinator/${subpage}$`));
        await expect(page.locator('body')).not.toContainText(/application error|internal server error/i);
      });
    }
  });
});
