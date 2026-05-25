// ============================================
// Fase 7: Frontend UI Tests (Public Pages)
// ============================================
const { test, expect } = require('@playwright/test');
const { expectNoCriticalPageError, expectNoHorizontalOverflow } = require('../helpers/ui');

test.describe('Fase 7 — Landing & Public Pages', () => {
  test('Landing page loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.+/); // Has some title
    await expectNoCriticalPageError(page);
    // Should have some content
    await expect(page.locator('body')).toContainText(/kavana|bimbingan|proyek/i);
  });

  test('Landing page has navigation to login', async ({ page }) => {
    await page.goto('/');
    const loginLink = page.getByRole('link', { name: /masuk|login/i }).first();
    await expect(loginLink).toBeVisible();
  });

  test('Login page renders all required elements', async ({ page }) => {
    await page.goto('/login');
    await expectNoCriticalPageError(page);

    // Email/NPM field
    await expect(page.getByLabel(/email atau npm/i)).toBeVisible();
    // Password field
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    // Submit button
    await expect(page.getByRole('button', { name: /masuk|login/i })).toBeVisible();
    // Back to home link
    await expect(page.getByText(/kembali|beranda/i).first()).toBeVisible();
  });

  test('Login page has "Lupa password?" link', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(/lupa password/i)).toBeVisible();
  });

  test('Login page has "Daftar sekarang" link', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(/daftar sekarang/i)).toBeVisible();
  });

  test('Login page has developer device section', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(/device developer/i)).toBeVisible();
  });

  test('Login page has Turnstile security section', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(/verifikasi keamanan/i)).toBeVisible();
  });

  test('Register page renders all fields', async ({ page }) => {
    await page.goto('/register');
    await expectNoCriticalPageError(page);

    await expect(page.getByLabel(/nama lengkap/i)).toBeVisible();
    await expect(page.getByLabel(/^npm$/i)).toBeVisible();
    await expect(page.getByLabel(/angkatan/i)).toBeVisible();
    await expect(page.getByLabel(/^email$/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByLabel(/konfirmasi password/i)).toBeVisible();
  });

  test('Forgot password page loads', async ({ page }) => {
    await page.goto('/forgot-password');
    await expectNoCriticalPageError(page);
    await expect(page.locator('body')).toContainText(/email|reset|lupa/i);
  });

  test('FAQ page loads', async ({ page }) => {
    await page.goto('/faq-sistem');
    await expectNoCriticalPageError(page);
  });

  test('Kebijakan Privasi page loads', async ({ page }) => {
    await page.goto('/kebijakan-privasi');
    await expectNoCriticalPageError(page);
  });

  test('Syarat Layanan page loads', async ({ page }) => {
    await page.goto('/syarat-layanan');
    await expectNoCriticalPageError(page);
  });

  test('Panduan Pengguna page loads', async ({ page }) => {
    await page.goto('/panduan-pengguna');
    await expectNoCriticalPageError(page);
  });

  test('Luaran Proyek 1 page loads', async ({ page }) => {
    await page.goto('/luaran-proyek-1');
    await expectNoCriticalPageError(page);
  });

  test('Luaran Proyek 2 page loads', async ({ page }) => {
    await page.goto('/luaran-proyek-2');
    await expectNoCriticalPageError(page);
  });

  test('Luaran Proyek 3 page loads', async ({ page }) => {
    await page.goto('/luaran-proyek-3');
    await expectNoCriticalPageError(page);
  });
});

test.describe('Fase 7 — Protected Routes Redirect', () => {
  test('Dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/mahasiswa');
    // Should redirect to login or show auth required
    await expect(page).toHaveURL(/login|\/$/);
  });

  test('Dosen dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/dosen');
    await expect(page).toHaveURL(/login|\/$/);
  });

  test('Admin dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/admin');
    await expect(page).toHaveURL(/login|\/$/);
  });

  test('Koordinator dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/koordinator');
    await expect(page).toHaveURL(/login|\/$/);
  });

  test('Kaprodi dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/kaprodi');
    await expect(page).toHaveURL(/login|\/$/);
  });

  test('Developer dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/developer');
    await expect(page).toHaveURL(/login|\/$/);
  });

  test('Profile page redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/profile');
    await expect(page).toHaveURL(/login|\/$/);
  });
});

test.describe('Fase 7 — Responsive Design Smoke Tests', () => {
  test('Landing page has no horizontal overflow (desktop)', async ({ page }) => {
    await page.goto('/');
    await expectNoHorizontalOverflow(page);
  });

  test('Login page has no horizontal overflow (desktop)', async ({ page }) => {
    await page.goto('/login');
    await expectNoHorizontalOverflow(page);
  });

  test('Register page has no horizontal overflow', async ({ page }) => {
    await page.goto('/register');
    await expectNoHorizontalOverflow(page);
  });
});
