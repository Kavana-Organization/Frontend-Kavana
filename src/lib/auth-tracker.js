import { API_BASE_URL } from '@/lib/api';

const TRACKER_COOKIE_PREFIX = 'KAVANA_AUTH_TRACKER';
const TRACKER_TTL_HOURS = 24;
const PAGE_VISIT_EVENTS = {
  login: 'login_page_visit',
  register: 'register_page_visit',
};
const AUTH_EVENTS = new Set([
  'login_attempt',
  'login_success',
  'login_failed',
  'register_attempt',
  'register_otp_sent',
  'register_otp_resend',
  'register_success',
  'register_failed',
]);

let ispInfoPromise = null;

function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const encodedName = `${encodeURIComponent(name)}=`;
  return document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(encodedName))
    ?.slice(encodedName.length) || null;
}

function setCookie(name, value, hours) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + hours * 60 * 60 * 1000).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

async function getIspInfo() {
  if (ispInfoPromise) return ispInfoPromise;

  ispInfoPromise = (async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) return {};
      return await response.json();
    } catch {
      return {};
    }
  })();

  return ispInfoPromise;
}

async function getIspInfoWithTimeout(timeoutMs = 250) {
  return Promise.race([
    getIspInfo(),
    new Promise((resolve) => {
      setTimeout(() => resolve({}), timeoutMs);
    }),
  ]);
}

function maskAuthIdentifier(value) {
  const text = String(value || '').trim();
  if (!text) return null;

  if (text.includes('@')) {
    const [localPart, domain] = text.split('@');
    if (!domain) return '***';
    const visibleLocal = localPart.length <= 2 ? localPart[0] || '*' : `${localPart.slice(0, 2)}***`;
    return `${visibleLocal}@${domain}`;
  }

  if (/^\d+$/.test(text)) {
    if (text.length <= 4) return '*'.repeat(text.length);
    return `${text.slice(0, 2)}***${text.slice(-2)}`;
  }

  if (text.length <= 3) return '***';
  return `${text.slice(0, 2)}***`;
}

function getAuthFlow(eventType, flow) {
  if (flow) return flow;
  return eventType.startsWith('register') ? 'register' : 'login';
}

function getAuthStatus(eventType, status) {
  if (status) return status;
  if (eventType.endsWith('_success') || eventType.endsWith('_sent') || eventType.endsWith('_resend')) return 'success';
  if (eventType.endsWith('_failed')) return 'failed';
  if (eventType.endsWith('_attempt')) return 'attempt';
  return null;
}

function normalizeFailureReason(value) {
  if (!value) return null;
  return String(value).replace(/\s+/g, ' ').trim().slice(0, 255);
}

function buildAuthFields(eventType, details = {}) {
  const identifier = details.identifier_hint || details.identifier;

  return {
    event_category: details.event_category || 'auth_event',
    auth_flow: getAuthFlow(eventType, details.auth_flow),
    auth_stage: details.auth_stage || details.stage || null,
    auth_status: getAuthStatus(eventType, details.auth_status || details.status),
    identifier_hint: maskAuthIdentifier(identifier),
    failure_reason: normalizeFailureReason(details.failure_reason || details.reason),
  };
}

async function getTrackerPayload(eventType, details = {}, options = {}) {
  const isp = options.fast ? await getIspInfoWithTimeout() : await getIspInfo();
  return buildTrackerPayload(eventType, isp, details);
}

async function sendTrackerPayload(payload) {
  try {
    await fetch(`${API_BASE_URL}/api/auth/tracker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Tracker failures must not affect auth UX.
  }
}

function buildTrackerPayload(eventType, isp = {}, details = {}) {
  const hostname = window.location.hostname;

  return {
    event_type: eventType,
    ...details,
    hostname: hostname === 't.if.co.id' ? `${hostname}${window.location.pathname}` : hostname,
    url: window.location.href,
    browser: navigator.userAgent,
    browser_language: navigator.language || navigator.userLanguage || null,
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    ontouchstart: 'ontouchstart' in window,
    tanggal_ambil: new Date().toISOString(),
    isp: {
      ip: isp.ip,
      city: isp.city,
      region: isp.region,
      country_name: isp.country_name,
      postal: isp.postal,
      latitude: isp.latitude,
      longitude: isp.longitude,
      timezone: isp.timezone,
      asn: isp.asn,
      org: isp.org,
    },
  };
}

export async function trackAuthPageView(eventType) {
  if (typeof window === 'undefined') return;
  if (!PAGE_VISIT_EVENTS[eventType]) return;

  const cookieName = `${TRACKER_COOKIE_PREFIX}_${eventType}`;
  if (getCookie(cookieName)) return;

  const payload = await getTrackerPayload(PAGE_VISIT_EVENTS[eventType], {
    event_category: 'page_visit',
    auth_flow: eventType,
  });

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/tracker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      setCookie(cookieName, 'sent', TRACKER_TTL_HOURS);
    }
  } catch {
    // Tracker failures must not affect auth UX.
  }
}

export async function trackAuthEvent(eventType, details = {}) {
  if (typeof window === 'undefined') return;
  if (!AUTH_EVENTS.has(eventType)) return;

  const payload = await getTrackerPayload(eventType, buildAuthFields(eventType, details), { fast: true });
  await sendTrackerPayload(payload);
}
