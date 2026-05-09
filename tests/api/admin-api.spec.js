const { test, expect } = require('@playwright/test');
const { apiUrl, isBackendUnavailableStatus } = require('../helpers/api');

test.describe('Admin API', () => {
  test('admin users endpoint without token is rejected', async ({ request }) => {
    const response = await request.get(apiUrl('/api/admin/users'));
    test.skip(isBackendUnavailableStatus(response.status()), `Backend sedang tidak sehat, status ${response.status()}.`);
    expect([401, 403]).toContain(response.status());
  });

  test('admin logs endpoint without token is rejected', async ({ request }) => {
    const response = await request.get(apiUrl('/api/admin/logs'));
    test.skip(isBackendUnavailableStatus(response.status()), `Backend sedang tidak sehat, status ${response.status()}.`);
    expect([401, 403, 404]).toContain(response.status());
  });

  test.skip('admin management mutations require dedicated admin testing account', async () => {
    // TODO: Enable only on staging/testing data.
  });
});
