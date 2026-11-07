const { test, expect } = require('@playwright/test');
const { apiUrl, isBackendUnavailableStatus } = require('../helpers/api');

test.describe('Notification API', () => {
  test('notification list without token is rejected', async ({ request }) => {
    const response = await request.get(apiUrl('/api/notifications'));
    test.skip(isBackendUnavailableStatus(response.status()), `Backend sedang tidak sehat, status ${response.status()}.`);
    expect([401, 403]).toContain(response.status());
  });

  test('notification stats without token is rejected', async ({ request }) => {
    // Tidak ada /unread-count; hitungan notifikasi tersedia di /stats.
    const response = await request.get(apiUrl('/api/notifications/stats'));
    test.skip(isBackendUnavailableStatus(response.status()), `Backend sedang tidak sehat, status ${response.status()}.`);
    expect([401, 403]).toContain(response.status());
  });
});
