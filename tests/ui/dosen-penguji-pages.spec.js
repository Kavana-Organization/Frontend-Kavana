const { test, expect } = require('@playwright/test');

const LONG_PROPOSAL_TITLE =
  'Pengembangan Sistem Informasi Manajemen Akademik dan Bimbingan Proyek Berbasis Cloud Native Terintegrasi Lintas Peran';
const ACADEMIC_DOSEN_NAME = 'Roni Andarsyah, M.Kom.';
const LONG_STUDENT_NAME = 'Muhammad Fathurrahman Al-Farizi, S.Tr.Kom.';
const LONG_DRIVE_URL =
  'https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789abcdefghijklmnopqrstuvwxyz?usp=sharing';

const mockStats = {
  total_mahasiswa: 2,
  pending_bimbingan: 2,
  pending_laporan: 1,
  bimbingan_minggu_ini: 3,
};

const mockMahasiswa = [
  {
    id: 101,
    nama: LONG_STUDENT_NAME,
    npm: '1214088',
    track: 'proyek-2',
    status: 'active',
    bimbingan_count: 6,
  },
  {
    id: 102,
    nama: 'Aulia Putri Maharani, S.Kom.',
    npm: '1214089',
    track: 'internship-1',
    status: 'active',
    bimbingan_count: 8,
  },
];

const mockBimbingan = [
  {
    id: 201,
    mahasiswa_nama: LONG_STUDENT_NAME,
    npm: '1214088',
    track: 'proyek-2',
    kelompok_id: null,
    minggu_ke: 5,
    tanggal: '2026-03-10',
    created_at: '2026-03-10T09:00:00.000Z',
    topik: 'Implementasi modul persetujuan dan drawer detail responsif pada viewport 320px',
    catatan: 'Sudah menyelesaikan perancangan tabel dan drawer detail.',
    status: 'pending',
  },
  {
    id: 202,
    mahasiswa_nama: 'Aulia Putri Maharani',
    npm: '1214089',
    track: 'internship-1',
    kelompok_id: null,
    minggu_ke: 4,
    tanggal: '2026-03-01',
    created_at: '2026-03-01T08:00:00.000Z',
    topik: 'Validasi alur pengumpulan logbook mingguan paling awal',
    catatan: 'Catatan sesi paling awal untuk uji urutan antrean.',
    status: 'waiting',
  },
  {
    id: 203,
    mahasiswa_nama: 'Rizky Ramadhan',
    npm: '1214090',
    track: 'internship-1',
    kelompok_id: null,
    minggu_ke: 3,
    tanggal: '2026-02-20',
    created_at: '2026-02-20T08:00:00.000Z',
    topik: 'Sesi bimbingan yang sudah disetujui dengan tanda tangan QR',
    catatan: 'Disetujui oleh pembimbing.',
    status: 'approved',
  },
];

const mockLaporan = [
  {
    id: 301,
    mahasiswa_id: 101,
    mahasiswa_nama: LONG_STUDENT_NAME,
    mahasiswa_npm: '1214088',
    track: 'proyek-2',
    kelompok_nama: 'Kelompok Proyek Cloud Native ULBI',
    anggota_nama: `${LONG_STUDENT_NAME}, Rizky Ramadhan`,
    judul: LONG_PROPOSAL_TITLE,
    file_url: LONG_DRIVE_URL,
    file_luaran: LONG_DRIVE_URL,
    submitted_at: '2026-02-25T10:00:00.000Z',
    status: 'submitted',
  },
  {
    id: 302,
    mahasiswa_id: 102,
    mahasiswa_nama: 'Aulia Putri Maharani',
    mahasiswa_npm: '1214089',
    track: 'internship-1',
    judul: 'Laporan Akhir Magang Industri Integrasi Layanan API',
    file_url: LONG_DRIVE_URL,
    file_luaran: LONG_DRIVE_URL,
    submitted_at: '2026-02-15T10:00:00.000Z',
    status: 'approved',
  },
];

