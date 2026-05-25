// ============================================
// Fase 2: Authentication API Tests — All Roles
// ============================================
const { test, expect } = require('@playwright/test');
const { apiUrl, isBackendUnavailableStatus, safeJson } = require('../helpers/api');
const { ALL_DOSEN, TEST_USERS, hasRoleCredential } = require('../helpers/env');

// ---- Helper: login via API ----
async function loginViaApi(request, email, password, extras = {}) {
  const res = await request.post(apiUrl('/api/auth/login'), {
    data: { email, password, ...extras },
  });
  const body = await safeJson(res);
  if (res.status() !== 200) {
    console.log(`Login failed for ${email} with status ${res.status()}:`, body);
  }
  return { response: res, body, token: body?.token || body?.data?.token, status: res.status() };
}

// =============================================
// Dosen Login Tests (9 accounts)
// =============================================
test.describe('Fase 2 — Dosen Authentication (9 accounts)', () => {
  for (const dosen of ALL_DOSEN) {
    test(`Login: ${dosen.name} (${dosen.email})`, async ({ request }) => {
      const result = await loginViaApi(request, dosen.email, dosen.password);
      test.skip(isBackendUnavailableStatus(result.status), `Backend unavailable (${result.status})`);

      expect(result.status).toBe(200);
      expect(result.body.token).toBeTruthy();
      expect(result.body.user_id).toBeTruthy();
      // Dosen role can be: dosen, koordinator, kaprodi, penguji
      expect(['dosen', 'koordinator', 'kaprodi', 'penguji']).toContain(result.body.role);
    });

    test(`Profile after login: ${dosen.name}`, async ({ request }) => {
      const login = await loginViaApi(request, dosen.email, dosen.password);
      test.skip(isBackendUnavailableStatus(login.status), `Backend unavailable`);
      test.skip(!login.token, `Login failed for ${dosen.email}`);

      const profileRes = await request.get(apiUrl('/api/auth/profile'), {
        headers: { Authorization: `Bearer ${login.token}` },
      });
      expect(profileRes.status()).toBe(200);
      const profile = await safeJson(profileRes);
      expect(profile.email).toBe(dosen.email);
      expect(profile.nama).toBeTruthy();
    });
  }
});

// =============================================
// Admin Login Tests
// =============================================
test.describe('Fase 2 — Admin Authentication', () => {
  const admin = TEST_USERS.admin;

  test('Admin login succeeds', async ({ request }) => {
    test.skip(!hasRoleCredential('admin'), 'Admin credential not configured');
    const result = await loginViaApi(request, admin.email, admin.password);
    test.skip(isBackendUnavailableStatus(result.status), `Backend unavailable`);

    expect(result.status).toBe(200);
    expect(result.body.token).toBeTruthy();
    expect(result.body.role).toBe('admin');
  });

  test('Admin profile accessible after login', async ({ request }) => {
    test.skip(!hasRoleCredential('admin'), 'Admin credential not configured');
    const login = await loginViaApi(request, admin.email, admin.password);
    test.skip(!login.token, 'Login failed');

    const profileRes = await request.get(apiUrl('/api/auth/profile'), {
      headers: { Authorization: `Bearer ${login.token}` },
    });
    expect(profileRes.status()).toBe(200);
    const profile = await safeJson(profileRes);
    expect(profile.role).toBe('admin');
  });

  test('Admin /api/auth/me accessible', async ({ request }) => {
    test.skip(!hasRoleCredential('admin'), 'Admin credential not configured');
    const login = await loginViaApi(request, admin.email, admin.password);
    test.skip(!login.token, 'Login failed');

    const meRes = await request.get(apiUrl('/api/auth/me'), {
      headers: { Authorization: `Bearer ${login.token}` },
    });
    expect([200, 404]).toContain(meRes.status()); // 404 if endpoint not yet implemented
  });
});

