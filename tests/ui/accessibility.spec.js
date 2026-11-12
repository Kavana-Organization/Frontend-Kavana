const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const PUBLIC_AND_AUTH_ROUTES = [
  { name: 'landing', path: '/' },
  { name: 'panduan-pengguna', path: '/panduan-pengguna' },
  { name: 'faq-sistem', path: '/faq-sistem' },
  { name: 'kebijakan-privasi', path: '/kebijakan-privasi' },
  { name: 'syarat-layanan', path: '/syarat-layanan' },
  { name: 'luaran-proyek-1', path: '/luaran-proyek-1' },
  { name: 'luaran-proyek-2', path: '/luaran-proyek-2' },
  { name: 'luaran-proyek-3', path: '/luaran-proyek-3' },
  { name: 'verify-bimbingan', path: '/verify/bimbingan/mock-token' },
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  { name: 'forgot-password', path: '/forgot-password' },
];

const ROLE_ROUTES = {
  mahasiswa: [
    '/dashboard/mahasiswa',
    '/dashboard/mahasiswa/track',
    '/dashboard/mahasiswa/kelompok',
    '/dashboard/mahasiswa/bimbingan',
    '/dashboard/mahasiswa/proposal',
    '/dashboard/mahasiswa/laporan',
    '/dashboard/mahasiswa/hasil',
    '/dashboard/mahasiswa/revisi-sidang',
    '/dashboard/mahasiswa/profile',
    '/dashboard/mahasiswa/settings',
  ],
  dosen: [
    '/dashboard/dosen',
    '/dashboard/dosen/mahasiswa-bimbingan',
    '/dashboard/dosen/bimbingan-approve',
    '/dashboard/dosen/laporan-approve',
    '/dashboard/dosen/revisi-approve',
  ],
  penguji: [
    '/dashboard/penguji',
    '/dashboard/penguji/sidang',
    '/dashboard/penguji/bimbingan-approve',
  ],
  koordinator: [
    '/dashboard/koordinator',
    '/dashboard/koordinator/kelola-periode',
    '/dashboard/koordinator/validasi-proposal',
    '/dashboard/koordinator/approve-pembimbing',
    '/dashboard/koordinator/daftar-mahasiswa',
    '/dashboard/koordinator/jadwal-sidang',
    '/dashboard/koordinator/revisi-monitoring',
    '/dashboard/koordinator/rekap-mahasiswa',
  ],
  kaprodi: [
    '/dashboard/kaprodi',
    '/dashboard/kaprodi/kelola-koordinator',
    '/dashboard/kaprodi/daftar-dosen',
    '/dashboard/kaprodi/monitoring',
  ],
  admin: [
    '/dashboard/admin',
    '/dashboard/admin/kelola-users',
    '/dashboard/admin/kelola-dosen',
    '/dashboard/admin/monitoring',
    '/dashboard/admin/settings',
  ],
  developer: [
    '/dashboard/developer',
    '/dashboard/developer/health',
    '/dashboard/developer/audit-logs',
    '/dashboard/developer/auth-logs',
    '/dashboard/developer/auth-trackers',
    '/dashboard/developer/devices',
    '/dashboard/developer/redis-cache',
    '/dashboard/developer/permission-matrix',
  ],
  shared: [
    '/dashboard/profile',
    '/dashboard/settings',
    '/dashboard/support',
  ],
};

const ACADEMIC_DOSEN = 'Roni Andarsyah, S.T., M.Kom.';
const LONG_PROPOSAL_TITLE =
  'Pengembangan Sistem Informasi Manajemen Akademik dan Bimbingan Proyek Berbasis Cloud Native';
const LONG_DRIVE_URL = 'https://drive.google.com/drive/folders/mock-folder-123';

