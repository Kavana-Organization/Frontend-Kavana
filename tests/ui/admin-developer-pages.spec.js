const { test, expect } = require('@playwright/test');

const mockAdminStats = {
  total_users: 166,
  total_mahasiswa: 148,
  total_dosen: 12,
  total_admin: 2,
  proposal_pending: 5,
  bimbingan_aktif: 42,
  laporan_pending: 3,
  sidang_scheduled: 6,
  users_inactive: 4,
};

const mockDosenList = [
  {
    id: 10,
    nama: 'Roni Andarsyah, S.T., M.Kom.',
    email: 'roni.andarsyah@ulbi.ac.id',
    jumlah_bimbingan: 8,
  },
  {
    id: 11,
    nama: 'Dr. Siti Nurhayati Kusumawardhani, M.T.',
    email: 'siti.nurhayati.kusumawardhani@ulbi.ac.id',
    jumlah_bimbingan: 0,
  },
];

const mockUsers = [
  {
    id: 101,
    nama: 'Muhammad Fathurrahman Al-Farizi, S.Tr.Kom.',
    email: 'fathurrahman.alfarizi.proyek@student.ulbi.ac.id',
    role: 'mahasiswa',
    npm: '1214088',
    angkatan: 2022,
    jalur: 'regular',
    no_wa: '081234567890',
    is_active: true,
  },
  {
    id: 102,
    nama: 'Roni Andarsyah, M.Kom.',
    email: 'roni@ulbi.ac.id',
    role: 'dosen',
    nidn: '0412098701',
    no_wa: '081298765432',
    is_active: true,
  },
  {
    id: 103,
    nama: 'Dr. Kaprodi Informatika',
    email: 'kaprodi@ulbi.ac.id',
    role: 'kaprodi',
    nidn: '0401018502',
    no_wa: '081300001111',
    is_active: false,
  },
];

const mockActivities = [
  {
    id: 1,
    message: 'Admin memperbarui status pengguna mahasiswa 1214088',
    created_at: '2026-11-12T09:15:00.000Z',
    result: 'success',
  },
];

const mockAdminAuditLogs = [
  {
    id: 501,
    action: 'UPDATE_USER_STATUS',
    target: 'user',
    target_id: '101',
    user_id: '1',
    role: 'admin',
    request_id: 'req-admin-501-abcdef123456',
    ip_address: '103.144.22.18',
    result: 'success',
    created_at: '2026-11-12T09:20:00.000Z',
    details: JSON.stringify({
      previous_status: 'inactive',
      next_status: 'active',
      reason: 'Verifikasi ulang akun mahasiswa tingkat akhir',
    }),
  },
];

const mockHealth = {
  status: 'ok',
  db: { ok: true, latency_ms: 14 },
  redis: { configured: true, ok: true, latency_ms: 6 },
  runtime: {
    node_env: 'production',
    cors_origins: ['https://kavana.my.id', 'http://localhost:3000'],
    email_notifications_enabled: true,
    turnstile_enabled: false,
  },
};

const mockSyntheticResult = {
  status: 'passed',
  checks: [
    { name: 'database_ping', ok: true, latency_ms: 11 },
    { name: 'redis_configured', ok: true, latency_ms: 4 },
    { name: 'auth_endpoints', ok: true, count: 3 },
  ],
};

const mockDeveloperAuditLogs = [
  {
    id: 9001,
    action: 'REVOKE_DEVICE',
    target: 'developer_device',
    target_id: 'dev-02',
    user_id: '99',
    role: 'developer',
    request_id: 'req-dev-9001-xyz789012345',
    ip_address: '192.168.10.42',
    result: 'success',
    created_at: '2026-11-12T08:45:00.000Z',
    user_agent: 'Mozilla/5.0 Playwright Test Runner',
    details: JSON.stringify({
      device_id: 'dev-02-long-identifier-hash-sample',
      revoked_by: 'developer@kavana.my.id',
    }),
  },
];

