const { test, expect } = require('@playwright/test');

const LONG_PROPOSAL_TITLE =
  'Pengembangan Sistem Informasi Manajemen Akademik dan Bimbingan Proyek Berbasis Cloud Native Terintegrasi';
const ACADEMIC_DOSEN_NAME = 'Roni Andarsyah, S.T., M.Kom.';
const ACADEMIC_PENGUJI_NAME = 'Dr. Muhammad Haviz, M.T. & Dr. Ir. Wahyu Wibowo, M.Sc.';
const LONG_DRIVE_URL =
  'https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789abcdefghijklmnopqrstuvwxyz?usp=sharing';

const baseMockProfile = {
  id: 1,
  nama: 'Budi Santoso, S.Kom.',
  npm: '1214088',
  email: 'budi@ulbi.ac.id',
  track: 'proyek-2',
  judul_proyek: LONG_PROPOSAL_TITLE,
  judul_proposal: LONG_PROPOSAL_TITLE,
  dosen_nama: ACADEMIC_DOSEN_NAME,
  dosen_pembimbing: ACADEMIC_DOSEN_NAME,
  status_proposal: 'approved',
  proposal_status: 'approved',
  enrollments: [
    {
      id: 'enr-01',
      track: 'proyek-2',
      status: 'active',
      enrollment_type: 'regular',
      status_proposal: 'approved',
      judul_proyek: LONG_PROPOSAL_TITLE,
      dosen_id: 10,
      dosen_nama: ACADEMIC_DOSEN_NAME,
    },
  ],
};

const mockBimbingan = [
  {
    id: 'B-01',
    tanggal: '2026-03-01',
    topik: 'Pembahasan Analisis Kebutuhan Sistem Terintegrasi',
    catatan: 'Dosen menyetujui diagram use case dan spesifikasi arsitektur data.',
    status: 'approved',
  },
  {
    id: 'B-02',
    tanggal: '2026-03-08',
    topik: 'Perancangan Database dan Relasi Antar Tabel',
    catatan: 'Revisi normalisasi tabel bimbingan dan laporan sidang.',
    status: 'approved',
  },
  {
    id: 'B-03',
    tanggal: '2026-03-15',
    topik: 'Implementasi Antarmuka Mahasiswa Sesuai Desain Bebas Slop',
    catatan: 'Menunggu peninjauan prototipe responsif pada viewport mobile.',
    status: 'pending',
  },
];

const mockLaporan = [
  {
    id: 1,
    judul: LONG_PROPOSAL_TITLE,
    file_url: LONG_DRIVE_URL,
    file_luaran: LONG_DRIVE_URL,
    status: 'submitted',
  },
];

const mockSidang = {
  tanggal_sidang: '2026-07-15',
  tanggal: '2026-07-15',
  waktu_sidang: '09:30:00',
  waktu: '09:30:00',
  ruangan: 'Ruang Sidang Gedung Rektorat Lt 3',
  penguji_nama: ACADEMIC_PENGUJI_NAME,
  hasil: 'lulus_revisi',
  hasil_sidang: 'lulus_revisi',
  catatan_sidang: 'Perbaiki bab 4 pengujian performa sistem dan sertakan bukti uji beban.',
};

const mockRevisi = {
  sidang: mockSidang,
  is_kelompok: false,
  revisi: [
    {
      id: 'rev-01',
      revision_round: 1,
      status: 'pending',
      submitted_at: '2026-07-20T10:00:00.000Z',
      catatan_mahasiswa: 'Sudah memperbaiki bab 4 pengujian performa sesuai catatan penguji.',
      catatan_dosen: 'Tinjau ulang tabel uji beban 100 pengguna serentak.',
      reviewer_nama: ACADEMIC_PENGUJI_NAME,
      file_url: LONG_DRIVE_URL,
      file_luaran: LONG_DRIVE_URL,
    },
  ],
};