const ROLE_USER_MAP = {
  mahasiswa: {
    id: 1,
    nama: 'Budi Santoso',
    email: 'budi@ulbi.ac.id',
    role: 'mahasiswa',
    roles: ['mahasiswa'],
    npm: '1214088',
    angkatan: 2022,
    no_wa: '081234567890',
    track: 'proyek-2',
    dosen_nama: ACADEMIC_DOSEN,
    dosen_pembimbing: ACADEMIC_DOSEN,
    status_proposal: 'approved',
    proposal_status: 'approved',
    judul_proyek: LONG_PROPOSAL_TITLE,
    judul_proposal: LONG_PROPOSAL_TITLE,
    is_active: true,
    enrollments: [
      {
        id: 'enr-01',
        track: 'proyek-2',
        status: 'active',
        enrollment_type: 'regular',
        status_proposal: 'approved',
        judul_proyek: LONG_PROPOSAL_TITLE,
        dosen_id: 10,
        dosen_nama: ACADEMIC_DOSEN,
      },
    ],
  },
  dosen: {
    id: 10,
    dosen_id: 10,
    nama: ACADEMIC_DOSEN,
    email: 'roni@ulbi.ac.id',
    role: 'dosen',
    roles: ['dosen'],
    nidn: '0412038901',
    kode_dosen: 'ULBI-D4TI-001',
    signature_ready: true,
    is_active: true,
  },
  penguji: {
    id: 10,
    dosen_id: 10,
    nama: ACADEMIC_DOSEN,
    email: 'penguji@ulbi.ac.id',
    role: 'penguji',
    roles: ['penguji', 'dosen'],
    nidn: '0412038901',
    is_active: true,
  },
  koordinator: {
    id: 10,
    dosen_id: 10,
    nama: ACADEMIC_DOSEN,
    email: 'koordinator@ulbi.ac.id',
    role: 'koordinator',
    roles: ['koordinator', 'dosen'],
    nidn: '0412038901',
    is_active: true,
  },
  kaprodi: {
    id: 10,
    dosen_id: 10,
    nama: 'Dr. Kaprodi TI, M.T.',
    email: 'kaprodi@ulbi.ac.id',
    role: 'kaprodi',
    roles: ['kaprodi', 'dosen'],
    nidn: '0401018502',
    is_koordinator: true,
    is_active: true,
  },
  admin: {
    id: 1,
    nama: 'Admin Sistem Kavana',
    email: 'admin@kavana.my.id',
    role: 'admin',
    roles: ['admin'],
    is_active: true,
  },
  developer: {
    id: 99,
    nama: 'Developer Kavana',
    email: 'dev@kavana.my.id',
    role: 'developer',
    roles: ['developer'],
    is_active: true,
  },
};