const mockAuthTrackers = [
  {
    id: 301,
    event_type: 'login_failed',
    event_category: 'auth_event',
    auth_status: 'failed',
    auth_flow: 'password',
    auth_stage: 'verify',
    identifier_hint: 'mahasiswa.proyek.panjang.sekali@student.ulbi.ac.id',
    failure_reason: 'invalid_credentials',
    hostname: 'kavana.my.id',
    url: 'https://kavana.my.id/login',
    browser: 'Chrome 130.0',
    browser_language: 'id-ID',
    screen_resolution: '390x844',
    timezone: 'Asia/Jakarta',
    ontouchstart: true,
    tanggal_ambil: '2026-11-12T08:30:00.000Z',
    request_ip: '36.79.112.45',
    isp_ip: '36.79.112.45',
    city: 'Bandung',
    region: 'Jawa Barat',
    country_name: 'Indonesia',
    postal: '40151',
    latitude: -6.874,
    longitude: 107.575,
    isp_timezone: 'Asia/Jakarta',
    asn: 'AS7713',
    org: 'PT Telekomunikasi Indonesia',
    created_at: '2026-11-12T08:30:00.000Z',
  },
];

const mockDevices = {
  configured: [
    {
      device_id: 'dev-macbook-pro-kavana-01',
      token_hash: 'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      source: 'github_secret',
    },
  ],
  database: [
    {
      id: 1,
      device_id: 'dev-enrolled-01',
      device_name: 'Workstation Chrome DevTools',
      developer_email: 'dev.kavana.lead@ulbi.ac.id',
      status: 'active',
      last_login_at: '2026-11-12T08:00:00.000Z',
      last_ip: '103.144.22.99',
    },
  ],
};

const mockRedisKeys = {
  configured: true,
  pattern: 'kavana:*',
  count: 2,
  keys: [
    'kavana:session:user:101:long-token-segment-for-overflow-check',
    'kavana:stats:dashboard:kaprodi',
  ],
};

const mockPermissionMatrix = {
  admin: ['manage_users', 'manage_dosen', 'view_audit_logs'],
  developer: ['view_health', 'clear_redis_cache', 'revoke_device'],
};

async function setupMockRole(
  page,
  role = 'admin',
  { emptyMode = false, delayMs = 0, onRequest } = {}
) {
  const userName = role === 'developer' ? 'Developer Kavana' : 'Admin Sistem Kavana';
  const email = role === 'developer' ? 'dev@kavana.my.id' : 'admin@kavana.my.id';

  await page.route('**/*', async (route) => {
    const url = route.request().url();
    if (!url.includes('/api/') && !url.includes('cloudfunctions')) {
      return route.continue();
    }

    if (onRequest) {
      onRequest(route.request());
    }

    if (delayMs > 0 && !url.includes('/auth/me') && !url.includes('/notifications')) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    if (url.includes('/auth/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          nama: userName,
          email,
          role,
          roles: [role],
        }),
      });
    }

    if (url.includes('/notifications')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    }

    // Admin endpoints
    if (url.includes('/api/admin/stats')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyMode ? {} : mockAdminStats),
      });
    }
    if (url.includes('/api/admin/activity')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyMode ? [] : mockActivities),
      });
    }
    if (url.includes('/api/admin/audit-logs')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyMode ? [] : mockAdminAuditLogs),
      });
    }
    if (url.includes('/api/admin/users/') && url.includes('/status')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, message: 'Status diperbarui' }),
      });
    }
    if (url.includes('/api/admin/users')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyMode ? [] : mockUsers),
      });
    }
    if (url.includes('/api/admin/dosen')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyMode ? [] : mockDosenList),
      });
    }

    // Developer endpoints
    if (url.includes('/api/developer/tests/synthetic')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSyntheticResult),
      });
    }
    if (url.includes('/api/developer/health')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockHealth),
      });
    }
    if (url.includes('/api/developer/audit-logs') || url.includes('/api/developer/auth-logs')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyMode ? [] : mockDeveloperAuditLogs),
      });
    }
    if (url.includes('/api/developer/auth-trackers')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyMode ? [] : mockAuthTrackers),
      });
    }
    if (url.includes('/api/developer/devices/') && url.includes('/revoke')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    }
    if (url.includes('/api/developer/devices')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyMode ? { configured: [], database: [] } : mockDevices),
      });
    }
    if (url.includes('/api/developer/redis/cache')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 2 }),
      });
    }
    if (url.includes('/api/developer/redis/keys')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyMode ? { configured: true, pattern: 'kavana:*', count: 0, keys: [] } : mockRedisKeys),
      });
    }
    if (url.includes('/api/developer/permissions/matrix')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyMode ? {} : mockPermissionMatrix),
      });
    }

    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.addInitScript(({ activeRole, name, mail }) => {
    sessionStorage.setItem('authToken', `mock-${activeRole}-token`);
    sessionStorage.setItem('userRole', activeRole);
    sessionStorage.setItem('userId', '1');
    sessionStorage.setItem('userName', name);
    sessionStorage.setItem('userEmail', mail);
    sessionStorage.setItem('userRoles', JSON.stringify([activeRole]));
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({
        state: {
          token: `mock-${activeRole}-token`,
          role: activeRole,
          roles: [activeRole],
          user: {
            id: 1,
            nama: name,
            email: mail,
            role: activeRole,
            roles: [activeRole],
          },
        },
        version: 0,
      })
    );
  }, { activeRole: role, name: userName, mail: email });
}