const mockKelompok = {
  kelompok: {
    id: 1,
    nama: 'Kelompok Proyek Sistem Informasi Akademik Terpadu TI-4B',
    track: 'proyek-2',
  },
  anggota: [
    { id: 1, nama: 'Budi Santoso, S.Kom.', npm: '1214088' },
    { id: 2, nama: 'Rizky Ramadhan, S.Tr.Kom.', npm: '1214089' },
  ],
};

async function setupMockMahasiswa(page, {
  emptyBimbingan = false,
  unselectedTrack = false,
  hasProposal = true,
  hasKelompok = true,
} = {}) {
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
          ok: true,
          data: {
            id: 1,
            nama: baseMockProfile.nama,
            email: baseMockProfile.email,
            role: 'mahasiswa',
            roles: ['mahasiswa'],
          },
        }),
      });
    }

    if (url.includes('/notifications')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, data: {} }),
      });
    }

    if (url.includes('/mahasiswa/profile') || url.includes('/auth/profile')) {
      let data = { ...baseMockProfile };
      if (unselectedTrack) {
        data = { ...data, track: null, status_proposal: null, enrollments: [] };
      } else if (!hasProposal) {
        data = { ...data, status_proposal: null, proposal_status: null, enrollments: [] };
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, data }),
      });
    }

    if (url.includes('/mahasiswa/bimbingan')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: emptyBimbingan ? [] : mockBimbingan,
        }),
      });
    }

    if (url.includes('/mahasiswa/laporan')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, data: mockLaporan }),
      });
    }

    if (url.includes('/mahasiswa/sidang')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, data: mockSidang }),
      });
    }

    if (url.includes('/mahasiswa/revisi')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, data: mockRevisi }),
      });
    }

    if (url.includes('/mahasiswa/kelompok/available')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, data: [] }),
      });
    }

    if (url.includes('/mahasiswa/kelompok')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: hasKelompok ? mockKelompok : { kelompok: null, anggota: [] },
        }),
      });
    }

    if (url.includes('/mahasiswa/dosen')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: [
            { id: 10, nama: ACADEMIC_DOSEN_NAME },
            { id: 11, nama: 'Dosen Pembimbing Kedua, M.T.' },
          ],
        }),
      });
    }

    if (url.includes('/mahasiswa/periode') || url.includes('/mahasiswa/track')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            semester: 4,
            active: true,
            jalur: 'regular',
            eligibilities: [
              { track: 'proyek2', enrollment_type: 'regular', reason: 'Semester 4' },
            ],
            active_enrollments: [],
          },
        }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, data: [] }),
    });
  });

  await page.addInitScript(() => {
    sessionStorage.setItem('authToken', 'mock-mahasiswa-token');
    sessionStorage.setItem('userRole', 'mahasiswa');
    sessionStorage.setItem('userId', '1');
    sessionStorage.setItem('userName', 'Budi Santoso');
    sessionStorage.setItem('userEmail', 'budi@ulbi.ac.id');
    sessionStorage.setItem('userRoles', JSON.stringify(['mahasiswa']));
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({
        state: {
          token: 'mock-mahasiswa-token',
          role: 'mahasiswa',
          roles: ['mahasiswa'],
          user: {
            id: 1,
            nama: 'Budi Santoso',
            email: 'budi@ulbi.ac.id',
            role: 'mahasiswa',
            roles: ['mahasiswa'],
          },
        },
        version: 0,
      })
    );
  });
}

async function checkNoHorizontalOverflow(page) {
  const isOverflowing = await page.evaluate(() => {
    const root = document.documentElement;
    // Allow 1px tolerance for subpixel antialiasing differences
    return root.scrollWidth > root.clientWidth + 1;
  });
  expect(isOverflowing).toBe(false);
}

