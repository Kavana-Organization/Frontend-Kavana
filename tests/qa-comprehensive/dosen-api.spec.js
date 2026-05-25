// ============================================
// Fase 4: Dosen/Koordinator/Kaprodi API Tests
// ============================================
const { test, expect } = require('@playwright/test');
const { apiUrl, isBackendUnavailableStatus, safeJson } = require('../helpers/api');
const { ALL_DOSEN } = require('../helpers/env');

async function loginViaApi(request, email, password) {
  const res = await request.post(apiUrl('/api/auth/login'), {
    data: { email, password },
  });
  const body = await safeJson(res);
  return { token: body?.token, role: body?.role, status: res.status(), userId: body?.user_id };
}

// Track role distribution across all dosen accounts
const roleResults = [];

test.describe('Fase 4 — Dosen Role Distribution Analysis', () => {
  for (const dosen of ALL_DOSEN) {
    test(`Identify role for ${dosen.name} (${dosen.email})`, async ({ request }) => {
      const login = await loginViaApi(request, dosen.email, dosen.password);
      test.skip(isBackendUnavailableStatus(login.status), 'Backend unavailable');
      test.skip(!login.token, `Login failed for ${dosen.email}`);

      roleResults.push({ name: dosen.name, email: dosen.email, role: login.role, userId: login.userId });

      // Log role for reporting
      console.log(`  → ${dosen.name}: role=${login.role}, user_id=${login.userId}`);
      expect(login.role).toBeTruthy();
    });
  }
});

test.describe('Fase 4 — Dosen Endpoint Tests (all dosen accounts)', () => {
  for (const dosen of ALL_DOSEN) {
    test(`${dosen.name}: GET /api/dosen/profile`, async ({ request }) => {
      const login = await loginViaApi(request, dosen.email, dosen.password);
      test.skip(!login.token, `Login failed for ${dosen.email}`);
      // Only test if role has dosen access
      const dosenRoles = ['dosen', 'koordinator', 'kaprodi', 'penguji'];
      test.skip(!dosenRoles.includes(login.role), `Role ${login.role} may not access dosen endpoints`);

      const res = await request.get(apiUrl('/api/dosen/profile'), {
        headers: { Authorization: `Bearer ${login.token}` },
      });
      test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
      expect(res.status()).toBe(200);
      const profile = await safeJson(res);
      expect(profile.nama).toBeTruthy();
      expect(profile.email).toBe(dosen.email);
    });

    test(`${dosen.name}: GET /api/dosen/stats`, async ({ request }) => {
      const login = await loginViaApi(request, dosen.email, dosen.password);
      test.skip(!login.token, `Login failed`);
      const dosenRoles = ['dosen', 'koordinator', 'kaprodi', 'penguji'];
      test.skip(!dosenRoles.includes(login.role), `Role ${login.role} skip`);

      const res = await request.get(apiUrl('/api/dosen/stats'), {
        headers: { Authorization: `Bearer ${login.token}` },
      });
      test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
      expect(res.status()).toBe(200);
      const stats = await safeJson(res);
      expect(stats).toBeTruthy();
    });

    test(`${dosen.name}: GET /api/dosen/mahasiswa`, async ({ request }) => {
      const login = await loginViaApi(request, dosen.email, dosen.password);
      test.skip(!login.token, `Login failed`);
      const dosenRoles = ['dosen', 'koordinator', 'kaprodi', 'penguji'];
      test.skip(!dosenRoles.includes(login.role), `Role ${login.role} skip`);

      const res = await request.get(apiUrl('/api/dosen/mahasiswa'), {
        headers: { Authorization: `Bearer ${login.token}` },
      });
      test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
      expect(res.status()).toBe(200);
    });

    test(`${dosen.name}: GET /api/dosen/bimbingan`, async ({ request }) => {
      const login = await loginViaApi(request, dosen.email, dosen.password);
      test.skip(!login.token, `Login failed`);
      const dosenRoles = ['dosen', 'koordinator', 'kaprodi', 'penguji'];
      test.skip(!dosenRoles.includes(login.role), `Role ${login.role} skip`);

      const res = await request.get(apiUrl('/api/dosen/bimbingan'), {
        headers: { Authorization: `Bearer ${login.token}` },
      });
      test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
      expect(res.status()).toBe(200);
    });
  }
});

// ---- Koordinator-specific endpoints (tested with dosen that has koordinator role) ----
test.describe('Fase 4 — Koordinator Endpoint Tests', () => {
  // Try all dosen accounts, use whichever has koordinator role
  for (const dosen of ALL_DOSEN) {
    test(`${dosen.name}: Try koordinator endpoints`, async ({ request }) => {
      const login = await loginViaApi(request, dosen.email, dosen.password);
      test.skip(!login.token, `Login failed`);
      test.skip(login.role !== 'koordinator', `${dosen.name} role is ${login.role}, not koordinator`);

      // Profile
      const profileRes = await request.get(apiUrl('/api/koordinator/profile'), {
        headers: { Authorization: `Bearer ${login.token}` },
      });
      expect(profileRes.status()).toBe(200);

      // Stats
      const statsRes = await request.get(apiUrl('/api/koordinator/stats'), {
        headers: { Authorization: `Bearer ${login.token}` },
      });
      expect(statsRes.status()).toBe(200);

      // Pending proposals
      const proposalRes = await request.get(apiUrl('/api/koordinator/proposal/pending'), {
        headers: { Authorization: `Bearer ${login.token}` },
      });
      expect(proposalRes.status()).toBe(200);

      // Mahasiswa list
      const mhsRes = await request.get(apiUrl('/api/koordinator/mahasiswa'), {
        headers: { Authorization: `Bearer ${login.token}` },
      });
      expect(mhsRes.status()).toBe(200);

      // Jadwal list
      const jadwalRes = await request.get(apiUrl('/api/koordinator/jadwal'), {
        headers: { Authorization: `Bearer ${login.token}` },
      });
      expect(jadwalRes.status()).toBe(200);

      console.log(`  ✓ Koordinator endpoints all pass for ${dosen.name}`);
    });
  }
});

// ---- Kaprodi-specific endpoints ----
test.describe('Fase 4 — Kaprodi Endpoint Tests', () => {
  for (const dosen of ALL_DOSEN) {
    test(`${dosen.name}: Try kaprodi endpoints`, async ({ request }) => {
      const login = await loginViaApi(request, dosen.email, dosen.password);
      test.skip(!login.token, `Login failed`);
      test.skip(login.role !== 'kaprodi', `${dosen.name} role is ${login.role}, not kaprodi`);

      const profileRes = await request.get(apiUrl('/api/kaprodi/profile'), {
        headers: { Authorization: `Bearer ${login.token}` },
      });
      expect(profileRes.status()).toBe(200);

      const statsRes = await request.get(apiUrl('/api/kaprodi/stats'), {
        headers: { Authorization: `Bearer ${login.token}` },
      });
      expect(statsRes.status()).toBe(200);

      const dosenListRes = await request.get(apiUrl('/api/kaprodi/dosen'), {
        headers: { Authorization: `Bearer ${login.token}` },
      });
      expect(dosenListRes.status()).toBe(200);

      const koordinatorRes = await request.get(apiUrl('/api/kaprodi/koordinator'), {
        headers: { Authorization: `Bearer ${login.token}` },
      });
      expect(koordinatorRes.status()).toBe(200);

      console.log(`  ✓ Kaprodi endpoints all pass for ${dosen.name}`);
    });
  }
});
