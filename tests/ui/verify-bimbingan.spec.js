const { test, expect } = require('@playwright/test');
const { expectNoCriticalPageError, expectNoHorizontalOverflow } = require('../helpers/ui');

const MOCK_VALID_DATA = {
  status: 'active',
  verify_url: 'https://kavana.my.id/verify/bimbingan/valid-signature-token-123',
  signed_at: '2026-05-10T14:30:00.000Z',
  revoked_at: null,
  revoked_reason: null,
  dosen: {
    nama: 'Dr. Ir. Budi Rahardjo, M.T.',
    kode_dosen: 'BDR',
    nidn: '0412345678',
    nik_masked: '320101******0001',
  },
  bimbingan: {
    id: 42,
    tanggal: '2026-05-09T09:00:00.000Z',
    minggu_ke: 5,
    topik: 'Evaluasi arsitektur sistem dan persiapan berkas sidang proposal',
    status: 'approved',
  },
  mahasiswa: {
    nama: 'Ahmad Dani',
    npm: '1214088',
    track: 'Proyek 2',
  },
};

const MOCK_REVOKED_DATA = {
  status: 'revoked',
  verify_url: 'https://kavana.my.id/verify/bimbingan/revoked-signature-token-456',
  signed_at: '2026-04-10T14:30:00.000Z',
  revoked_at: '2026-04-15T10:00:00.000Z',
  revoked_reason: 'Perubahan substansi bab 3 belum disetujui pembimbing',
  dosen: {
    nama: 'Dr. Ir. Budi Rahardjo, M.T.',
    kode_dosen: 'BDR',
    nidn: '0412345678',
    nik_masked: '320101******0001',
  },
  bimbingan: {
    id: 42,
    tanggal: '2026-04-09T09:00:00.000Z',
    minggu_ke: 3,
    topik: 'Revisi metodologi penelitian bab 3',
    status: 'rejected',
  },
  mahasiswa: {
    nama: 'Ahmad Dani',
    npm: '1214088',
    track: 'Proyek 2',
  },
};