test.describe('Task 12 — Mahasiswa Dashboard & Pages Redesign', () => {
  test.setTimeout(60000);
  test.use({ navigationTimeout: 60000 });

  test('Mahasiswa dashboard: Langkah berikutnya is first block with single CTA', async ({ page }) => {
    await setupMockMahasiswa(page);
    await page.goto('/dashboard/mahasiswa');

    const nextStepCard = page.locator('[data-testid="next-step-card"]');
    await expect(nextStepCard).toBeVisible();

    // Verify it contains "Langkah berikutnya"
    await expect(nextStepCard).toContainText(/langkah berikutnya/i);

    // Verify single primary CTA inside the card
    const cta = nextStepCard.getByRole('link');
    await expect(cta).toHaveCount(1);
    await expect(cta).toHaveAttribute('href', /\/dashboard\/mahasiswa\//);
  });

  test('Mahasiswa dashboard: 7-stage pipeline strip renders with all 7 stages and proper states', async ({ page }) => {
    await setupMockMahasiswa(page);
    await page.goto('/dashboard/mahasiswa');

    const pipelineStrip = page.locator('[data-testid="pipeline-strip"]');
    await expect(pipelineStrip).toBeVisible();

    // All 7 stages
    const expectedStages = [
      'Track',
      'Kelompok',
      'Proposal',
      'Pembimbing',
      'Bimbingan',
      'Laporan',
      'Jadwal Sidang',
    ];

    for (const stage of expectedStages) {
      await expect(pipelineStrip).toContainText(new RegExp(stage, 'i'));
    }

    // Check states: selesai, berjalan, terkunci
    const stageItems = pipelineStrip.locator('[data-testid^="pipeline-stage-"]');
    await expect(stageItems).toHaveCount(7);

    // Verify state labels exist in the rendered text
    await expect(pipelineStrip).toContainText(/selesai|berjalan|terkunci/i);
  });

  test('Mahasiswa dashboard: metric strip has 4 metrics without icons or delta strings', async ({ page }) => {
    await setupMockMahasiswa(page);
    await page.goto('/dashboard/mahasiswa');

    const metricStrip = page.locator('[data-testid="metric-strip"]');
    await expect(metricStrip).toBeVisible();

    // Check titles
    await expect(metricStrip).toContainText(/total bimbingan/i);
    await expect(metricStrip).toContainText(/disetujui/i);
    await expect(metricStrip).toContainText(/menunggu/i);
    await expect(metricStrip).toContainText(/dosen pembimbing/i);

    // Must NOT contain delta strings like "+2" or "+3 total disetujui"
    await expect(metricStrip).not.toContainText(/\+\d+\s+total/i);
    await expect(metricStrip).not.toContainText(/\+\d+\s+sesi/i);

    // Numerics have font-mono tabular-nums
    const totalMetric = metricStrip.locator('p:has-text("3")');
    await expect(totalMetric).toHaveClass(/tabular-nums/);
  });

  test('Mahasiswa dashboard: 8-slot segmented progress replaces Recharts chart', async ({ page }) => {
    await setupMockMahasiswa(page);
    await page.goto('/dashboard/mahasiswa');

    const progressCard = page.locator('[data-testid="bimbingan-segmented-progress"]');
    await expect(progressCard).toBeVisible();

    // Has role="progressbar" with aria attributes
    const progressbar = progressCard.getByRole('progressbar');
    await expect(progressbar).toBeVisible();
    await expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    await expect(progressbar).toHaveAttribute('aria-valuemax', '8');
    await expect(progressbar).toHaveAttribute('aria-valuenow', '2'); // 2 approved in mock

    // 8 slots rendered
    const slots = progressbar.locator('div > span');
    await expect(slots).toHaveCount(8);

    // Recharts svg chart is NOT present in this card
    await expect(progressCard.locator('svg.recharts-surface')).toHaveCount(0);
  });

  test('Mahasiswa dashboard: activity table uses Table stackOnMobile and StatusBadge', async ({ page }) => {
    await setupMockMahasiswa(page);
    await page.goto('/dashboard/mahasiswa');

    const activityCard = page.locator('[data-testid="bimbingan-activity-card"]');
    await expect(activityCard).toBeVisible();

    // Table stackOnMobile applies table-stack class
    const table = activityCard.locator('table');
    await expect(table).toHaveClass(/table-stack/);

    // Table cells have data-label attribute
    const firstCell = activityCard.locator('tbody tr').first().locator('td').first();
    await expect(firstCell).toHaveAttribute('data-label', 'ID');

    // StatusBadge is rendered
    const badges = activityCard.locator('[data-slot="status-badge"]');
    await expect(badges.first()).toBeVisible();
  });

  test('Subpage /bimbingan: Field label associations, empty-state action, and LoadingState', async ({ page }) => {
    // 1. Normal state with sessions
    await setupMockMahasiswa(page);
    await page.goto('/dashboard/mahasiswa/bimbingan');
    await expect(page.getByRole('heading', { name: /bimbingan online/i })).toBeVisible();

    // Open add dialog
    await page.getByRole('button', { name: /tambah sesi/i }).click();
    const form = page.locator('[data-testid="bimbingan-form"]');
    await expect(form).toBeVisible();

    // Verify Field label associations (for matches input id)
    const tanggalLabel = form.locator('label:has-text("Tanggal")');
    const tanggalInput = form.locator('input[type="date"]');
    const labelFor = await tanggalLabel.getAttribute('for');
    const inputId = await tanggalInput.getAttribute('id');
    expect(labelFor).toBeTruthy();
    expect(labelFor).toBe(inputId);

    // Close modal
    await page.getByRole('button', { name: /batal/i }).click();

    // 2. Empty state with "Catat bimbingan" CTA
    await setupMockMahasiswa(page, { emptyBimbingan: true });
    await page.goto('/dashboard/mahasiswa/bimbingan');
    const emptyAction = page.getByRole('button', { name: /catat bimbingan/i });
    await expect(emptyAction).toBeVisible();
  });

  test('Subpage /proposal: Field label associations and data-testid proposal-form', async ({ page }) => {
    await setupMockMahasiswa(page, { hasProposal: false });
    await page.goto('/dashboard/mahasiswa/proposal');

    const form = page.locator('[data-testid="proposal-form"]');
    await expect(form).toBeVisible();

    // Check label association for Judul
    const judulLabel = form.locator('label:has-text("Judul")');
    const judulInput = form.locator('input[placeholder="Judul proposal"]');
    expect(await judulLabel.getAttribute('for')).toBe(await judulInput.getAttribute('id'));

    // Check label association for Link Proposal
    const linkLabel = form.locator('label:has-text("Link Proposal")');
    const linkInput = form.locator('input[placeholder*="drive.google.com"]');
    expect(await linkLabel.getAttribute('for')).toBe(await linkInput.getAttribute('id'));
  });

  test('Subpage /kelompok: persistent label on join-code / group name input', async ({ page }) => {
    await setupMockMahasiswa(page, { hasKelompok: false });
    await page.goto('/dashboard/mahasiswa/kelompok');

    // Label "Nama kelompok" must be bound to input
    const label = page.locator('label:has-text("Nama kelompok")');
    await expect(label).toBeVisible();
    const input = page.locator('input[placeholder="Nama kelompok"]');
    await expect(input).toBeVisible();
    expect(await label.getAttribute('for')).toBe(await input.getAttribute('id'));
  });

  test('320 px zero horizontal overflow check across all 9 Mahasiswa routes', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 600 });
    await setupMockMahasiswa(page);

    const routes = [
      '/dashboard/mahasiswa',
      '/dashboard/mahasiswa/bimbingan',
      '/dashboard/mahasiswa/proposal',
      '/dashboard/mahasiswa/laporan',
      '/dashboard/mahasiswa/track',
      '/dashboard/mahasiswa/kelompok',
      '/dashboard/mahasiswa/hasil',
      '/dashboard/mahasiswa/revisi-sidang',
      '/dashboard/mahasiswa/profile',
    ];

    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(250);
      await checkNoHorizontalOverflow(page);
    }
  });
});
