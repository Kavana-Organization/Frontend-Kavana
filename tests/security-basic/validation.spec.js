const { test, expect } = require('@playwright/test');
const { weirdInput } = require('../fixtures/test-data');

test.describe('Security basic - validation and error handling', () => {
  test('login form handles unusual input without crashing the app', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email atau npm/i).fill(weirdInput);
    await page.getByLabel(/^password$/i).fill(weirdInput);
    const submit = page.getByRole('button', { name: /masuk|login/i });

    if (!(await submit.isDisabled())) {
      await submit.click();
    }

    await expect(page).toHaveURL(/login/);
    await expect(page.locator('body')).not.toContainText(/application error|internal server error|typeerror|referenceerror/i);
  });

  test('register form handles invalid email format without creating account', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel(/nama lengkap/i).fill('Testing Invalid Email');
    await page.getByLabel(/^npm$/i).fill('123456789');
    await page.getByLabel(/^email$/i).fill('bagas++agung.12');
    await page.getByLabel(/^password$/i).fill('password123');
    await page.getByLabel(/konfirmasi password/i).fill('password123');
    await page.getByRole('button', { name: /daftar|register/i }).click();

    await expect(page).toHaveURL(/register/);
    await expect(page.locator('body')).toContainText(/email|valid|ditolak|tidak valid/i);
  });
});
