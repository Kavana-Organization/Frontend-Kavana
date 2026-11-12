const { test, expect } = require('@playwright/test');

test.describe('Protected Route Redirects & AuthGuard Loading State', () => {
  test('unauthenticated visit to protected dashboard renders loading state and redirects to login', async ({ page }) => {
    // Delay client-side transition to /login so we can observe the intermediate loading state
    await page.route('**/login**', async (route) => {
      if (route.request().headers()['rsc'] || route.request().url().includes('_rsc')) {
        await new Promise((r) => setTimeout(r, 800));
      }
      return route.continue();
    });

    // Clear storage
    await page.addInitScript(() => {
      sessionStorage.clear();
      localStorage.clear();
    });

    await page.goto('/dashboard/mahasiswa');

    // LoadingState should render before/during redirect
    const loadingState = page.locator('[role="status"][data-slot="loading-state"]');
    await expect(loadingState).toBeVisible();

    // Then page redirects to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('authenticated user is not redirected away from allowed dashboard route', async ({ page }) => {
    await page.route('**/api/auth/me', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            id: 1,
            nama: 'Budi Santoso',
            email: 'budi@ulbi.ac.id',
            role: 'mahasiswa',
            roles: ['mahasiswa'],
          },
        }),
      });
    });

    await page.route('**/api/**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, data: [] }),
      });
    });

    await page.addInitScript(() => {
      sessionStorage.setItem('authToken', 'valid-token');
      sessionStorage.setItem('userRole', 'mahasiswa');
      sessionStorage.setItem('userRoles', JSON.stringify(['mahasiswa']));
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            token: 'valid-token',
            role: 'mahasiswa',
            roles: ['mahasiswa'],
            user: { id: 1, nama: 'Budi Santoso', role: 'mahasiswa', roles: ['mahasiswa'] },
          },
          version: 0,
        })
      );
    });

    await page.goto('/dashboard/mahasiswa');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL(/\/dashboard\/mahasiswa/);
  });
});
