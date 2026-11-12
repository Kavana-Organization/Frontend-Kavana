const { test, expect } = require('@playwright/test');

/**
 * Helper to bootstrap authenticated session with mocked backend endpoints.
 * This ensures tests run deterministically against the local Next.js server
 * even when the remote backend is unreachable.
 */
async function setupMockDashboard(page, {
  role = 'mahasiswa',
  roles = [role],
  is_koordinator = false,
  notificationStats = {},
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
            is_koordinator,
          },
        }),
      });
    }
    if (url.includes('/api/kaprodi/profile')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            id: 1,
            nama: 'Dr. Kaprodi TI',
            email: 'kaprodi@ulbi.ac.id',
            role: 'kaprodi',
            roles,
            is_koordinator,
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
    ({ role, roles, is_koordinator }) => {
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
              is_koordinator,
            },
          },
          version: 0,
        })
      );
    },
    { role, roles, is_koordinator }
  );
}

/**
 * Resolves the active sidebar container for the current viewport:
 * - Desktop: <aside>
 * - Mobile: opens the Sheet drawer and returns the dialog container
 */
async function getSidebarScope(page, isMobile) {
  if (isMobile) {
    const trigger = page.getByRole('button', { name: /buka menu sidebar/i });
    if (await trigger.isVisible()) {
      await trigger.click();
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    }
    return page.locator('[role="dialog"]');
  }
  return page.locator('aside');
}

