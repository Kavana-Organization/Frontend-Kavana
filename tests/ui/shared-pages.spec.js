const { test, expect } = require('@playwright/test');

const ROLE_PROFILE_FIXTURES = {
  mahasiswa: {
    id: 101,
    nama: 'Muhammad Fathurrahman Al-Farizi',
    email: 'fathurrahman.proyek@student.ulbi.ac.id',
    role: 'mahasiswa',
    roles: ['mahasiswa'],
    npm: '1214088',
    angkatan: 2022,
    no_wa: '081234567890',
    track: 'Proyek 3',
    dosen_pembimbing: 'Roni Andarsyah, M.Kom.',
    is_active: true,
  },
  dosen: {
    id: 201,
    nama: 'Roni Andarsyah, M.Kom.',
    email: 'roni.andarsyah@ulbi.ac.id',
    role: 'dosen',
    roles: ['dosen'],
    nidn: '0412098701',
    is_active: true,
  },
  koordinator: {
    id: 301,
    nama: 'Dr. Koordinator Proyek, M.T.',
    email: 'koordinator@ulbi.ac.id',
    role: 'koordinator',
    roles: ['koordinator', 'dosen'],
    nidn: '0415028402',
    is_active: true,
  },
  kaprodi: {
    id: 401,
    nama: 'Dr. Kaprodi TI, M.Kom.',
    email: 'kaprodi@ulbi.ac.id',
    role: 'kaprodi',
    roles: ['kaprodi', 'dosen'],
    nidn: '0401018502',
    is_koordinator: true,
    is_active: true,
  },
  penguji: {
    id: 501,
    nama: 'Dr. Penguji Sidang, M.T.',
    email: 'penguji@ulbi.ac.id',
    role: 'penguji',
    roles: ['penguji', 'dosen'],
    nidn: '0409088803',
    is_active: true,
  },
  admin: {
    id: 601,
    nama: 'Administrator Akademik',
    email: 'admin@ulbi.ac.id',
    role: 'admin',
    roles: ['admin'],
    is_active: true,
  },
  developer: {
    id: 701,
    nama: 'Developer Sistem Kavana',
    email: 'dev@ulbi.ac.id',
    role: 'developer',
    roles: ['developer'],
    is_active: true,
  },
};

async function setupMockRole(page, role) {
  const fixture = ROLE_PROFILE_FIXTURES[role] || ROLE_PROFILE_FIXTURES.mahasiswa;
  let lastPasswordChange = null;
  let lastProfileUpdate = null;

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = request.url();
    const method = request.method();

    if (url.includes('/realtime') || request.headers()['accept']?.includes('text/event-stream')) {
      return route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: ': ok\n\n',
      });
    }

    if (url.includes('/api/auth/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fixture),
      });
    }

    if (url.includes('/api/auth/change-password') && method === 'POST') {
      lastPasswordChange = request.postDataJSON();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Password berhasil diubah' }),
      });
    }

    if (url.includes('/api/auth/profile') && method === 'PATCH') {
      lastProfileUpdate = request.postDataJSON();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...fixture, ...lastProfileUpdate }),
      });
    }

    if (
      url.includes('/api/mahasiswa/profile') ||
      url.includes('/api/dosen/profile') ||
      url.includes('/api/koordinator/profile') ||
      url.includes('/api/kaprodi/profile') ||
      url.includes('/api/auth/profile')
    ) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fixture),
      });
    }

    if (url.includes('/api/notifications/stats')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    }

    if (url.includes('/api/notifications')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.addInitScript(
    ({ fixtureData }) => {
      sessionStorage.setItem('authToken', 'mock-token');
      sessionStorage.setItem('userRole', fixtureData.role);
      sessionStorage.setItem('userId', String(fixtureData.id));
      sessionStorage.setItem('userName', fixtureData.nama);
      sessionStorage.setItem('userEmail', fixtureData.email);
      sessionStorage.setItem('userRoles', JSON.stringify(fixtureData.roles));
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            token: 'mock-token',
            role: fixtureData.role,
            roles: fixtureData.roles,
            user: fixtureData,
          },
          version: 0,
        })
      );
    },
    { fixtureData: fixture }
  );

  return {
    getLastPasswordChange: () => lastPasswordChange,
    getLastProfileUpdate: () => lastProfileUpdate,
  };
}

function attachErrorListeners(page) {
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    pageErrors.push(String(err));
  });
  return { consoleErrors, pageErrors };
}

async function waitForPageReady(page) {
  await expect(page.locator('h1[data-testid="dashboard-title"]')).toBeVisible();
  await expect(page.locator('[data-slot="loading-state"]')).toHaveCount(0);
}

