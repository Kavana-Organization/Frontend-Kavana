const { test, expect } = require('@playwright/test');

const LONG_PROPOSAL_TITLE =
  'Pengembangan Sistem Informasi Manajemen Akademik dan Bimbingan Proyek Berbasis Cloud Native Terintegrasi Lintas Peran';
const ACADEMIC_DOSEN_NAME = 'Roni Andarsyah, M.Kom.';
const LONG_STUDENT_NAME = 'Muhammad Fathurrahman Al-Farizi, S.Tr.Kom.';

const mockKoordinatorStats = {
  total_proposal: 14,
  pending_proposal: 4,
  total_mahasiswa: 28,
  assigned_dosen: 9,
};

const mockKaprodiStats = {
  total_mahasiswa: 32,
  total_dosen: 10,
  lulus_semester_ini: 8,
  proyek: 20,
  internship: 8,
  belum_track: 4,
  by_angkatan: { 2022: 12, 2023: 14, 2024: 6 },
  by_status: {
    'Menunggu Track': 4,
    'Proposal Pending': 6,
    'Sedang Bimbingan': 10,
    'Siap Sidang': 4,
    Lulus: 8,
  },
};

const mockPeriodes = [
  {
    id: 1,
    nama: 'Proyek 2 Semester Genap 2026',
    tipe: 'proyek',
    semester: 3,
    jalur_scope: 'both',
    start_date: '2026-02-01',
    end_date: '2026-07-31',
    status: 'active',
    deskripsi: 'Periode bimbingan dan sidang proyek tingkat 2',
  },
  {
    id: 2,
    nama: 'Internship 1 Semester Ganjil 2025',
    tipe: 'internship',
    semester: 7,
    jalur_scope: 'regular',
    start_date: '2025-09-01',
    end_date: '2026-01-15',
    status: 'completed',
    deskripsi: 'Periode magang industri semester 7',
  },
];

const mockProposals = [
  {
    id: 101,
    mahasiswa_nama: LONG_STUDENT_NAME,
    kelompok_nama: 'Kelompok Proyek Cloud Native ULBI',
    judul_proyek: LONG_PROPOSAL_TITLE,
    track: 'proyek-2',
    anggota: [{ id: 101, nama: LONG_STUDENT_NAME }],
    status_proposal: 'pending',
    enrollment_type: 'regular',
    jalur_pengambilan: 'regular',
    file_proposal: 'https://drive.google.com/file/d/proposal101/view',
  },
  {
    id: 102,
    mahasiswa_nama: 'Aulia Putri Maharani, S.Kom.',
    judul_proyek: 'Integrasi Layanan Monitoring Akademik Terdistribusi',
    track: 'internship-1',
    anggota: [{ id: 102, nama: 'Aulia Putri Maharani, S.Kom.' }],
    status_proposal: 'approved',
    enrollment_type: 'repeat',
    jalur_pengambilan: 'rpl',
  },
];

const mockMahasiswaList = [
  {
    id: 201,
    nama: LONG_STUDENT_NAME,
    npm: '1214088',
    jalur: 'regular',
    track: 'proyek2',
    status_proposal: 'approved',
    dosen_id: null,
    usulan_dosen_nama: ACADEMIC_DOSEN_NAME,
    sidang_eligible: true,
  },
  {
    id: 202,
    nama: 'Aulia Putri Maharani, S.Kom.',
    npm: '1214089',
    jalur: 'rpl',
    track: 'internship1',
    status_proposal: 'approved',
    dosen_id: 10,
    dosen_nama: ACADEMIC_DOSEN_NAME,
    repeat_required: true,
    repeat_track: 'proyek2',
    converted_tracks: ['proyek1'],
    sidang_eligible: true,
  },
  {
    id: 203,
    nama: 'Rizky Ramadhan, S.Tr.Kom.',
    npm: '1214090',
    jalur: 'regular',
    track: 'internship1',
    status_proposal: 'approved',
    dosen_id: 10,
    dosen_nama: ACADEMIC_DOSEN_NAME,
    sidang_eligible: true,
  },
];

const mockDosenList = [
  {
    id: 10,
    nama: ACADEMIC_DOSEN_NAME,
    email: 'roni.andarsyah@ulbi.ac.id',
    mahasiswa_count: 6,
  },
  {
    id: 11,
    nama: 'Dr. Siti Nurhayati, S.T., M.T.',
    email: 'siti.nurhayati@ulbi.ac.id',
    mahasiswa_count: 0,
  },
];

