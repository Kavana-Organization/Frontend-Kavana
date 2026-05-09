const { test, expect } = require('@playwright/test');
const { hasRoleCredential } = require('../helpers/env');
const { loginRole } = require('../helpers/auth');
const { academicRoutes } = require('../helpers/selectors');

test.describe('Academic flow - bimbingan online', () => {
  test('mahasiswa can open bimbingan page and see progress target', async ({ page }) => {
    test.skip(!hasRoleCredential('mahasiswa'), 'Butuh akun testing mahasiswa.');

    await loginRole(page, 'mahasiswa');
    await page.goto(academicRoutes.bimbingan);

    await expect(page.locator('body')).toContainText(/bimbingan/i);
    await expect(page.locator('body')).toContainText(/progress|catatan|8\/8|0\/8|approved|disetujui/i);
  });

  test('empty bimbingan form shows validation when add form is available', async ({ page }) => {
    test.skip(!hasRoleCredential('mahasiswa'), 'Butuh akun testing mahasiswa.');

    await loginRole(page, 'mahasiswa');
    await page.goto(academicRoutes.bimbingan);

    const add = page.getByRole('button', { name: /tambah|catat/i }).first();
    test.skip(!(await add.count()) || !(await add.isEnabled()), 'Tombol tambah bimbingan tidak tersedia untuk state saat ini.');

    await add.click();
    await page.getByRole('button', { name: /simpan|submit|kirim/i }).first().click();
    await expect(page.locator('body')).toContainText(/tanggal|topik|catatan|wajib|required/i);
  });

  test.skip('create bimbingan valid requires dedicated testing schedule and proposal state', async () => {
    // TODO: Enable only for staging/test accounts. Creation mutates bimbingan progress.
  });

  test('export PDF button is visible when export feature is available', async ({ page }) => {
    test.skip(!hasRoleCredential('mahasiswa'), 'Butuh akun testing mahasiswa.');

    await loginRole(page, 'mahasiswa');
    await page.goto(academicRoutes.bimbingan);

    const exportButton = page.getByRole('button', { name: /export/i }).first();
    test.skip(!(await exportButton.count()), 'Tombol export PDF belum tersedia untuk user/state ini.');
    await expect(exportButton).toBeVisible();
  });
});
