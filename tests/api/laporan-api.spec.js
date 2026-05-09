const { test, expect } = require('@playwright/test');
const { apiUrl, isBackendUnavailableStatus } = require('../helpers/api');

test.describe('Laporan API', () => {
  test('submit laporan without token is rejected', async ({ request }) => {
    const response = await request.post(apiUrl('/api/mahasiswa/laporan'), { data: {} });
    test.skip(isBackendUnavailableStatus(response.status()), `Backend sedang tidak sehat, status ${response.status()}.`);
    expect([401, 403]).toContain(response.status());
  });

  test('laporan status without token is rejected', async ({ request }) => {
    const response = await request.get(apiUrl('/api/mahasiswa/laporan'));
    test.skip(isBackendUnavailableStatus(response.status()), `Backend sedang tidak sehat, status ${response.status()}.`);
    expect([401, 403]).toContain(response.status());
  });

  test.skip('submit valid laporan requires eight approved bimbingan and testing account', async () => {
    // TODO: Enable only on staging/testing data.
  });
});
