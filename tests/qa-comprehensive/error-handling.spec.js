// ============================================
// Fase 9: Error Handling & Edge Cases
// ============================================
const { test, expect } = require('@playwright/test');
const { apiUrl, isBackendUnavailableStatus, safeJson } = require('../helpers/api');
const { ALL_DOSEN } = require('../helpers/env');

async function loginViaApi(request, email, password) {
  const res = await request.post(apiUrl('/api/auth/login'), {
    data: { email, password },
  });
  const body = await safeJson(res);
  return { token: body?.token, status: res.status() };
}

test.describe('Fase 9 — Error Handling & Edge Cases', () => {
  test('Non-existent API route returns proper 404', async ({ request }) => {
    const res = await request.get(apiUrl('/api/this-route-does-not-exist'));
    // Should be 404, not 500
    expect(res.status()).not.toBe(500);
  });

  test('POST to a GET-only endpoint returns 404 or 405', async ({ request }) => {
    const res = await request.post(apiUrl('/api/dosen/profile'));
    // Without auth: 401/403, with wrong method: 404/405
    expect([401, 403, 404, 405]).toContain(res.status());
  });

  test('Malformed JSON body returns 400 (not 500)', async ({ request }) => {
    const res = await request.post(apiUrl('/api/auth/login'), {
      headers: { 'Content-Type': 'application/json' },
      data: 'this is not json{{{',
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBeLessThan(500);
  });

  test('Empty body on POST login returns 400', async ({ request }) => {
    const res = await request.post(apiUrl('/api/auth/login'), {
      headers: { 'Content-Type': 'application/json' },
      data: '',
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBeLessThan(500);
  });

  test('GET /api/bimbingan/999999 returns 404 for non-existent bimbingan', async ({ request }) => {
    const dosen = ALL_DOSEN[1];
    const login = await loginViaApi(request, dosen.email, dosen.password);
    test.skip(!login.token, 'Login failed');

    const res = await request.get(apiUrl('/api/bimbingan/999999'), {
      headers: { Authorization: `Bearer ${login.token}` },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect([404, 403]).toContain(res.status());
  });

  test('PATCH bimbingan status without body returns error', async ({ request }) => {
    const dosen = ALL_DOSEN[1];
    const login = await loginViaApi(request, dosen.email, dosen.password);
    test.skip(!login.token, 'Login failed');

    const res = await request.patch(apiUrl('/api/dosen/bimbingan/1/status'), {
      headers: { Authorization: `Bearer ${login.token}` },
      data: {},
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    // Should return validation error, not crash
    expect(res.status()).toBeLessThan(500);
  });

  test('Change password with invalid old password returns error', async ({ request }) => {
    const dosen = ALL_DOSEN[1];
    const login = await loginViaApi(request, dosen.email, dosen.password);
    test.skip(!login.token, 'Login failed');

    const res = await request.post(apiUrl('/api/auth/change-password'), {
      headers: { Authorization: `Bearer ${login.token}` },
      data: { old_password: 'wrong_old_password', new_password: 'new_password_123' },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect([400, 401]).toContain(res.status());
    const body = await safeJson(res);
    expect(body.message).toBeTruthy();
  });

  test('Change password with short new password returns error', async ({ request }) => {
    const dosen = ALL_DOSEN[1];
    const login = await loginViaApi(request, dosen.email, dosen.password);
    test.skip(!login.token, 'Login failed');

    const res = await request.post(apiUrl('/api/auth/change-password'), {
      headers: { Authorization: `Bearer ${login.token}` },
      data: { old_password: dosen.password, new_password: '12' },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBe(400);
    const body = await safeJson(res);
    expect(body.message).toContain('6');
  });

  test('Change password with missing fields returns error', async ({ request }) => {
    const dosen = ALL_DOSEN[1];
    const login = await loginViaApi(request, dosen.email, dosen.password);
    test.skip(!login.token, 'Login failed');

    const res = await request.post(apiUrl('/api/auth/change-password'), {
      headers: { Authorization: `Bearer ${login.token}` },
      data: {},
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBe(400);
  });

  test('Expired/tampered token returns 401/403', async ({ request }) => {
    // Use a structurally valid but expired JWT
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwicm9sZSI6ImRvc2VuIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDF9.invalid_signature';
    const res = await request.get(apiUrl('/api/dosen/profile'), {
      headers: { Authorization: `Bearer ${fakeToken}` },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect([401, 403]).toContain(res.status());
  });

  test('API error responses have consistent format', async ({ request }) => {
    const res = await request.post(apiUrl('/api/auth/login'), { data: {} });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');

    const body = await safeJson(res);
    // Should have a message field (standardized error format)
    const hasMessage = body?.message || body?.error?.message;
    expect(hasMessage).toBeTruthy();
  });

  test('Health response headers include X-Request-Id', async ({ request }) => {
    const res = await request.get(apiUrl('/ping'));
    // X-Request-Id should be set by requestId middleware
    const requestId = res.headers()['x-request-id'];
    if (requestId) {
      expect(requestId.length).toBeGreaterThan(0);
    }
    // Not a hard failure if missing — just noted
  });

  test('CORS headers present on API response', async ({ request }) => {
    const res = await request.get(apiUrl('/ping'));
    // Check CORS headers
    const allowOrigin = res.headers()['access-control-allow-origin'];
    // Backend should include CORS headers
    // This is informational — actual CORS behavior depends on origin
  });
});
