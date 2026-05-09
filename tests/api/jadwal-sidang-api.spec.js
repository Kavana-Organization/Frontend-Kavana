const { test, expect } = require('@playwright/test');
const { apiUrl, isBackendUnavailableStatus } = require('../helpers/api');

test.describe('Jadwal sidang API', () => {
  test('create jadwal sidang without token is rejected', async ({ request }) => {
    const response = await request.post(apiUrl('/api/koordinator/sidang/schedule'), { data: {} });
    test.skip(isBackendUnavailableStatus(response.status()), `Backend sedang tidak sehat, status ${response.status()}.`);
    expect([401, 403]).toContain(response.status());
  });

  test('jadwal sidang koordinator endpoint without token is rejected', async ({ request }) => {
    const response = await request.get(apiUrl('/api/koordinator/sidang/schedule'));
    test.skip(isBackendUnavailableStatus(response.status()), `Backend sedang tidak sehat, status ${response.status()}.`);
    expect([401, 403]).toContain(response.status());
  });

  test.skip('create schedule and conflict validation require controlled seed data', async () => {
    // TODO: Enable only on staging/testing data.
  });
});
