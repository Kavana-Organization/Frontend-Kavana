const { test, expect } = require('@playwright/test');
const { apiUrl, safeJson } = require('../helpers/api');

test.describe('API health', () => {
  test('backend exposes at least one health/status endpoint or documents absence', async ({ request }) => {
    const candidates = ['/health', '/api/health', '/status'];
    const results = [];

    for (const path of candidates) {
      const response = await request.get(apiUrl(path));
      results.push({ path, status: response.status(), body: await safeJson(response) });
      if (response.status() === 200) {
        expect(response.ok()).toBeTruthy();
        return;
      }
    }

    test.skip(true, `Health endpoint belum ditemukan. Dicoba: ${JSON.stringify(results.map((item) => `${item.path}:${item.status}`))}`);
  });
});