const mockKoordinatorList = [
  {
    id: 10,
    nama: ACADEMIC_DOSEN_NAME,
    email: 'roni.andarsyah@ulbi.ac.id',
    is_koordinator: true,
    assigned_semesters: [3, 5],
  },
  {
    id: 11,
    nama: 'Dr. Siti Nurhayati, S.T., M.T.',
    email: 'siti.nurhayati@ulbi.ac.id',
    is_koordinator: false,
    assigned_semesters: [],
  },
];

const mockSidangList = [
  {
    id: 501,
    mahasiswa_id: 202,
    mahasiswa_nama: LONG_STUDENT_NAME,
    npm: '1214088',
    judul_proyek: LONG_PROPOSAL_TITLE,
    track: 'proyek-2',
    tanggal: '2026-07-15',
    waktu: '09:30:00',
    ruangan: 'Ruang Sidang Gedung Rektorat Lt. 3',
    dosen_id: 10,
    dosen_nama: ACADEMIC_DOSEN_NAME,
    penguji_id: 11,
    penguji_nama: 'Dr. Siti Nurhayati, S.T., M.T.',
    status: 'scheduled',
  },
];

const mockRevisiMonitoring = [
  {
    sidang_id: 501,
    mahasiswa_id: 202,
    display_nama: LONG_STUDENT_NAME,
    judul_proyek: LONG_PROPOSAL_TITLE,
    dosen_nama: ACADEMIC_DOSEN_NAME,
    revisi_status: 'pending',
    revisi_round: 1,
    last_submitted_at: '2026-07-18T10:00:00.000Z',
    last_reviewed_at: null,
  },
];

async function setupMockRole(page, role = 'koordinator', { emptyMode = false } = {}) {
  const isKaprodi = role === 'kaprodi';
  const userName = isKaprodi ? 'Dr. Kaprodi TI, M.T.' : ACADEMIC_DOSEN_NAME;

  await page.route('**/*', async (route) => {
    const url = route.request().url();
    if (!url.includes('/api/') && !url.includes('cloudfunctions')) {
      return route.continue();
    }

    if (url.includes('/auth/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 10,
          dosen_id: 10,
          nama: userName,
          email: isKaprodi ? 'kaprodi@ulbi.ac.id' : 'roni@ulbi.ac.id',
          role,
          roles: [role],
          is_koordinator: isKaprodi,
        }),
      });
    }

    if (url.includes('/notifications')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    }

    if (url.includes('/kaprodi/profile')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 10,
          nama: userName,
          role: 'kaprodi',
          roles: [role],
          is_koordinator: true,
        }),
      });
    }

    if (url.includes('/koordinator/stats')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockKoordinatorStats),
      });
    }

    if (url.includes('/koordinator/proposal/pending')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyMode ? [] : mockProposals),
      });
    }

    if (url.includes('/koordinator/my-semester')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ assigned: true, semesters: [3, 5, 7] }),
      });
    }

    if (url.includes('/koordinator/jadwal')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyMode ? [] : mockPeriodes),
      });
    }

    if (url.includes('/koordinator/revisi-sidang')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyMode ? [] : mockRevisiMonitoring),
      });
    }

    if (url.includes('/koordinator/penguji')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDosenList),
      });
    }

    if (url.includes('/koordinator/sidang')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyMode ? [] : mockSidangList),
      });
    }

    if (url.includes('/koordinator/mahasiswa') || url.includes('/kaprodi/mahasiswa')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyMode ? [] : mockMahasiswaList),
      });
    }

    if (url.includes('/koordinator/dosen') || url.includes('/kaprodi/dosen')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyMode ? [] : mockDosenList),
      });
    }

    if (url.includes('/kaprodi/stats')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyMode ? { total_mahasiswa: 0, total_dosen: 0, lulus_semester_ini: 0, by_angkatan: {} } : mockKaprodiStats),
      });
    }

    if (url.includes('/kaprodi/koordinator')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyMode ? [] : mockKoordinatorList),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.addInitScript(({ activeRole, name, isKaprodi }) => {
    sessionStorage.setItem('authToken', `mock-${activeRole}-token`);
    sessionStorage.setItem('userRole', activeRole);
    sessionStorage.setItem('userId', '10');
    sessionStorage.setItem('userName', name);
    sessionStorage.setItem('userEmail', isKaprodi ? 'kaprodi@ulbi.ac.id' : 'roni@ulbi.ac.id');
    sessionStorage.setItem('userRoles', JSON.stringify([activeRole]));
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({
        state: {
          token: `mock-${activeRole}-token`,
          role: activeRole,
          roles: [activeRole],
          user: {
            id: 10,
            dosen_id: 10,
            nama: name,
            email: isKaprodi ? 'kaprodi@ulbi.ac.id' : 'roni@ulbi.ac.id',
            role: activeRole,
            roles: [activeRole],
            is_koordinator: isKaprodi,
          },
        },
        version: 0,
      })
    );
  }, { activeRole: role, name: userName, isKaprodi });
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

