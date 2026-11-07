const { test, expect } = require('@playwright/test');
const { apiUrl, isBackendUnavailableStatus } = require('../helpers/api');
const { TEST_USERS, hasRoleCredential } = require('../helpers/env');

// Sumber: controllers/otpController.js
const OTP_RATE_LIMIT = 3; // maksimal permintaan per email per 10 menit
const OTP_MAX_ATTEMPTS = 5; // maksimal percobaan verifikasi per kode

function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
}

test.describe('OTP security', () => {
  test('request OTP tanpa email ditolak 400', async ({ request }) => {
    const response = await request.post(apiUrl('/api/auth/request-otp'), { data: {} });
    test.skip(isBackendUnavailableStatus(response.status()), `Backend sedang tidak sehat, status ${response.status()}.`);

    expect(response.status()).toBe(400);
  });

  test('request OTP untuk email tidak terdaftar ditolak tanpa 5xx', async ({ request }) => {
    const response = await request.post(apiUrl('/api/auth/request-otp'), {
      data: { email: uniqueEmail('otp-unknown') },
    });
    test.skip(isBackendUnavailableStatus(response.status()), `Backend sedang tidak sehat, status ${response.status()}.`);

    expect(response.status()).toBe(404);
  });

  test('verify OTP tanpa email atau kode ditolak 400', async ({ request }) => {
    const response = await request.post(apiUrl('/api/auth/verify-otp'), { data: {} });
    test.skip(isBackendUnavailableStatus(response.status()), `Backend sedang tidak sehat, status ${response.status()}.`);

    expect(response.status()).toBe(400);
  });

  test('percobaan OTP salah berulang tidak pernah berhasil', async ({ request }) => {
    const email = uniqueEmail('otp-brute');

    for (let i = 0; i < OTP_MAX_ATTEMPTS; i += 1) {
      const response = await request.post(apiUrl('/api/auth/verify-otp'), {
        data: { email, otp: `00000${i}` },
      });

      test.skip(isBackendUnavailableStatus(response.status()), `Backend sedang tidak sehat, status ${response.status()}.`);
      expect(response.status(), `percobaan ke-${i + 1} tidak boleh sukses`).not.toBe(200);
      expect(response.status(), `percobaan ke-${i + 1} tidak boleh error server`).toBeLessThan(500);
    }
  });

  test('rate limit OTP aktif setelah batas permintaan', async ({ request }) => {
    // Butuh email yang benar-benar terdaftar; kirim OTP hanya bila diizinkan.
    test.skip(
      process.env.TEST_OTP_RATE_LIMIT !== 'true',
      'Set TEST_OTP_RATE_LIMIT=true dan isi TEST_MAHASISWA_EMAIL untuk menguji rate limit.'
    );
    test.skip(!hasRoleCredential('mahasiswa'), 'Butuh akun testing mahasiswa yang terdaftar.');

    const email = TEST_USERS.mahasiswa.email;
    const statuses = [];

    for (let i = 0; i < OTP_RATE_LIMIT + 1; i += 1) {
      const response = await request.post(apiUrl('/api/auth/request-otp'), { data: { email } });
      statuses.push(response.status());
    }

    expect(statuses[statuses.length - 1], `status: ${statuses.join(',')}`).toBe(429);
  });
});
