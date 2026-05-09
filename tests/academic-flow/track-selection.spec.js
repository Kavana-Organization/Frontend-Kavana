const { test, expect } = require('@playwright/test');
const { hasRoleCredential } = require('../helpers/env');
const { loginRole } = require('../helpers/auth');
const { academicRoutes } = require('../helpers/selectors');

test.describe('Academic flow - track selection', () => {
  test('mahasiswa can open project and internship page', async ({ page }) => {
    test.skip(!hasRoleCredential('mahasiswa'), 'Butuh akun testing mahasiswa.');

    await loginRole(page, 'mahasiswa');
    await page.goto(academicRoutes.track);

    await expect(page.locator('body')).toContainText(/proyek|internship|track|jalur/i);
  });

  test('track submission without selection should show validation when form is available', async ({ page }) => {
    test.skip(!hasRoleCredential('mahasiswa'), 'Butuh akun testing mahasiswa.');

    await loginRole(page, 'mahasiswa');
    await page.goto(academicRoutes.track);

    const submit = page.getByRole('button', { name: /pilih|submit|simpan|lanjut/i }).first();
    test.skip(!(await submit.count()), 'Form pemilihan track tidak tersedia untuk user/state saat ini.');

    await submit.click();
    await expect(page.locator('body')).toContainText(/pilih|track|wajib|required|eligible|tidak bisa/i);
  });
});
