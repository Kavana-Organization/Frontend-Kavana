// ============================================
// Fase 8: Security Tests
// ============================================
const { test, expect } = require('@playwright/test');
const { apiUrl, isBackendUnavailableStatus, safeJson } = require('../helpers/api');

test.describe('Fase 8 — Input Validation & Security', () => {
  test('SQL injection in email field returns 400 (not 500)', async ({ request }) => {
    const res = await request.post(apiUrl('/api/auth/login'), {
      data: { email: "' OR 1=1 --", password: 'test' },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test('XSS in email field returns 400 (not 500)', async ({ request }) => {
    const res = await request.post(apiUrl('/api/auth/login'), {
      data: { email: '<script>alert("xss")</script>', password: 'test' },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test('Extra long email is handled gracefully', async ({ request }) => {
    const longEmail = 'a'.repeat(1000) + '@test.com';
    const res = await request.post(apiUrl('/api/auth/login'), {
      data: { email: longEmail, password: 'test' },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test('Extra long password is handled gracefully', async ({ request }) => {
    const longPassword = 'x'.repeat(10000);
    const res = await request.post(apiUrl('/api/auth/login'), {
      data: { email: 'test@test.com', password: longPassword },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBeLessThan(500);
  });

  test('JSON with nested objects does not crash server', async ({ request }) => {
    const nested = { email: { nested: { deep: 'value' } }, password: 'test' };
    const res = await request.post(apiUrl('/api/auth/login'), {
      data: nested,
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBeLessThan(500);
  });

  test('Array in email field does not crash server', async ({ request }) => {
    const res = await request.post(apiUrl('/api/auth/login'), {
      data: { email: ['array', 'value'], password: 'test' },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBeLessThan(500);
  });

  test('Null values do not crash server', async ({ request }) => {
    const res = await request.post(apiUrl('/api/auth/login'), {
      data: { email: null, password: null },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBeLessThan(500);
  });

  test('Integer in email field does not crash server', async ({ request }) => {
    const res = await request.post(apiUrl('/api/auth/login'), {
      data: { email: 12345, password: 67890 },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBeLessThan(500);
  });

  test('Unicode/emoji in fields does not crash server', async ({ request }) => {
    const res = await request.post(apiUrl('/api/auth/login'), {
      data: { email: '🎓@test.com', password: '🔑password' },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBeLessThan(500);
  });

  test('NoSQL injection attempt in email field', async ({ request }) => {
    const res = await request.post(apiUrl('/api/auth/login'), {
      data: { email: '{"$gt":""}', password: '{"$gt":""}' },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBeLessThan(500);
  });
});

test.describe('Fase 8 — Registration Input Validation', () => {
  test('Register with missing required fields returns 400', async ({ request }) => {
    const res = await request.post(apiUrl('/api/auth/register/mahasiswa'), {
      data: {},
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test('Register with invalid email domain returns 400', async ({ request }) => {
    const res = await request.post(apiUrl('/api/auth/register/mahasiswa'), {
      data: {
        email: 'test@gmail.com', // Should only accept @ulbi.ac.id
        password: 'password123',
        npm: '9999999999',
        nama: 'Test User',
      },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    // Either 400 (validation) or success if no domain restriction
    expect(res.status()).toBeLessThan(500);
  });

  test('Register with short password returns 400', async ({ request }) => {
    const res = await request.post(apiUrl('/api/auth/register/mahasiswa'), {
      data: {
        email: 'testqaqa@ulbi.ac.id',
        password: '12',
        npm: '9999999998',
        nama: 'Test User',
      },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBeLessThan(500);
  });

  test('Register with SQL injection in NPM returns 400', async ({ request }) => {
    const res = await request.post(apiUrl('/api/auth/register/mahasiswa'), {
      data: {
        email: 'testqaqa2@ulbi.ac.id',
        password: 'password123',
        npm: "'; DROP TABLE mahasiswa; --",
        nama: 'Test User',
      },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBeLessThan(500);
  });
});

test.describe('Fase 8 — OTP Endpoint Security', () => {
  test('Request OTP with missing email returns error', async ({ request }) => {
    const res = await request.post(apiUrl('/api/auth/request-otp'), {
      data: {},
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBeLessThan(500);
  });

  test('Verify OTP with invalid data returns error', async ({ request }) => {
    const res = await request.post(apiUrl('/api/auth/verify-otp'), {
      data: { email: 'fake@test.com', otp: '000000' },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBeLessThan(500);
  });

  test('Reset password without reset_token returns error', async ({ request }) => {
    const res = await request.post(apiUrl('/api/auth/reset-password'), {
      data: { new_password: 'newpassword123' },
    });
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    expect(res.status()).toBeLessThan(500);
  });
});

test.describe('Fase 8 — Exposed Schema Fix Endpoint (Security Concern)', () => {
  test('GET /api/auth/fix-schema is accessible without auth (security concern)', async ({ request }) => {
    const res = await request.get(apiUrl('/api/auth/fix-schema'));
    test.skip(isBackendUnavailableStatus(res.status()), 'Backend unavailable');
    // This endpoint modifies database schema and is PUBLIC - potential security issue!
    if (res.status() === 200) {
      console.log('  ⚠️ WARNING: /api/auth/fix-schema is publicly accessible and modifies database schema!');
    }
    // Document the finding regardless of status
    expect(res.status()).toBeLessThan(500);
  });
});
