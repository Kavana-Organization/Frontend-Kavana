import { API_BASE_URL } from '@/lib/api';

const TRACKER_COOKIE_PREFIX = 'KAVANA_AUTH_TRACKER';
const TRACKER_TTL_HOURS = 24;

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
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) return {};
    return await response.json();
  } catch {
    return {};
  }
}

function buildTrackerPayload(eventType, isp = {}) {
  const hostname = window.location.hostname;

  return {
    event_type: eventType,
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
  if (!['login', 'register'].includes(eventType)) return;

  const cookieName = `${TRACKER_COOKIE_PREFIX}_${eventType}`;
  if (getCookie(cookieName)) return;

  const isp = await getIspInfo();
  const payload = buildTrackerPayload(eventType, isp);

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