async function installPublicAndApiMocks(page, activeRole = 'mahasiswa') {
  const user = ROLE_USER_MAP[activeRole] || ROLE_USER_MAP.mahasiswa;

  await page.route('**/*', async (route) => {
    const req = route.request();
    const url = req.url();
    if (!url.includes('/api/') && !url.includes('cloudfunctions')) {
      return route.continue();
    }

    if (url.includes('/realtime') || req.headers()['accept']?.includes('text/event-stream')) {
      return route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: ': ok\n\n',
      });
    }

    if (url.includes('/api/verify/bimbingan/')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'active',
          token: 'mock-token',
          mahasiswa_nama: 'Budi Santoso',
          mahasiswa_npm: '1214088',
          dosen_nama: ACADEMIC_DOSEN,
          dosen_kode: 'ULBI-D4TI-001',
          dosen_nidn: '0412038901',
          minggu_ke: 5,
          tanggal_bimbingan: '2026-03-10',
          topik: 'Pembahasan Arsitektur Sistem Terintegrasi',
          signed_at: '2026-03-10T09:15:00.000Z',
        }),
      });
    }

    if (url.includes('/auth/me')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) });
    }
    if (url.includes('/notifications/stats')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    }
    if (url.includes('/notifications')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    }

    // Mahasiswa
    if (url.includes('/mahasiswa/profile') || url.includes('/auth/profile')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ROLE_USER_MAP.mahasiswa) });
    }
    if (url.includes('/mahasiswa/bimbingan')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'B-01',
            tanggal: '2026-03-01',
            topik: 'Pembahasan Analisis Kebutuhan Sistem',
            catatan: 'Diagram use case disetujui.',
            status: 'approved',
          },
          {
            id: 'B-02',
            tanggal: '2026-03-10',
            topik: 'Implementasi Antarmuka Mahasiswa',
            catatan: 'Menunggu peninjauan pembimbing.',
            status: 'pending',
          },
        ]),
      });
    }
    if (url.includes('/mahasiswa/laporan')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, judul: LONG_PROPOSAL_TITLE, file_url: LONG_DRIVE_URL, file_luaran: LONG_DRIVE_URL, status: 'submitted' },
        ]),
      });
    }
    if (url.includes('/mahasiswa/sidang')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tanggal_sidang: '2026-07-15',
          tanggal: '2026-07-15',
          waktu_sidang: '09:30:00',
          waktu: '09:30:00',
          ruangan: 'Ruang Sidang Lt 3',
          penguji_nama: 'Dr. Penguji Sidang, M.T.',
          hasil: 'lulus_revisi',
          hasil_sidang: 'lulus_revisi',
          catatan_sidang: 'Perbaiki bab 4 pengujian performa.',
        }),
      });
    }
    if (url.includes('/mahasiswa/revisi')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sidang: { hasil: 'lulus_revisi', catatan_sidang: 'Perbaiki bab 4.' },
          is_kelompok: false,
          revisi: [
            {
              id: 'rev-01',
              revision_round: 1,
              status: 'pending',
              submitted_at: '2026-07-20T10:00:00.000Z',
              catatan_mahasiswa: 'Sudah memperbaiki bab 4.',
              file_url: LONG_DRIVE_URL,
            },
          ],
        }),
      });
    }
    if (url.includes('/mahasiswa/kelompok/available')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
    if (url.includes('/mahasiswa/kelompok')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          kelompok: { id: 1, nama: 'Kelompok Proyek TI-4B', track: 'proyek-2' },
          anggota: [
            { id: 1, nama: 'Budi Santoso', npm: '1214088' },
            { id: 2, nama: 'Rizky Ramadhan', npm: '1214089' },
          ],
        }),
      });
    }
    if (url.includes('/mahasiswa/dosen')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 10, nama: ACADEMIC_DOSEN }]),
      });
    }
    if (url.includes('/mahasiswa/periode') || url.includes('/mahasiswa/track')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          semester: 4,
          active: true,
          jalur: 'regular',
          eligibilities: [{ track: 'proyek2', enrollment_type: 'regular', reason: 'Semester 4' }],
          active_enrollments: [],
        }),
      });
    }

    // Dosen & Penguji
    if (url.includes('/dosen/profile')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ROLE_USER_MAP.dosen) });
    }
    if (url.includes('/dosen/stats')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total_mahasiswa: 2, pending_bimbingan: 2, pending_laporan: 1, bimbingan_minggu_ini: 3 }),
      });
    }
    if (url.includes('/dosen/mahasiswa')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 101, nama: 'Budi Santoso', npm: '1214088', track: 'proyek-2', status: 'active', bimbingan_count: 6 },
        ]),
      });
    }
    if (url.includes('/dosen/bimbingan/') && url.includes('/signature')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          signature: {
            status: 'valid',
            token: 'mock-token',
            qr_data_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
            dosen_nama: ACADEMIC_DOSEN,
            dosen_kode: 'ULBI-D4TI-001',
            dosen_nidn: '0412038901',
            verify_url: 'https://kavana.my.id/verify/bimbingan/mock-token',
          },
        }),
      });
    }
    if (url.includes('/dosen/bimbingan')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 201,
            mahasiswa_nama: 'Budi Santoso',
            npm: '1214088',
            track: 'proyek-2',
            minggu_ke: 5,
            tanggal: '2026-03-10',
            created_at: '2026-03-10T09:00:00.000Z',
            topik: 'Implementasi modul persetujuan',
            catatan: 'Sudah menyelesaikan perancangan tabel.',
            status: 'pending',
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
            mahasiswa_nama: 'Budi Santoso',
            mahasiswa_npm: '1214088',
            track: 'proyek-2',
            judul: LONG_PROPOSAL_TITLE,
            file_url: LONG_DRIVE_URL,
            file_luaran: LONG_DRIVE_URL,
            submitted_at: '2026-02-25T10:00:00.000Z',
            status: 'submitted',
          },
        ]),
      });
    }
    if (url.includes('/dosen/revisi-sidang')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 401,
            revision_round: 1,
            status: 'pending',
            submitted_at: '2026-04-02T10:30:00.000Z',
            mahasiswa_nama: 'Budi Santoso',
            npm: '1214088',
            judul_proyek: LONG_PROPOSAL_TITLE,
            grouping_mode: 'individu',
            catatan_mahasiswa: 'Sudah melampirkan hasil uji beban.',
            file_url: LONG_DRIVE_URL,
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
            mahasiswa_id: 101,
            mahasiswa_nama: 'Budi Santoso',
            npm: '1214088',
            judul_proyek: LONG_PROPOSAL_TITLE,
            track: 'proyek-2',
            tanggal: '2026-07-15',
            waktu: '09:30:00',
            ruangan: 'Ruang Sidang Lt 3',
            dosen_id: 10,
            dosen_nama: ACADEMIC_DOSEN,
            penguji_id: 10,
            penguji_nama: ACADEMIC_DOSEN,
            status: 'scheduled',
            file_laporan: LONG_DRIVE_URL,
            file_luaran: LONG_DRIVE_URL,
          },
        ]),
      });
    }

    // Koordinator & Kaprodi
    if (url.includes('/kaprodi/profile')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ROLE_USER_MAP.kaprodi) });
    }
    if (url.includes('/koordinator/stats')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total_proposal: 14, pending_proposal: 4, total_mahasiswa: 28, assigned_dosen: 9 }),
      });
    }
    if (url.includes('/koordinator/proposal/pending')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 101,
            mahasiswa_nama: 'Budi Santoso',
            judul_proyek: LONG_PROPOSAL_TITLE,
            track: 'proyek-2',
            status_proposal: 'pending',
            enrollment_type: 'regular',
            jalur_pengambilan: 'regular',
            file_proposal: LONG_DRIVE_URL,
          },
        ]),
      });
    }
    if (url.includes('/koordinator/my-semester')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ assigned: true, semesters: [3, 5, 7] }) });
    }
    if (url.includes('/koordinator/jadwal')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            nama: 'Proyek 2 Semester Genap 2026',
            tipe: 'proyek',
            semester: 3,
            jalur_scope: 'both',
            start_date: '2026-02-01',
            end_date: '2026-07-31',
            status: 'active',
          },
        ]),
      });
    }
    if (url.includes('/koordinator/revisi-sidang')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            sidang_id: 501,
            mahasiswa_id: 101,
            display_nama: 'Budi Santoso',
            judul_proyek: LONG_PROPOSAL_TITLE,
            dosen_nama: ACADEMIC_DOSEN,
            revisi_status: 'pending',
            revisi_round: 1,
            last_submitted_at: '2026-07-18T10:00:00.000Z',
          },
        ]),
      });
    }
    if (url.includes('/koordinator/penguji') || url.includes('/koordinator/dosen') || url.includes('/kaprodi/dosen')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 10, nama: ACADEMIC_DOSEN, email: 'roni@ulbi.ac.id', mahasiswa_count: 6 }]),
      });
    }
    if (url.includes('/koordinator/mahasiswa') || url.includes('/kaprodi/mahasiswa')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 201,
            nama: 'Budi Santoso',
            npm: '1214088',
            jalur: 'regular',
            track: 'proyek2',
            status_proposal: 'approved',
            dosen_id: 10,
            dosen_nama: ACADEMIC_DOSEN,
            sidang_eligible: true,
          },
        ]),
      });
    }
    if (url.includes('/kaprodi/stats')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total_mahasiswa: 32,
          total_dosen: 10,
          lulus_semester_ini: 8,
          proyek: 20,
          internship: 8,
          belum_track: 4,
          by_angkatan: { 2022: 12, 2023: 14, 2024: 6 },
          by_status: { 'Menunggu Track': 4, 'Proposal Pending': 6, 'Sedang Bimbingan': 10, 'Siap Sidang': 4, Lulus: 8 },
        }),
      });
    }
    if (url.includes('/kaprodi/koordinator')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 10, nama: ACADEMIC_DOSEN, email: 'roni@ulbi.ac.id', is_koordinator: true, assigned_semesters: [3, 5] },
        ]),
      });
    }

    // Admin & Developer
    if (url.includes('/api/admin/stats')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total_users: 166,
          total_mahasiswa: 148,
          total_dosen: 12,
          total_admin: 2,
          proposal_pending: 5,
          bimbingan_aktif: 42,
          laporan_pending: 3,
          sidang_scheduled: 6,
          users_inactive: 4,
        }),
      });
    }
    if (url.includes('/api/admin/activity')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, message: 'Admin memperbarui status pengguna mahasiswa 1214088', created_at: '2026-11-12T09:15:00.000Z', result: 'success' },
        ]),
      });
    }
    if (url.includes('/api/admin/audit-logs')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 501,
            action: 'UPDATE_USER_STATUS',
            target: 'user',
            target_id: '101',
            user_id: '1',
            role: 'admin',
            request_id: 'req-admin-501',
            ip_address: '103.144.22.18',
            result: 'success',
            created_at: '2026-11-12T09:20:00.000Z',
            details: JSON.stringify({ previous_status: 'inactive', next_status: 'active' }),
          },
        ]),
      });
    }
    if (url.includes('/api/admin/users')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 101,
            nama: 'Budi Santoso',
            email: 'budi@student.ulbi.ac.id',
            role: 'mahasiswa',
            npm: '1214088',
            angkatan: 2022,
            jalur: 'regular',
            no_wa: '081234567890',
            is_active: true,
          },
        ]),
      });
    }
    if (url.includes('/api/admin/dosen')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 10, nama: ACADEMIC_DOSEN, email: 'roni@ulbi.ac.id', jumlah_bimbingan: 8 }]),
      });
    }
    if (url.includes('/api/developer/health')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'ok',
          db: { ok: true, latency_ms: 14 },
          redis: { configured: true, ok: true, latency_ms: 6 },
          runtime: { node_env: 'production', cors_origins: ['http://localhost:3000'], email_notifications_enabled: true, turnstile_enabled: false },
        }),
      });
    }
    if (url.includes('/api/developer/audit-logs') || url.includes('/api/developer/auth-logs')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 9001,
            action: 'REVOKE_DEVICE',
            target: 'developer_device',
            target_id: 'dev-02',
            user_id: '99',
            role: 'developer',
            request_id: 'req-dev-9001',
            ip_address: '192.168.10.42',
            result: 'success',
            created_at: '2026-11-12T08:45:00.000Z',
            details: JSON.stringify({ device_id: 'dev-02' }),
          },
        ]),
      });
    }
    if (url.includes('/api/developer/auth-trackers')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 301,
            event_type: 'login_failed',
            auth_status: 'failed',
            auth_flow: 'password',
            identifier_hint: 'budi@student.ulbi.ac.id',
            failure_reason: 'invalid_credentials',
            browser: 'Chrome 130.0',
            created_at: '2026-11-12T08:30:00.000Z',
          },
        ]),
      });
    }
    if (url.includes('/api/developer/devices')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          configured: [{ device_id: 'dev-01', token_hash: 'sha256:abc', source: 'github_secret' }],
          database: [{ id: 1, device_id: 'dev-enrolled-01', device_name: 'Workstation', developer_email: 'dev@ulbi.ac.id', status: 'active' }],
        }),
      });
    }
    if (url.includes('/api/developer/redis/keys')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ configured: true, pattern: 'kavana:*', count: 1, keys: ['kavana:session:1'] }),
      });
    }
    if (url.includes('/api/developer/permissions/matrix')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ admin: ['manage_users'], developer: ['view_health'] }),
      });
    }

    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
}

