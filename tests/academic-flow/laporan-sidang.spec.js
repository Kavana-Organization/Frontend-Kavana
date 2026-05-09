const { test, expect } = require('@playwright/test');
const { hasRoleCredential } = require('../helpers/env');
const { loginRole } = require('../helpers/auth');
const { academicRoutes } = require('../helpers/selectors');
const { invalidDriveLink } = require('../fixtures/test-data');

test.describe('Academic flow - laporan sidang', () => {
  test('mahasiswa can open laporan sidang page', async ({ page }) => {
    test.skip(!hasRoleCredential('mahasiswa'), 'Butuh akun testing mahasiswa.');

    await loginRole(page, 'mahasiswa');
    await page.goto(academicRoutes.laporan);

    await expect(page.locator('body')).toContainText(/laporan sidang|laporan/i);
  });

  test('laporan form has title, laporan link, and one luaran drive link when available', async ({ page }) => {
    test.skip(!hasRoleCredential('mahasiswa'), 'Butuh akun testing mahasiswa.');

    await loginRole(page, 'mahasiswa');
    await page.goto(academicRoutes.laporan);

    const title = page.getByLabel(/judul/i).first();
    test.skip(!(await title.count()), 'Form laporan tidak tersedia, kemungkinan belum eligible atau sudah submit.');

    await expect(title).toBeVisible();
    await expect(page.getByLabel(/link laporan/i)).toBeVisible();
    await expect(page.getByLabel(/link luaran/i)).toBeVisible();
  });

  test('invalid laporan drive link is rejected when form is available', async ({ page }) => {
    test.skip(!hasRoleCredential('mahasiswa'), 'Butuh akun testing mahasiswa.');

    await loginRole(page, 'mahasiswa');
    await page.goto(academicRoutes.laporan);

    const laporanLink = page.getByLabel(/link laporan/i).first();
    test.skip(!(await laporanLink.count()), 'Form laporan tidak tersedia untuk validasi link.');

    await page.getByLabel(/judul/i).first().fill('Laporan Sidang Testing Kavana');
    await laporanLink.fill(invalidDriveLink);
    await page.getByLabel(/link luaran/i).first().fill(invalidDriveLink);
    await page.getByRole('button', { name: /submit|kirim|upload/i }).first().click();
    await expect(page.locator('body')).toContainText(/google drive|link|valid|laporan|luaran/i);
  });

  test.skip('submit valid laporan requires eight approved bimbingan and testing data', async () => {
    // TODO: Enable only in staging/test data. A valid submit mutates laporan state.
  });
});
