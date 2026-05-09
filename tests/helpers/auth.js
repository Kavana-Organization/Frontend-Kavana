const { expect } = require('@playwright/test');
const { TEST_USERS, hasRoleCredential } = require('./env');

async function loginAs(page, email, password) {
  await page.goto('/login');

  await page.getByLabel(/email atau npm/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);

  const turnstile = page.locator('[name="cf-turnstile-response"]');
  if (await turnstile.count()) {
    console.warn('Turnstile detected. Use testing mode or testing keys for E2E.');
  }

  await page.getByRole('button', { name: /masuk|login/i }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

async function loginRole(page, role) {
  if (!hasRoleCredential(role)) {
    throw new Error(`Credential test untuk role ${role} belum diisi di .env`);
  }
  const user = TEST_USERS[role];
  await loginAs(page, user.email, user.password);
}

module.exports = {
  loginAs,
  loginRole,
};
