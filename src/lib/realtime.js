'use client';

// =============================================================================
// REALTIME EVENT BUS
// =============================================================================
// - Sumber tunggal sinkronisasi data dashboard berbasis event spesifik (bukan
//   polling waktu).
// - Mendukung sinkronisasi antar tab via BroadcastChannel + storage fallback.
// - Mendukung dua API:
//   * legacy: notifyRealtimeUpdate(prefixes) / subscribeRealtimeUpdates(handler)
//   * baru:   emitRealtimeEvent(type, meta) / subscribeRealtimeEvent(type, h)
// =============================================================================

const REALTIME_EVENT = 'kavana:realtime-update';
const REALTIME_CHANNEL = 'kavana-realtime';

function canUseDom() {
  return typeof window !== 'undefined';
}

// =============================================================================
// EVENT TYPES & CACHE PREFIX MAP
// =============================================================================
// Daftar event spesifik per resource. Naming pakai dot-namespace agar mudah
// di-grep dan di-extend.
export const REALTIME_EVENTS = Object.freeze({
  // Auth & profile
  PROFILE_UPDATED: 'profile.updated',
  AUTH_LOGOUT: 'auth.logout',

  // Mahasiswa flow
  TRACK_CHANGED: 'track.changed',
  PROPOSAL_SUBMITTED: 'proposal.submitted',
  PROPOSAL_VALIDATED: 'proposal.validated',
  KELOMPOK_CHANGED: 'kelompok.changed',
  BIMBINGAN_CREATED: 'bimbingan.created',
  BIMBINGAN_APPROVED: 'bimbingan.approved',
  LAPORAN_SUBMITTED: 'laporan.submitted',
  LAPORAN_APPROVED: 'laporan.approved',
  SIDANG_SCHEDULED: 'sidang.scheduled',

  // Koordinator / kaprodi
  PERIODE_UPDATED: 'periode.updated',
  DOSEN_ASSIGNED: 'dosen.assigned',
  KOORDINATOR_ASSIGNED: 'koordinator.assigned',
  MAHASISWA_REPEAT_UPDATED: 'mahasiswa.repeat-updated',

  // Admin
  ADMIN_USER_UPDATED: 'admin.user.updated',
  ADMIN_AUDIT_TOUCHED: 'admin.audit.touched',

  // Revisi pasca sidang
  SIDANG_HASIL_UPDATED: 'sidang.hasil-updated',
  REVISI_SUBMITTED: 'revisi.submitted',
  REVISI_REVIEWED: 'revisi.reviewed',
});

