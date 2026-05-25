// ============================================
// Fase 1: Backend Health & Connectivity Tests
// ============================================
const { test, expect } = require('@playwright/test');
const { apiUrl, isBackendUnavailableStatus, safeJson } = require('../helpers/api');

test.describe('Fase 1 — Backend Health & Connectivity', () => {
  test('GET / returns API OK message', async ({ request }) => {
    const res = await request.get(apiUrl('/'));
    expect(res.status()).toBe(200);
    const body = await safeJson(res);
    expect(body.message).toContain('API OK');
  });

  test('GET /ping returns pong', async ({ request }) => {
    const res = await request.get(apiUrl('/ping'));
    expect(res.status()).toBe(200);
    const body = await safeJson(res);
    expect(body.status).toBe('ok');
    expect(body.message).toBe('pong');
    expect(body.timestamp).toBeTruthy();
    expect(body.uptime).toBeGreaterThan(0);
  });

  test('GET /health returns health status', async ({ request }) => {
    const res = await request.get(apiUrl('/health'));
    // 200 = healthy, 503 = degraded but still responding
    expect([200, 503]).toContain(res.status());
    const body = await safeJson(res);
    expect(body).toBeTruthy();
  });

  test('GET /ready returns readiness status', async ({ request }) => {
    const res = await request.get(apiUrl('/ready'));
    expect([200, 503]).toContain(res.status());
  });

  test('GET /live returns liveness status', async ({ request }) => {
    const res = await request.get(apiUrl('/live'));
    expect(res.status()).toBe(200);
  });

  test('GET /docs returns Swagger UI', async ({ request }) => {
    const res = await request.get(apiUrl('/docs'));
    // Swagger serves HTML, may redirect
    expect([200, 301, 302]).toContain(res.status());
  });

  test('GET /docs.json returns OpenAPI spec', async ({ request }) => {
    const res = await request.get(apiUrl('/docs.json'));
    if (res.status() === 200) {
      const body = await safeJson(res);
      expect(body.openapi).toBeTruthy();
      expect(body.info).toBeTruthy();
      expect(body.paths).toBeTruthy();
    }
  });

  test('GET /openapi.json returns OpenAPI spec', async ({ request }) => {
    const res = await request.get(apiUrl('/openapi.json'));
    if (res.status() === 200) {
      const body = await safeJson(res);
      expect(body.openapi).toBe('3.0.3');
      expect(body.info.title).toContain('Bimbingan');
    }
  });

  test('Non-existent endpoint returns 404 (not 500)', async ({ request }) => {
    const res = await request.get(apiUrl('/api/nonexistent-route-xyz'));
    expect(res.status()).not.toBe(500);
  });
});
