const { test, expect } = require('@playwright/test');

const PRD_VIEWPORTS = [
  { name: 'Laptop Standar', width: 1366, height: 768 },
  { name: 'Desktop Lebar', width: 1440, height: 900 },
  { name: 'Monitor Full HD', width: 1920, height: 1080 },
  { name: 'Tablet Landscape', width: 1024, height: 768 },
  { name: 'Tablet Portrait', width: 768, height: 1024 },
  { name: 'Mobile', width: 390, height: 844 },
];

async function setupRoleMocks(page, role = 'mahasiswa', { multiRoles = [role], failStats = false } = {}) {
  await page.route('**/*', async (route) => {
    const req = route.request();
    const url = req.url();
    if (!url.includes('/api/') && !url.includes('cloudfunctions')) {
      return route.continue();
    }

    if (url.includes('/auth/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 99,
          dosen_id: 99,
          nama: 'Dr. Roni Andarsyah, M.Kom.',
          email: 'roni@ulbi.ac.id',
          role,
          roles: multiRoles,
        }),
      });
    }

    if (failStats && url.includes('/stats')) {
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Gangguan server sementara' }),
      });
    }

    if (url.includes('/mahasiswa/profile')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          nama: 'Aulia Putri Maharani',
          npm: '121400088',
          track: 'proyek-2',
          status_proposal: 'approved',
          usulan_dosen_id: 10,
          dosen_nama: 'Dr. Roni Andarsyah, M.Kom.',
        }),
      });
    }

    if (url.includes('/mahasiswa/bimbingan')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            minggu_ke: 1,
            tanggal: '2026-11-16',
            topik: 'Perancangan Arsitektur Sistem Akademik',
            catatan: 'ACC bab 1 dan 2',
            status: 'approved',
          },
          {
            id: 2,
            minggu_ke: 2,
            tanggal: '2026-11-18',
            topik: 'Implementasi Skema Basis Data',
            catatan: 'Perbaiki relasi tabel logbook',
            status: 'revisi',
          },
        ]),
      });
    }

    if (url.includes('/mahasiswa/laporan')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'submitted', judul: 'Sistem Akademik ULBI' }),
      });
    }

    if (url.includes('/mahasiswa/sidang')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'scheduled',
          tanggal: '2026-11-25',
          waktu: '09:30',
          ruangan: 'Ruang Sidang 301',
        }),
      });
    }

    if (url.includes('/mahasiswa/periode-status')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ has_active: true, active: { nama: 'Semester Ganjil 2026/2027' } }),
      });
    }

    if (url.includes('/dosen/stats')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total_mahasiswa: 2,
          pending_bimbingan: 1,
          pending_laporan: 1,
          bimbingan_minggu_ini: 2,
        }),
      });
    }

    if (url.includes('/dosen/mahasiswa') || url.includes('/kaprodi/mahasiswa') || url.includes('/koordinator/mahasiswa')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 101,
            nama: 'Aulia Putri Maharani',
            npm: '121400088',
            track: 'proyek-2',
            status: 'active',
            status_proposal: 'pending',
            bimbingan_count: 2,
            bimbingan_approved: 2,
            dosen_id: null,
            dosen_nama: null,
            judul_proyek: 'Integrasi Portal Akademik',
          },
        ]),
      });
    }

    if (url.includes('/dosen/bimbingan')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 201,
            mahasiswa_nama: 'Aulia Putri Maharani',
            npm: '121400088',
            minggu_ke: 2,
            tanggal: '2026-11-16',
            created_at: '2026-11-16T08:00:00.000Z',
            topik: 'Review ERD dan skema migrasi',
            status: 'waiting',
          },
        ]),
      });
    }

    if (url.includes('/dosen/laporan')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 301,
            mahasiswa_id: 101,
            mahasiswa_nama: 'Aulia Putri Maharani',
            mahasiswa_npm: '121400088',
            judul: 'Integrasi Portal Akademik',
            submitted_at: '2026-11-15T10:00:00.000Z',
            status: 'submitted',
          },
        ]),
      });
    }

    if (url.includes('/kaprodi/stats') || url.includes('/koordinator/stats')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total_mahasiswa: 12,
          proposal_pending: 2,
          proposal_approved: 8,
          siap_sidang: 4,
          lulus: 3,
          lulus_semester_ini: 3,
          total_dosen: 6,
          by_angkatan: { 2023: 6, 2024: 6 },
          Track: { proyek1: 3, proyek2: 4, proyek3: 2, internship1: 2, internship2: 1 },
        }),
      });
    }

    if (url.includes('/koordinator/jadwal')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            nama: 'Periode Sidang Ganjil',
            type: 'sidang',
            status: 'active',
            start_date: '2026-11-10',
            end_date: '2026-11-30',
          },
        ]),
      });
    }

    if (url.includes('/penguji/sidang') || url.includes('/koordinator/sidang')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 501,
            mahasiswa_nama: 'Aulia Putri Maharani',
            npm: '121400088',
            judul_proyek: 'Integrasi Portal Akademik',
            tanggal: '2026-11-16',
            waktu: '09:30:00',
            ruangan: 'Ruang Sidang 301',
            dosen_nama: 'Dr. Roni Andarsyah, M.Kom.',
            penguji_id: 99,
            penguji_nama: 'Dr. Roni Andarsyah, M.Kom.',
            status: 'scheduled',
          },
        ]),
      });
    }

    if (url.includes('/admin/stats')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total_users: 42,
          total_mahasiswa: 30,
          total_dosen: 10,
          pending_proposals: 2,
        }),
      });
    }

    if (url.includes('/admin/users')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            nama: 'Aulia Putri Maharani',
            email: 'aulia@ulbi.ac.id',
            role: 'mahasiswa',
            npm: '121400088',
            status: 'active',
          },
        ]),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.addInitScript(
    ({ activeRole, allRoles }) => {
      sessionStorage.setItem('authToken', `mock-${activeRole}-token`);
      sessionStorage.setItem('userRole', activeRole);
      sessionStorage.setItem('userId', '99');
      sessionStorage.setItem('userName', 'Dr. Roni Andarsyah, M.Kom.');
      sessionStorage.setItem('userEmail', 'roni@ulbi.ac.id');
      sessionStorage.setItem('userRoles', JSON.stringify(allRoles));
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            token: `mock-${activeRole}-token`,
            role: activeRole,
            roles: allRoles,
            user: {
              id: 99,
              dosen_id: 99,
              nama: 'Dr. Roni Andarsyah, M.Kom.',
              email: 'roni@ulbi.ac.id',
              role: activeRole,
              roles: allRoles,
            },
          },
          version: 0,
        })
      );
    },
    { activeRole: role, allRoles: multiRoles }
  );
}

