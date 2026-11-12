const { test, expect } = require('@playwright/test');
const { hasRoleCredential } = require('../helpers/env');
const { loginRole } = require('../helpers/auth');

const PUBLIC_ROUTES = [
  { name: 'landing', path: '/' },
  { name: 'panduan-pengguna', path: '/panduan-pengguna' },
  { name: 'faq-sistem', path: '/faq-sistem' },
  { name: 'kebijakan-privasi', path: '/kebijakan-privasi' },
  { name: 'syarat-layanan', path: '/syarat-layanan' },
  { name: 'luaran-proyek-1', path: '/luaran-proyek-1' },
  { name: 'luaran-proyek-2', path: '/luaran-proyek-2' },
  { name: 'luaran-proyek-3', path: '/luaran-proyek-3' },
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  { name: 'forgot-password', path: '/forgot-password' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
];

const THEMES = ['light', 'dark'];

test.describe('Visual Baseline - Public Pages', () => {
  for (const route of PUBLIC_ROUTES) {
    for (const vp of VIEWPORTS) {
      for (const theme of THEMES) {
        test(`${route.name} - ${vp.name} (${vp.width}x${vp.height}) [${theme}]`, async ({ page }, testInfo) => {
          test.skip(testInfo.project.name !== 'e2e-desktop', 'Visual baseline snapshots run on e2e-desktop');

          await page.setViewportSize({ width: vp.width, height: vp.height });
          await page.addInitScript((t) => {
            try {
              window.localStorage.setItem('kavana-theme', t);
            } catch (_) {}
          }, theme);

          await page.goto(route.path, { waitUntil: 'domcontentloaded' });
          await page.waitForLoadState('load');

          // Explicitly ensure theme class is applied to html element
          await page.evaluate((t) => {
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(t);
          }, theme);

          await page.waitForTimeout(400);

          await expect(page).toHaveScreenshot(`${route.name}-${vp.name}-${theme}.png`, {
            fullPage: true,
            maxDiffPixelRatio: 0.05,
            animations: 'disabled',
          });
        });
      }
    }
  }
});

const AUTH_ROLES = [
  { role: 'mahasiswa', path: '/dashboard/mahasiswa' },
  { role: 'dosen', path: '/dashboard/dosen' },
  { role: 'koordinator', path: '/dashboard/koordinator' },
  { role: 'kaprodi', path: '/dashboard/kaprodi' },
  { role: 'admin', path: '/dashboard/admin' },
  { role: 'penguji', path: '/dashboard/penguji' },
  { role: 'developer', path: '/dashboard/developer' },
];

test.describe('Visual Baseline - Authenticated Route Sweeps', () => {
  for (const item of AUTH_ROLES) {
    test(`authenticated sweep: ${item.role}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'e2e-desktop', 'Visual baseline sweeps run on e2e-desktop');
      test.skip(!hasRoleCredential(item.role), `No credentials configured for role: ${item.role}`);

      try {
        await loginRole(page, item.role);
      } catch (err) {
        test.skip(true, `Backend auth unavailable: ${err.message}`);
        return;
      }

      await page.goto(item.path, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('load');

      await expect(page.locator('body')).toBeVisible();
      const title = page.locator('[data-testid="dashboard-title"]').first();
      await expect(title).toBeVisible();
    });
  }
});

