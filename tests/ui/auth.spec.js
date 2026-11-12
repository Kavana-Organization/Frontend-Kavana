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

  test('login page has developer device section visible on desktop and mobile', async ({ page }) => {
    await page.goto('/login');
    const devSection = page.getByTestId('developer-device-section');
    await expect(devSection).toBeVisible();
    await expect(devSection).toContainText(/device developer/i);
    await expect(devSection).toContainText(/device lock aktif/i);
  });

  test('login page Turnstile fallback has aria-live="polite" and no .env.local wording', async ({ page }) => {
    await page.goto('/login');
    // Verify no .env.local wording exists anywhere in the rendered page
    await expect(page.locator('body')).not.toContainText('.env.local');
    await expect(page.locator('body')).not.toContainText('NEXT_PUBLIC_TURNSTILE_SITE_KEY');

    // If TURNSTILE_SITE_KEY is not set (typical test environment), fallback message with aria-live="polite" is rendered
    const politeMessage = page.getByTestId('turnstile-fallback');
    if ((await politeMessage.count()) > 0) {
      await expect(politeMessage).toBeVisible();
      await expect(politeMessage).toHaveAttribute('aria-live', 'polite');
      await expect(politeMessage).toContainText(/verifikasi keamanan belum tersedia/i);
    }
  });

  test('register page links to syarat-layanan and kebijakan-privasi', async ({ page }) => {
    await page.goto('/register');
    const termsLink = page.getByRole('link', { name: /syarat dan ketentuan/i });
    const privacyLink = page.getByRole('link', { name: /kebijakan privasi/i });

    await expect(termsLink).toBeVisible();
    await expect(termsLink).toHaveAttribute('href', '/syarat-layanan');
    await expect(privacyLink).toBeVisible();
    await expect(privacyLink).toHaveAttribute('href', '/kebijakan-privasi');
  });

  test('OTP inputs in forgot-password have name, aria-label, and autoComplete="one-time-code"', async ({ page }) => {
    await page.route('**/api/auth/request-otp', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, data: { expires_in: 300 } }),
      });
    });

    await page.goto('/forgot-password');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.getByRole('button', { name: /kirim kode otp/i }).click();

    for (let i = 0; i < 6; i++) {
      const otpInput = page.locator(`input[name="otp-${i}"]`);
      await expect(otpInput).toBeVisible();
      await expect(otpInput).toHaveAttribute('aria-label', `Digit OTP ${i + 1}`);
      await expect(otpInput).toHaveAttribute('autocomplete', 'one-time-code');
    }
  });

  test('OTP inputs in register have name, aria-label, and autoComplete="one-time-code"', async ({ page }) => {
    await page.route('**/api/auth/request-register-otp', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, data: { expires_in: 300 } }),
      });
    });

    await page.goto('/register');
    await page.getByLabel(/nama lengkap/i).fill('Test User');
    await page.getByLabel(/^npm$/i).fill('1234567890');
    // Select angkatan
    await page.getByLabel(/angkatan/i).click();
    await page.getByRole('option').first().click();
    await page.getByLabel(/^email$/i).fill('test@std.ulbi.ac.id');
    await page.getByLabel(/nomor whatsapp/i).fill('081234567890');
    await page.getByLabel(/^password$/i).fill('Password123');
    await page.getByLabel(/konfirmasi password/i).fill('Password123');
    await page.locator('#terms').check();

    await page.getByRole('button', { name: /daftar akun/i }).click();

    for (let i = 0; i < 6; i++) {
      const otpInput = page.locator(`input[name="otp-${i}"]`);
      await expect(otpInput).toBeVisible();
      await expect(otpInput).toHaveAttribute('aria-label', `Digit OTP ${i + 1}`);
      await expect(otpInput).toHaveAttribute('autocomplete', 'one-time-code');
    }
  });
});