async function seedRoleSession(page, activeRole, theme = 'light') {
  const user = ROLE_USER_MAP[activeRole] || ROLE_USER_MAP.mahasiswa;
  await page.addInitScript(
    ({ u, t }) => {
      try {
        localStorage.setItem('kavana-theme', t);
        sessionStorage.setItem('authToken', `mock-${u.role}-token`);
        sessionStorage.setItem('userRole', u.role);
        sessionStorage.setItem('userId', String(u.id));
        sessionStorage.setItem('userName', u.nama);
        sessionStorage.setItem('userEmail', u.email);
        sessionStorage.setItem('userRoles', JSON.stringify(u.roles));
        localStorage.setItem(
          'auth-storage',
          JSON.stringify({
            state: { token: `mock-${u.role}-token`, role: u.role, roles: u.roles, user: u },
            version: 0,
          })
        );
      } catch (_) {}
    },
    { u: user, t: theme }
  );
}

async function setThemeClass(page, theme) {
  await page.evaluate((t) => {
    localStorage.setItem('kavana-theme', t);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(t);
  }, theme);
  await page.waitForTimeout(100);
}

async function waitForLoadedRoute(page) {
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('[data-slot="loading-state"]')).toHaveCount(0, { timeout: 15000 });
  const heading = page.locator('h1:visible, h2:visible, [data-testid="dashboard-title"]:visible').first();
  await expect(heading).toBeVisible({ timeout: 15000 });
  // Allow Framer Motion entrance fade-ins (250-300ms) to finish before contrast/target checks
  await page.waitForTimeout(400);
}

