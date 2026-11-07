const { test, expect } = require('@playwright/test');

// Catatan: Label pada halaman ini tidak memakai htmlFor, jadi input dicari
// lewat atribut type/placeholder, bukan getByLabel.
const emailInput = (page) => page.locator('input[type="email"]');
const otpButton = (page) => page.getByRole('button', { name: /kirim kode otp/i });

test.describe('Forgot password', () => {
  test('halaman lupa password terbuka dan menampilkan form email', async ({ page }) => {
    await page.goto('/forgot-password');

    await expect(page.getByRole('heading', { name: /lupa password/i })).toBeVisible();
    await expect(emailInput(page)).toBeVisible();
    await expect(page.getByText(/masukkan email untuk menerima kode verifikasi/i)).toBeVisible();

    // Tombol nonaktif selama email masih kosong.
    await expect(otpButton(page)).toBeDisabled();
    await emailInput(page).fill('nama@ulbi.ac.id');
    await expect(otpButton(page)).toBeEnabled();
  });

  test('tautan kembali ke login berfungsi', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByRole('link', { name: /kembali ke login/i }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByLabel(/email atau npm/i)).toBeVisible();
  });

  test('login page menyediakan tautan lupa password', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /lupa password/i }).click();

    await expect(page).toHaveURL(/forgot-password/);
    await expect(page.getByRole('heading', { name: /lupa password/i })).toBeVisible();
  });

  test('email tidak valid tidak memicu permintaan OTP', async ({ page }) => {
    await page.goto('/forgot-password');
    await emailInput(page).fill('bukan-email');

    // Validasi native input type=email menahan submit; tetap di step email.
    await otpButton(page).click();
    await expect(page.getByRole('heading', { name: /lupa password/i })).toBeVisible();
    await expect(otpButton(page)).toBeVisible();
  });

  test('email tidak terdaftar tidak lolos ke step OTP', async ({ page }) => {
    await page.goto('/forgot-password');
    await emailInput(page).fill(`tidak-terdaftar-${Date.now()}@example.com`);
    await otpButton(page).click();

    // Apa pun respons backend (404/error jaringan), UI tidak boleh pindah step.
    await expect(page.getByRole('heading', { name: /lupa password/i })).toBeVisible();
    await expect(emailInput(page)).toBeVisible();
  });
});
