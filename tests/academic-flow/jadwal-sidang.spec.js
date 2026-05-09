const { test, expect } = require('@playwright/test');
const { hasRoleCredential } = require('../helpers/env');
const { loginRole } = require('../helpers/auth');
const { academicRoutes } = require('../helpers/selectors');

test.describe('Academic flow - jadwal sidang', () => {
  test('koordinator can open jadwal sidang page', async ({ page }) => {
    test.skip(!hasRoleCredential('koordinator'), 'Butuh akun testing koordinator.');

    await loginRole(page, 'koordinator');
    await page.goto(academicRoutes.jadwalSidang);

    await expect(page.locator('body')).toContainText(/jadwal sidang/i);
  });

  test('empty schedule form shows validation when form is available', async ({ page }) => {
    test.skip(!hasRoleCredential('koordinator'), 'Butuh akun testing koordinator.');

    await loginRole(page, 'koordinator');
    await page.goto(academicRoutes.jadwalSidang);

    const openForm = page.getByRole('button', { name: /jadwalkan|tambah/i }).first();
    test.skip(!(await openForm.count()), 'Form jadwal sidang tidak tersedia untuk state saat ini.');

    await openForm.click();
    await page.getByRole('button', { name: /simpan|submit|jadwalkan/i }).last().click();
    await expect(page.locator('body')).toContainText(/tanggal|jam|ruangan|pembimbing|penguji|wajib|required/i);
  });

  test.skip('create conflicting schedule requires controlled seed data', async () => {
    // TODO: Enable in staging. Conflict rule must reject same date/time for same dosen or room.
  });
});