async function runAxeScan(page, routePath, theme) {
  const results = await new AxeBuilder({ page })
    .exclude('#turnstile-widget iframe')
    .analyze();

  const seriousOrCritical = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical'
  );
  if (seriousOrCritical.length > 0) {
    console.error(
      `[AXE FAIL] ${routePath} [${theme}]:`,
      JSON.stringify(
        seriousOrCritical.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes.map((n) => ({ target: n.target, failureSummary: n.failureSummary })),
        })),
        null,
        2
      )
    );
  }
  return {
    route: routePath,
    theme,
    total: results.violations.length,
    seriousOrCritical,
    minorOrModerate: results.violations.filter(
      (v) => v.impact !== 'serious' && v.impact !== 'critical'
    ),
  };
}

test.describe('Step 1: Axe-Core Accessibility Audit', () => {
  test('public and auth routes have 0 serious/critical violations in light & dark', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'e2e-desktop', 'Axe sweep runs on e2e-desktop');
    test.setTimeout(120000);

    await installPublicAndApiMocks(page, 'mahasiswa');
    const failures = [];

    for (const theme of ['light', 'dark']) {
      await page.addInitScript((t) => {
        localStorage.setItem('kavana-theme', t);
      }, theme);

      for (const route of PUBLIC_AND_AUTH_ROUTES) {
        await page.goto(route.path, { waitUntil: 'domcontentloaded' });
        await setThemeClass(page, theme);
        await waitForLoadedRoute(page);
        const scan = await runAxeScan(page, route.path, theme);
        if (scan.seriousOrCritical.length > 0) {
          failures.push(`${route.path} [${theme}]: ${scan.seriousOrCritical.map((v) => v.id).join(', ')}`);
        }
      }
    }

    expect(failures, `Axe serious/critical violations:\n${failures.join('\n')}`).toEqual([]);
  });

  for (const [roleKey, paths] of Object.entries(ROLE_ROUTES)) {
    const authRole = roleKey === 'shared' ? 'mahasiswa' : roleKey;

    test(`authenticated ${roleKey} routes have 0 serious/critical violations in light & dark`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'e2e-desktop', 'Axe sweep runs on e2e-desktop');
      test.setTimeout(120000);

      await installPublicAndApiMocks(page, authRole);
      await seedRoleSession(page, authRole, 'light');
      const failures = [];

      for (const theme of ['light', 'dark']) {
        for (const routePath of paths) {
          await page.goto(routePath, { waitUntil: 'domcontentloaded' });
          await setThemeClass(page, theme);
          await waitForLoadedRoute(page);
          const scan = await runAxeScan(page, routePath, theme);
          if (scan.seriousOrCritical.length > 0) {
            failures.push(`${routePath} [${theme}]: ${scan.seriousOrCritical.map((v) => v.id).join(', ')}`);
          }
        }
      }

      expect(failures, `Axe serious/critical violations for ${roleKey}:\n${failures.join('\n')}`).toEqual([]);
    });
  }
});

