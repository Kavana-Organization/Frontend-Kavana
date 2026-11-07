const { test, expect } = require('@playwright/test');
const { hasRoleCredential } = require('../helpers/env');
const { loginRole } = require('../helpers/auth');

const PENGUJI_SUBPAGES = [
  'mahasiswa-bimbingan',
  'bimbingan-approve',
  'laporan-approve',
  'revisi-approve',
];

test.describe('Penguji dashboard', () => {
  test('penguji dapat membuka seluruh subhalaman bimbingan dan sidang', async ({ page }) => {
    test.skip(!hasRoleCredential('penguji'), 'Butuh akun testing dengan role penguji.');

    await loginRole(page, 'penguji');

    for (const subpage of PENGUJI_SUBPAGES) {
      await test.step(`penguji/${subpage}`, async () => {
        await page.goto(`/dashboard/penguji/${subpage}`);

        await expect(page).toHaveURL(new RegExp(`/dashboard/penguji/${subpage}$`));
        await expect(page.locator('body')).not.toContainText(/application error|internal server error/i);
      });
    }
  });
});