async function waitForPageReady(page) {
  await expect(page.locator('h1[data-testid="dashboard-title"]')).toBeVisible();
  await expect(page.locator('[data-slot="loading-state"]')).toHaveCount(0);
}

async function checkNoHorizontalOverflow(page) {
  const isOverflowing = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth > root.clientWidth + 1;
  });
  expect(isOverflowing).toBe(false);
}

test.describe('Task 15 — Admin & Developer Pages Redesign', () => {
  test.setTimeout(60000);
  test.use({ navigationTimeout: 60000 });

  test('Admin dashboard & kelola-dosen: metric strips, Contoh data caption, Field labels, Table stackOnMobile, StatusBadge', async ({ page }) => {
    await setupMockRole(page, 'admin');

    await page.goto('/dashboard/admin');
    await waitForPageReady(page);
    const strip = page.locator('[data-testid="admin-metric-strip"]');
    await expect(strip).toBeVisible();
    await expect(strip).toContainText('166');
    await expect(strip.locator('[data-slot="status-badge"]')).toContainText('OK');
    await expect(page.locator('body')).toContainText('Contoh data');

    await page.goto('/dashboard/admin/kelola-dosen');
    await waitForPageReady(page);
    const searchLabel = page.locator('label:has-text("Cari dosen")');
    const searchInput = page.locator('input[name="search"]');
    await expect(searchLabel).toBeVisible();
    expect(await searchLabel.getAttribute('for')).toBe(await searchInput.getAttribute('id'));

    const table = page.locator('table');
    await expect(table).toBeVisible();
    await expect(table).toHaveClass(/table-stack/);
    await expect(table.locator('tbody tr:first-child td[data-label="Dosen"]')).toBeVisible();
    await expect(table.locator('[data-slot="status-badge"]').first()).toContainText('8 mhs');

    // Open Tambah Dosen dialog and verify Field bindings
    await page.getByRole('button', { name: 'Tambah' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const namaLabel = dialog.locator('label:has-text("Nama")');
    const namaInput = dialog.locator('input[name="nama"]');
    expect(await namaLabel.getAttribute('for')).toBe(await namaInput.getAttribute('id'));
  });

  test('Admin kelola-users: labelled role="group" toggle, Field bindings in dialogs, visible search label, no penguji or deactivate confirm', async ({ page }) => {
    let statusPatched = false;
    await setupMockRole(page, 'admin', {
      onRequest: (req) => {
        if (req.url().includes('/api/admin/users/') && req.url().includes('/status')) {
          statusPatched = true;
        }
      },
    });

    await page.goto('/dashboard/admin/kelola-users');
    await waitForPageReady(page);

    const filterGroup = page.getByRole('group', { name: /Filter peran pengguna/i });
    await expect(filterGroup).toBeVisible();
    await expect(filterGroup).not.toContainText(/penguji/i);

    const semuaBtn = filterGroup.getByRole('button', { name: /Semua/i });
    const mahasiswaBtn = filterGroup.getByRole('button', { name: /Mahasiswa/i });
    await expect(semuaBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(mahasiswaBtn).toHaveAttribute('aria-pressed', 'false');

    await mahasiswaBtn.click();
    await expect(mahasiswaBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(semuaBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('tbody tr')).toHaveCount(1);

    // Search label binding
    const searchLabel = page.locator('label:has-text("Cari pengguna")');
    const searchInput = page.locator('input[name="search"]');
    await expect(searchLabel).toBeVisible();
    expect(await searchLabel.getAttribute('for')).toBe(await searchInput.getAttribute('id'));

    // Table stackOnMobile + StatusBadge
    const table = page.locator('table');
    await expect(table).toHaveClass(/table-stack/);
    await expect(table.locator('tbody tr:first-child td[data-label="Pengguna"]')).toBeVisible();
    await expect(table.locator('[data-slot="status-badge"]').first()).toContainText('Aktif');

    // Direct deactivation without new confirmation dialog (§8 Deferral)
    await table.locator('tbody tr:first-child').getByRole('button', { name: /Nonaktifkan/i }).click();
    await expect.poll(() => statusPatched).toBe(true);
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // Edit Profil dialog Field bindings (including SelectTrigger)
    await table.locator('tbody tr:first-child').getByRole('button', { name: /Edit Profil/i }).click();
    const editDialog = page.getByRole('dialog');
    await expect(editDialog).toBeVisible();
    const editNamaLabel = editDialog.locator('label:has-text("Nama")');
    const editNamaInput = editDialog.locator('input[name="nama"]');
    expect(await editNamaLabel.getAttribute('for')).toBe(await editNamaInput.getAttribute('id'));
    const jalurLabel = editDialog.locator('label:has-text("Jalur")');
    const jalurTrigger = editDialog.locator('button[role="combobox"]');
    expect(await jalurLabel.getAttribute('for')).toBe(await jalurTrigger.getAttribute('id'));
    await editDialog.getByRole('button', { name: 'Batal' }).click();

    // Reset Password dialog Field bindings
    await table.locator('tbody tr:first-child').getByRole('button', { name: /Reset Password/i }).click();
    const passDialog = page.getByRole('dialog');
    await expect(passDialog).toBeVisible();
    const passLabel = passDialog.locator('label:has-text("Password Baru")');
    const passInput = passDialog.locator('input[name="new_password"]');
    expect(await passLabel.getAttribute('for')).toBe(await passInput.getAttribute('id'));
  });

  test('Admin monitoring: audit detail JSON rendered as <dl> key-value list plus expandable <details> raw JSON block', async ({ page }) => {
    await setupMockRole(page, 'admin');
    await page.goto('/dashboard/admin/monitoring');
    await waitForPageReady(page);

    // Activities table stackOnMobile + StatusBadge
    const table = page.locator('table');
    await expect(table).toBeVisible();
    await expect(table).toHaveClass(/table-stack/);
    await expect(table.locator('[data-slot="status-badge"]').first()).toContainText('success');

    // Visible search label
    const searchLabel = page.locator('label:has-text("Cari audit log")');
    const searchInput = page.locator('input[name="search"]');
    await expect(searchLabel).toBeVisible();
    expect(await searchLabel.getAttribute('for')).toBe(await searchInput.getAttribute('id'));

    // Audit detail <dl> key-value list + expandable raw JSON <details>
    const article = page.locator('article').first();
    await expect(article.locator('dl dt', { hasText: 'previous_status' })).toBeVisible();
    await expect(article.locator('dl dd', { hasText: 'inactive' })).toBeVisible();
    await expect(article.locator('dl dd').first()).toHaveClass(/font-mono/);

    const details = article.locator('details');
    await expect(details).toBeVisible();
    const pre = details.locator('pre');
    await expect(pre).toBeHidden();
    await details.locator('summary').click();
    await expect(pre).toBeVisible();
    await expect(pre).toContainText('"previous_status": "inactive"');
    await expect(pre).toHaveClass(/font-mono/);
  });

  test('Developer Center: LoadingState, StatusBadge, font-mono tabular-nums, EmptyState, and preserved Turnstile/action semantics', async ({ page }) => {
    let deviceRevoked = false;
    let cacheCleared = false;

    await setupMockRole(page, 'developer', {
      delayMs: 350,
      onRequest: (req) => {
        if (req.url().includes('/revoke')) deviceRevoked = true;
        if (req.url().includes('/redis/cache')) cacheCleared = true;
      },
    });

    await page.goto('/dashboard/developer');
    // LoadingState role="status" visible during async fetch
    await expect(page.locator('[data-slot="loading-state"][role="status"]')).toBeVisible();
    await waitForPageReady(page);

    // StatusBadge & Turnstile Off + Issue status derivation preserved
    const badges = page.locator('[data-slot="status-badge"]');
    await expect(badges.first()).toBeVisible();
    await expect(page.locator('body')).toContainText('Turnstile');
    await expect(page.locator('body')).toContainText('Off');
    await expect(page.locator('body')).toContainText('Issue');

    // Synthetic test button works
    await page.getByRole('button', { name: /Run Synthetic Test/i }).click();
    await expect(page.locator('body')).toContainText('Hasil Synthetic Test');
    await expect(page.locator('body')).toContainText('11 ms');

    // Audit logs: KeyValueGrid <dl> + font-mono + expandable raw JSON
    await page.goto('/dashboard/developer/audit-logs');
    await waitForPageReady(page);
    const devArticle = page.locator('article').first();
    await expect(devArticle.locator('dl dd').first()).toHaveClass(/font-mono/);
    await expect(devArticle.locator('details summary')).toBeVisible();

    // Devices: Table stackOnMobile + direct Revoke (no confirm dialog)
    await page.goto('/dashboard/developer/devices');
    await waitForPageReady(page);
    await expect(page.locator('table').first()).toHaveClass(/table-stack/);
    await page.getByRole('button', { name: 'Revoke' }).click();
    await expect.poll(() => deviceRevoked).toBe(true);
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // Redis cache: visible Field label + direct Clear Prefix (no confirm dialog)
    await page.goto('/dashboard/developer/redis-cache');
    await waitForPageReady(page);
    const prefixLabel = page.locator('label:has-text("Prefix Redis")');
    const prefixInput = page.locator('input[name="cachePrefix"]');
    await expect(prefixLabel).toBeVisible();
    expect(await prefixLabel.getAttribute('for')).toBe(await prefixInput.getAttribute('id'));
    await page.getByRole('button', { name: /Clear Prefix/i }).click();
    await expect.poll(() => cacheCleared).toBe(true);
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // EmptyState check when backend returns empty
    await setupMockRole(page, 'developer', { emptyMode: true });
    await page.goto('/dashboard/developer/audit-logs');
    await waitForPageReady(page);
    await expect(page.locator('[data-slot="empty-state"]')).toBeVisible();
  });

  test('320 px zero horizontal overflow across all Admin and Developer routes', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });

    const adminRoutes = [
      '/dashboard/admin',
      '/dashboard/admin/kelola-dosen',
      '/dashboard/admin/kelola-users',
      '/dashboard/admin/monitoring',
    ];

    await setupMockRole(page, 'admin');
    for (const route of adminRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page);
      await checkNoHorizontalOverflow(page);
    }

    const developerRoutes = [
      '/dashboard/developer',
      '/dashboard/developer/health',
      '/dashboard/developer/audit-logs',
      '/dashboard/developer/auth-logs',
      '/dashboard/developer/auth-trackers',
      '/dashboard/developer/devices',
      '/dashboard/developer/redis-cache',
      '/dashboard/developer/permission-matrix',
    ];

    await setupMockRole(page, 'developer');
    for (const route of developerRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page);
      await checkNoHorizontalOverflow(page);
    }
  });
});
