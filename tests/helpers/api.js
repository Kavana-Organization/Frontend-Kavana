const { BACKEND_URL } = require('./env');

function apiUrl(path) {
  const cleanBase = BACKEND_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

async function safeJson(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function isBackendUnavailableStatus(status) {
  return [500, 502, 503, 504].includes(status);
}

async function loginApi(request, role) {
  const { TEST_USERS, hasRoleCredential } = require('./env');
  if (!hasRoleCredential(role)) return null;

  const user = TEST_USERS[role];
  const response = await request.post(apiUrl('/api/auth/login'), {
    data: {
      email: user.email,
      password: user.password,
      turnstile_token: process.env.TURNSTILE_TEST_MODE === 'true' ? 'test-token' : undefined,
    },
  });

  const body = await safeJson(response);
  return { response, body, token: body?.token || body?.data?.token };
}

module.exports = {
  apiUrl,
  isBackendUnavailableStatus,
  safeJson,
  loginApi,
};