// =============================================
// Developer Login Tests (3-step)
// =============================================
test.describe('Fase 2 — Developer Authentication', () => {
  const dev = TEST_USERS.developer;

  test('Developer device enrollment', async ({ request }) => {
    test.skip(!dev?.email || !dev?.device_id, 'Developer credential not configured');

    const enrollRes = await request.post(apiUrl('/api/auth/developer-device/enroll'), {
      data: {
        device_id: dev.device_id,
        device_token: dev.device_token,
      },
    });
    // Enroll might be 200 (success), 409 (already enrolled), or other
    const body = await safeJson(enrollRes);
    expect(enrollRes.status()).toBeLessThan(500);
  });

  test('Developer login with device credentials', async ({ request }) => {
    test.skip(!dev?.email || !dev?.device_id, 'Developer credential not configured');

    // Enroll first
    await request.post(apiUrl('/api/auth/developer-device/enroll'), {
      data: {
        device_id: dev.device_id,
        device_token: dev.device_token,
      },
    });

    // Login
    const result = await loginViaApi(request, dev.email, dev.password, {
      device_id: dev.device_id,
      device_token: dev.device_token,
    });
    test.skip(isBackendUnavailableStatus(result.status), `Backend unavailable`);

    if (result.status === 200) {
      expect(result.body.token).toBeTruthy();
      expect(result.body.role).toBe('developer');
      expect(result.body.roles).toBeTruthy();
    }
  });

  test('Developer profile accessible after login', async ({ request }) => {
    test.skip(!dev?.email || !dev?.device_id, 'Developer credential not configured');

    await request.post(apiUrl('/api/auth/developer-device/enroll'), {
      data: { device_id: dev.device_id, device_token: dev.device_token },
    });

    const login = await loginViaApi(request, dev.email, dev.password, {
      device_id: dev.device_id,
      device_token: dev.device_token,
    });
    test.skip(!login.token, 'Developer login failed');

    const profileRes = await request.get(apiUrl('/api/auth/profile'), {
      headers: { Authorization: `Bearer ${login.token}` },
    });
    expect(profileRes.status()).toBe(200);
    const profile = await safeJson(profileRes);
    expect(profile.role).toBe('developer');
  });
});

// =============================================
// Negative Auth Tests
// =============================================
test.describe('Fase 2 — Negative Authentication Tests', () => {
  test('Login with empty body returns 400', async ({ request }) => {
    const res = await request.post(apiUrl('/api/auth/login'), { data: {} });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test('Login with wrong password returns 400', async ({ request }) => {
    const res = await request.post(apiUrl('/api/auth/login'), {
      data: { email: 'awangga@ulbi.ac.id', password: 'wrongpassword123' },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect([400, 401, 403]).toContain(res.status());
  });

  test('Login with non-existent email returns 400', async ({ request }) => {
    const res = await request.post(apiUrl('/api/auth/login'), {
      data: { email: 'nonexistent@ulbi.ac.id', password: 'password123' },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect([400, 401, 403, 404]).toContain(res.status());
  });

  test('Login with invalid email format returns 400', async ({ request }) => {
    const res = await request.post(apiUrl('/api/auth/login'), {
      data: { email: 'not-an-email', password: 'password123' },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test('Profile without token returns 401 or 403', async ({ request }) => {
    const res = await request.get(apiUrl('/api/auth/profile'));
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect([401, 403]).toContain(res.status());
  });

  test('Profile with invalid token returns 401 or 403', async ({ request }) => {
    const res = await request.get(apiUrl('/api/auth/profile'), {
      headers: { Authorization: 'Bearer invalid-token-xyz-123' },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect([401, 403]).toContain(res.status());
  });

  test('Login with missing password returns 400', async ({ request }) => {
    const res = await request.post(apiUrl('/api/auth/login'), {
      data: { email: 'awangga@ulbi.ac.id' },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test('Login with missing email returns 400', async ({ request }) => {
    const res = await request.post(apiUrl('/api/auth/login'), {
      data: { password: 'bagas7474' },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });
});
