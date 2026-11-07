const { test, expect } = require('@playwright/test');
const { apiUrl, isBackendUnavailableStatus, loginApi, safeJson } = require('../helpers/api');
const { hasRoleCredential } = require('../helpers/env');

const PENGUJI_ENDPOINTS = ['/api/penguji/profile', '/api/penguji/sidang'];

test.describe('Penguji API', () => {
  test('endpoint penguji menolak request tanpa token', async ({ request }) => {
    for (const path of PENGUJI_ENDPOINTS) {
      const response = await request.get(apiUrl(path));
      test.skip(isBackendUnavailableStatus(response.status()), `Backend sedang tidak sehat, status ${response.status()}.`);

      expect([401, 403], `${path} harus menolak tanpa token`).toContain(response.status());
    }
  });

  test('penguji dapat membaca profil dan daftar sidang', async ({ request }) => {
    test.skip(!hasRoleCredential('penguji'), 'Butuh TEST_PENGUJI_EMAIL/PASSWORD dengan role penguji.');

    const login = await loginApi(request, 'penguji');
    test.skip(isBackendUnavailableStatus(login.response.status()), `Backend sedang tidak sehat, status ${login.response.status()}.`);
    expect(login.response.status()).toBe(200);
    expect(login.token).toBeTruthy();

    const headers = { Authorization: `Bearer ${login.token}` };

    const profile = await request.get(apiUrl('/api/penguji/profile'), { headers });
    test.skip(isBackendUnavailableStatus(profile.status()), `Backend sedang tidak sehat, status ${profile.status()}.`);
    expect(profile.status()).toBe(200);

    const profileBody = await safeJson(profile);
    expect(profileBody.email).toBeTruthy();
    expect(profileBody.role).toBe('penguji');

    const sidang = await request.get(apiUrl('/api/penguji/sidang'), { headers });
    expect([200, 404]).toContain(sidang.status());
    if (sidang.status() === 200) {
      expect(Array.isArray(await safeJson(sidang))).toBe(true);
    }
  });
});