test.describe('PRD v1.2 Compliance — Navigation, Dashboards, Key Pages & 6 Viewports', () => {
  test.setTimeout(90000);

  test('NAV-1..4 & NAV-7..8: 264px/72px sidebar, Ctrl+B shortcut, active parent dot, Quick Search Ctrl+K, and Multi-Role Switcher', async ({
    page,
  }) => {
    await setupRoleMocks(page, 'dosen', { multiRoles: ['dosen', 'penguji', 'kaprodi'] });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dashboard/dosen/bimbingan-approve');

    const sidebar = page.locator('aside[data-collapsed]');
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveClass(/w-\[264px\]/);

    // Active parent indicator dot on group containing bimbingan-approve
    await expect(page.locator('[data-testid^="sidebar-group-active-dot-"]').first()).toBeVisible();

    // Multi-role switcher visible when user has >1 role
    await expect(page.locator('[data-testid="role-switcher"]')).toBeVisible();

    // Quick search trigger and Ctrl+K dialog
    await expect(page.locator('[data-testid="quick-search-trigger"]')).toBeVisible();
    await page.keyboard.press('Control+k');
    const searchDialog = page.locator('[data-testid="quick-search-dialog"]');
    await expect(searchDialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(searchDialog).toBeHidden();

    // Collapse sidebar with Ctrl+B and verify 72px rail + localStorage persistence
    await page.keyboard.press('Control+b');
    await expect(sidebar).toHaveClass(/w-\[72px\]/);
    const stored = await page.evaluate(() => window.localStorage.getItem('kavana-sidebar-collapsed'));
    expect(stored).toBe('true');
  });

  test('DB-3..6 & DD-2..4: Kaprodi companion table + raw degradation, Koordinator 3-col grid, Penguji spotlight, Admin directory, and Partial Failure ErrorState', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Kaprodi: companion table + raw degradation widget
    await setupRoleMocks(page, 'kaprodi');
    await page.goto('/dashboard/kaprodi');
    await expect(page.locator('[data-testid="kaprodi-cohort-companion-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="kaprodi-degradation-card"]')).toBeVisible();

    // Koordinator: 3-column operational grid
    await setupRoleMocks(page, 'koordinator');
    await page.goto('/dashboard/koordinator');
    await expect(page.locator('[data-testid="koordinator-operational-grid"]')).toBeVisible();

    // Penguji: Focus Spotlight Card
    await setupRoleMocks(page, 'penguji');
    await page.goto('/dashboard/penguji');
    await expect(page.locator('[data-testid="penguji-focus-spotlight"]')).toBeVisible();

    // Admin: Quick User Directory + Partial Failure recovery
    await setupRoleMocks(page, 'admin', { failStats: true });
    await page.goto('/dashboard/admin');
    await expect(page.locator('[data-slot="error-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-quick-users-card"]')).toBeVisible();
  });

  test('PG-1, PG-3, PG-4, PG-6: Split view detail pane, logbook timeline, jadwal kalender strip, and segmented auto-save form', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 });

    // PG-1: Dosen Mahasiswa Bimbingan Split View
    await setupRoleMocks(page, 'dosen');
    await page.goto('/dashboard/dosen/mahasiswa-bimbingan');
    await expect(page.locator('[data-testid="mahasiswa-bimbingan-split-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="mahasiswa-detail-pane"]')).toBeVisible();

    // PG-3: Mahasiswa Bimbingan Vertical Timeline & Revisi distinct icon
    await setupRoleMocks(page, 'mahasiswa');
    await page.goto('/dashboard/mahasiswa/bimbingan');
    await expect(page.locator('[data-testid="bimbingan-logbook-timeline"]')).toBeVisible();
    await expect(page.locator('[data-testid="bimbingan-logbook-timeline"]')).toContainText('16 Nov 2026');

    // PG-4: Koordinator Jadwal Sidang Kalender Strip
    await setupRoleMocks(page, 'koordinator');
    await page.goto('/dashboard/koordinator/jadwal-sidang');
    await expect(page.locator('[data-testid="jadwal-kalender-strip"]')).toBeVisible();

    // PG-6: Penguji Sidang Segmented Form + Auto-save draft indicator
    await setupRoleMocks(page, 'penguji');
    await page.goto('/dashboard/penguji/sidang');
    await expect(page.locator('[data-testid="sidang-segmented-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidang-autosave-indicator"]')).toBeVisible();
  });

  test('DIM-1: Zero horizontal body scroll across all 6 PRD §6.6 viewports', async ({ page }) => {
    await setupRoleMocks(page, 'koordinator');

    for (const vp of PRD_VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/dashboard/koordinator', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1[data-testid="dashboard-title"]')).toBeVisible();
      const hasHorizontalOverflow = await page.evaluate(() => {
        const root = document.documentElement;
        return root.scrollWidth > root.clientWidth + 1;
      });
      expect(hasHorizontalOverflow, `Overflow detected at ${vp.name} (${vp.width}x${vp.height})`).toBe(false);
    }
  });
});
