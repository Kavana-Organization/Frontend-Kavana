// ============================================
// Fase 3: RBAC Cross-Role Access Tests
// ============================================
const { test, expect } = require('@playwright/test');
const { apiUrl, isBackendUnavailableStatus, safeJson } = require('../helpers/api');
const { ALL_DOSEN, TEST_USERS, hasRoleCredential } = require('../helpers/env');

async function loginViaApi(request, email, password, extras = {}) {
  const res = await request.post(apiUrl('/api/auth/login'), {
    data: { email, password, ...extras },
  });
  const body = await safeJson(res);
  return { token: body?.token, role: body?.role, status: res.status() };
}

async function getDosenToken(request) {
  const dosen = ALL_DOSEN[1]; // Pak Rolly
  return loginViaApi(request, dosen.email, dosen.password);
}

async function getAdminToken(request) {
  const admin = TEST_USERS.admin;
  return loginViaApi(request, admin.email, admin.password);
}

async function getDeveloperToken(request) {
  const dev = TEST_USERS.developer;
  if (!dev?.email) return { token: null };
  await request.post(apiUrl('/api/auth/developer-device/enroll'), {
    data: { device_id: dev.device_id, device_token: dev.device_token },
  });
  return loginViaApi(request, dev.email, dev.password, {
    device_id: dev.device_id,
    device_token: dev.device_token,
  });
}

test.describe('Fase 3 — RBAC Cross-Role Access Control', () => {

  // ---- Dosen should NOT access admin endpoints ----
  test('Dosen cannot access /api/admin/stats', async ({ request }) => {
    const login = await getDosenToken(request);
    test.skip(!login.token, 'Dosen login failed');

    const res = await request.get(apiUrl('/api/admin/stats'), {
      headers: { Authorization: `Bearer ${login.token}` },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect([401, 403]).toContain(res.status());
  });

  test('Dosen cannot access /api/admin/users', async ({ request }) => {
    const login = await getDosenToken(request);
    test.skip(!login.token, 'Dosen login failed');

    const res = await request.get(apiUrl('/api/admin/users'), {
      headers: { Authorization: `Bearer ${login.token}` },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect([401, 403]).toContain(res.status());
  });

  test('Dosen cannot access /api/developer/health', async ({ request }) => {
    const login = await getDosenToken(request);
    test.skip(!login.token, 'Dosen login failed');

    const res = await request.get(apiUrl('/api/developer/health'), {
      headers: { Authorization: `Bearer ${login.token}` },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect([401, 403]).toContain(res.status());
  });

  // ---- Admin should NOT access dosen-specific endpoints ----
  test('Admin cannot access /api/dosen/profile', async ({ request }) => {
    const login = await getAdminToken(request);
    test.skip(!login.token, 'Admin login failed');

    const res = await request.get(apiUrl('/api/dosen/profile'), {
      headers: { Authorization: `Bearer ${login.token}` },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect([401, 403]).toContain(res.status());
  });

  test('Admin cannot access /api/dosen/bimbingan', async ({ request }) => {
    const login = await getAdminToken(request);
    test.skip(!login.token, 'Admin login failed');

    const res = await request.get(apiUrl('/api/dosen/bimbingan'), {
      headers: { Authorization: `Bearer ${login.token}` },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect([401, 403]).toContain(res.status());
  });

  test('Admin cannot access /api/koordinator/stats', async ({ request }) => {
    const login = await getAdminToken(request);
    test.skip(!login.token, 'Admin login failed');

    const res = await request.get(apiUrl('/api/koordinator/stats'), {
      headers: { Authorization: `Bearer ${login.token}` },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect([401, 403]).toContain(res.status());
  });

  test('Admin cannot access /api/developer/health', async ({ request }) => {
    const login = await getAdminToken(request);
    test.skip(!login.token, 'Admin login failed');

    const res = await request.get(apiUrl('/api/developer/health'), {
      headers: { Authorization: `Bearer ${login.token}` },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect([401, 403]).toContain(res.status());
  });

  // ---- No token should be rejected everywhere ----
  test('No token → /api/dosen/profile returns 401/403', async ({ request }) => {
    const res = await request.get(apiUrl('/api/dosen/profile'));
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect([401, 403]).toContain(res.status());
  });

  test('No token → /api/admin/stats returns 401/403', async ({ request }) => {
    const res = await request.get(apiUrl('/api/admin/stats'));
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect([401, 403]).toContain(res.status());
  });

  test('No token → /api/koordinator/stats returns 401/403', async ({ request }) => {
    const res = await request.get(apiUrl('/api/koordinator/stats'));
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect([401, 403]).toContain(res.status());
  });

  test('No token → /api/kaprodi/stats returns 401/403', async ({ request }) => {
    const res = await request.get(apiUrl('/api/kaprodi/stats'));
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect([401, 403]).toContain(res.status());
  });

  test('No token → /api/mahasiswa/profile returns 401/403', async ({ request }) => {
    const res = await request.get(apiUrl('/api/mahasiswa/profile'));
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect([401, 403]).toContain(res.status());
  });

  test('No token → /api/developer/profile returns 401/403', async ({ request }) => {
    const res = await request.get(apiUrl('/api/developer/profile'));
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect([401, 403]).toContain(res.status());
  });

  test('No token → /api/notifications/stats returns 401/403', async ({ request }) => {
    const res = await request.get(apiUrl('/api/notifications/stats'));
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect([401, 403]).toContain(res.status());
  });
});
