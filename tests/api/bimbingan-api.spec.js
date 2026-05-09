const { test, expect } = require('@playwright/test');
const { apiUrl, isBackendUnavailableStatus } = require('../helpers/api');

test.describe('Bimbingan API', () => {
  test('create bimbingan without token is rejected', async ({ request }) => {
    const response = await request.post(apiUrl('/api/mahasiswa/bimbingan'), { data: {} });
    test.skip(isBackendUnavailableStatus(response.status()), `Backend sedang tidak sehat, status ${response.status()}.`);
    expect([401, 403]).toContain(response.status());
  });

  test('bimbingan list without token is rejected', async ({ request }) => {
    const response = await request.get(apiUrl('/api/mahasiswa/bimbingan'));
    test.skip(isBackendUnavailableStatus(response.status()), `Backend sedang tidak sehat, status ${response.status()}.`);
    expect([401, 403]).toContain(response.status());
  });

  test.skip('create valid bimbingan requires seeded proposal assignment and test account', async () => {
    // TODO: Enable only on staging/testing data.
  });
});