test.describe('Bimbingan Verification Page (/verify/bimbingan/[token])', () => {
  test('renders valid state with institutional status banner and two definition lists', async ({
    page,
  }) => {
    await page.route('**/api/verify/bimbingan/valid-signature-token-123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_VALID_DATA),
      });
    });

    await page.goto('/verify/bimbingan/valid-signature-token-123');
    await expectNoCriticalPageError(page);

    // Status banner for valid state
    const banner = page.getByRole('region', { name: /status verifikasi/i });
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(/tanda tangan sah & terverifikasi/i);
    await expect(banner).toContainText(/valid/i);
    await expect(banner).toContainText(/dokumen bimbingan ini sah/i);

    // Two definition lists (<dl>) must exist
    const dls = page.locator('dl');
    await expect(dls).toHaveCount(2);

    // Definition list 1: Data Mahasiswa & Sesi Bimbingan
    const dlMahasiswa = dls.nth(0);
    await expect(dlMahasiswa).toContainText('Ahmad Dani');
    await expect(dlMahasiswa).toContainText('1214088');
    await expect(dlMahasiswa).toContainText('Proyek 2');
    await expect(dlMahasiswa).toContainText('5');
    await expect(dlMahasiswa).toContainText('Evaluasi arsitektur sistem dan persiapan berkas sidang proposal');

    // Definition list 2: Metadata Verifikasi & Tanda Tangan Digital
    const dlVerifikasi = dls.nth(1);
    await expect(dlVerifikasi).toContainText('Dr. Ir. Budi Rahardjo, M.T.');
    await expect(dlVerifikasi).toContainText('0412345678');
    await expect(dlVerifikasi).toContainText('BDR');
    await expect(dlVerifikasi).toContainText('320101******0001');
    await expect(dlVerifikasi).toContainText('valid-signature-token-123');

    // Numerals and identifiers use font-mono and tabular-nums (§4.2)
    const npmElement = dlMahasiswa.locator('dd:has-text("1214088")');
    await expect(npmElement).toHaveClass(/font-mono/);
    await expect(npmElement).toHaveClass(/tabular-nums/);

    const nidnElement = dlVerifikasi.locator('dd:has-text("0412345678")');
    await expect(nidnElement).toHaveClass(/font-mono/);
    await expect(nidnElement).toHaveClass(/tabular-nums/);

    const tokenElement = dlVerifikasi.locator('dd:has-text("valid-signature-token-123")');
    await expect(tokenElement).toHaveClass(/font-mono/);
    await expect(tokenElement).toHaveClass(/tabular-nums/);

    // Helper text must use 12px (text-xs) and text-[var(--text-muted)]
    const helperText = page.locator('span:has-text("Disamarkan untuk privasi")');
    await expect(helperText).toBeVisible();
    await expect(helperText).toHaveClass(/text-xs/);
    await expect(helperText).toHaveClass(/text-\[var\(--text-muted\)\]/);

    // Single printable document layout: max-w-[760px]
    const mainContainer = page.locator('main');
    await expect(mainContainer).toHaveClass(/max-w-\[760px\]/);

    // Print button exists on screen and hides in print mode
    const printButton = page.getByRole('button', { name: /cetak bukti/i });
    await expect(printButton).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });

  test('renders revoked state with banner, reason, and definition lists', async ({
    page,
  }) => {
    await page.route('**/api/verify/bimbingan/revoked-signature-token-456', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_REVOKED_DATA),
      });
    });

    await page.goto('/verify/bimbingan/revoked-signature-token-456');
    await expectNoCriticalPageError(page);

    // Banner indicates revoked status
    const banner = page.getByRole('region', { name: /status verifikasi/i });
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(/tanda tangan digital telah dicabut/i);
    await expect(banner).toContainText(/dicabut/i);
    await expect(banner).toContainText(/perubahan substansi bab 3 belum disetujui pembimbing/i);

    // Two definition lists still render for institutional audit trail
    const dls = page.locator('dl');
    await expect(dls).toHaveCount(2);

    // Revocation timestamp rendered in definition list 2
    const dlVerifikasi = dls.nth(1);
    await expect(dlVerifikasi).toContainText(/waktu pencabutan/i);

    await expectNoHorizontalOverflow(page);
  });

  test('renders not found state (404) with institutional message and no document list', async ({
    page,
  }) => {
    await page.route('**/api/verify/bimbingan/missing-token-999', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Tanda tangan tidak ditemukan' }),
      });
    });

    await page.goto('/verify/bimbingan/missing-token-999');
    await expectNoCriticalPageError(page);

    const banner = page.getByRole('region', { name: /status verifikasi/i });
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(/tanda tangan tidak ditemukan/i);
    await expect(banner).toContainText(/tidak terdaftar/i);
    await expect(banner).toContainText(/kode qr atau token verifikasi tidak terdaftar dalam pangkalan data sistem/i);

    // Token displayed
    await expect(banner).toContainText('missing-token-999');

    // No definition lists rendered when document is not found
    const dls = page.locator('dl');
    await expect(dls).toHaveCount(0);

    await expectNoHorizontalOverflow(page);
  });

  test('maps raw English error strings to user-safe Bahasa Indonesia at render layer', async ({
    page,
  }) => {
    // Test raw network error / failed to fetch
    await page.route('**/api/verify/bimbingan/network-err-token', async (route) => {
      await route.abort('failed');
    });

    await page.goto('/verify/bimbingan/network-err-token');
    await expectNoCriticalPageError(page);

    const banner = page.getByRole('region', { name: /status verifikasi/i });
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(/gagal memuat data verifikasi/i);
    // Verified mapped Indonesian string:
    await expect(banner).toContainText(
      /gagal terhubung ke server verifikasi\. periksa koneksi internet anda dan coba lagi\./i
    );
    // Raw English string must NOT be displayed
    await expect(banner).not.toContainText(/failed to fetch/i);
    await expect(banner).not.toContainText(/network error/i);
  });

  test('maps raw English "Token not found" error to user-safe Indonesian message', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const origFetch = window.fetch;
      window.fetch = async (url, ...args) => {
        if (typeof url === 'string' && url.includes('token-not-found-raw')) {
          throw new Error('Token not found in verification database');
        }
        return origFetch(url, ...args);
      };
    });

    await page.goto('/verify/bimbingan/token-not-found-raw');
    await expectNoCriticalPageError(page);

    const banner = page.getByRole('region', { name: /status verifikasi/i });
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(
      /tanda tangan digital tidak ditemukan atau token verifikasi tidak valid/i
    );
  });

  test('shows LoadingState role="status" while verification data is loading', async ({
    page,
  }) => {
    let continueRoute;
    const delayedPromise = new Promise((resolve) => {
      continueRoute = resolve;
    });

    await page.route('**/api/verify/bimbingan/delayed-token', async (route) => {
      await delayedPromise;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_VALID_DATA),
      });
    });

    const navPromise = page.goto('/verify/bimbingan/delayed-token');

    // While loading, LoadingState with role="status" should be present
    const loadingEl = page.locator('[role="status"]');
    await expect(loadingEl).toBeVisible();
    await expect(loadingEl).toHaveAttribute('data-slot', 'loading-state');

    // Unblock the route and verify resolved state
    continueRoute();
    await navPromise;

    await expect(page.getByRole('region', { name: /status verifikasi/i })).toBeVisible();
    await expect(loadingEl).not.toBeVisible();
  });
});
