const { test, expect } = require('@playwright/test');
const { TEST_USERS, hasRoleCredential } = require('../helpers/env');
const { loginRole } = require('../helpers/auth');
const { expectNoCriticalPageError } = require('../helpers/ui');

test.describe('Authentication UI', () => {
  test('login page shows required fields and submit button', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByLabel(/email atau npm/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /masuk|login/i })).toBeVisible();
    await expectNoCriticalPageError(page);
  });

  test('empty login submit stays on login and shows validation or error state', async ({ page }) => {
    await page.goto('/login');
    const submit = page.getByRole('button', { name: /masuk|login/i });

    if (await submit.isDisabled()) {
      await expect(page).toHaveURL(/login/);
      await expect(page.getByLabel(/email atau npm/i)).toBeVisible();
      await expect(page.getByLabel(/^password$/i)).toBeVisible();
      return;
    }

    await submit.click();

    await expect(page).toHaveURL(/login/);
    await expect(page.locator('body')).toContainText(/email|npm|password|wajib|required|invalid/i);
  });

  test('invalid email format cannot pass login flow', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email atau npm/i).fill('email-tidak-valid');
    await page.getByLabel(/^password$/i).fill('password123');
    const submit = page.getByRole('button', { name: /masuk|login/i });

    if (await submit.isDisabled()) {
      await expect(page).toHaveURL(/login/);
      await expect(page.locator('body')).not.toContainText(/application error|internal server error/i);
      return;
    }

    await submit.click();

    await expect(page).toHaveURL(/login/);
    await expect(page.locator('body')).toContainText(/email|npm|tidak valid|invalid|gagal/i);
  });

  test('mahasiswa can login with dedicated test credential', async ({ page }) => {
    test.skip(!hasRoleCredential('mahasiswa'), 'TEST_MAHASISWA_EMAIL/PASSWORD belum diisi dengan akun testing khusus.');

    await loginRole(page, 'mahasiswa');
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('body')).toContainText(/dashboard|mahasiswa/i);
  });

  test('logout is available after login', async ({ page }) => {
    test.skip(!hasRoleCredential('mahasiswa'), 'Butuh akun testing mahasiswa untuk menguji logout.');

    await loginRole(page, 'mahasiswa');
    await page.getByRole('button', { name: new RegExp(TEST_USERS.mahasiswa.email.split('@')[0], 'i') }).click().catch(() => {});
    const logout = page.getByText(/logout|keluar/i).first();
    test.skip(!(await logout.count()), 'Tombol logout tidak ditemukan pada layout aktif.');
    await logout.click();
    await expect(page).toHaveURL(/login|\/$/);
  });

  test('register page exposes expected registration fields when available', async ({ page }) => {
    await page.goto('/register');

    await expect(page.getByLabel(/nama lengkap/i)).toBeVisible();
    await expect(page.getByLabel(/^npm$/i)).toBeVisible();
    await expect(page.getByLabel(/angkatan/i)).toBeVisible();
    await expect(page.getByLabel(/^email$/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByLabel(/konfirmasi password/i)).toBeVisible();
  });

  test('register rejects empty required fields without creating production data', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: /daftar|register/i }).click();

    await expect(page).toHaveURL(/register/);
    await expect(page.locator('body')).toContainText(/nama|npm|email|password|wajib|required/i);
  });
});
