const { test, expect } = require('@playwright/test');
const { apiUrl, isBackendUnavailableStatus } = require('../helpers/api');

const protectedRoutes = [
  '/dashboard/mahasiswa',
  '/dashboard/dosen',
  '/dashboard/koordinator',
  '/dashboard/kaprodi',
  '/dashboard/admin',
];

test.describe('Security basic - auth protection', () => {
  for (const route of protectedRoutes) {
    test(`unauthenticated user is redirected from ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/login/);
      await expect(page.locator('body')).toContainText(/masuk|login|email/i);
    });
  }

  test('protected API endpoint without token returns unauthorized/forbidden', async ({ request }) => {
    const response = await request.get(apiUrl('/api/auth/profile'));
    test.skip(isBackendUnavailableStatus(response.status()), `Backend sedang tidak sehat, status ${response.status()}.`);
    expect([401, 403]).toContain(response.status());
  });
});
