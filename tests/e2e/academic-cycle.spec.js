const { test, expect } = require('@playwright/test');
const { apiUrl, loginApi, safeJson, isBackendUnavailableStatus } = require('../helpers/api');
const { hasRoleCredential } = require('../helpers/env');
const { loginRole } = require('../helpers/auth');

// ===========================================================================
// E2E siklus akademik: proposal -> bimbingan -> laporan -> sidang -> revisi
//
// Dua lapis:
//   1. "Journey UI"  : hanya membaca, butuh akun mahasiswa. Selalu jalan.
//   2. "Siklus tulis": mengubah data, hanya jalan bila TEST_ACADEMIC_CYCLE=true.
//
// Siklus tulis butuh cohort uji yang sudah punya:
//   - enrollment aktif + jadwal proyek yang mencakup 8 minggu bimbingan
//   - akun dosen pembimbing, koordinator, dan penguji
// Bila prasyarat tidak terpenuhi, test berhenti sebagai skip dengan alasan.
// ===========================================================================

const ROLE_REQUIREMENTS = ['mahasiswa', 'dosen', 'koordinator', 'penguji'];

function missingRoles() {
  return ROLE_REQUIREMENTS.filter((role) => !hasRoleCredential(role));
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

async function call(request, method, path, token, data) {
  const options = { headers: token ? { Authorization: `Bearer ${token}` } : {} };
  if (data !== undefined) options.data = data;

  const response = await request[method](apiUrl(path), options);
  const body = await safeJson(response);
  return { status: response.status(), body };
}

function listOf(body) {
  if (Array.isArray(body)) return body;
  for (const key of ['data', 'items', 'rows']) {
    if (Array.isArray(body?.[key])) return body[key];
  }
  return [];
}

test.describe.configure({ mode: 'serial' });

test.describe('Siklus akademik - journey UI', () => {
  test('mahasiswa dapat membuka seluruh tahap siklus', async ({ page }) => {
    test.skip(!hasRoleCredential('mahasiswa'), 'Butuh akun testing mahasiswa.');

    await loginRole(page, 'mahasiswa');

    const stages = [
      { path: '/dashboard/mahasiswa/proposal', teks: /proposal|track/i },
      { path: '/dashboard/mahasiswa/bimbingan', teks: /bimbingan/i },
      { path: '/dashboard/mahasiswa/laporan', teks: /laporan|berkas sidang/i },
      { path: '/dashboard/mahasiswa/hasil', teks: /hasil|sidang/i },
      { path: '/dashboard/mahasiswa/revisi-sidang', teks: /revisi/i },
    ];

    for (const stage of stages) {
      await test.step(stage.path, async () => {
        await page.goto(stage.path);

        // Tidak boleh terlempar ke /login atau halaman peran lain.
        await expect(page).toHaveURL(new RegExp(`${stage.path}$`));
        await expect(page.locator('body')).toContainText(stage.teks);
        await expect(page.locator('body')).not.toContainText(/application error|internal server error/i);
      });
    }
  });
});

test.describe('Siklus akademik - alur tulis', () => {
  test('satu siklus proposal sampai revisi disetujui', async ({ request }) => {
    test.skip(process.env.TEST_ACADEMIC_CYCLE !== 'true', 'Set TEST_ACADEMIC_CYCLE=true untuk menjalankan alur tulis.');

    const missing = missingRoles();
    test.skip(missing.length > 0, `Butuh kredensial role: ${missing.join(', ')}.`);
    test.skip(!process.env.TEST_PROPOSAL_DRIVE_LINK, 'Butuh TEST_PROPOSAL_DRIVE_LINK.');
    test.skip(!process.env.TEST_LAPORAN_DRIVE_LINK, 'Butuh TEST_LAPORAN_DRIVE_LINK.');

    const sessions = {};
    for (const role of ROLE_REQUIREMENTS) {
      sessions[role] = await loginApi(request, role);
      expect(sessions[role].response.status(), `login ${role}`).toBe(200);
      expect(sessions[role].token, `token ${role}`).toBeTruthy();
    }

    const mhsId = sessions.mahasiswa.body?.id || sessions.mahasiswa.body?.user_id;
    const dosenId = sessions.dosen.body?.id || sessions.dosen.body?.user_id;
    expect(mhsId, 'id mahasiswa dari respons login').toBeTruthy();
    expect(dosenId, 'id dosen dari respons login').toBeTruthy();

    // ---------------------------------------------------------------- 1. Proposal
    let enrollmentId;
    let proposalStatus;

    await test.step('proposal disubmit dan divalidasi koordinator', async () => {
      const status = await call(request, 'get', '/api/mahasiswa/proposal/status', sessions.mahasiswa.token);
      test.skip(isBackendUnavailableStatus(status.status), `Backend tidak sehat (${status.status}).`);
      expect(status.status).toBe(200);

      const enrollments = Array.isArray(status.body?.enrollments)
        ? status.body.enrollments
        : status.body?.enrollment_id
          ? [status.body]
          : [];

      test.skip(enrollments.length === 0, 'Akun mahasiswa belum punya enrollment aktif. Seed track dulu.');

      enrollmentId = enrollments[0].enrollment_id;
      proposalStatus = enrollments[0].status_proposal;

      if (proposalStatus !== 'approved') {
        const submit = await call(request, 'post', '/api/mahasiswa/proposal', sessions.mahasiswa.token, {
          judul_proyek: process.env.TEST_PROPOSAL_TITLE || `E2E Siklus Akademik ${Date.now()}`,
          file_url: process.env.TEST_PROPOSAL_DRIVE_LINK,
          enrollment_id: enrollmentId,
        });
        expect([200, 201], `submit proposal: ${JSON.stringify(submit.body).slice(0, 200)}`).toContain(submit.status);

        const validate = await call(request, 'patch', '/api/koordinator/proposal/validate', sessions.koordinator.token, {
          mahasiswa_id: mhsId,
          enrollment_id: enrollmentId,
          status: 'approved',
        });
        expect([200, 201], `validasi proposal: ${JSON.stringify(validate.body).slice(0, 200)}`).toContain(validate.status);
      }
    });

    // ------------------------------------------------------------- 2. Pembimbing
    await test.step('koordinator menetapkan dosen pembimbing', async () => {
      const assign = await call(request, 'post', '/api/koordinator/assign-dosen', sessions.koordinator.token, {
        mahasiswa_id: mhsId,
        dosen_id: dosenId,
        enrollment_id: enrollmentId,
      });
      expect([200, 201], `assign dosen: ${JSON.stringify(assign.body).slice(0, 200)}`).toContain(assign.status);
    });

    // -------------------------------------------------------------- 3. Bimbingan
    await test.step('delapan bimbingan disetujui dosen', async () => {
      const read = await call(request, 'get', '/api/mahasiswa/bimbingan', sessions.mahasiswa.token);
      expect(read.status).toBe(200);

      const approved = listOf(read.body).filter((item) => item.status === 'approved').length;
      const missingWeeks = 8 - approved;

      for (let i = 1; i <= missingWeeks; i += 1) {
        const created = await call(request, 'post', '/api/mahasiswa/bimbingan', sessions.mahasiswa.token, {
          tanggal: isoDate(addDays(new Date(), i * 7)),
          minggu_ke: approved + i,
          topik: `E2E bimbingan minggu ${approved + i}`,
          enrollment_id: enrollmentId,
        });

        if (created.status === 400) {
          test.skip(true, `Cohort tidak mendukung 8 minggu bimbingan: ${created.body?.message || 'ditolak'}`);
        }
        expect([200, 201], `bimbingan minggu ${approved + i}: ${JSON.stringify(created.body).slice(0, 200)}`).toContain(created.status);
      }

      const reread = await call(request, 'get', '/api/mahasiswa/bimbingan', sessions.mahasiswa.token);
      const waiting = listOf(reread.body).filter((item) => item.status !== 'approved');

      for (const item of waiting) {
        const approvedRes = await call(request, 'patch', `/api/dosen/bimbingan/${item.id}/status`, sessions.dosen.token, {
          status: 'approved',
        });
        expect([200, 201], `approve bimbingan ${item.id}`).toContain(approvedRes.status);
      }
    });

    // ---------------------------------------------------------------- 4. Laporan
    await test.step('laporan sidang disubmit dan disetujui', async () => {
      const read = await call(request, 'get', '/api/mahasiswa/laporan', sessions.mahasiswa.token);
      expect(read.status).toBe(200);

      const approved = listOf(read.body).find((row) => row.status === 'approved');
      if (!approved) {
        const submit = await call(request, 'post', '/api/mahasiswa/laporan', sessions.mahasiswa.token, {
          file_url: process.env.TEST_LAPORAN_DRIVE_LINK,
          file_luaran: process.env.TEST_LUARAN_DRIVE_LINK,
        });
        if (submit.status === 400) {
          test.skip(true, `Laporan belum bisa disubmit: ${submit.body?.message || 'ditolak'}`);
        }
        expect([200, 201]).toContain(submit.status);

        const reread = await call(request, 'get', '/api/mahasiswa/laporan', sessions.mahasiswa.token);
        const pending = listOf(reread.body).find((row) => row.status !== 'approved');
        expect(pending, 'laporan yang baru disubmit').toBeTruthy();

        const approve = await call(request, 'patch', `/api/dosen/laporan/${pending.id}/status`, sessions.dosen.token, {
          status: 'approved',
        });
        expect([200, 201], `approve laporan: ${JSON.stringify(approve.body).slice(0, 200)}`).toContain(approve.status);
      }
    });

    // ----------------------------------------------------------------- 5. Sidang
    let sidangId;
    await test.step('koordinator menjadwalkan sidang', async () => {
      const existing = await call(request, 'get', '/api/mahasiswa/sidang', sessions.mahasiswa.token);
      const sudahAda = listOf(existing.body).find((row) => row.hasil_sidang);
      if (sudahAda) {
        sidangId = sudahAda.id;
        return;
      }

      const pengujiList = await call(request, 'get', '/api/koordinator/penguji', sessions.koordinator.token);
      const penguji = listOf(pengujiList.body)[0];
      test.skip(!penguji, 'Belum ada dosen berperan penguji untuk dijadwalkan.');

      const schedule = await call(request, 'post', '/api/koordinator/sidang/schedule', sessions.koordinator.token, {
        mahasiswa_id: mhsId,
        tanggal: isoDate(addDays(new Date(), 7)),
        waktu: '09:00',
        ruangan: 'E2E-Ruang',
        penguji_id: penguji.id,
      });
      if (schedule.status === 400) {
        test.skip(true, `Sidang belum memenuhi syarat: ${schedule.body?.message || 'ditolak'}`);
      }
      expect([200, 201], `jadwal sidang: ${JSON.stringify(schedule.body).slice(0, 200)}`).toContain(schedule.status);
      sidangId = schedule.body?.id;
    });

    // ------------------------------------------------------------ 6. Hasil sidang
    await test.step('hasil sidang ditandai lulus_revisi', async () => {
      if (!sidangId) {
        const existing = await call(request, 'get', '/api/mahasiswa/sidang', sessions.mahasiswa.token);
        sidangId = listOf(existing.body)[0]?.id;
      }
      expect(sidangId, 'id sidang').toBeTruthy();

      const hasil = await call(request, 'patch', `/api/sidang/${sidangId}/hasil`, sessions.koordinator.token, {
        hasil_sidang: 'lulus_revisi',
        catatan_sidang: 'E2E siklus akademik',
      });
      // 409 = hasil sudah final dari percobaan sebelumnya; lanjut ke revisi.
      expect([200, 201, 409], `hasil sidang: ${JSON.stringify(hasil.body).slice(0, 200)}`).toContain(hasil.status);
    });

    // ---------------------------------------------------------------- 7. Revisi
    await test.step('revisi disubmit dan disetujui', async () => {
      const read = await call(request, 'get', '/api/mahasiswa/revisi-sidang', sessions.mahasiswa.token);
      expect(read.status).toBe(200);

      const rows = Array.isArray(read.body?.revisi) ? read.body.revisi : listOf(read.body);
      const approved = rows.find((row) => row.status === 'approved');

      if (!approved) {
        const submit = await call(request, 'post', '/api/mahasiswa/revisi-sidang', sessions.mahasiswa.token, {
          file_url: process.env.TEST_LAPORAN_DRIVE_LINK,
          catatan_mahasiswa: 'E2E siklus akademik',
        });
        if (submit.status === 400) {
          test.skip(true, `Revisi belum bisa disubmit: ${submit.body?.message || 'ditolak'}`);
        }
        expect([200, 201], `submit revisi: ${JSON.stringify(submit.body).slice(0, 200)}`).toContain(submit.status);

        const reread = await call(request, 'get', '/api/mahasiswa/revisi-sidang', sessions.mahasiswa.token);
        const pendingRows = Array.isArray(reread.body?.revisi) ? reread.body.revisi : listOf(reread.body);
        const pending = pendingRows.find((row) => row.status !== 'approved');
        expect(pending, 'revisi yang baru disubmit').toBeTruthy();

        const review = await call(request, 'patch', `/api/dosen/revisi-sidang/${pending.id}/status`, sessions.koordinator.token, {
          status: 'approved',
          catatan_dosen: 'E2E disetujui',
        });
        expect([200, 201], `review revisi: ${JSON.stringify(review.body).slice(0, 200)}`).toContain(review.status);
      }

      const final = await call(request, 'get', '/api/mahasiswa/revisi-sidang', sessions.mahasiswa.token);
      const finalRows = Array.isArray(final.body?.revisi) ? final.body.revisi : listOf(final.body);
      expect(finalRows.some((row) => row.status === 'approved')).toBe(true);
    });
  });
});
