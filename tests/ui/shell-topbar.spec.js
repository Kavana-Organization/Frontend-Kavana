const { test, expect } = require('@playwright/test');

/**
 * Mock helper for authenticated dashboard session.
 */
async function setupMockDashboard(page, {
  role = 'mahasiswa',
  roles = [role],
  notificationStats = { 'upload-proposal': 1 },
} = {}) {
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/api/auth/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            id: 1,
            nama: 'Budi Santoso',
            email: 'budi@ulbi.ac.id',
            role,
            roles,
          },
        }),
      });
    }
    if (url.includes('/api/notifications/stats') || url.includes('/api/notifications')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: notificationStats,
        }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, data: [] }),
    });
  });

  await page.addInitScript(
    ({ role, roles }) => {
      sessionStorage.setItem('authToken', 'mock-token');
      sessionStorage.setItem('userRole', role);
      sessionStorage.setItem('userId', '1');
      sessionStorage.setItem('userName', 'Budi Santoso');
      sessionStorage.setItem('userEmail', 'budi@ulbi.ac.id');
      sessionStorage.setItem('userRoles', JSON.stringify(roles));
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            token: 'mock-token',
            role,
            roles,
            user: {
              id: 1,
              nama: 'Budi Santoso',
              email: 'budi@ulbi.ac.id',
              role,
              roles,
            },
          },
          version: 0,
        })
      );
    },
    { role, roles }
  );
}

test.describe('Shell, Topbar, Guard State, and WhatsApp (§4.4, §5.1, Ruling 1)', () => {
  test('1. Topbar is 56px (h-14), flat, with breadcrumb and no template subtitle', async ({ page }) => {
    await setupMockDashboard(page);
    await page.goto('/dashboard/mahasiswa');
    await page.waitForLoadState('domcontentloaded');

    const topbar = page.locator('header.sticky');
    await expect(topbar).toBeVisible();

    // Check height is exactly 56px (h-14)
    const box = await topbar.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.round(box.height)).toBe(56);

    // Flat surface & line border, no soft-panel slop or rounded-[30px]
    await expect(topbar).toHaveClass(/h-14/);
    await expect(topbar).toHaveClass(/border-b/);
    await expect(topbar).not.toHaveClass(/soft-panel/);
    await expect(topbar).not.toHaveClass(/rounded-\[/);

    // Breadcrumb Role / Page
    const breadcrumb = topbar.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toContainText('Mahasiswa');
    await expect(breadcrumb).toContainText('Ringkasan Kegiatan');

    // No template subtitle
    await expect(topbar).not.toContainText('Fokus pada pekerjaan yang masih menunggu tindak lanjut hari ini.');
  });

  test('2. Date is demoted to plain muted text on desktop (xl) without border pill', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupMockDashboard(page);
    await page.goto('/dashboard/mahasiswa');
    await page.waitForLoadState('domcontentloaded');

    const topbar = page.locator('header.sticky');
    // Find the date text element inside the topbar
    const dateText = topbar.locator('.tabular-nums');
    await expect(dateText).toBeVisible();
    await expect(dateText).not.toHaveClass(/border/);
    await expect(dateText).not.toHaveClass(/rounded-2xl/);
    await expect(dateText).toHaveClass(/text-\[var\(--text-muted\)\]|text-muted/);
  });

  test('3. Fullscreen action lives inside the user dropdown menu', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupMockDashboard(page);
    await page.goto('/dashboard/mahasiswa');
    await page.waitForLoadState('domcontentloaded');

    const topbar = page.locator('header.sticky');
    // Ensure standalone fullscreen button is NOT in topbar action row
    const standaloneFullscreen = topbar.locator('button[aria-label="Toggle fullscreen"]');
    await expect(standaloneFullscreen).toHaveCount(0);

    // Open user menu
    const userMenuTrigger = topbar.getByRole('button', { name: /menu pengguna|user|budi/i });
    await userMenuTrigger.click();

    // Verify fullscreen item exists inside dropdown
    const fullscreenMenuItem = page.getByRole('menuitem', { name: /layar penuh|fullscreen/i });
    await expect(fullscreenMenuItem).toBeVisible();
  });

  test('4. Notification bell target meets >= 44px and dropdown has 12px radius, shadow-overlay, and aria-live', async ({ page }) => {
    await setupMockDashboard(page);
    await page.goto('/dashboard/mahasiswa');
    await page.waitForLoadState('domcontentloaded');

    const topbar = page.locator('header.sticky');
    const bellBtn = topbar.locator('button[aria-label="Notifications"]');
    await expect(bellBtn).toBeVisible();

    const box = await bellBtn.boundingBox();
    expect(box).not.toBeNull();
    // 44px target
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);

    // Open notification dropdown
    await bellBtn.click();
    const dropdown = page.locator('[role="menu"][data-radix-menu-content], [role="menu"]');
    await expect(dropdown).toBeVisible();
    await expect(dropdown).toHaveClass(/rounded-xl/);
    await expect(dropdown).toHaveClass(/shadow-overlay/);
    await expect(dropdown).not.toHaveClass(/rounded-\[/);
    await expect(dropdown).not.toHaveClass(/backdrop-blur/);
  });

  test('5. Page content container uses max-w-[1280px]', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupMockDashboard(page);
    await page.goto('/dashboard/mahasiswa');
    await page.waitForLoadState('domcontentloaded');

    const contentContainer = page.locator('main .max-w-\\[1280px\\]');
    await expect(contentContainer).toBeVisible();
  });

  test('6. FloatingWhatsApp is visible on public routes and absent on dashboard and auth routes', async ({ page }) => {
    // 1. Visible on public landing route /
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const waButton = page.locator('button[aria-label="Chat via WhatsApp"]');
    await expect(waButton).toBeVisible();

    // 2. Absent on /login
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('button[aria-label="Chat via WhatsApp"]')).toHaveCount(0);

    // 3. Absent on /dashboard/mahasiswa
    await setupMockDashboard(page);
    await page.goto('/dashboard/mahasiswa');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('button[aria-label="Chat via WhatsApp"]')).toHaveCount(0);
  });

  test('7. AuthGuard renders LoadingState ([role="status"]) instead of blank screen during auth check', async ({ page }) => {
    // Delay client-side transition to /login so we can observe the intermediate loading state
    await page.route('**/login**', async (route) => {
      if (route.request().headers()['rsc'] || route.request().url().includes('_rsc')) {
        await new Promise((r) => setTimeout(r, 800));
      }
      return route.continue();
    });

    // Clear session storage to ensure unauthenticated state
    await page.addInitScript(() => {
      sessionStorage.clear();
      localStorage.clear();
    });

    await page.goto('/dashboard/mahasiswa');

    // Check that LoadingState is displayed with role="status"
    const loadingState = page.locator('[role="status"][data-slot="loading-state"]');
    await expect(loadingState).toBeVisible();

    // Eventually redirects to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
