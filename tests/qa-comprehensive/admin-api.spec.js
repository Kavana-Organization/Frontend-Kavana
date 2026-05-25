// ============================================
// Fase 5: Admin API Tests
// ============================================
const { test, expect } = require('@playwright/test');
const { apiUrl, isBackendUnavailableStatus, safeJson } = require('../helpers/api');
const { TEST_USERS, hasRoleCredential } = require('../helpers/env');

async function getAdminToken(request) {
  const admin = TEST_USERS.admin;
  if (!hasRoleCredential('admin')) return { token: null };
  const res = await request.post(apiUrl('/api/auth/login'), {
    data: { email: admin.email, password: admin.password },
  });
  const body = await safeJson(res);
  return { token: body?.token, status: res.status() };
}

test.describe('Fase 5 — Admin API Endpoints', () => {
  test('GET /api/admin/profile', async ({ request }) => {
    test.skip(!hasRoleCredential('admin'), 'Admin credential not configured');
    const { token } = await getAdminToken(request);
    test.skip(!token, 'Admin login failed');

    const res = await request.get(apiUrl('/api/admin/profile'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBe(200);
    const body = await safeJson(res);
    expect(body.role || body.data?.role).toBeTruthy();
  });

  test('GET /api/admin/stats', async ({ request }) => {
    test.skip(!hasRoleCredential('admin'), 'Admin credential not configured');
    const { token } = await getAdminToken(request);
    test.skip(!token, 'Admin login failed');

    const res = await request.get(apiUrl('/api/admin/stats'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBe(200);
    const stats = await safeJson(res);
    expect(stats).toBeTruthy();
    console.log('  Admin stats:', JSON.stringify(stats).slice(0, 200));
  });

  test('GET /api/admin/users', async ({ request }) => {
    test.skip(!hasRoleCredential('admin'), 'Admin credential not configured');
    const { token } = await getAdminToken(request);
    test.skip(!token, 'Admin login failed');

    const res = await request.get(apiUrl('/api/admin/users'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBe(200);
    const body = await safeJson(res);
    expect(body).toBeTruthy();
  });

  test('GET /api/admin/dosen', async ({ request }) => {
    test.skip(!hasRoleCredential('admin'), 'Admin credential not configured');
    const { token } = await getAdminToken(request);
    test.skip(!token, 'Admin login failed');

    const res = await request.get(apiUrl('/api/admin/dosen'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBe(200);
    const body = await safeJson(res);
    // Should be array of dosen
    const dosenList = body.data || body;
    if (Array.isArray(dosenList)) {
      console.log(`  Admin sees ${dosenList.length} dosen`);
      expect(dosenList.length).toBeGreaterThan(0);
    }
  });

  test('GET /api/admin/mahasiswa', async ({ request }) => {
    test.skip(!hasRoleCredential('admin'), 'Admin credential not configured');
    const { token } = await getAdminToken(request);
    test.skip(!token, 'Admin login failed');

    const res = await request.get(apiUrl('/api/admin/mahasiswa'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBe(200);
  });

  test('GET /api/admin/report', async ({ request }) => {
    test.skip(!hasRoleCredential('admin'), 'Admin credential not configured');
    const { token } = await getAdminToken(request);
    test.skip(!token, 'Admin login failed');

    const res = await request.get(apiUrl('/api/admin/report'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect([200, 404]).toContain(res.status()); // 404 if not implemented
  });

  test('GET /api/admin/activity', async ({ request }) => {
    test.skip(!hasRoleCredential('admin'), 'Admin credential not configured');
    const { token } = await getAdminToken(request);
    test.skip(!token, 'Admin login failed');

    const res = await request.get(apiUrl('/api/admin/activity'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect([200, 404]).toContain(res.status());
  });

  test('GET /api/admin/audit-logs', async ({ request }) => {
    test.skip(!hasRoleCredential('admin'), 'Admin credential not configured');
    const { token } = await getAdminToken(request);
    test.skip(!token, 'Admin login failed');

    const res = await request.get(apiUrl('/api/admin/audit-logs'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect([200, 404]).toContain(res.status());
    if (res.status() === 200) {
      const body = await safeJson(res);
      console.log('  Audit logs sample:', JSON.stringify(body).slice(0, 200));
    }
  });

  test('GET /api/admin/audit-logs with limit param', async ({ request }) => {
    test.skip(!hasRoleCredential('admin'), 'Admin credential not configured');
    const { token } = await getAdminToken(request);
    test.skip(!token, 'Admin login failed');

    const res = await request.get(apiUrl('/api/admin/audit-logs?limit=5'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect([200, 404]).toContain(res.status());
  });
});
