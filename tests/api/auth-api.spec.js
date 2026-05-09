const { test, expect } = require('@playwright/test');
const { apiUrl, isBackendUnavailableStatus, loginApi, safeJson } = require('../helpers/api');
const { hasRoleCredential } = require('../helpers/env');

test.describe('Auth API', () => {
  test('login with empty payload fails safely', async ({ request }) => {
    const response = await request.post(apiUrl('/api/auth/login'), { data: {} });
    test.skip(isBackendUnavailableStatus(response.status()), `Backend sedang tidak sehat, status ${response.status()}.`);
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test('login with invalid identity fails safely', async ({ request }) => {
    const response = await request.post(apiUrl('/api/auth/login'), {
      data: {
        email: 'email-tidak-valid',
        password: 'password123',
      },
    });
    test.skip(isBackendUnavailableStatus(response.status()), `Backend sedang tidak sehat, status ${response.status()}.`);
    expect([400, 401, 403, 422]).toContain(response.status());
  });

  test('profile endpoint without token is protected', async ({ request }) => {
    const response = await request.get(apiUrl('/api/auth/profile'));
    test.skip(isBackendUnavailableStatus(response.status()), `Backend sedang tidak sehat, status ${response.status()}.`);
    expect([401, 403]).toContain(response.status());
  });

  test('valid mahasiswa login works only with testing credential', async ({ request }) => {
    test.skip(!hasRoleCredential('mahasiswa'), 'TEST_MAHASISWA_EMAIL/PASSWORD belum diisi dengan akun testing khusus.');

    const result = await loginApi(request, 'mahasiswa');
    expect(result.response.status()).toBe(200);
    expect(result.token).toBeTruthy();
    expect(await safeJson(result.response)).toBeTruthy();
  });
});