const mockRevisi = [
  {
    id: 401,
    revision_round: 1,
    status: 'pending',
    submitted_at: '2026-04-02T10:30:00.000Z',
    mahasiswa_nama: LONG_STUDENT_NAME,
    npm: '1214088',
    judul_proyek: LONG_PROPOSAL_TITLE,
    grouping_mode: 'individu',
    catatan_mahasiswa: 'Sudah melampirkan hasil uji beban pada Bab 4.',
    file_url: LONG_DRIVE_URL,
  },
];

const mockSidang = [
  {
    id: 501,
    mahasiswa_nama: LONG_STUDENT_NAME,
    npm: '1214088',
    judul_proyek: LONG_PROPOSAL_TITLE,
    tanggal: '2026-07-15',
    waktu: '09:30:00',
    ruangan: 'Ruang Sidang Gedung Rektorat Lt. 3',
    dosen_nama: ACADEMIC_DOSEN_NAME,
    penguji_id: 10,
    penguji_nama: ACADEMIC_DOSEN_NAME,
    status: 'scheduled',
    file_laporan: LONG_DRIVE_URL,
    file_luaran: LONG_DRIVE_URL,
  },
  {
    id: 502,
    mahasiswa_nama: 'Aulia Putri Maharani',
    npm: '1214089',
    judul_proyek: 'Sistem Monitoring Kinerja Layanan Akademik Berbasis Event',
    tanggal: '2026-07-10',
    waktu: '13:00:00',
    ruangan: 'Lab TI-02',
    dosen_nama: ACADEMIC_DOSEN_NAME,
    penguji_id: 10,
    penguji_nama: ACADEMIC_DOSEN_NAME,
    status: 'completed',
    hasil_sidang: 'lulus_revisi',
    catatan_sidang: 'Lengkapi lampiran dokumentasi API.',
  },
];

const mockQrSignature = {
  signature: {
    status: 'valid',
    token: 'abcdef1234567890',
    qr_data_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    dosen_nama: ACADEMIC_DOSEN_NAME,
    dosen_kode: 'ULBI-D4TI-001',
    dosen_nidn: '0412038901',
    dosen_nik_masked: '3273********0001',
    verify_url: 'https://kavana.my.id/verify/bimbingan/abcdef1234567890',
  },
};

async function setupMockRole(page, role = 'dosen', { onHasilPatch } = {}) {
  const userName = ACADEMIC_DOSEN_NAME;

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
          id: 10,
          dosen_id: 10,
          nama: userName,
          email: 'roni@ulbi.ac.id',
          role,
          roles: [role],
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
        body: JSON.stringify({ id: 10, nama: userName, is_koordinator: true, roles: [role] }),
      });
    }

    if (url.includes('/dosen/profile')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 10,
          dosen_id: 10,
          nama: userName,
          email: 'roni@ulbi.ac.id',
          nidn: '0412038901',
          kode_dosen: 'ULBI-D4TI-001',
          nik_masked: '3273********0001',
          signature_ready: true,
        }),
      });
    }

    if (url.includes('/dosen/stats')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStats),
      });
    }

    if (url.includes('/dosen/mahasiswa')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockMahasiswa),
      });
    }

    if (url.includes('/dosen/bimbingan/') && url.includes('/signature')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockQrSignature),
      });
    }

    if (url.includes('/dosen/bimbingan/') && url.includes('/status')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'ok' }),
      });
    }

    if (url.includes('/dosen/bimbingan')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockBimbingan),
      });
    }

    if (url.includes('/dosen/laporan/') && url.includes('/status')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'ok' }),
      });
    }

    if (url.includes('/dosen/laporan')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockLaporan),
      });
    }

    if (url.includes('/dosen/revisi-sidang')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRevisi),
      });
    }

    if (url.includes('/penguji/sidang') || url.includes('/koordinator/sidang')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSidang),
      });
    }

    if (url.includes('/sidang/') && url.includes('/hasil') && req.method() === 'PATCH') {
      const payload = req.postDataJSON();
      if (onHasilPatch) onHasilPatch(payload);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Hasil sidang berhasil disimpan' }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.addInitScript(({ activeRole, name }) => {
    sessionStorage.setItem('authToken', `mock-${activeRole}-token`);
    sessionStorage.setItem('userRole', activeRole);
    sessionStorage.setItem('userId', '10');
    sessionStorage.setItem('userName', name);
    sessionStorage.setItem('userEmail', 'roni@ulbi.ac.id');
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
            email: 'roni@ulbi.ac.id',
            role: activeRole,
            roles: [activeRole],
          },
        },
        version: 0,
      })
    );
  }, { activeRole: role, name: userName });
}

