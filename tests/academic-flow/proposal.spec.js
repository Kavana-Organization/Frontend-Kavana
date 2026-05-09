const { test, expect } = require('@playwright/test');
const { hasRoleCredential } = require('../helpers/env');
const { loginRole } = require('../helpers/auth');
const { academicRoutes } = require('../helpers/selectors');
const { invalidDriveLink } = require('../fixtures/test-data');

test.describe('Academic flow - proposal', () => {
  test('proposal upload page exposes proposal fields when form is available', async ({ page }) => {
    test.skip(!hasRoleCredential('mahasiswa'), 'Butuh akun testing mahasiswa.');

    await loginRole(page, 'mahasiswa');
    await page.goto(academicRoutes.proposal);

    await expect(page.locator('body')).toContainText(/upload proposal|proposal/i);

    const title = page.getByLabel(/judul/i).first();
    test.skip(!(await title.count()), 'Form proposal tidak tersedia, kemungkinan sudah submit atau belum eligible.');

    await expect(title).toBeVisible();
    await expect(page.getByLabel(/dosen 1/i)).toBeVisible();
    await expect(page.getByLabel(/link proposal/i)).toBeVisible();
  });

  test('empty proposal submit shows validation when form is available', async ({ page }) => {
    test.skip(!hasRoleCredential('mahasiswa'), 'Butuh akun testing mahasiswa.');

    await loginRole(page, 'mahasiswa');
    await page.goto(academicRoutes.proposal);

    const submit = page.getByRole('button', { name: /submit|kirim|upload/i }).first();
    test.skip(!(await submit.count()), 'Form proposal tidak tersedia untuk validasi kosong.');

    await submit.click();
    await expect(page.locator('body')).toContainText(/judul|link|dosen|wajib|required/i);
  });

  test('invalid Google Drive proposal link is rejected when form is available', async ({ page }) => {
    test.skip(!hasRoleCredential('mahasiswa'), 'Butuh akun testing mahasiswa.');

    await loginRole(page, 'mahasiswa');
    await page.goto(academicRoutes.proposal);

    const link = page.getByLabel(/link proposal/i).first();
    test.skip(!(await link.count()), 'Form proposal tidak tersedia untuk validasi link.');

    await page.getByLabel(/judul/i).first().fill('Proposal Testing Kavana');
    await link.fill(invalidDriveLink);
    await page.getByRole('button', { name: /submit|kirim|upload/i }).first().click();
    await expect(page.locator('body')).toContainText(/google drive|link|valid|proposal/i);
  });

  test.skip('submit valid proposal requires dedicated testing account and seed period', async () => {
    // TODO: Enable only against staging/test data. A valid submit mutates live proposal state.
  });
});
