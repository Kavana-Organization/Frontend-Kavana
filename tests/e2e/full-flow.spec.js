const { test, expect } = require('@playwright/test');
const { hasRoleCredential } = require('../helpers/env');
const { loginRole } = require('../helpers/auth');

// Port dari Test-Kavana/tests/e2e/full-flow.test.js:
// satu siklus utuh login -> dashboard -> logout dalam satu sesi browser.
test.describe('Full flow', () => {
  test('dosen login, membuka dashboard, lalu logout kembali ke login', async ({ page }) => {
    test.skip(!hasRoleCredential('dosen'), 'Butuh akun testing dosen.');

    await loginRole(page, 'dosen');

    // Login berhasil bila tidak lagi berada di /login.
    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('body')).toContainText(/dashboard|dosen/i);

    // Dashboard memuat konteks akademik, bukan halaman kosong.
    await expect(page.locator('body')).toContainText(/bimbingan|laporan|mahasiswa/i);

    await page.goto('/dashboard/profile');
    await expect(page.locator('body')).toContainText(/profil|profile/i);

    await page.getByText(/keluar dari akun/i).first().click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByLabel(/email atau npm/i)).toBeVisible();
  });
});