test.describe('Sidebar Component & Grouping (§5.1)', () => {
  test('1. Group toggle updates aria-expanded and shows/hides group items', async ({ page, isMobile }) => {
    await setupMockDashboard(page, { role: 'mahasiswa' });
    await page.goto('/dashboard/mahasiswa');
    const sidebar = await getSidebarScope(page, isMobile);

    const persiapanHeader = sidebar.locator('[data-testid="sidebar-group-persiapan-akademik"]');
    const trackLink = sidebar.locator('[data-testid="sidebar-link-track"]');
    const akunHeader = sidebar.locator('[data-testid="sidebar-group-akun"]');
    const profileLink = sidebar.locator('[data-testid="sidebar-link-profile"]');

    await expect(persiapanHeader).toBeVisible();
    await expect(persiapanHeader).toHaveAttribute('aria-expanded', 'true');
    await expect(trackLink).toBeVisible();

    // Akun starts closed by default
    await expect(akunHeader).toBeVisible();
    await expect(akunHeader).toHaveAttribute('aria-expanded', 'false');
    await expect(profileLink).toBeHidden();

    // Toggle Akun open
    await akunHeader.click();
    await expect(akunHeader).toHaveAttribute('aria-expanded', 'true');
    await expect(profileLink).toBeVisible();

    // Toggle Persiapan Akademik closed
    await persiapanHeader.click();
    await expect(persiapanHeader).toHaveAttribute('aria-expanded', 'false');
    await expect(trackLink).toBeHidden();
  });

  test('2. Group open/closed state persists in localStorage across page.reload()', async ({ page, isMobile }) => {
    await setupMockDashboard(page, { role: 'mahasiswa' });
    await page.goto('/dashboard/mahasiswa');
    let sidebar = await getSidebarScope(page, isMobile);

    const persiapanHeader = sidebar.locator('[data-testid="sidebar-group-persiapan-akademik"]');
    const akunHeader = sidebar.locator('[data-testid="sidebar-group-akun"]');

    await expect(persiapanHeader).toBeVisible();
    await expect(akunHeader).toBeVisible();

    // Toggle Akun open and Persiapan closed
    await akunHeader.click();
    await persiapanHeader.click();

    await expect(akunHeader).toHaveAttribute('aria-expanded', 'true');
    await expect(persiapanHeader).toHaveAttribute('aria-expanded', 'false');

    // Reload page
    await page.reload();
    sidebar = await getSidebarScope(page, isMobile);

    const reloadedAkun = sidebar.locator('[data-testid="sidebar-group-akun"]');
    const reloadedPersiapan = sidebar.locator('[data-testid="sidebar-group-persiapan-akademik"]');

    await expect(reloadedAkun).toHaveAttribute('aria-expanded', 'true');
    await expect(reloadedPersiapan).toHaveAttribute('aria-expanded', 'false');
  });

  test('3. Navigating directly to route inside closed group auto-opens group and sets aria-current', async ({ page, isMobile }) => {
    await setupMockDashboard(page, { role: 'mahasiswa' });
    await page.goto('/dashboard/profile');
    const sidebar = await getSidebarScope(page, isMobile);

    const akunHeader = sidebar.locator('[data-testid="sidebar-group-akun"]');
    const profileLink = sidebar.locator('[data-testid="sidebar-link-profile"]');
    const persiapanHeader = sidebar.locator('[data-testid="sidebar-group-persiapan-akademik"]');

    // Akun auto-opens because active route is inside it
    await expect(akunHeader).toHaveAttribute('aria-expanded', 'true');
    await expect(profileLink).toBeVisible();
    await expect(profileLink).toHaveAttribute('aria-current', 'page');

    // Persiapan akademik remains open (multi-open default)
    await expect(persiapanHeader).toHaveAttribute('aria-expanded', 'true');
  });

  test('4. Kaprodi without Koordinator privilege shows no Otoritas Koordinator group header', async ({ page, isMobile }) => {
    await setupMockDashboard(page, {
      role: 'kaprodi',
      roles: ['kaprodi'],
      is_koordinator: false,
    });
    await page.goto('/dashboard/kaprodi');

    if (isMobile) {
      const sidebar = await getSidebarScope(page, true);
      await expect(sidebar.locator('[data-testid="sidebar-group-manajemen-prodi"]')).toBeVisible();
      await expect(sidebar.locator('[data-testid="sidebar-group-dosen-pembimbing"]')).toBeVisible();
      await expect(sidebar.locator('[data-testid="sidebar-group-akun"]')).toBeVisible();
      await expect(sidebar.locator('[data-testid="sidebar-group-otoritas-koordinator"]')).toHaveCount(0);
    } else {
      const sidebar = page.locator('aside');
      await expect(sidebar.locator('[data-testid="sidebar-group-manajemen-prodi"]')).toBeVisible();
      await expect(sidebar.locator('[data-testid="sidebar-group-dosen-pembimbing"]')).toBeVisible();
      await expect(sidebar.locator('[data-testid="sidebar-group-akun"]')).toBeVisible();
      await expect(sidebar.locator('[data-testid="sidebar-group-otoritas-koordinator"]')).toHaveCount(0);

      // Collapse rail mode
      const toggle = sidebar.locator('[data-testid="sidebar-collapse-toggle"]');
      await toggle.click();
      await expect(sidebar.locator('[data-testid="sidebar-group-otoritas-koordinator"]')).toHaveCount(0);
    }
  });

  test('5. Collapsed 64 px rail flyout opens and closes on Escape', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Rail mode is desktop-only');

    await setupMockDashboard(page, { role: 'mahasiswa' });
    await page.goto('/dashboard/mahasiswa');
    const sidebar = page.locator('aside');

    const collapseToggle = sidebar.locator('[data-testid="sidebar-collapse-toggle"]');
    await expect(collapseToggle).toBeVisible();
    await collapseToggle.click();

    await expect(sidebar).toHaveClass(/w-16|w-\[64px\]/);

    const groupTrigger = sidebar.locator('[data-testid="sidebar-group-persiapan-akademik"]');
    await expect(groupTrigger).toBeVisible();

    // Click trigger opens Popover flyout
    await groupTrigger.click();

    const flyoutLink = page.locator('[data-radix-popper-content-wrapper] [data-testid="sidebar-link-track"]');
    await expect(flyoutLink).toBeVisible();

    // Escape closes flyout and returns focus to trigger
    await page.keyboard.press('Escape');
    await expect(flyoutLink).toBeHidden();
    await expect(groupTrigger).toBeFocused();
  });

  test('6. Keyboard navigation: ArrowDown, ArrowUp, Home, End move focus', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Focus traversal test on desktop nav');

    await setupMockDashboard(page, { role: 'mahasiswa' });
    await page.goto('/dashboard/mahasiswa');
    const sidebar = page.locator('aside');

    const dashboardLink = sidebar.locator('[data-testid="sidebar-link-dashboard"]');
    await dashboardLink.focus();
    await expect(dashboardLink).toBeFocused();

    // ArrowDown moves to next interactive item (first group header)
    await page.keyboard.press('ArrowDown');
    const groupHeader = sidebar.locator('[data-testid="sidebar-group-persiapan-akademik"]');
    await expect(groupHeader).toBeFocused();

    // ArrowDown moves into first group item
    await page.keyboard.press('ArrowDown');
    const trackLink = sidebar.locator('[data-testid="sidebar-link-track"]');
    await expect(trackLink).toBeFocused();

    // ArrowUp moves back
    await page.keyboard.press('ArrowUp');
    await expect(groupHeader).toBeFocused();

    // Home jumps to top
    await page.keyboard.press('Home');
    await expect(dashboardLink).toBeFocused();

    // End jumps to last item in nav
    await page.keyboard.press('End');
    const navButtons = sidebar.locator('nav a[href], nav button[data-testid^="sidebar-group-"]');
    const lastNavButton = navButtons.last();
    await expect(lastNavButton).toBeFocused();
  });

  test('7. Realtime refresh survival preserves sidebar group state', async ({ page, isMobile }) => {
    await setupMockDashboard(page, { role: 'mahasiswa' });
    await page.goto('/dashboard/mahasiswa');
    const sidebar = await getSidebarScope(page, isMobile);

    const akunHeader = sidebar.locator('[data-testid="sidebar-group-akun"]');
    await akunHeader.click();
    await expect(akunHeader).toHaveAttribute('aria-expanded', 'true');

    // Dispatch realtime broadcast event that bumps refreshVersion in DashboardLayout
    await page.evaluate(() => {
      try {
        const bc = new BroadcastChannel('kavana-realtime-updates');
        bc.postMessage({ type: 'REALTIME_EVENT', payload: { prefix: '/api/notifications' } });
        bc.close();
      } catch (e) {}
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'kavana-realtime-event',
          newValue: JSON.stringify({ prefix: '/api/notifications', ts: Date.now() }),
        })
      );
    });

    // Wait past debounce
    await page.waitForTimeout(350);

    // Sidebar group must still be expanded
    await expect(akunHeader).toHaveAttribute('aria-expanded', 'true');
  });

  test('8. Blocked localStorage falls back to defaults without unhandled errors', async ({ page, isMobile }) => {
    await setupMockDashboard(page, { role: 'mahasiswa' });

    // Block localStorage before page scripts execute sidebar state
    await page.addInitScript(() => {
      const origGet = Storage.prototype.getItem;
      const origSet = Storage.prototype.setItem;
      Storage.prototype.getItem = function (key) {
        if (key && key.startsWith('kavana-sidebar-groups')) {
          throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
        }
        return origGet.apply(this, arguments);
      };
      Storage.prototype.setItem = function (key) {
        if (key && key.startsWith('kavana-sidebar-groups')) {
          throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
        }
        return origSet.apply(this, arguments);
      };
    });

    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await page.goto('/dashboard/mahasiswa');
    const sidebar = await getSidebarScope(page, isMobile);

    const persiapanHeader = sidebar.locator('[data-testid="sidebar-group-persiapan-akademik"]');
    const akunHeader = sidebar.locator('[data-testid="sidebar-group-akun"]');

    // Default open state renders properly
    await expect(persiapanHeader).toBeVisible();
    await expect(persiapanHeader).toHaveAttribute('aria-expanded', 'true');
    await expect(akunHeader).toBeVisible();
    await expect(akunHeader).toHaveAttribute('aria-expanded', 'false');

    // Toggling in-memory works without crashing
    await akunHeader.click();
    await expect(akunHeader).toHaveAttribute('aria-expanded', 'true');

    expect(pageErrors).toHaveLength(0);
  });
});