test.describe('Step 2: 44px Coarse Pointer Target Check (Pixel 5)', () => {
  const COARSE_AUDIT_ROUTES = [
    { role: null, path: '/' },
    { role: null, path: '/login' },
    { role: null, path: '/register' },
    { role: null, path: '/forgot-password' },
    { role: 'mahasiswa', path: '/dashboard/mahasiswa' },
    { role: 'mahasiswa', path: '/dashboard/mahasiswa/bimbingan' },
    { role: 'dosen', path: '/dashboard/dosen/bimbingan-approve' },
    { role: 'penguji', path: '/dashboard/penguji/sidang' },
    { role: 'koordinator', path: '/dashboard/koordinator/jadwal-sidang' },
    { role: 'kaprodi', path: '/dashboard/kaprodi/kelola-koordinator' },
    { role: 'admin', path: '/dashboard/admin/kelola-users' },
    { role: 'developer', path: '/dashboard/developer/devices' },
    { role: 'mahasiswa', path: '/dashboard/support' },
  ];

  test('visible interactive button, a, and [role=button] controls meet 44px on coarse pointer', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'e2e-mobile', 'Coarse pointer audit runs on e2e-mobile (Pixel 5)');
    test.setTimeout(120000);

    const violations = [];

    for (const entry of COARSE_AUDIT_ROUTES) {
      await page.unrouteAll({ behavior: 'ignoreErrors' });
      await installPublicAndApiMocks(page, entry.role || 'mahasiswa');
      if (entry.role) {
        await seedRoleSession(page, entry.role, 'light');
      }
      await page.goto(entry.path, { waitUntil: 'domcontentloaded' });
      await waitForLoadedRoute(page);

      const badTargets = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        const issues = [];
        for (const el of els) {
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || el.closest('[hidden]')) {
            continue;
          }
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) continue;

          // Inline text links inside running prose paragraphs/lists/labels are exempt under WCAG 2.5.8 inline exception
          const isInlineProseLink =
            el.tagName === 'A' &&
            Boolean(el.closest('p, li, label')) &&
            !el.hasAttribute('data-slot') &&
            style.display === 'inline';
          if (isInlineProseLink) continue;

          // Native/Radix checkboxes whose associated <label> provides >= 44px hit target
          if (el.getAttribute('role') === 'checkbox' && el.id) {
            const assocLabel = document.querySelector(`label[for="${el.id}"]`);
            if (assocLabel) {
              const lRect = assocLabel.getBoundingClientRect();
              if (lRect.height >= 43.5 && lRect.width >= 43.5) continue;
            }
          }

          if (rect.height < 43.5 || rect.width < 43.5) {
            issues.push({
              tag: el.tagName.toLowerCase(),
              text: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim().slice(0, 50),
              testid: el.getAttribute('data-testid') || '',
              width: Math.round(rect.width * 10) / 10,
              height: Math.round(rect.height * 10) / 10,
              className: String(el.className || '').slice(0, 100),
            });
          }
        }
        return issues;
      });

      if (badTargets.length > 0) {
        console.error(`[COARSE TARGET FAIL] ${entry.path}:`, JSON.stringify(badTargets, null, 2));
        violations.push({ path: entry.path, count: badTargets.length, items: badTargets });
      }
    }

    expect(violations, `Controls smaller than 44px on Pixel 5:\n${JSON.stringify(violations, null, 2)}`).toEqual([]);
  });
});

