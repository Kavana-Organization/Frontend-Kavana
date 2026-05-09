const { test, expect } = require('@playwright/test');
const { apiUrl, isBackendUnavailableStatus } = require('../helpers/api');

test.describe('Proposal API', () => {
  test('submit proposal without token is rejected', async ({ request }) => {
    const response = await request.post(apiUrl('/api/mahasiswa/proposal'), { data: {} });
    test.skip(isBackendUnavailableStatus(response.status()), `Backend sedang tidak sehat, status ${response.status()}.`);
    expect([401, 403]).toContain(response.status());
  });

  test('proposal list/detail without token is rejected', async ({ request }) => {
    const response = await request.get(apiUrl('/api/mahasiswa/proposal'));
    test.skip(isBackendUnavailableStatus(response.status()), `Backend sedang tidak sehat, status ${response.status()}.`);
    expect([401, 403]).toContain(response.status());
  });

  test.skip('submit valid proposal requires dedicated testing account and seed period', async () => {
    // TODO: Enable only on staging/testing data.
  });
});