test.describe('Task 14 — Koordinator & Kaprodi Pages Redesign', () => {
  test.setTimeout(60000);
  test.use({ navigationTimeout: 60000 });

  test('Koordinator dashboard: metric strip without deltas and Contoh data caption on static chart', async ({ page }) => {
    await setupMockRole(page, 'koordinator');
    await page.goto('/dashboard/koordinator');
    await waitForPageReady(page);

    const strip = page.locator('[data-testid="koordinator-metric-strip"]');
    await expect(strip).toBeVisible();
    await expect(strip).toContainText('14');
    await expect(strip).toContainText('Total Proposal');
    await expect(page.locator('body')).toContainText('Contoh data');
    await expect(page.locator('body')).not.toContainText(/Theme: Catppuccin Mocha/i);
  });

  test('Jadwal Sidang: 4 fieldset/legend groups, data-testid, Field bindings, and >= 12px constraint text', async ({ page }) => {
    await setupMockRole(page, 'koordinator');
    await page.goto('/dashboard/koordinator/jadwal-sidang');
    await waitForPageReady(page);

    await page.getByRole('button', { name: /Jadwalkan/i }).first().click();

    const form = page.locator('form[data-testid="jadwal-sidang-form"]');
    await expect(form).toBeVisible();

    const legends = form.locator('fieldset > legend');
    await expect(legends).toHaveCount(4);
    await expect(legends.nth(0)).toHaveText('Sidang');
    await expect(legends.nth(1)).toHaveText('Ruang dan Waktu');
    await expect(legends.nth(2)).toHaveText('Penguji');
    await expect(legends.nth(3)).toHaveText('Catatan');

    // Field bindings + unchanged field names
    const tanggalLabel = form.locator('label:has-text("Tanggal")');
    const tanggalInput = form.locator('input[name="tanggal"]');
    expect(await tanggalLabel.getAttribute('for')).toBe(await tanggalInput.getAttribute('id'));

    const waktuLabel = form.locator('label:has-text("Waktu")');
    const waktuInput = form.locator('input[name="waktu"]');
    expect(await waktuLabel.getAttribute('for')).toBe(await waktuInput.getAttribute('id'));

    const ruanganLabel = form.locator('label:has-text("Ruangan")');
    const ruanganInput = form.locator('input[name="ruangan"]');
    expect(await ruanganLabel.getAttribute('for')).toBe(await ruanganInput.getAttribute('id'));

    // Constraint helper text visible and >= 12px
    const helperText = form.locator('fieldset', { hasText: 'Catatan' }).locator('p').first();
    await expect(helperText).toContainText(/bimbingan minimal 8 sesi/i);
    const fontSize = await helperText.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(fontSize).toBeGreaterThanOrEqual(12);
  });

  test('Koordinator pages: Table stackOnMobile with data-label, StatusBadge, Field bindings, and visible search labels', async ({ page }) => {
    await setupMockRole(page, 'koordinator');

    const tablePages = [
      { path: '/dashboard/koordinator/kelola-periode', expectedLabel: 'Nama Periode' },
      { path: '/dashboard/koordinator/validasi-proposal', expectedLabel: 'Judul Proposal' },
      { path: '/dashboard/koordinator/approve-pembimbing', expectedLabel: 'Mahasiswa / Kelompok' },
      { path: '/dashboard/koordinator/daftar-mahasiswa', expectedLabel: 'Mahasiswa', searchLabel: 'Cari mahasiswa' },
      { path: '/dashboard/koordinator/revisi-monitoring', expectedLabel: 'Judul Proyek' },
    ];

    for (const item of tablePages) {
      await page.goto(item.path);
      await waitForPageReady(page);

      const table = page.locator('table');
      await expect(table).toBeVisible();
      await expect(table).toHaveClass(/table-stack/);
      await expect(
        table.locator(`tbody tr:first-child td[data-label="${item.expectedLabel}"]`)
      ).toBeVisible();
      await expect(table.locator('[data-slot="status-badge"]').first()).toBeVisible();

      if (item.searchLabel) {
        const searchLabel = page.locator(`label:has-text("${item.searchLabel}")`);
        const searchInput = page.locator('input[name="search"]');
        await expect(searchLabel).toBeVisible();
        expect(await searchLabel.getAttribute('for')).toBe(await searchInput.getAttribute('id'));
      }
    }

    // Verify kelola-periode dialog Field bindings
    await page.goto('/dashboard/koordinator/kelola-periode');
    await waitForPageReady(page);
    await page.getByRole('button', { name: /Buat Periode/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const namaLabel = dialog.locator('label:has-text("Nama Periode")');
    const namaInput = dialog.locator('input[name="nama"]');
    expect(await namaLabel.getAttribute('for')).toBe(await namaInput.getAttribute('id'));
  });

  test('Kaprodi pages: oversight wording, kelola-koordinator role="group", and monitoring aria-valuenow progressbars', async ({ page }) => {
    await setupMockRole(page, 'kaprodi');

    // Kaprodi dashboard oversight wording
    await page.goto('/dashboard/kaprodi');
    await waitForPageReady(page);
    await expect(page.locator('h1[data-testid="dashboard-title"]')).toContainText(/Monitoring|Rekap/i);

    // daftar-dosen visible search label & Table stackOnMobile
    await page.goto('/dashboard/kaprodi/daftar-dosen');
    await waitForPageReady(page);
    await expect(page.locator('h1[data-testid="dashboard-title"]')).toContainText(/Rekap & Daftar Dosen/i);
    const dosenSearchLabel = page.locator('label:has-text("Cari dosen")');
    const dosenSearchInput = page.locator('input[name="search"]');
    await expect(dosenSearchLabel).toBeVisible();
    expect(await dosenSearchLabel.getAttribute('for')).toBe(await dosenSearchInput.getAttribute('id'));
    await expect(page.locator('table')).toHaveClass(/table-stack/);

    // kelola-koordinator: labelled role="group" semester toggles + visible search label
    await page.goto('/dashboard/kaprodi/kelola-koordinator');
    await waitForPageReady(page);
    await expect(page.locator('h1[data-testid="dashboard-title"]')).toContainText(/Validasi Akhir|Kelola/i);
    const koorSearchLabel = page.locator('label:has-text("Cari dosen")');
    const koorSearchInput = page.locator('input[name="search"]');
    await expect(koorSearchLabel).toBeVisible();
    expect(await koorSearchLabel.getAttribute('for')).toBe(await koorSearchInput.getAttribute('id'));

    const semesterGroup = page.getByRole('group', { name: new RegExp(`Pilih semester koordinator untuk ${ACADEMIC_DOSEN_NAME}`, 'i') });
    await expect(semesterGroup).toBeVisible();
    const sem3Btn = semesterGroup.getByRole('button', { name: /Proyek 2 \(Semester 3\)/i });
    await expect(sem3Btn).toHaveAttribute('aria-pressed', 'true');
    await sem3Btn.click();
    await expect(sem3Btn).toHaveAttribute('aria-pressed', 'false');

    // monitoring: progress bars expose role="progressbar", aria-valuenow, aria-valuemin=0, aria-valuemax=100
    await page.goto('/dashboard/kaprodi/monitoring');
    await waitForPageReady(page);
    await expect(page.locator('h1[data-testid="dashboard-title"]')).toContainText(/Monitoring Progres Mahasiswa Prodi/i);

    const progressBars = page.getByRole('progressbar');
    await expect(progressBars).toHaveCount(6);
    const firstBar = progressBars.first();
    await expect(firstBar).toHaveAttribute('aria-valuemin', '0');
    await expect(firstBar).toHaveAttribute('aria-valuemax', '100');
    await expect(firstBar).toHaveAttribute('aria-valuenow', '13'); // 4/32 = 12.5 -> 13%

    // Empty state oversight wording check
    await setupMockRole(page, 'kaprodi', { emptyMode: true });
    await page.goto('/dashboard/kaprodi/monitoring');
    await waitForPageReady(page);
    await expect(page.locator('[data-slot="empty-state"]')).toContainText(/dipantau/i);
  });

  test('320 px zero horizontal overflow across Koordinator and Kaprodi routes', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });

    const koordinatorRoutes = [
      '/dashboard/koordinator',
      '/dashboard/koordinator/kelola-periode',
      '/dashboard/koordinator/validasi-proposal',
      '/dashboard/koordinator/approve-pembimbing',
      '/dashboard/koordinator/daftar-mahasiswa',
      '/dashboard/koordinator/rekap-mahasiswa',
      '/dashboard/koordinator/jadwal-sidang',
      '/dashboard/koordinator/revisi-monitoring',
    ];

    await setupMockRole(page, 'koordinator');
    for (const route of koordinatorRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page);
      await checkNoHorizontalOverflow(page);
    }

    const kaprodiRoutes = [
      '/dashboard/kaprodi',
      '/dashboard/kaprodi/daftar-dosen',
      '/dashboard/kaprodi/kelola-koordinator',
      '/dashboard/kaprodi/monitoring',
      '/dashboard/kaprodi/daftar-mahasiswa',
    ];

    await setupMockRole(page, 'kaprodi');
    for (const route of kaprodiRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page);
      await checkNoHorizontalOverflow(page);
    }
  });
});
