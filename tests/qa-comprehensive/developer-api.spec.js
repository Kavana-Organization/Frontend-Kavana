// ============================================
// Fase 6: Developer API Tests
// ============================================
const { test, expect } = require('@playwright/test');
const { apiUrl, isBackendUnavailableStatus, safeJson } = require('../helpers/api');
const { TEST_USERS } = require('../helpers/env');

async function getDeveloperToken(request) {
  const dev = TEST_USERS.developer;
  if (!dev?.email || !dev?.device_id) return { token: null };

  // Enroll device first
  await request.post(apiUrl('/api/auth/developer-device/enroll'), {
    data: { device_id: dev.device_id, device_token: dev.device_token },
  });

  // Login
  const res = await request.post(apiUrl('/api/auth/login'), {
    data: {
      email: dev.email,
      password: dev.password,
      device_id: dev.device_id,
      device_token: dev.device_token,
    },
  });
  const body = await safeJson(res);
  return { token: body?.token, status: res.status(), role: body?.role };
}

const hasDeveloperCreds = () => {
  const dev = TEST_USERS.developer;
  return Boolean(dev?.email && dev?.device_id && dev?.device_token);
};

test.describe('Fase 6 — Developer API Endpoints', () => {
  test('Developer login and verify role', async ({ request }) => {
    test.skip(!hasDeveloperCreds(), 'Developer credentials not configured');
    const { token, role, status } = await getDeveloperToken(request);
    test.skip(isBackendUnavailableStatus(status), 'Backend unavailable');

    if (status === 200) {
      expect(token).toBeTruthy();
      expect(role).toBe('developer');
    }
  });

  test('GET /api/developer/profile', async ({ request }) => {
    test.skip(!hasDeveloperCreds(), 'Developer credentials not configured');
    const { token } = await getDeveloperToken(request);
    test.skip(!token, 'Developer login failed');

    const res = await request.get(apiUrl('/api/developer/profile'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBe(200);
    const body = await safeJson(res);
    expect(body.role || body.data?.role).toBe('developer');
  });

  test('GET /api/developer/health', async ({ request }) => {
    test.skip(!hasDeveloperCreds(), 'Developer credentials not configured');
    const { token } = await getDeveloperToken(request);
    test.skip(!token, 'Developer login failed');

    const res = await request.get(apiUrl('/api/developer/health'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBe(200);
    const body = await safeJson(res);
    console.log('  Developer health:', JSON.stringify(body).slice(0, 300));
  });

  test('GET /api/developer/system/config', async ({ request }) => {
    test.skip(!hasDeveloperCreds(), 'Developer credentials not configured');
    const { token } = await getDeveloperToken(request);
    test.skip(!token, 'Developer login failed');

    const res = await request.get(apiUrl('/api/developer/system/config'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBe(200);
  });

  test('GET /api/developer/audit-logs', async ({ request }) => {
    test.skip(!hasDeveloperCreds(), 'Developer credentials not configured');
    const { token } = await getDeveloperToken(request);
    test.skip(!token, 'Developer login failed');

    const res = await request.get(apiUrl('/api/developer/audit-logs?limit=10'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBe(200);
  });

  test('GET /api/developer/auth-logs', async ({ request }) => {
    test.skip(!hasDeveloperCreds(), 'Developer credentials not configured');
    const { token } = await getDeveloperToken(request);
    test.skip(!token, 'Developer login failed');

    const res = await request.get(apiUrl('/api/developer/auth-logs?limit=10'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBe(200);
  });

  test('GET /api/developer/devices', async ({ request }) => {
    test.skip(!hasDeveloperCreds(), 'Developer credentials not configured');
    const { token } = await getDeveloperToken(request);
    test.skip(!token, 'Developer login failed');

    const res = await request.get(apiUrl('/api/developer/devices'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBe(200);
    const body = await safeJson(res);
    console.log('  Developer devices:', JSON.stringify(body).slice(0, 200));
  });

  test('GET /api/developer/redis/keys', async ({ request }) => {
    test.skip(!hasDeveloperCreds(), 'Developer credentials not configured');
    const { token } = await getDeveloperToken(request);
    test.skip(!token, 'Developer login failed');

    const res = await request.get(apiUrl('/api/developer/redis/keys?pattern=kavana:*'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    // Redis might not be available, so 200 or error is acceptable
    expect(res.status()).toBeLessThan(500);
  });

  test('GET /api/developer/permissions/matrix', async ({ request }) => {
    test.skip(!hasDeveloperCreds(), 'Developer credentials not configured');
    const { token } = await getDeveloperToken(request);
    test.skip(!token, 'Developer login failed');

    const res = await request.get(apiUrl('/api/developer/permissions/matrix'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBe(200);
    const body = await safeJson(res);
    console.log('  Permission matrix:', JSON.stringify(body).slice(0, 300));
  });
});