async function checkNoHorizontalOverflow(page) {
  const isOverflowing = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth > root.clientWidth + 1;
  });
  expect(isOverflowing).toBe(false);
}

test.describe('Task 13 — Dosen & Penguji Pages Redesign', () => {
  test.setTimeout(60000);
  test.use({ navigationTimeout: 60000 });

  test('Dosen dashboard: queue-first ordering leads before supervised-student summary with no chart/deltas', async ({ page }) => {
    await setupMockRole(page, 'dosen');
    await page.goto('/dashboard/dosen');

    const queueCard = page.locator('[data-testid="dosen-queue-card"]');
    const studentsCard = page.locator('[data-testid="dosen-students-card"]');
    await expect(queueCard).toBeVisible();
    await expect(studentsCard).toBeVisible();

    const queueBox = await queueCard.boundingBox();
    const studentsBox = await studentsCard.boundingBox();
    expect(queueBox.y).toBeLessThan(studentsBox.y);

    const queueItems = page.locator('[data-testid="dosen-queue-item"]');
    await expect(queueItems).toHaveCount(3);

    // Oldest pending item: 2026-02-25 (laporan 301) -> 2026-03-01 (bimbingan 202) -> 2026-03-10 (bimbingan 201)
    await expect(queueItems.nth(0)).toContainText(/Laporan Sidang/i);
    await expect(queueItems.nth(0).locator('a')).toHaveAttribute('href', '/dashboard/dosen/laporan-approve');

    await expect(queueItems.nth(1)).toContainText(/Aulia Putri Maharani/i);
    await expect(queueItems.nth(1).locator('a')).toHaveAttribute('href', '/dashboard/dosen/bimbingan-approve');

    await expect(queueItems.nth(2)).toContainText(/Muhammad Fathurrahman/i);
    await expect(queueItems.nth(2).locator('a')).toHaveAttribute('href', '/dashboard/dosen/bimbingan-approve');

    // No decorative Recharts chart or fabricated delta arrows
    await expect(page.locator('svg.recharts-surface')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText(/Theme: Catppuccin Mocha/i);
  });

  test('bimbingan-approve: dense Table stackOnMobile, Sheet drawer, aria-label icon buttons, Field rejection, and QR block', async ({ page }, testInfo) => {
    await setupMockRole(page, 'dosen');
    await page.goto('/dashboard/dosen/bimbingan-approve');

    const table = page.locator('table');
    await expect(table).toBeVisible();
    await expect(table).toHaveClass(/table-stack/);
    await expect(table.locator('tbody tr').first().locator('td').first()).toHaveAttribute('data-label', 'Mahasiswa');
    await expect(table.locator('[data-slot="status-badge"]').first()).toBeVisible();

    // Icon-only controls have aria-label
    const detailBtn = page.getByRole('button', { name: /Lihat detail bimbingan Muhammad Fathurrahman/i });
    const approveBtn = page.getByRole('button', { name: /Setujui bimbingan Muhammad Fathurrahman/i });
    const rejectBtn = page.getByRole('button', { name: /Tolak bimbingan Muhammad Fathurrahman/i });
    await expect(detailBtn).toBeVisible();
    await expect(approveBtn).toBeVisible();
    await expect(rejectBtn).toBeVisible();

    if (testInfo.project.name === 'e2e-mobile') {
      for (const btn of [detailBtn, approveBtn, rejectBtn]) {
        const box = await btn.boundingBox();
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    // Open right-side Sheet detail drawer
    await detailBtn.click();
    const sheet = page.locator('[data-slot="sheet-content"]');
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText(LONG_STUDENT_NAME);
    await expect(sheet).toContainText(/Sudah menyelesaikan perancangan tabel/i);

    // Open rejection dialog and verify Field label->textarea association
    await sheet.getByRole('button', { name: /Tolak \/ Revisi/i }).click();
    const dialog = page.getByRole('dialog', { name: /Alasan Revisi/i });
    await expect(dialog).toBeVisible();
    const catatanLabel = dialog.locator('label:has-text("Catatan Revisi")');
    const catatanTextarea = dialog.locator('textarea[name="catatan"]');
    expect(await catatanLabel.getAttribute('for')).toBe(await catatanTextarea.getAttribute('id'));
    await dialog.getByRole('button', { name: /Batal/i }).click();
    await expect(dialog).toBeHidden();
    await sheet.getByRole('button', { name: /Close/i }).click();
    await expect(sheet).toBeHidden();

    // Verify QR block on approved session
    const qrBtn = page.getByRole('button', { name: /Lihat QR tanda tangan Rizky Ramadhan/i });
    await expect(qrBtn).toBeVisible();
    await qrBtn.click();
    const qrDialog = page.getByRole('dialog', { name: /Tanda Tangan QR Bimbingan/i });
    await expect(qrDialog).toBeVisible();
    await expect(qrDialog.getByAltText('QR tanda tangan bimbingan')).toBeVisible();
    await expect(qrDialog).toContainText('ULBI-D4TI-001');
    await expect(qrDialog).toContainText('0412038901');
    await expect(qrDialog).toContainText('3273********0001');
  });

  test('laporan-approve: dense Table stackOnMobile, Sheet drawer, aria-label icon buttons, and Field rejection', async ({ page }) => {
    await setupMockRole(page, 'dosen');
    await page.goto('/dashboard/dosen/laporan-approve');

    const table = page.locator('table');
    await expect(table).toBeVisible();
    await expect(table).toHaveClass(/table-stack/);
    await expect(table.locator('[data-slot="status-badge"]').first()).toBeVisible();

    const detailBtn = page.getByRole('button', { name: /Lihat detail laporan Kelompok Proyek/i });
    const approveBtn = page.getByRole('button', { name: /Setujui laporan Kelompok Proyek/i });
    const rejectBtn = page.getByRole('button', { name: /Minta revisi laporan Kelompok Proyek/i });
    await expect(detailBtn).toBeVisible();
    await expect(approveBtn).toBeVisible();
    await expect(rejectBtn).toBeVisible();

    await detailBtn.click();
    const sheet = page.locator('[data-slot="sheet-content"]');
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText(LONG_PROPOSAL_TITLE);

    await sheet.getByRole('button', { name: /Minta Revisi/i }).click();
    const dialog = page.getByRole('dialog', { name: /Catatan Revisi/i });
    await expect(dialog).toBeVisible();
    const label = dialog.locator('label:has-text("Catatan Revisi")');
    const textarea = dialog.locator('textarea[name="catatan"]');
    expect(await label.getAttribute('for')).toBe(await textarea.getAttribute('id'));
  });

  test('revisi-approve: Field binds both review Select and rejection Textarea', async ({ page }) => {
    await setupMockRole(page, 'dosen');
    await page.goto('/dashboard/dosen/revisi-approve');

    await page.getByRole('button', { name: /^Review$/i }).click();
    const dialog = page.getByRole('dialog', { name: /Review Revisi/i });
    await expect(dialog).toBeVisible();

    const statusLabel = dialog.locator('label:has-text("Status")');
    const statusTrigger = dialog.getByRole('combobox');
    expect(await statusLabel.getAttribute('for')).toBe(await statusTrigger.getAttribute('id'));

    const noteLabel = dialog.locator('label:has-text("Catatan untuk Mahasiswa")');
    const noteTextarea = dialog.locator('textarea[name="catatan_dosen"]');
    expect(await noteLabel.getAttribute('for')).toBe(await noteTextarea.getAttribute('id'));
  });

  test('Penguji sidang: two-pane assessment layout with Field-bound controls and unchanged field names', async ({ page }) => {
    let submittedPayload = null;
    await setupMockRole(page, 'penguji', {
      onHasilPatch: (payload) => {
        submittedPayload = payload;
      },
    });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard/penguji/sidang');

    const layout = page.locator('[data-testid="penguji-sidang-layout"]');
    const leftPane = page.locator('[data-testid="sidang-left-pane"]');
    const rightPane = page.locator('[data-testid="sidang-right-pane"]');
    await expect(layout).toBeVisible();
    await expect(leftPane).toBeVisible();
    await expect(rightPane).toBeVisible();

    // Side-by-side on lg desktop
    const leftBox = await leftPane.boundingBox();
    const rightBox = await rightPane.boundingBox();
    expect(leftBox.x).toBeLessThan(rightBox.x);

    // Documents and schedule on left
    await expect(leftPane).toContainText('Naskah Laporan Sidang');
    await expect(leftPane).toContainText('Ruang Sidang Gedung Rektorat Lt. 3');

    // Evaluation form on right with Field bindings and unchanged field names
    const hasilLabel = rightPane.locator('label:has-text("Hasil Sidang")');
    const hasilTrigger = rightPane.getByRole('combobox');
    expect(await hasilLabel.getAttribute('for')).toBe(await hasilTrigger.getAttribute('id'));

    const catatanLabel = rightPane.locator('label:has-text("Catatan Sidang")');
    const catatanTextarea = rightPane.locator('textarea[name="catatan_sidang"]');
    expect(await catatanLabel.getAttribute('for')).toBe(await catatanTextarea.getAttribute('id'));

    await catatanTextarea.fill('Siap disetujui penguji');
    await rightPane.getByRole('button', { name: /Simpan Hasil/i }).click();
    await expect.poll(() => submittedPayload).toEqual({
      hasil_sidang: 'lulus',
      catatan_sidang: 'Siap disetujui penguji',
    });
  });

  test('Re-exported routes resolve page titles through TITLE_MAP and breadcrumb per role namespace', async ({ page }) => {
    const cases = [
      { role: 'koordinator', path: '/dashboard/koordinator/bimbingan-approve', expectedRole: 'Koordinator', expectedTitle: 'Approve Bimbingan' },
      { role: 'kaprodi', path: '/dashboard/kaprodi/laporan-approve', expectedRole: 'Kepala Prodi', expectedTitle: 'Approve Laporan Sidang' },
      { role: 'penguji', path: '/dashboard/penguji/mahasiswa-bimbingan', expectedRole: 'Dosen Penguji', expectedTitle: 'Mahasiswa Bimbingan' },
      { role: 'penguji', path: '/dashboard/penguji/revisi-approve', expectedRole: 'Dosen Penguji', expectedTitle: 'Approve Revisi Sidang' },
    ];

    for (const item of cases) {
      await setupMockRole(page, item.role);
      await page.goto(item.path);
      const topBreadcrumb = page.locator('header nav[aria-label="Breadcrumb"]');
      await expect(topBreadcrumb).toContainText(item.expectedRole);
      await expect(topBreadcrumb).toContainText(item.expectedTitle);
      await expect(page.getByRole('heading', { name: item.expectedTitle })).toBeVisible();
    }
  });

  test('320 px zero horizontal overflow across dosen, penguji, and re-exported routes', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });

    const dosenRoutes = [
      '/dashboard/dosen',
      '/dashboard/dosen/mahasiswa-bimbingan',
      '/dashboard/dosen/bimbingan-approve',
      '/dashboard/dosen/laporan-approve',
      '/dashboard/dosen/revisi-approve',
      '/dashboard/dosen/profile',
    ];

    await setupMockRole(page, 'dosen');
    for (const route of dosenRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(250);
      await checkNoHorizontalOverflow(page);
    }

    const pengujiRoutes = [
      '/dashboard/penguji',
      '/dashboard/penguji/sidang',
      '/dashboard/penguji/bimbingan-approve',
    ];

    await setupMockRole(page, 'penguji');
    for (const route of pengujiRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(250);
      await checkNoHorizontalOverflow(page);
    }
  });
});