async function checkNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe('Shared Pages: Profile, Settings, Support (Task 16)', () => {
  test('1. Shared /dashboard/profile and /dashboard/settings render without errors for all 7 roles', async ({ page }) => {
    const roles = ['mahasiswa', 'dosen', 'koordinator', 'kaprodi', 'penguji', 'admin', 'developer'];
    const { consoleErrors, pageErrors } = attachErrorListeners(page);

    for (const role of roles) {
      await setupMockRole(page, role);

      await page.goto('/dashboard/profile', { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page);
      await expect(page.locator('h1[data-testid="dashboard-title"]')).toHaveText('Profil Saya');
      await expect(page.locator('[data-slot="status-badge"]').first()).toBeVisible();

      await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page);
      await expect(page.locator('h1[data-testid="dashboard-title"]')).toHaveText('Pengaturan');
    }

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test('2. All five role settings re-exports render cleanly without console/page errors', async ({ page }) => {
    const reexportCases = [
      { role: 'mahasiswa', path: '/dashboard/mahasiswa/settings' },
      { role: 'dosen', path: '/dashboard/dosen/settings' },
      { role: 'koordinator', path: '/dashboard/koordinator/settings' },
      { role: 'kaprodi', path: '/dashboard/kaprodi/settings' },
      { role: 'admin', path: '/dashboard/admin/settings' },
    ];
    const { consoleErrors, pageErrors } = attachErrorListeners(page);

    for (const item of reexportCases) {
      await setupMockRole(page, item.role);
      await page.goto(item.path, { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page);
      await expect(page.locator('h1[data-testid="dashboard-title"]')).toHaveText('Pengaturan');
      await expect(page.locator('input[name="oldPw"]')).toBeVisible();
      await expect(page.locator('input[name="newPw"]')).toBeVisible();
      await expect(page.locator('input[name="confirmPw"]')).toBeVisible();
    }

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test('3. Profile & Settings use two-column lg layout (identity left, security right) and Field bindings', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Two-column lg layout assertion runs on desktop viewport');
    await page.setViewportSize({ width: 1280, height: 800 });

    const trackers = await setupMockRole(page, 'mahasiswa');

    // Profile page
    await page.goto('/dashboard/profile', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    const profileIdentityBox = await page.locator('[data-testid="profile-identity-col"]').boundingBox();
    const profileSecurityBox = await page.locator('[data-testid="profile-security-col"]').boundingBox();
    expect(profileIdentityBox).not.toBeNull();
    expect(profileSecurityBox).not.toBeNull();
    expect(profileIdentityBox.x).toBeLessThan(profileSecurityBox.x);

    // Font mono tabular-nums on NPM
    await expect(page.locator('dd', { hasText: '1214088' })).toHaveClass(/font-mono/);
    await expect(page.locator('dd', { hasText: '1214088' })).toHaveClass(/tabular-nums/);

    // Edit profile Field bindings & submit
    await page.getByRole('button', { name: 'Edit' }).click();
    const namaLabel = page.locator('label', { hasText: 'Nama Lengkap' });
    const namaInput = page.locator('input[name="nama"]');
    const emailLabel = page.locator('label', { hasText: 'Email' });
    const emailInput = page.locator('input[name="email"]');
    const waLabel = page.locator('label', { hasText: 'No. WhatsApp' });
    const waInput = page.locator('input[name="no_wa"]');

    expect(await namaLabel.getAttribute('for')).toBe(await namaInput.getAttribute('id'));
    expect(await emailLabel.getAttribute('for')).toBe(await emailInput.getAttribute('id'));
    expect(await waLabel.getAttribute('for')).toBe(await waInput.getAttribute('id'));

    await namaInput.fill('Fathurrahman Updated');
    await page.getByRole('button', { name: 'Simpan' }).click();
    await expect.poll(() => trackers.getLastProfileUpdate()?.nama).toBe('Fathurrahman Updated');

    // Password Field bindings on profile
    const oldPwLabel = page.locator('label', { hasText: 'Password Lama' });
    const oldPwInput = page.locator('input[name="oldPw"]');
    expect(await oldPwLabel.getAttribute('for')).toBe(await oldPwInput.getAttribute('id'));

    // Settings page
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    const settingsIdentityBox = await page.locator('[data-testid="settings-identity-col"]').boundingBox();
    const settingsSecurityBox = await page.locator('[data-testid="settings-security-col"]').boundingBox();
    expect(settingsIdentityBox).not.toBeNull();
    expect(settingsSecurityBox).not.toBeNull();
    expect(settingsIdentityBox.x).toBeLessThan(settingsSecurityBox.x);

    const settingsOldPwLabel = page.locator('label', { hasText: 'Password Lama' });
    const settingsOldPwInput = page.locator('input[name="oldPw"]');
    const settingsNewPwLabel = page.locator('label', { hasText: 'Password Baru' }).first();
    const settingsNewPwInput = page.locator('input[name="newPw"]');
    const settingsConfirmLabel = page.locator('label', { hasText: 'Konfirmasi Password Baru' });
    const settingsConfirmInput = page.locator('input[name="confirmPw"]');

    expect(await settingsOldPwLabel.getAttribute('for')).toBe(await settingsOldPwInput.getAttribute('id'));
    expect(await settingsNewPwLabel.getAttribute('for')).toBe(await settingsNewPwInput.getAttribute('id'));
    expect(await settingsConfirmLabel.getAttribute('for')).toBe(await settingsConfirmInput.getAttribute('id'));

    await settingsOldPwInput.fill('oldpass123');
    await settingsNewPwInput.fill('newpass123');
    await settingsConfirmInput.fill('newpass123');
    await page.getByRole('button', { name: 'Ubah Password' }).click();
    await expect.poll(() => trackers.getLastPasswordChange()?.new_password).toBe('newpass123');
  });

  test('4. Support page: searchable FAQ with Accordion, Email & WhatsApp contact cards, and role-specific FAQ entries', async ({ page }) => {
    const { consoleErrors, pageErrors } = attachErrorListeners(page);

    // Check mahasiswa role-specific FAQ
    await setupMockRole(page, 'mahasiswa');
    await page.goto('/dashboard/support', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await expect(page.locator('h1[data-testid="dashboard-title"]')).toHaveText('Pusat Bantuan');

    // Visible Field-bound FAQ search input
    const searchLabel = page.locator('label', { hasText: 'Cari Pertanyaan (FAQ)' });
    const searchInput = page.locator('input[name="faqSearch"]');
    await expect(searchLabel).toBeVisible();
    expect(await searchLabel.getAttribute('for')).toBe(await searchInput.getAttribute('id'));

    // Role-specific FAQ present for mahasiswa
    const accordion = page.locator('[data-testid="support-faq-accordion"]');
    const bimbinganTrigger = accordion.getByRole('button', { name: /Berapa minimal sesi bimbingan/i });
    await expect(bimbinganTrigger).toBeVisible();
    await bimbinganTrigger.click();
    await expect(bimbinganTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(accordion).toContainText('minimal 8 sesi bimbingan');

    // Accordion expand/collapse works
    const passwordTrigger = accordion.getByRole('button', { name: /Bagaimana cara ganti password akun/i });
    await passwordTrigger.click();
    await expect(passwordTrigger).toHaveAttribute('aria-expanded', 'true');
    // Section 8 deferral: password copy stays minimal 6 karakter
    await expect(accordion).toContainText('minimal 6 karakter');
    await passwordTrigger.click();
    await expect(passwordTrigger).toHaveAttribute('aria-expanded', 'false');

    // Typing in search filters Accordion items
    await searchInput.fill('8 sesi');
    const itemsAfterFilter = accordion.locator('[data-slot="accordion-item"]');
    await expect(itemsAfterFilter).toHaveCount(1);
    await expect(accordion).toContainText('Berapa minimal sesi bimbingan');

    // Non-matching search shows EmptyState and reset works
    await searchInput.fill('zzzz-tidak-ada');
    await expect(page.locator('[data-slot="empty-state"]')).toBeVisible();
    await page.getByRole('button', { name: 'Reset Pencarian' }).click();
    await expect(accordion.locator('[data-slot="accordion-item"]')).toHaveCount(7);

    // Email & WhatsApp contact cards with CAMPUS_CONTACT values
    const emailCard = page.locator('[data-testid="support-email-card"]');
    await expect(emailCard).toContainText('support@kavana.my.id');
    await expect(emailCard.locator('a[href^="mailto:support@kavana.my.id"]')).toBeVisible();

    const waCard = page.locator('[data-testid="support-whatsapp-card"]');
    await expect(waCard).toContainText('+62 851 7993 5117');
    await expect(waCard.locator('a[href^="https://wa.me/6285179935117"]')).toBeVisible();

    // Check dosen role-specific FAQ differs
    await setupMockRole(page, 'dosen');
    await page.goto('/dashboard/support', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await expect(page.locator('[data-testid="support-faq-accordion"]')).toContainText('Kode Dosen dan NIK');

    // Check developer role-specific FAQ differs
    await setupMockRole(page, 'developer');
    await page.goto('/dashboard/support', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await expect(page.locator('[data-testid="support-faq-accordion"]')).toContainText('Device Lock');

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test('5. 320 px zero horizontal overflow across /dashboard/profile, /dashboard/settings, and /dashboard/support', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await setupMockRole(page, 'mahasiswa');

    const sharedRoutes = [
      '/dashboard/profile',
      '/dashboard/settings',
      '/dashboard/support',
      '/dashboard/mahasiswa/settings',
    ];

    for (const route of sharedRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page);
      await checkNoHorizontalOverflow(page);
    }
  });
});
