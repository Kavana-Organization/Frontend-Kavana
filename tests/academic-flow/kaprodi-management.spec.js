const { test, expect } = require('@playwright/test');
const { hasRoleCredential } = require('../helpers/env');
const { loginRole } = require('../helpers/auth');

const KAPRODI_SUBPAGES = [
  'daftar-dosen',
  'daftar-mahasiswa',
  'kelola-koordinator',
  'kelola-periode',
  'monitoring',
  'validasi-proposal',
  'revisi-monitoring',
];

test.describe('Kaprodi management', () => {
  test('kaprodi dapat membuka seluruh subhalaman manajemen', async ({ page }) => {
    test.skip(!hasRoleCredential('kaprodi'), 'Butuh akun testing kaprodi.');

    await loginRole(page, 'kaprodi');

    for (const subpage of KAPRODI_SUBPAGES) {
      await test.step(`kaprodi/${subpage}`, async () => {
        await page.goto(`/dashboard/kaprodi/${subpage}`);

        await expect(page).toHaveURL(new RegExp(`/dashboard/kaprodi/${subpage}$`));
        await expect(page.locator('body')).not.toContainText(/application error|internal server error/i);
      });
    }
  });
});
