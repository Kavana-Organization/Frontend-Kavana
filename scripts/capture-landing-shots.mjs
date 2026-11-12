import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const OUT_DIR = path.resolve('public/landing');

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return true;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

const FIXTURES = {
  mahasiswa: {
    role: 'mahasiswa',
    path: '/dashboard/mahasiswa',
    outFile: 'mahasiswa.png',
    user: {
      nama: 'Mahasiswa D4TI',
      email: 'mahasiswa@it.ulbi.ac.id',
    },
    profile: {
      nama: 'Mahasiswa D4TI',
      npm: '714220001',
      email: 'mahasiswa@it.ulbi.ac.id',
      track: 'Proyek 1',
      judul_proposal: 'Rancang Bangun Sistem Informasi Bimbingan Terpadu',
      dosen_nama: 'Dosen Pembimbing Utama, M.Kom.',
      status_proposal: 'approved',
    },
    bimbingan: [
      { id: 1, tanggal: '2026-03-05', catatan: 'Analisis kebutuhan sistem dan arsitektur data', status: 'approved' },
      { id: 2, tanggal: '2026-03-12', catatan: 'Perancangan basis data dan relasi tabel', status: 'approved' },
      { id: 3, tanggal: '2026-03-19', catatan: 'Implementasi modul autentikasi dan alur role', status: 'approved' },
      { id: 4, tanggal: '2026-03-26', catatan: 'Implementasi antarmuka dan validasi form bimbingan', status: 'approved' },
      { id: 5, tanggal: '2026-04-02', catatan: 'Pengujian fungsional dan integrasi komponen', status: 'approved' },
      { id: 6, tanggal: '2026-04-09', catatan: 'Review draf laporan bab 1 hingga bab 3', status: 'approved' },
      { id: 7, tanggal: '2026-04-16', catatan: 'Penyusunan bab 4 dan pengujian sistem menyeluruh', status: 'waiting' },
      { id: 8, tanggal: '2026-04-23', catatan: 'Persiapan draf final dan simulasi presentasi sidang', status: 'waiting' },
    ],
    laporan: { id: 1, status: 'approved', judul: 'Laporan Proyek 1 - Sistem Informasi Terpadu' },
    sidang: { tanggal_sidang: '2026-06-25', waktu_sidang: '09:00', ruangan: 'Lab Terpadu 3', penguji_nama: 'Tim Penguji D4TI' },
  },
  dosen: {
    role: 'dosen',
    path: '/dashboard/dosen',
    outFile: 'dosen.png',
    user: {
      nama: 'Dosen Pembimbing D4TI',
      email: 'dosen@it.ulbi.ac.id',
    },
    stats: {
      total_mahasiswa: 12,
      pending_bimbingan: 3,
      pending_laporan: 2,
      bimbingan_minggu_ini: 5,
    },
    mahasiswaList: [
      { id: 1, npm: '714220001', nama: 'Mahasiswa D4TI A', track: 'Proyek 1', judul: 'Sistem Informasi Bimbingan Terpadu', total_bimbingan: 6, status: 'aktif' },
      { id: 2, npm: '714220002', nama: 'Mahasiswa D4TI B', track: 'Proyek 2', judul: 'Aplikasi Rekomendasi Topik Tugas Akhir', total_bimbingan: 5, status: 'aktif' },
      { id: 3, npm: '714220003', nama: 'Mahasiswa D4TI C', track: 'Internship', judul: 'Portal Layanan Industri dan Magang', total_bimbingan: 8, status: 'siap_sidang' },
      { id: 4, npm: '714220004', nama: 'Mahasiswa D4TI D', track: 'Proyek 1', judul: 'Dashboard Monitoring Capaian Pembelajaran', total_bimbingan: 4, status: 'aktif' },
    ],
  },
  koordinator: {
    role: 'koordinator',
    path: '/dashboard/koordinator',
    outFile: 'koordinator.png',
    user: {
      nama: 'Koordinator Akademik D4TI',
      email: 'koordinator@it.ulbi.ac.id',
    },
    stats: {
      total_proposal: 42,
      pending_proposal: 4,
      total_mahasiswa: 58,
      assigned_dosen: 14,
      stage_counts: { proposal: 8, bimbingan: 28, sidang: 12, selesai: 10 },
    },
  },
};

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  let devServerProcess = null;
  const isUp = await waitForServer(BASE_URL, 2000);
  if (!isUp) {
    console.log(`[capture-shots] Server not responding at ${BASE_URL}. Launching next dev...`);
    const isWindows = process.platform === 'win32';
    devServerProcess = spawn(isWindows ? 'npm.cmd' : 'npm', ['run', 'dev'], {
      stdio: 'inherit',
      cwd: process.cwd(),
      shell: true,
      env: { ...process.env, PORT: '3000' },
    });

    const ready = await waitForServer(BASE_URL, 60000);
    if (!ready) {
      console.error('[capture-shots] Timed out waiting for dev server to start.');
      if (devServerProcess) devServerProcess.kill();
      process.exit(1);
    }
  }

  console.log(`[capture-shots] Dev server is ready at ${BASE_URL}. Launching Chromium...`);
  const browser = await chromium.launch({ headless: true });

  try {
    for (const [key, item] of Object.entries(FIXTURES)) {
      console.log(`[capture-shots] Capturing screenshot for ${key} -> public/landing/${item.outFile}...`);
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();

      // Intercept backend API requests
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
                id: 'inst-01',
                nama: item.user.nama,
                email: item.user.email,
                role: item.role,
                roles: [item.role],
              },
            }),
          });
        }

        if (key === 'mahasiswa') {
          if (url.includes('/profile') || url.includes('/mahasiswa/profile')) {
            return route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({ ok: true, data: item.profile }),
            });
          }
          if (url.includes('/bimbingan')) {
            return route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({ ok: true, data: item.bimbingan }),
            });
          }
          if (url.includes('/laporan')) {
            return route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({ ok: true, data: item.laporan }),
            });
          }
          if (url.includes('/sidang')) {
            return route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({ ok: true, data: item.sidang }),
            });
          }
        }

        if (key === 'dosen') {
          if (url.includes('/stats') || url.includes('/dosen/stats')) {
            return route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({ ok: true, data: item.stats }),
            });
          }
          if (url.includes('/mahasiswa-bimbingan')) {
            return route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({ ok: true, data: item.mahasiswaList }),
            });
          }
        }

        if (key === 'koordinator') {
          if (url.includes('/stats') || url.includes('/koordinator/stats')) {
            return route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({ ok: true, data: item.stats }),
            });
          }
        }

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, data: [] }),
        });
      });

      // Seed session storage and theme
      await page.addInitScript(({ role, user }) => {
        try {
          sessionStorage.setItem('authToken', 'mock-institutional-token');
          sessionStorage.setItem('userRole', role);
          sessionStorage.setItem('userId', 'inst-01');
          sessionStorage.setItem('userName', user.nama);
          sessionStorage.setItem('userEmail', user.email);
          sessionStorage.setItem('userRoles', JSON.stringify([role]));
          localStorage.setItem('kavana-theme', 'light');
          localStorage.setItem('auth-storage', JSON.stringify({
            state: {
              token: 'mock-institutional-token',
              role,
              roles: [role],
              userId: 'inst-01',
              user,
            },
            version: 0,
          }));
        } catch (_) {}
      }, { role: item.role, user: item.user });

      await page.goto(`${BASE_URL}${item.path}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1000);

      // Explicit light mode styling
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      });
      await page.waitForTimeout(400);

      const targetPath = path.join(OUT_DIR, item.outFile);
      await page.screenshot({ path: targetPath, fullPage: false });
      console.log(`[capture-shots] Saved ${targetPath} (${fs.statSync(targetPath).size} bytes)`);

      await context.close();
    }
  } finally {
    await browser.close();
    if (devServerProcess) {
      console.log('[capture-shots] Stopping spawned dev server...');
      devServerProcess.kill();
    }
  }

  console.log('[capture-shots] All screenshots captured successfully.');
}

main().catch((err) => {
  console.error('[capture-shots] Error:', err);
  process.exit(1);
});