// Mapping event → cache prefix yang relevan. Sumber kebenaran tunggal — jangan
// duplikasi mapping di halaman atau di api helpers.
export const EVENT_PREFIX_MAP = Object.freeze({
  [REALTIME_EVENTS.PROFILE_UPDATED]: [
    '/api/auth/profile',
    '/api/mahasiswa/profile',
    '/api/dosen/profile',
    '/api/kaprodi/profile',
    '/api/koordinator/profile',
    '/api/admin/profile',
  ],
  [REALTIME_EVENTS.AUTH_LOGOUT]: ['/api/'],

  [REALTIME_EVENTS.TRACK_CHANGED]: [
    '/api/mahasiswa/',
    '/api/koordinator/',
    '/api/kaprodi/',
    '/api/notifications/stats',
  ],
  [REALTIME_EVENTS.PROPOSAL_SUBMITTED]: [
    '/api/mahasiswa/proposal',
    '/api/mahasiswa/profile',
    '/api/koordinator/proposal',
    '/api/koordinator/mahasiswa',
    '/api/kaprodi/proposal',
    '/api/kaprodi/mahasiswa',
    '/api/notifications/stats',
  ],
  [REALTIME_EVENTS.PROPOSAL_VALIDATED]: [
    '/api/mahasiswa/',
    '/api/koordinator/',
    '/api/kaprodi/',
    '/api/notifications/stats',
  ],
  [REALTIME_EVENTS.KELOMPOK_CHANGED]: [
    '/api/mahasiswa/profile',
    '/api/mahasiswa/kelompok',
    '/api/koordinator/',
    '/api/kaprodi/',
  ],
  [REALTIME_EVENTS.BIMBINGAN_CREATED]: [
    '/api/mahasiswa/bimbingan',
    '/api/dosen/bimbingan',
    '/api/dosen/mahasiswa',
    '/api/dosen/stats',
    '/api/notifications/stats',
  ],
  [REALTIME_EVENTS.BIMBINGAN_APPROVED]: [
    '/api/mahasiswa/bimbingan',
    '/api/dosen/bimbingan',
    '/api/dosen/mahasiswa',
    '/api/dosen/stats',
    '/api/koordinator/mahasiswa',
    '/api/kaprodi/mahasiswa',
    '/api/notifications/stats',
  ],
  [REALTIME_EVENTS.LAPORAN_SUBMITTED]: [
    '/api/mahasiswa/laporan',
    '/api/mahasiswa/sidang',
    '/api/dosen/laporan',
    '/api/dosen/stats',
    '/api/notifications/stats',
  ],
  [REALTIME_EVENTS.LAPORAN_APPROVED]: [
    '/api/mahasiswa/laporan',
    '/api/mahasiswa/sidang',
    '/api/dosen/laporan',
    '/api/dosen/stats',
    '/api/koordinator/sidang',
    '/api/koordinator/mahasiswa',
    '/api/kaprodi/mahasiswa',
    '/api/notifications/stats',
  ],
  [REALTIME_EVENTS.SIDANG_SCHEDULED]: [
    '/api/mahasiswa/sidang',
    '/api/koordinator/sidang',
    '/api/koordinator/mahasiswa',
    '/api/kaprodi/sidang',
    '/api/notifications/stats',
  ],
  [REALTIME_EVENTS.PERIODE_UPDATED]: [
    '/api/koordinator/jadwal',
    '/api/koordinator/jadwal/active',
    '/api/mahasiswa/periode-aktif',
  ],
  [REALTIME_EVENTS.DOSEN_ASSIGNED]: [
    '/api/mahasiswa/',
    '/api/dosen/',
    '/api/koordinator/',
    '/api/kaprodi/',
    '/api/notifications/stats',
  ],
  [REALTIME_EVENTS.KOORDINATOR_ASSIGNED]: [
    '/api/kaprodi/',
    '/api/koordinator/',
    '/api/notifications/stats',
  ],
  [REALTIME_EVENTS.MAHASISWA_REPEAT_UPDATED]: [
    '/api/kaprodi/',
    '/api/koordinator/',
    '/api/mahasiswa/',
    '/api/notifications/stats',
  ],
  [REALTIME_EVENTS.ADMIN_USER_UPDATED]: [
    '/api/admin/users',
    '/api/admin/stats',
    '/api/admin/activity',
    '/api/admin/audit-logs',
  ],
  [REALTIME_EVENTS.ADMIN_AUDIT_TOUCHED]: [
    '/api/admin/activity',
    '/api/admin/audit-logs',
  ],

  [REALTIME_EVENTS.SIDANG_HASIL_UPDATED]: [
    '/api/mahasiswa/sidang',
    '/api/mahasiswa/revisi-sidang',
    '/api/koordinator/sidang',
    '/api/koordinator/revisi-sidang',
    '/api/dosen/revisi-sidang',
    '/api/notifications/stats',
  ],
  [REALTIME_EVENTS.REVISI_SUBMITTED]: [
    '/api/mahasiswa/revisi-sidang',
    '/api/dosen/revisi-sidang',
    '/api/koordinator/revisi-sidang',
    '/api/notifications/stats',
  ],
  [REALTIME_EVENTS.REVISI_REVIEWED]: [
    '/api/mahasiswa/revisi-sidang',
    '/api/dosen/revisi-sidang',
    '/api/koordinator/revisi-sidang',
    '/api/notifications/stats',
  ],
});

// =============================================================================
// CORE TRANSPORT
// =============================================================================

