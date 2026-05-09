const { test, expect } = require('@playwright/test');
const { hasRoleCredential } = require('../helpers/env');
const { loginApi } = require('../helpers/api');
const { apiUrl } = require('../helpers/api');

test.describe('Security basic - RBAC', () => {
  test('mahasiswa cannot access admin endpoint with valid test token', async ({ request }) => {
    test.skip(!hasRoleCredential('mahasiswa'), 'Butuh akun testing mahasiswa.');

    const auth = await loginApi(request, 'mahasiswa');
    const response = await request.get(apiUrl('/api/admin/users'), {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    expect([401, 403]).toContain(response.status());
  });

  test('mahasiswa cannot access koordinator endpoint with valid test token', async ({ request }) => {
    test.skip(!hasRoleCredential('mahasiswa'), 'Butuh akun testing mahasiswa.');

    const auth = await loginApi(request, 'mahasiswa');
    const response = await request.get(apiUrl('/api/koordinator/proposals'), {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    expect([401, 403]).toContain(response.status());
  });

  test('dosen cannot access admin endpoint with valid test token', async ({ request }) => {
    test.skip(!hasRoleCredential('dosen'), 'Butuh akun testing dosen.');

    const auth = await loginApi(request, 'dosen');
    const response = await request.get(apiUrl('/api/admin/users'), {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    expect([401, 403]).toContain(response.status());
  });
});