test.describe('Step 3: Keyboard-Only Walkthrough', () => {
  test('1. /login keyboard traversal: email -> password -> visibility toggle -> submit', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'e2e-desktop', 'Keyboard walkthrough runs on e2e-desktop');

    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await waitForLoadedRoute(page);

    const emailInput = page.getByTestId('login-email');
    await emailInput.focus();
    await expect(emailInput).toBeFocused();

    await page.keyboard.press('Tab');
    const passwordInput = page.getByTestId('login-password');
    await expect(passwordInput).toBeFocused();
    await expect(passwordInput).toHaveAttribute('type', 'password');

    await page.keyboard.press('Tab');
    const toggleBtn = page.getByRole('button', { name: /tampilkan password/i });
    await expect(toggleBtn).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Tab forward until login-submit is focused
    const submitBtn = page.getByTestId('login-submit');
    for (let i = 0; i < 6; i++) {
      if (await submitBtn.evaluate((el) => document.activeElement === el)) break;
      await page.keyboard.press('Tab');
    }
    await expect(submitBtn).toBeFocused();
  });

  test('2. Sidebar keyboard navigation: ArrowDown/Up, Home/End, Enter/Space toggle, Escape on rail flyout', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'e2e-desktop', 'Keyboard walkthrough runs on e2e-desktop');

    await installPublicAndApiMocks(page, 'mahasiswa');
    await seedRoleSession(page, 'mahasiswa', 'light');
    await page.goto('/dashboard/mahasiswa', { waitUntil: 'domcontentloaded' });
    await waitForLoadedRoute(page);

    const sidebar = page.locator('aside');
    const dashboardLink = sidebar.getByTestId('sidebar-link-dashboard');
    await dashboardLink.focus();
    await expect(dashboardLink).toBeFocused();

    // ArrowDown moves to first group header
    await page.keyboard.press('ArrowDown');
    const persiapanGroup = sidebar.getByTestId('sidebar-group-persiapan-akademik');
    await expect(persiapanGroup).toBeFocused();

    // End jumps to last visible item (Akun header, since Akun starts closed)
    await page.keyboard.press('End');
    const akunGroup = sidebar.getByTestId('sidebar-group-akun');
    await expect(akunGroup).toBeFocused();
    await expect(akunGroup).toHaveAttribute('aria-expanded', 'false');

    // Space expands Akun group
    await page.keyboard.press('Space');
    await expect(akunGroup).toHaveAttribute('aria-expanded', 'true');

    // ArrowDown enters Akun children
    await page.keyboard.press('ArrowDown');
    await expect(sidebar.getByTestId('sidebar-link-profile')).toBeFocused();

    // Home jumps back to dashboard link
    await page.keyboard.press('Home');
    await expect(dashboardLink).toBeFocused();

    // Collapse sidebar to rail mode and test Popover Escape restores focus
    const collapseBtn = sidebar.getByTestId('sidebar-collapse-toggle');
    await collapseBtn.click();
    const railGroup = sidebar.getByTestId('sidebar-group-persiapan-akademik');
    await railGroup.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('link', { name: 'Proyek & Internship' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('link', { name: 'Proyek & Internship' })).toBeHidden();
    await expect(railGroup).toBeFocused();
  });

  test('3. Dialog keyboard trap & Escape focus restoration (kelola-periode)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'e2e-desktop', 'Keyboard walkthrough runs on e2e-desktop');

    await installPublicAndApiMocks(page, 'koordinator');
    await seedRoleSession(page, 'koordinator', 'light');
    await page.goto('/dashboard/koordinator/kelola-periode', { waitUntil: 'domcontentloaded' });
    await waitForLoadedRoute(page);

    const triggerBtn = page.getByRole('button', { name: /buat periode/i });
    await triggerBtn.focus();
    await expect(triggerBtn).toBeFocused();

    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Verify focus moves inside dialog and Tab stays trapped inside dialog
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focusInside = await dialog.evaluate((d) => d.contains(document.activeElement));
      expect(focusInside).toBe(true);
    }

    // Escape closes dialog and restores focus to trigger
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(triggerBtn).toBeFocused();
  });

  test('4. Table row action & Sheet detail drawer keyboard flow (bimbingan-approve)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'e2e-desktop', 'Keyboard walkthrough runs on e2e-desktop');

    await installPublicAndApiMocks(page, 'dosen');
    await seedRoleSession(page, 'dosen', 'light');
    await page.goto('/dashboard/dosen/bimbingan-approve', { waitUntil: 'domcontentloaded' });
    await waitForLoadedRoute(page);

    const detailBtn = page.getByRole('button', { name: /detail bimbingan/i }).first();
    await detailBtn.focus();
    await expect(detailBtn).toBeFocused();

    await page.keyboard.press('Enter');
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();

    await page.keyboard.press('Tab');
    const focusInsideSheet = await sheet.evaluate((s) => s.contains(document.activeElement));
    expect(focusInsideSheet).toBe(true);

    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await expect(detailBtn).toBeFocused();
  });
});