function buildPayload({ type = null, prefixes = [], meta = {} } = {}) {
  return {
    type,
    prefixes: Array.isArray(prefixes) ? prefixes : [],
    timestamp: Date.now(),
    ...meta,
  };
}

function dispatchLocal(payload) {
  if (!canUseDom()) return;
  window.dispatchEvent(new CustomEvent(REALTIME_EVENT, { detail: payload }));
}

function dispatchBroadcast(payload) {
  if (!canUseDom() || typeof BroadcastChannel === 'undefined') return;
  try {
    const channel = new BroadcastChannel(REALTIME_CHANNEL);
    channel.postMessage(payload);
    channel.close();
  } catch (_) { /* ignore */ }
}

function publish(payload) {
  dispatchLocal(payload);
  dispatchBroadcast(payload);
}

// =============================================================================
// PUBLIC API — LEGACY (prefix-only)
// =============================================================================

export function notifyRealtimeUpdate(prefixes = [], meta = {}) {
  publish(buildPayload({ prefixes, meta }));
}

export function subscribeRealtimeUpdates(listener) {
  if (!canUseDom()) return () => {};

  const handleEvent = (event) => listener(event.detail || {});
  window.addEventListener(REALTIME_EVENT, handleEvent);

  let channel = null;
  let handleMessage = null;

  if (typeof BroadcastChannel !== 'undefined') {
    try {
      channel = new BroadcastChannel(REALTIME_CHANNEL);
      handleMessage = (event) => listener(event.data || {});
      channel.addEventListener('message', handleMessage);
    } catch (_) { channel = null; }
  }

  return () => {
    window.removeEventListener(REALTIME_EVENT, handleEvent);
    if (channel && handleMessage) {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    }
  };
}

// =============================================================================
// PUBLIC API — TYPED EVENTS
// =============================================================================

/**
 * Emit event spesifik. Prefix cache otomatis di-resolve dari EVENT_PREFIX_MAP,
 * tetapi pemanggil masih bisa override lewat `meta.prefixes`.
 */
export function emitRealtimeEvent(type, meta = {}) {
  if (!type) return;
  const mappedPrefixes = EVENT_PREFIX_MAP[type] || [];
  const finalPrefixes = Array.isArray(meta.prefixes) && meta.prefixes.length > 0
    ? meta.prefixes
    : mappedPrefixes;
  const { prefixes: _ignored, ...rest } = meta;
  publish(buildPayload({ type, prefixes: finalPrefixes, meta: rest }));
}

/**
 * Subscribe ke satu event. Handler hanya dipanggil bila `payload.type === type`.
 */
export function subscribeRealtimeEvent(type, handler) {
  if (!type || typeof handler !== 'function') return () => {};
  return subscribeRealtimeUpdates((payload) => {
    if (payload?.type === type) handler(payload);
  });
}

/**
 * Subscribe ke beberapa event sekaligus. Handler dipanggil dengan payload-nya
 * setiap kali salah satu event match.
 */
export function subscribeManyRealtimeEvents(types, handler) {
  if (!Array.isArray(types) || types.length === 0 || typeof handler !== 'function') {
    return () => {};
  }
  const set = new Set(types);
  return subscribeRealtimeUpdates((payload) => {
    if (payload?.type && set.has(payload.type)) handler(payload);
  });
}

/**
 * Helper: cek apakah payload realtime menyentuh salah satu prefix yang dipantau.
 * Berguna untuk listener yang lebih suka filter berdasarkan resource.
 */
export function payloadTouchesPrefixes(payload, prefixes = []) {
  if (!payload || !Array.isArray(prefixes) || prefixes.length === 0) return false;
  const payloadPrefixes = Array.isArray(payload.prefixes) ? payload.prefixes : [];
  if (payloadPrefixes.length === 0) return false;
  return prefixes.some((wanted) => (
    payloadPrefixes.some((actual) => (
      typeof actual === 'string' && typeof wanted === 'string'
        && (actual.includes(wanted) || wanted.includes(actual))
    ))
  ));
}
